'use strict';

var debug = require('debug')('jcdecaux.camera.service');
var Promise = require('es6-promise').Promise;

// var _hvcP2Driver = require('./hvc-p2-driver');

// function Camera() {
//   this._cam = undefined;
//   this._options = _hvcP2Driver.CameraProtocol.Option.faceDetection | _hvcP2Driver.CameraProtocol.Option.faceDirectionEstimation | _hvcP2Driver.CameraProtocol.Option.genderEstimation |
//     _hvcP2Driver.CameraProtocol.Option.ageEstimation | _hvcP2Driver.CameraProtocol.Option.gazeEstimation;
//   // this.Events = new EventEmitter();
//   // this.Events.on('newListener', function (event, listener) {
//   //   debug('NEW LISTENER', event, listener);
//   // });
// }

// Camera.prototype.open = function open(portCom) {
//   var _that01 = this;
//   var p = new Promise(function (resolve, reject) {
//     if (!_that01._cam) {
//       debug('Camera open port 1' + portCom);
//       _that01._cam = new _hvcP2Driver.CameraProtocol(portCom);
//       debug('Camera open port 2 ...' + portCom);
//       _that01._cam.open()
//         .then(function (cam) {
//           debug('Camera open ...');
//           return cam.foundBaudrate();
//         })
//         // .then(function (cam) {
//         //   debug('Camera baudrate = ' + cam.baudRate);
//         //   if (cam.baudRate >= 115200) {
//         //     return Promise.resolve(cam);
//         //   }
//         //   else {
//         //     return cam.setBaudrate(115200);
//         //   }
//         // })
//         .then(function (cam) {
//           debug('Camera port open :' + JSON.stringify(cam._com));
//           // _that01.Events.emit('detect','OPEN');
//           return cam.setFaceAngles(1, 0);
//         })
//         .then(function (answer) {
//           if (answer.isError) {
//             debug('Answer ERROR :', answer);
//           }
//           return _that01._cam.getFaceAngles();
//         })
//         .then(function (answer) {
//           var result = {
//             yaw: answer.yawAngle,
//             roll: answer.rollAngle
//           };
//           debug('Answer angle' + JSON.stringify(result))
//           resolve(_that01);
//         })
//         .catch(function (err, cam) {
//           reject(err, _that01);
//         })
//     }
//     else {
//       resolve(_that01);
//     }
//   })

//   return p;
// };

// // Camera.prototype._resultCallback = function _resultCallback(answer) {
// //   var infos = buildInfosResult(answer);
// //   // debug('Detection event : ' + JSON.stringify(infos));
// //   this.Events.emit('detect', infos);
// // };

// Camera.prototype.start = function start(callback) {
//   var _that02 = this;
//   var p = new Promise(function (resolve, reject) {
//     if (_that02._cam) {
//       if (!_that02._cam._loopRun) {
//         _that02._cam.startLoop(_that02._options, callback, 1500);
//         // _that02.Events.emit('detect','START');
//       }
//       resolve(_that02);
//     }
//     else {
//       reject('not open', _that02);
//     }
//   });
//   return p;
// };


// var CameraService = CameraService || (function CameraService() {
//   var instance = undefined;
//   return {
//     getInstance: function getInstance() {
//       if (!instance) {
//         instance = new Camera();
//       }
//       return instance;
//     },
//     buildInfosResult: function buildInfosResult(answer) {
//       var infos = {
//         count: answer.facesCount,
//         list: []       
//       };

//       for (var i = 0; i < answer.facesCount; i++) {
//         var item = {
//           gender: {},
//           age: {},
//           gaze: {},
//           direction: {},
//           blink: {},
//           expression: {}
//         };
//         if (answer.genderEstimation) {
//           item.gender = answer.gender(i);
//         }
//         if (answer.ageEstimation) {
//           item.age = answer.age(i);
//         }
//         if (answer.gazeEstimation) {
//           item.gaze = answer.gaze(i);
//         }
//         if (answer.directionEstimation) {
//           item.direction = answer.faceDirection(i);
//         }
//         if (answer.blinkEstimation) {
//           item.blink = answer.blink(i);
//         }
//         if (answer.expressionEstimation) {
//           item.expression = answer.expression(i);
//         }
//         infos.list.push(item);
//       }
//       return infos;
//     }
//   };
// })();//Espace de nom


var _hvcP2Driver = require('./hvc-p2-driver-es5');

function Camera() {
  this._cam = undefined;
  this._options = _hvcP2Driver.CameraProtocol.Option.faceDetection | _hvcP2Driver.CameraProtocol.Option.faceDirectionEstimation | _hvcP2Driver.CameraProtocol.Option.genderEstimation |
    _hvcP2Driver.CameraProtocol.Option.ageEstimation | _hvcP2Driver.CameraProtocol.Option.gazeEstimation;
}

Camera.prototype.open = function open(portCom) {
  var _that = this;
  var p = new Promise(function (resolve, reject) {
    if (!_that._cam) {      
      debug('Camera open port :' + portCom);
      _that._cam = new _hvcP2Driver.CameraProtocol(portCom);
      _that._cam.open()
        .then(function (cam) {
          return cam.foundBaudrate();
        })
        .then(function (cam) {
          debug('Camera opened on port :' + portCom);
          // debug('Camera port open :' + JSON.stringify(cam._com));
          return cam.setFaceAngles(1, 0);
        })
        .then(function (answer) {
          if (answer.isError) {
            debug('Answer ERROR :', answer);
          }
          return _that._cam.getFaceAngles();
        })
        .then(function (answer) {
          var result = {
            yaw: answer.yawAngle(),
            roll: answer.rollAngle()
          };
          debug('Answer angle' + JSON.stringify(result));
          resolve(_that);
        })
        .catch(function (err, cam) {
          reject(err, _that);
        })
    }
    else {
      resolve(_that);
    }
  })

  return p;
};

Camera.prototype.start = function start(callback) {
  var _that = this;
  var p = new Promise(function (resolve, reject) {
    if (_that._cam) {
      if (!_that._cam._loopRun) {
        _that._cam.startLoop(_that._options, callback, 2000);
      }
      resolve(_that);
    }
    else {
      reject('not open', _that);
    }
  });
  return p;
};


var CameraService = CameraService || (function CameraService() {
  var instance = undefined;
  return {
    getInstance: function getInstance() {
      if (!instance) {
        instance = new Camera();
      }
      return instance;
    },
    buildInfosResult: function buildInfosResult(answer) {
      var infos = {
        count: answer.facesCount(),
        list: []       
      };

      for (var i = 0; i < answer.facesCount(); i++) {
        var item = {
          gender: {},
          age: {},
          gaze: {},
          direction: {},
          blink: {},
          expression: {}
        };
        if (answer.genderEstimation()) {
          item.gender = answer.gender(i);
        }
        if (answer.ageEstimation()) {
          item.age = answer.age(i);
        }
        if (answer.gazeEstimation()) {
          item.gaze = answer.gaze(i);
        }
        if (answer.directionEstimation()) {
          item.direction = answer.faceDirection(i);
        }
        if (answer.blinkEstimation()) {
          item.blink = answer.blink(i);
        }
        if (answer.expressionEstimation()) {
          item.expression = answer.expression(i);
        }
        infos.list.push(item);
      }
      return infos;
    }
  };
})();//Espace de nom

module.exports = CameraService;