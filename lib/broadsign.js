"use strict";

var debug = require('debug')('jcdecaux.broadsign');
// var fs = require('fs');
var net = require('net');
// var path = require('path');
var SerialPort = require('serialport').SerialPort;
var xml2js = require('xml2js');

/** Local libraries **/
var NdefLibrary = require('./ndeflibrary.js');
// var collection = require('./collection.js');

var Broadsign = Broadsign || {};//Espace de nom

/******************************************************************************/
/*                             Services init                                  */
/******************************************************************************/

/** serialport init **/
var serialPort = new SerialPort("/dev/ttyACM0", { baudrate: 115200 }, false);
/** xml parser init **/
var parser = new xml2js.Parser();

/******************************************************************************/
/*                          Buffer and Serial init                            */
/******************************************************************************/

var bufferSerial = [];
var bufferASCII = "";
var startFound = false;
var NFCContent;
var NFCMessageByteArray = [];

/******************************************************************************/
/*                       Open and listen to serial port                       */
/******************************************************************************/

//Ouvre le port COM et lance la lecture/ecriture NFC
serialPort.open(function (error) {
    if (error) {
        debug('failed to open: ' + error);
    }
    else {
        debug('open serial device /dev/ttyACM0');
        //Cleaning of the serialBuffer after start/restart
        bufferSerial.splice(0, bufferSerial.length);
        //Init startCharacter > from >RF ON/OFF< to false
        startFound = false;
        serialPort.on('data', function (data) {
            for (var i = 0; i < data.length; i++) {
                //if startCharacter detected, collect data
                if (startFound) {
                    //if endCharacter detected, turn startFound to false and
                    if (data[i] == 60) {
                        startFound = false;
                        for (var j = 0; j < bufferSerial.length; j++) {
                            bufferASCII += String.fromCharCode(bufferSerial[j]);
                        }
                        //debug('data received : '+ bufferSerial + ' : ' + bufferASCII);
                        Is_NFC_Activity(bufferASCII);
                        bufferSerial.splice(0, bufferSerial.length);
                        bufferASCII = "";
                    }
                    else {
                        bufferSerial.push(data[i]);
                    }
                }
                else {
                    if (data[i] == 62) {
                        startFound = true;
                    }
                }
            }
        });
        setTimeout(Broadsign.pushNFC, 5000);
    }
});

/******************************************************************************/
/*              On serial incoming request, Broadsign request                 */
/******************************************************************************/
var delayBetweenRfOn = 0;

var Is_NFC_Activity = function Is_NFC_Activity(data) {
    var now = Date.now();

    if ((data == "RF ON") && (now > delayBetweenRfOn)) {
        debug('RF ON');
        delayBetweenRfOn = Date.now() + 1000;
    }
    else if (data == "RF OFF") {
        debug('RF OFF');
    }
};

/******************************************************************************/
/*                      PushNFC function for polling case                     */
/******************************************************************************/

function fillArrayWithNumbers(n) {
    var arr = Array.apply(null, Array(n));
    return arr.map(function (x, i) { return 0 });
}

var zeroArray = fillArrayWithNumbers(64);
// Valeur par defaut

//var hostsAddress = '172.30.255.141';  //Version Barcelone Deauville
//var hostsAddress = '192.168.2.2';     // Version local de test
//var hostsAddress = '192.168.240.2';   //Version MediaLab
var hostsAddress = '172.21.254.58';     //Version VivaTech

var theTimeOutID = undefined;

Broadsign.setPlayerAddress = function setPlayerAddress(ipaddr) {
    hostsAddress = ipaddr;
}

//Lecture dans broadsign du paramétres NFC dans ADCopy courrante et ecriture sur le TAG dynamique, et arme la lecture/ecriture lors du jeux de l'ADCopy suivante.
Broadsign.pushNFC = function pushNFC() {
    var nextDelay = 5000;
    theTimeOutID = undefined;
    try {
        var client = net.connect({ port: 2324, host: hostsAddress }, function () {
            var request = '<rc version="1" id="1" action="now_playing" />\r\n\r\n';
            client.write(request);
        });

        client.on('error', function (err) {
            debug('Connect to ' + hostsAddress + ' ERROR to Broadsign player (pushNFC)', err);
            Broadsign.nextPushNFC(nextDelay);
        });
        client.on('close', function (had_error) {
            debug('Close socket Broadsign player (pushNFC)', had_error);
        });
        //on data response parse document and extract nfc field
        client.on('data', function (response) {
            debug(response.toString());
            try {
                NFCMessageByteArray.splice(0, NFCMessageByteArray.length);
                parser.parseString(response, function (err, result) {
                    if (err) {
                        debug('Parse Error NFC (pushNFC)', err);
                        Broadsign.nextPushNFC(nextDelay);
                    }
                    else {
                        try {
                            debug(NFCMessageByteArray);

                            var url = unescape(result.rc.frame[0].current_item[0].bundle[0].ad_copy[0].$.flash_parameters).replace('nfc=', '');
                            nextDelay = parseInt(result.rc.frame[0].current_item[0].$.remaining_ms, 10);
                            debug('VALUE PARSE (pushNFC) :' + nextDelay);
                            serialPort.write(zeroArray);//RAZ NFC
                            debug(url);
                            if (url.length !== 0) {
                                var ndefMessage = new NdefLibrary.NdefMessage();
                                var ndefUriRecord = new NdefLibrary.NdefUriRecord();
                                ndefUriRecord.setUri(url);
                                ndefMessage.push(ndefUriRecord);
                                var byteArray = ndefMessage.toByteArray();
                                debug(byteArray);
                                NFCMessageByteArray = [3];
                                var lengthValue = byteArray.length;
                                var endValue = 254;
                                NFCMessageByteArray.push(lengthValue);
                                NFCMessageByteArray = NFCMessageByteArray.concat(byteArray);
                                NFCMessageByteArray.push(endValue);
                                debug(NFCMessageByteArray);
                                if (NFCMessageByteArray.length !== 0) {
                                    NFCContent = new Buffer(NFCMessageByteArray);
                                    serialPort.write(NFCContent);
                                    serialPort.write('\r\n');
                                }
                            }
                        }
                        catch (err) {
                            debug('VALUE PARSE ERROR (pushNFC) :', err);
                            Broadsign.nextPushNFC(nextDelay);
                        }
                    }
                });
            }
            catch (err) {
                debug('ERROR (pushNFC) :', err);
                Broadsign.nextPushNFC(nextDelay);
            }
            finally {
                client.end();
            }
        });
        client.on('end', function () {
            debug('End connection from Broadsign player (pushNFC)');
            Broadsign.nextPushNFC(nextDelay);
        });
    }
    catch (err) {
        debug('PUSH NFC ERROR (pushNFC) : ' + err.message);
        Broadsign.nextPushNFC(nextDelay);
    }
};

//Lance la lecture/ecriture du paramètre NFC dans ADcopy aprés un delay -> duration (si deja une demande est en cours aucune action)
Broadsign.nextPushNFC = function nextPushNFC(duration) {
    if (theTimeOutID === undefined) {
        var delay = duration + 1000;
        theTimeOutID = setTimeout(Broadsign.pushNFC, delay);
        debug('NEXT POLLING :' + delay);
    }
}

//Annule et réarme la lecture/écriture du parmètre NFC dans l'ADcopy
Broadsign.reArmPushNFC = function reArmPushNFC(duration) {
    if (theTimeOutID !== undefined) {
        clearTimeout(theTimeOutID);
    }
    var delay = duration + 1000;

    theTimeOutID = setTimeout(Broadsign.pushNFC, delay);
    debug('NEXT POLLING :' + delay);
}

//Demande le declenchement d'un TRIGGER sur le player BroadSign
Broadsign.pushTrigger = function pushTrigger(id) {
    try {
        var client = net.connect({ port: 2324, host: hostsAddress }, function () {
            var request = '<rc duration="10000" version="6" action="trigger" id="1" trigger_category_id="' + id + '" />\r\n\r\n';
            debug(request);
            client.write(request);
        });
        client.on('error', function (err) {
            debug('Connect to ' + hostsAddress + ' ERROR to Broadsign player (pushTrigger)', err);
        });
        client.on('close', function (had_error) {
            debug('Close socket Broadsign player (pushTrigger)', had_error);
        });
        //on data response parse document and extract nfc field
        client.on('data', function (response) {
            debug(response.toString());
            client.end();
        });
        client.on('end', function () {
            debug('disconnected from Broadsign player (pushTrigger)');
        });
    } catch (e) {
        debug('PUSH Trigger ERROR :' + e.message);
    }
};

//#region LOOP TRIGGE
var loopNfcContent = [];
var loopNfcContentIndex = 0;
var theTimeOutLoop = undefined;

//Programme une boucle triggée avec lecture/écriture NFC (à la fin de la boucle retour sur la programmation)
Broadsign.loopNFC = function loopNFC(idArray) {
    loopNfcContent = idArray;
    loopNfcContentIndex = 0;
    if (loopNfcContent.length > 0) {
        var currentContent = loopNfcContent[loopNfcContentIndex];
        Broadsign.pushTrigger(currentContent);//Triggger braodsign

        Broadsign.reArmPushNFC(100);
        theTimeOutLoop = setTimeout(function () {
            theTimeOutLoop = undefined;
            _loopNFCAction();
        }, 200);
    }
};

//Arrêt d'une boucle triggée
Broadsign.stopLoopNFC = function () {
    if (theTimeOutLoop !== undefined) {
        clearTimeout(theTimeOutLoop);
        theTimeOutLoop = undefined;
    }
};

var _nextLoppNFC = function _nextLoppNFC(delay, content) {
    debug('LOOP ACTION END  (_loopNFCAction) - NEXT TRIG ' + delay);
    theTimeOutLoop = setTimeout(function () {
        theTimeOutLoop = undefined;
        Broadsign.pushTrigger(content);//Triggger broadsign
        theTimeOutLoop = setTimeout(function () {
            theTimeOutLoop = undefined;
            _loopNFCAction();
        }, 200);
    }, delay);
};

//Gestion de boucle (privé)
var _loopNFCAction = function _loopNFCAction() {
    loopNfcContentIndex++;
    if (loopNfcContentIndex < loopNfcContent.length) {
        var nextContentTimeout = 2000;
        var currentContent = loopNfcContent[loopNfcContentIndex];
        try {
            var client = net.connect({ port: 2324, host: hostsAddress }, function () {
                var request = '<rc version="1" id="1" action="now_playing" />\r\n\r\n';
                client.write(request);
            });
            client.on('error', function (err) {
                debug('Connect to ' + hostsAddress + ' ERROR to Broadsign player (_loopNFCAction)', err);
                _nextLoppNFC(nextContentTimeout, currentContent);
            });
            client.on('close', function (had_error) {
                debug('Close socket Broadsign player (_loopNFCAction)', had_error);
            });
            //on data response parse document and extract nfc field
            client.on('data', function (response) {
                //debug(response.toString());
                try {
                    parser.parseString(response, function (err, result) {
                        if (err) {
                            debug('LOOP ACTION ERROR (_loopNFCAction) : ', err);
                        }
                        else {
                            try {
                                nextContentTimeout = parseInt(result.rc.frame[0].current_item[0].$.remaining_ms, 10);
                                debug('LOOP ACTION VALUE PARSE:' + nextContentTimeout);
                                if (nextContentTimeout > 200) {
                                    nextContentTimeout -= 200;
                                }
                            }
                            catch (err) {
                                debug('LOOP ACTION ERROR (_loopNFCAction): ' + err.message);
                            }
                        }
                    });
                }
                catch (err) {
                    debug('LOOP ACTION ERROR (_loopNFCAction) : ' + err.message);
                }
                finally {
                    client.end();
                }
            });
            client.on('end', function () {
                debug('End socket Broadsign player (_loopNFCAction)');
                _nextLoppNFC(nextContentTimeout, currentContent);
            });
        }
        catch (err) {
            debug('LOOP ACTION ERROR (_loopNFCAction): ' + err.message);
            _nextLoppNFC(nextContentTimeout, currentContent);
        }
    }
};

// * node module *
if (typeof module !== 'undefined') {
    module.exports = Broadsign;
}
