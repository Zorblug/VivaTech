'use strict';
(function () {
  var Debug = require('debug');
  var Broadsign = require('./broadSign');
  var TagNfc = require('./tagNfc');

  Broadsign.Manager = function Request(hostAddress, port) {
    this.debug = new Debug('jcdecaux.broadsign.manager');
    this._player = new Broadsign.Request(hostAddress);
    this._nfc = new TagNfc(port);
    this._nextPlayingInfosTimeOut = undefined;

    this._loopContent = [];
    this._loopIndex = 0;
    this._loopTimeOut = undefined;
  };

  Broadsign.Manager.prototype.open = function open() {
    return this._nfc.open();
  };

  Broadsign.Manager.prototype._nextPushNFC = function _nextPushNFC(duration) {    
    if (this._nextPlayingInfosTimeOut === undefined) {
      var delay = duration + 1000;
      var that = this;

      this._nextPlayingInfosTimeOut = setTimeout(function (contex) {
        that._nextPlayingInfosTimeOut = undefined;
        that.pushNFC();
      }, delay);

      this.debug('NEXT POLLING :' + delay);
    }
  };

  Broadsign.Manager.prototype.resetNFC = function resetNFC() {
    if (this._nextPlayingInfos !== undefined) {
      clearTimeout(this._nextPlayingInfos);
      this._nextPlayingInfosTimeOut = undefined;
    }
  };

  Broadsign.Manager.prototype.rearmNFC = function rearmNFC(duration) {
    this.resetNFC();
    this._nextPushNFC(duration);
  };

  Broadsign.Manager.prototype.pushNFC = function pushNFC() {
    var that = this;
    var nextDelay = 5000;

    this.resetNFC();

    this._player.getNowPLaying()
      .then(function (response) {
        var url = unescape(response.rc.frame[0].current_item[0].bundle[0].ad_copy[0].$.flash_parameters).replace('nfc=', '');
        nextDelay = parseInt(response.rc.frame[0].current_item[0].$.remaining_ms, 10);
        that.debug('NFC :' + url);
        return that._nfc.writeUri(url);
      })
      .then(function () {
        that._nextPushNFC(nextDelay);
      })
      .catch(function (err) {
        that.debug(err);
        that._nextPushNFC(nextDelay);
      });
  };

  Broadsign.Manager.prototype.pushTrigger = function pushTrigger(id) {
    return this._player.pushTrigger(id);
  };

  Broadsign.Manager.prototype._loopNext = function _nextloopProcess(duration, triggerId) {
    if (this._loopTimeOut === undefined) {
      var that = this;

      this.debug('LOOP next in :' + duration);
      this._loopTimeOut = setTimeout(function () {
        that.pushTrigger(triggerId)
          .then(function (response) {
            setTimeout(function () {
              that._loopTimeOut === undefined;
              that._loopProcess();
            }, 200);
          })
          .catch(function (err) {
            that.debug('LOOP next Error:', err);
            that._loopTimeOut === undefined;
            that._loopProcess();
          });
      }, duration);
    }
  };

  Broadsign.Manager.prototype._loopProcess = function _loopProcess() {
    this._loopIndex++;
    if (this._loopIndex >= _loopContent.length) {
      this._loopIndex = 0;
    }

    var nextTriggerId = this._loopContent[this._loopIndex];
    var nextContentTimeout = 2000;
    var that = this;
    
    this._player.getNowPLaying()
      .then(function (response) {
        nextContentTimeout = parseInt(response.rc.frame[0].current_item[0].$.remaining_ms, 10);
        that.debug('LOOP next to:' + nextContentTimeout);
        if (nextContentTimeout > 200) {
          nextContentTimeout -= 200;
        }
        that._loopNext(nextContentTimeout, nextTriggerId);
      })
      .catch(function (err) {
        that.debug('LOOP with Error next to:' + nextContentTimeout, err);
        that._loopNext(nextContentTimeout, nextTriggerId);
      });
  };

  Broadsign.Manager.prototype.startLoop = function startLoop(idsArray) {
    this._loopContent = idsArray;
    this._loopIndex = 0;

    this.stopLoop();

    if (this._loopContent.length > 0) {
      var currentTriggerId = this._loopContent[this._loopIndex];
      var that = this;

      this.pushTrigger(currentTriggerId)
        .then(function (response) {
          that.rearmNFC(100);
          setTimeout(function () {
            that._loopProcess();
          }, 200);
        })
        .catch(function (err) {
          that.debug('LOOP start error:', err);
          that.rearmNFC(1100);
          setTimeout(function () {
            that.startLoop(idsArray);
          }, 1200);
        });
    }
  };

  Broadsign.Manager.prototype.stopLoop = function stopLoop() {
    if (this._loopTimeOut) {
      clearTimeout(this._loopTimeOut);
      this._loopTimeOut = undefined;
    }
  }

  if (typeof module !== 'undefined') {
    module.exports = Broadsign;
  }
})();