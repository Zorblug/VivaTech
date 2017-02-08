'use strict';
(function () {
  var Debug = require('debug');
  var Events = require('events');
  var NdefLibrary = require('../lib/ndeflibrary');
  var Promise = require('es6-promise').Promise;
  var SerialPort = require('serialport').SerialPort;

  var TagNfc = function (port) {
    this._debug = Debug('jcdecaux.NFC');
    this._com = new SerialPort(port, { autoOpen: false, baudrate: 115200 });
    this._bufferSerial = [];
    this._bufferASCII = "";
    this._startFound = false;
    this._delayBetweenRfOn = 0;
    this.events = new Events.EventEmitter();


    function fillArrayWithNumbers(n) {
      var arr = Array.apply(null, Array(n));
      return arr.map(function (x, i) { return 0 });
    }

    this._zeroArray = fillArrayWithNumbers(64);

    var that = this;
    this._com.on('error', function (error) {
      that._debug('ERROR event :' + error);
      that.events.emit('error', error);
    });

    this._com.on('disconnect', function () {
      that._debug('DISCONNECT');
      that.events.emit('disconnect');
    });

    this._com.on('close', function () {
      that._debug('CLOSED');
      that.events.emit('close');
    });

    this._com.on('data', this._receivedData);
  };

  TagNfc.prototype.open = function open() {
    var that = this;
    return new Promise(function (resolve, reject) {
      that._com.open(function (error) {
        if (error) {
          that._debug('Error to open serial port : ' + error);
          reject(error);
        } else {
          that._debug('Port open ...');
          resolve();
        }
      });
    });
  };

  TagNfc.prototype.close = function close() {
    var that = this;
    return new Promise(function (resolve, reject) {
      that._com.close(function (error) {
        if (error) {
          that._debug('Error to close serial port : ' + error);
          reject(error);
        } else {
          that._debug('Port closed.');
          resolve();
        }
      });
    });
  };

  TagNfc.prototype.isOpen = function isOpen() {
    return this._com.isOpen();
  };

  TagNfc.prototype._receivedData = function receivedData(data) {
    for (var i = 0; i < data.length; i++) {
      //if startCharacter detected, collect data
      if (this._startFound) {
        //if endCharacter detected, turn this._startFound to false and
        if (data[i] == 60) {
          this._startFound = false;
          for (var j = 0; j < this._bufferSerial.length; j++) {
            this._bufferASCII += String.fromCharCode(bufferSerial[j]);
          }
          //debug('data received : '+ this._bufferSerial + ' : ' + this._bufferASCII);
          this._isNfcActivity(this._bufferASCII);
          this._bufferSerial.splice(0, this._bufferSerial.length);
          this._bufferASCII = "";
        }
        else {
          this._bufferSerial.push(data[i]);
        }
      }
      else {
        if (data[i] == 62) {
          this._startFound = true;
        }
      }
    }
  };

  TagNfc.prototype._isNfcActivity = function isNfcActivity(data) {
    var now = Date.now();
    if ((data == 'RF ON') && (now > this._delayBetweenRfOn)) {
      this._debug('RF ON');
      this._delayBetweenRfOn = Date.now() + 1000;
      that.events.emit('tagon');
    }
    else if (data == "RF OFF") {
      this._debug('RF ON');
      that.events.emit('tagoff');
    }
  };

  TagNfc.prototype._write = function _write(data) {
    var that = this;
    return new Promise(function (resolve, reject) {
      try {
        that._com.write(data, function () {
          resolve();
        });
      }
      catch (err) {
        reject(err);
      }
    });
  };

  TagNfc.prototype.writeUri = function writeUri(uri) {
    // if (uri.length > 0) {
    //   try {
    //     var ndefMessage = new NdefLibrary.NdefMessage();
    //     var ndefUriRecord = new NdefLibrary.NdefUriRecord();
    //     ndefUriRecord.setUri(uri);
    //     ndefMessage.push(ndefUriRecord);
    //     var byteArray = ndefMessage.toByteArray();
    //     this._debug(byteArray);
    //     var NFCMessageByteArray = [3];
    //     var lengthValue = byteArray.length;
    //     NFCMessageByteArray.push(lengthValue);
    //     NFCMessageByteArray = NFCMessageByteArray.concat(byteArray);
    //     NFCMessageByteArray.push(254);
    //     NFCMessageByteArray.push(10);
    //     NFCMessageByteArray.push(13);
    //     this._debug(NFCMessageByteArray);

    //     if (NFCMessageByteArray.length !== 0) {
    //       var NFCContent = new Buffer(NFCMessageByteArray);
    //       var that = this;

    //       return new Promise(function (resolve, reject) {
    //         that._write(that._zeroArray)
    //           .then(function () {
    //             that._debug(uri);
    //             return that._write(NFCContent);
    //           })
    //           .then(function () {
    //             resolve();
    //           })
    //           .catch(function (err) {
    //             reject(err);
    //           });
    //       });

    //     }
    //     else {
    //       return Promise.reject('No NFC Data !');
    //     }
    //   }
    //   catch (error) {
    //     return Promise.reject(error);
    //   }
    // }
    // else {
    //   return Promise.reject('Uri empty !');
    // }



      try {
        this._com.write(this._zeroArray);//RAZ NFC
        this._debug(uri);
        if (uri.length !== 0) {
          var ndefMessage = new NdefLibrary.NdefMessage();
          var ndefUriRecord = new NdefLibrary.NdefUriRecord();
          ndefUriRecord.setUri(uri);
          ndefMessage.push(ndefUriRecord);
          var byteArray = ndefMessage.toByteArray();
          this._debug(byteArray);
          var NFCMessageByteArray = [3];
          var lengthValue = byteArray.length;
          var endValue = 254;
          NFCMessageByteArray.push(lengthValue);
          NFCMessageByteArray = NFCMessageByteArray.concat(byteArray);
          NFCMessageByteArray.push(endValue);
          this._debug(NFCMessageByteArray);
          if (NFCMessageByteArray.length !== 0) {
            var NFCContent = new Buffer(NFCMessageByteArray);
            this._com.write(NFCContent);
            this._com.write('\r\n');
          }
        }
      }
      catch (err) {
        this._debug('VALUE PARSE ERROR (pushNFC) :', err);
      }

  };

  if (typeof module !== 'undefined') {
    module.exports = TagNfc;
  }
})();