'use strict';
(function () {
  var Debug = require('debug');
  var net = require('net');
  var Promise = require('es6-promise').Promise;
  var xml2js = require('xml2js');

  var Broadsign = Broadsign || {};//Espace de nom

  Broadsign.Request = function Request(hostAddress) {
    this.debug = Debug('jcdecaux.broadsign');
    this._parser = new xml2js.Parser();
    this.hostAddress = hostAddress;
  }

  Broadsign.Request.prototype._sendRequest = function _sendRequest(req) {
    var that = this;

    return new Promise(function (resolve, reject) {
      try {        
        var xmlResponse = undefined;
        var client = net.connect({ port: 2324, host: that.hostAddress }, function () {
          client.write(req);
          that.debug('send (_sendRequest) :', req);
        });

        client.on('error', function (err) {
          that.debug('Connection ERROR to Broadsign player (_sendRequest) :', err);
          reject(err);
        });

        client.on('close', function (hadError) {
          that.debug('Close socket to Broadsign player (_sendRequest) :', hadError);
        });

        client.on('end', function () {
          that.debug('End socket to Broadsign player (_sendRequest)');
          if (xmlResponse) {
            resolve(xmlResponse);//Resolution
          }
        });

        client.on('data', function (response) {
          that.debug('response : ' + response.toString());
          try {
            that._parser.parseString(response, function (err, result) {
              if (err) {
                that.debug('Parse broadSign response Error (_request) :', err);
                reject(err);
              } else {
                xmlResponse = result;//Reponse
              }
            })
          } catch (err) {
            that.debug('VALUE PARSE ERROR (_request) :', err);
            reject(err);
          } finally {
            client.end();
          }
        });
      } catch (err) {
        that.debug('GLOBAL ERROR (_request) :', err);
        reject(err);
      }
    });
  };

  /** Get now playing informations
   * Lecture dans broadSign des informations sur l'ADCopy courrante
  */
  Broadsign.Request.prototype.getNowPLaying = function getNowPLaying() {
    return this._sendRequest('<rc version="1" id="1" action="now_playing" />\r\n\r\n');
  };

  Broadsign.Request.prototype.pushTrigger = function pushTrigger(id) {
    return this._sendRequest('<rc duration="10000" version="6" action="trigger" id="1" trigger_category_id="' + id + '" />\r\n\r\n');
  };

  if (typeof module !== 'undefined') {
    module.exports = Broadsign;
  }
})();

