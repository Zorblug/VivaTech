/* Driver camera OMRONHVC P2 
 * Philippe EBERSOLD
 * 
 * Version compatible avec node 0.10.33 32bist sur linux openwrt 
*/
'use strict';
var Debug = require('debug');
var EventEmitter = require('events').EventEmitter;
var Promise = require('es6-promise').Promise;
var SerialPort = require('serialport').SerialPort;

var HvcP2_Driver = HvcP2_Driver || {};//Espace de nom HvcP2_Driver


// # Reponse aux commandes 
HvcP2_Driver.CameraAnswer = function CameraAnswer() {
  this.code = -1
  this.dataBuffer = undefined
};

HvcP2_Driver.CameraAnswer.debug = Debug('hvc:answer');

HvcP2_Driver.CameraAnswer.prototype.fill = function fill(answer) {
  this.code = answer.code
  this.dataBuffer = new Buffer(answer.data)
  HvcP2_Driver.CameraAnswer.debug(this.dataBuffer)
};

HvcP2_Driver.CameraAnswer.prototype.getData = function data() {
  return this.dataBuffer.toString('hex')
};

HvcP2_Driver.CameraAnswer.prototype.message = function message() {
  var message = 'Empty';
  switch (this.code) {
    case 0:
      message = 'Normal end';
      break;
    case 1:
      message = 'Number of faces that can be registered is 0';
      break;
    case 2:
      message = 'Number of detected faces is 2 or more';
      break;
    case 0xF0:
    case 0xF1:
    case 0xF2:
    case 0xF3:
    case 0xF4:
    case 0xF5:
    case 0xF6:
    case 0xF7:
    case 0xF8:
    case 0xF9:
      message = 'Device error';
      break;
    case 0xFA:
    case 0xFB:
    case 0xFC:
      message = 'Transmission error';
      break;
    case 0xFD:
      message = 'Improper command';
      break;
    case 0xFE:
      message = 'Internal error';
      break;
    case 0xFF:
      message = 'Undefined error';
      break;
    default:
      if ((this.code >= 0xC0) && (this.code <= 0xDF)) {
        message = 'Face recognition data error';
      }
      break;
  }
  return message
};

HvcP2_Driver.CameraAnswer.prototype.isError = function isError() {
  return this.code >= 0xC0;
};

// # Reponse à la commande getVersion
HvcP2_Driver.VersionAnswer = function VersionAnswer() {
  HvcP2_Driver.CameraAnswer.call(this);//Herite de CameraAnswer
};

HvcP2_Driver.VersionAnswer.prototype = Object.create(HvcP2_Driver.CameraAnswer.prototype, {
  constructor: HvcP2_Driver.VersionAnswer
});

HvcP2_Driver.VersionAnswer.prototype.modelString = function modelString() {
  return this.dataBuffer.toString('utf8', 0, 12);
};

HvcP2_Driver.VersionAnswer.prototype.major = function major() {
  return this.dataBuffer.readUInt8(12);
};

HvcP2_Driver.VersionAnswer.prototype.minorChanges = function minorChanges() {
  return this.dataBuffer.readUInt8(13);
};

HvcP2_Driver.VersionAnswer.prototype.minorCorrections = function minorCorrections() {
  return this.dataBuffer.readUInt8(14);
};

// # Reponse à la commande getCameraAngle
HvcP2_Driver.AngleAnswer = function AngleAnswer() {
  HvcP2_Driver.CameraAnswer.call(this);//Herite de CameraAnswer
};

HvcP2_Driver.AngleAnswer.prototype = Object.create(HvcP2_Driver.CameraAnswer.prototype, {
  constructor: HvcP2_Driver.AngleAnswer
});

HvcP2_Driver.AngleAnswer.degre = function () {
  var val = this.value;
  switch (val) {
    case 0x01:
      return 90;
    case 0x02:
      return 180;
    case 0x03:
      return 270;
    default:
      return 0;
  }
};

HvcP2_Driver.AngleAnswer.value = function () {
  return this.dataBuffer.readUInt8(0);
};

// # Reponse à la commnande getFaceAngle;
HvcP2_Driver.FaceAngledAnswer = function FaceAngledAnswer() {
  HvcP2_Driver.CameraAnswer.call(this);//;Herite de CameraAnswer
};

HvcP2_Driver.FaceAngledAnswer.prototype = Object.create(HvcP2_Driver.CameraAnswer.prototype, {
  constructor: HvcP2_Driver.FaceAngledAnswer
});

HvcP2_Driver.FaceAngledAnswer.prototype.yawValue = function yawValue() {
  return this.dataBuffer.readInt8(0);
};

HvcP2_Driver.FaceAngledAnswer.prototype.yawAngle = function yawAngle() {
  switch (this.yawValue) {
    case 0:
      return 30;
    case 1:
      return 60;
    case 2:
      return 90;
    default:
      return -1;
  }
};

HvcP2_Driver.FaceAngledAnswer.prototype.rollValue = function rollValue() {
  return this.dataBuffer.readInt8(1);
};

HvcP2_Driver.FaceAngledAnswer.prototype.rollAngle = function rollAngle() {
  switch (this.yawValue) {
    case 0:
      return 15;
    case 1:
      return 45;
    default:
      return -1;
  }
};

// # Reponse a la commande Execute
HvcP2_Driver.ExecuteAnswer = function ExecuteAnswer(options, imageSize) {
  HvcP2_Driver.CameraAnswer.call(this);//Herite de CameraAnswer

  this._bodiesDetection = (options & 0x0001) !== 0x0000
  this._handsDetection = (options & 0x0002) !== 0x0000;

  this._facesOffset = 0;
  if (this._facesDetection = ((options & 0x0004) !== 0x0000)) { // Faces detection      
    this._facesOffset += 8;
  }
  if (this._directionEstimation = ((options & 0x0008) !== 0x0000)) { // Faces direction estimation
    this._facesOffset += 8;
  }
  if (this._ageEstimation = ((options & 0x0010) !== 0x0000)) { // Ages estimation 
    this._facesOffset += 3;
  }
  if (this._genderEstimation = ((options & 0x0020) !== 0x0000)) {
    this._facesOffset += 3;
  }
  if (this._gazeEstimation = ((options & 0x0040) !== 0x0000)) {
    this._facesOffset += 2;
  }
  if (this._blinkEstimation = ((options & 0x0080) !== 0x0000)) {
    this._facesOffset += 4;
  }
  if (this._expressionEstimation = ((options & 0x0100) !== 0x0000)) {
    this._facesOffset += 6;
  }
  if (this._facesRecognition = ((options & 0x0200) !== 0x0000)) {
    this._facesOffset += 4;
  }

  this._imageSize = 0;
  switch (imageSize) {
    case 1:
      this._imageSize = 76800; // 320 x 240
      break;
    case 2:
      this._imageSize = 19200; // 160 x 120
      break;
    default:
      break;
  }
};

HvcP2_Driver.ExecuteAnswer.prototype = Object.create(HvcP2_Driver.CameraAnswer.prototype, {
  constructor: HvcP2_Driver.ExecuteAnswer
});

HvcP2_Driver.ExecuteAnswer.prototype.bodiesDetection = function bodiesDetection() {
  return this._bodiesDetection;
};

HvcP2_Driver.ExecuteAnswer.prototype.handsDetection = function handsDetection() {
  return this._handsDetection;
};

HvcP2_Driver.ExecuteAnswer.prototype.facesDetection = function facesDetection() {
  return this._facesDetection;
};

HvcP2_Driver.ExecuteAnswer.prototype.directionEstimation = function directionEstimation() {
  return this._directionEstimation;
};

HvcP2_Driver.ExecuteAnswer.prototype.ageEstimation = function ageEstimation() {
  return this._ageEstimation;
};

HvcP2_Driver.ExecuteAnswer.prototype.genderEstimation = function genderEstimation() {
  return this._genderEstimation;
};

HvcP2_Driver.ExecuteAnswer.prototype.gazeEstimation = function gazeEstimation() {
  return this._gazeEstimation;
};

HvcP2_Driver.ExecuteAnswer.prototype.blinkEstimation = function blinkEstimation() {
  return this._blinkEstimation;
};

HvcP2_Driver.ExecuteAnswer.prototype.expressionEstimation = function expressionEstimation() {
  return this._expressionEstimation;
};

HvcP2_Driver.ExecuteAnswer.prototype.facesRecognition = function facesRecognition() {
  return this._facesRecognition;
};

HvcP2_Driver.ExecuteAnswer.prototype.imageSize = function imageSize() {
  return this._imageSize;
};

HvcP2_Driver.ExecuteAnswer.prototype.bodiesCount = function bodiesCount() {
  return this.dataBuffer.readInt8(0);
};

HvcP2_Driver.ExecuteAnswer.prototype.handsCount = function handsCount() {
  return this.dataBuffer.readInt8(1);
};

HvcP2_Driver.ExecuteAnswer.prototype.facesCount = function facesCount() {
  return this.dataBuffer.readInt8(2);
};

HvcP2_Driver.ExecuteAnswer.prototype.body = function body(index) {
  var count = this.bodiesCount();
  if (index < count) {
    var offset = 4 + (8 * index);
    return {
      valid: true,
      x: this.dataBuffer.readInt16LE(offset),
      y: this.dataBuffer.readInt16LE(offset + 2),
      size: this.dataBuffer.readInt16LE(offset + 4),
      conf: this.dataBuffer.readInt16LE(offset + 6)
    };
  } else {
    return {
      valid: false,
      x: 0,
      y: 0,
      size: 0,
      conf: 0
    };
  }
};

HvcP2_Driver.ExecuteAnswer.prototype.hand = function hand(index) {
  var count = this.handsCount();
  if (index < count) {
    var offset = 4 + (8 * this.bodiesCount()) + (8 * index);
    return {
      valid: true,
      x: this.dataBuffer.readInt16LE(offset),
      y: this.dataBuffer.readInt16LE(offset + 2),
      size: this.dataBuffer.readInt16LE(offset + 4),
      conf: this.dataBuffer.readInt16LE(offset + 6)
    };
  } else {
    return {
      valid: false,
      x: 0,
      y: 0,
      size: 0,
      conf: 0
    };
  }
};

HvcP2_Driver.ExecuteAnswer.prototype.face = function face(index) {
  var count = this.facesCount();
  if (this._facesDetection && (index < count)) {
    var offset = 4 + (8 * this.bodiesCount()) + (8 * this.handsCount()) + (this._facesOffset * index);
    return {
      valid: true,
      x: this.dataBuffer.readInt16LE(offset),
      y: this.dataBuffer.readInt16LE(offset + 2),
      size: this.dataBuffer.readInt16LE(offset + 4),
      conf: this.dataBuffer.readInt16LE(offset + 6)
    };
  } else {
    return {
      valid: false,
      x: 0,
      y: 0,
      size: 0,
      conf: 0
    };
  }
};

HvcP2_Driver.ExecuteAnswer.prototype.faceDirection = function faceDirection(index) {
  var count = this.facesCount();
  if (this._directionEstimation && (index < count)) {
    var offset = 4 + (8 * this.bodiesCount()) + (8 * this.handsCount()) + (this._facesOffset * index);
    if (this._facesDetection) {
      offset += 8;
    }
    return {
      valid: true,
      angle: {
        leftRight: this.dataBuffer.readInt16LE(offset),
        upDown: this.dataBuffer.readInt16LE(offset + 2),
        roll: this.dataBuffer.readInt16LE(offset + 4)
      },
      conf: this.dataBuffer.readInt16LE(offset + 6)
    };
  } else {
    return {
      valid: false,
      angle: {
        leftRight: 0,
        upDown: 0,
        roll: 0
      },
      conf: 0
    };
  }
};

HvcP2_Driver.ExecuteAnswer.prototype.age = function age(index) {
  var count = this.facesCount();
  if (this._ageEstimation && (index < count)) {
    var offset = 4 + (8 * this.bodiesCount()) + (8 * this.handsCount()) + (this._facesOffset * index);
    if (this._facesDetection) {
      offset += 8;
    }
    if (this._directionEstimation) {
      offset += 8;
    }
    return {
      valid: true,
      age: this.dataBuffer.readInt8(offset),
      conf: this.dataBuffer.readInt16LE(offset + 1)
    };
  } else {
    return {
      valid: false,
      age: 0,
      conf: 0
    };
  }
};

HvcP2_Driver.ExecuteAnswer.prototype.gender = function gender(index) {
  var count = this.facesCount();
  HvcP2_Driver.CameraAnswer.debug('COUNT :' + count + '/' + index, this._genderEstimation);
  if (this._genderEstimation && (index < count)) {
    var offset = 4 + (8 * this.bodiesCount()) + (8 * this.handsCount()) + (this._facesOffset * index);
    if (this._facesDetection) {
      offset += 8;
    }
    if (this._directionEstimation) {
      offset += 8;
    }
    if (this._ageEstimation) {
      offset += 3;
    }

    var genderCode = this.dataBuffer.readInt8(offset);

    return {
      valid: true,
      code: genderCode,
      gender: (genderCode === 0) ? 'female' : 'male',
      conf: this.dataBuffer.readInt16LE(offset + 1)
    };
  } else {
    return {
      valid: false,
      code: -1,
      gender: 'unknow',
      conf: 0
    };
  }
};

HvcP2_Driver.ExecuteAnswer.prototype.gaze = function gaze(index) {
  var count = this.facesCount();
  if (this._gazeEstimation && (index < count)) {
    var offset = 4 + (8 * this.bodiesCount()) + (8 * this.handsCount()) + (this._facesOffset * index);
    if (this._facesDetection) {
      offset += 8;
    }
    if (this._directionEstimation) {
      offset += 8;
    }
    if (this._ageEstimation) {
      offset += 3;
    }
    if (this._genderEstimation) {
      offset += 3;
    }
    return {
      valid: true,
      leftRight: this.dataBuffer.readInt8(offset),
      upDown: this.dataBuffer.readInt8(offset + 1)
    };
  } else {
    return {
      valid: false,
      leftRight: 0,
      upDown: 0
    };
  }
};

HvcP2_Driver.ExecuteAnswer.prototype.blink = function blink(index) {
  var count = this.facesCount();
  if (this._blinkEstimation && (index < count)) {
    var offset = 4 + (8 * this.bodiesCount()) + (8 * this.handsCount()) + (this._facesOffset * index);
    if (this._facesDetection) {
      offset += 8;
    }
    if (this._directionEstimation) {
      offset += 8;
    }
    if (this._ageEstimation) {
      offset += 3;
    }
    if (this._genderEstimation) {
      offset += 3;
    }
    if (this._gazeEstimation) {
      offset += 2;
    }
    return {
      valid: true,
      left: this.dataBuffer.readInt16LE(offset),
      right: this.dataBuffer.readInt16LE(offset + 2)
    };
  } else {
    return {
      valid: false,
      left: 0,
      right: 0
    };
  }
};

HvcP2_Driver.ExecuteAnswer.prototype.expression = function expression(index) {
  var count = this.facesCount();
  if (this._expressionEstimation && (index < count)) {
    var offset = 4 + (8 * this.bodiesCount()) + (8 * this.handsCount()) + (this._facesOffset * index);
    if (this._facesDetection) {
      offset += 8;
    }
    if (this._directionEstimation) {
      offset += 8;
    }
    if (this._ageEstimation) {
      offset += 3;
    }
    if (this._genderEstimation) {
      offset += 3;
    }
    if (this._gazeEstimation) {
      offset += 2;
    }
    if (this._blinkEstimation) {
      offset += 4;
    }
    return {
      valid: true,
      neutral: this.dataBuffer.readInt8(offset),
      happiness: this.dataBuffer.readInt8(offset + 1),
      surprise: this.dataBuffer.readInt8(offset + 2),
      anger: this.dataBuffer.readInt8(offset + 3),
      sadness: this.dataBuffer.readInt8(offset + 4),
      positif: this.dataBuffer.readInt8(offset + 5)
    };
  } else {
    return {
      valid: false,
      happiness: 0,
      surprise: 0,
      anger: 0,
      sadness: 0,
      positif: 0
    };
  }
};

HvcP2_Driver.ExecuteAnswer.prototype.faceRecognition = function faceRecognition(index) {
  var count = this.facesCount();
  if (this._facesRecognition && (index < count)) {
    var offset = 4 + (8 * this.bodiesCount()) + (8 * this.handsCount()) + (this._facesOffset * index);
    if (this._facesDetection) {
      offset += 8;
    }
    if (this._directionEstimation) {
      offset += 8;
    }
    if (this._ageEstimation) {
      offset += 3;
    }
    if (this._genderEstimation) {
      offset += 3;
    }
    if (this._gazeEstimation) {
      offset += 2;
    }
    if (this._blinkEstimation) {
      offset += 4;
    }
    if (this._expressionEstimation) {
      offset += 6;
    }
    return {
      valid: true,
      id: this.dataBuffer.readInt16LE(offset),
      conf: this.dataBuffer.readInt16LE(offset + 2)
    };
  } else {
    return {
      valid: false,
      id: 0,
      conf: 0
    };
  }
};

// #Protocole de communication avec la camera OMRON HCV P2
HvcP2_Driver.CameraProtocol = function CameraProtocol(portCom) {
  this.debug = Debug('hvc:driver');

  // AUTO RUN
  this._loopRun = false;
  this._loopOptions = 0;
  this._loopCallback = undefined;
  this._loopDelay = 5;

  // ANSWER
  this.Events = new EventEmitter();
  // answer Buffer
  this._serialBuffer = [];
  // this._lengthBuffer = Buffer.alloc(4, 0x00)//Nom compatible node0.10.*
  this._lengthBuffer = new Buffer(4);
  this._lengthIndex = 0;
  this._state = 0; // 0: ready to received, 1: on received code, 2: received answer length, 3: data on received
  this.answerLength = 0;// size of answer
  this.answerCode = -1; // answer code    
  // answer Timeout    
  this._timeout = undefined;

  // BAUDRATE FOUNDER
  this._currentBaudrateIdx = 0;
  this._baudrates = [9600, 38400, 115200, 230400, 460800, 921600];

  // Serial port
  this._com = new SerialPort(portCom, {
    autoOpen: false,
    baudRate: 9600
  });

  var that = this;
  this._com.on('error', function (error) {
    that.debug('ERROR ' + error);
    that.Events.emit('error', error);
  });

  this._com.on('disconnect', function () {
    that.debug('DISCONNECT');
    that.Events.emit('disconnect');
  });

  this._com.on('close', function () {
    that.debug('CLOSED');
    that.Events.emit('close');
  })

  // Answer received
  this._com.on('data', function (data) {
    that.debug('received data:' + JSON.stringify(data))
    for (var i = 0; i < data.length; i++) {
      if (that._state === 0) { // Wait synchronous code FEh
        if (data[i] === 0xFE) {
          that._state = 1;
          that.debug('Answer start ...');
        }
      } else if (that._state === 1) { // wait answer code
        that.answerCode = data[i];
        that._lengthIndex = 0;
        that._state = 2;
        that.debug('Answer code: ' + that.answerCode + '...');
      } else if (that._state === 2) { // wait answer length
        // that.debug('Length buffer : ', that._lengthIndex, data[i]);        
        that._lengthBuffer.writeUInt8(data[i], that._lengthIndex++);
        if (that._lengthIndex >= 4) {
          that.answerLength = that._lengthBuffer.readUInt32LE(0);
          that.debug('Answer length: ' + that.answerLength + ' ...');
          if (that.answerLength > 0) {
            that._state = 3;
          }
          else {
            that.__clearTimeout();
            that.debug('Answer code: ' + that.answerCode + ' length: ' + that.answerLength + '.');
            that.__emitAnswerEvent(that.answerCode, that._serialBuffer);
            that.__razAnswerValues();
          }
        }
      } else if (that._state === 3) { // wait answer datas
        that._serialBuffer.push(data[i]);
        if (that._serialBuffer.length >= that.answerLength) {
          that.__clearTimeout();
          that.debug('Answer code:' + that.answerCode + ' length:' + that.answerLength + ' data:' + JSON.stringify(that._serialBuffer) + '.');
          that.__emitAnswerEvent(that.answerCode, that._serialBuffer);
          that.__razAnswerValues();
        }
      }
    }
  });
};

HvcP2_Driver.CameraProtocol.prototype = {
  constructor: HvcP2_Driver.CameraProtocol,
  __clearTimeout: function __clearTimeout() {
    if (this._timeout) {
      clearTimeout(this._timeout);
      this._timeout = undefined;
    }
  },
  __emitAnswerEvent: function __emitAnswerEvent(code, dataArray) {
    this.Events.emit('answer', { code: code, data: dataArray });
  },
  __razAnswerValues: function __razAnswerValues() {
    // RAZ
    this._serialBuffer.splice(0, this._serialBuffer.length);
    this._lengthBuffer.writeUInt32LE(0x0, 0);
    this.answerLength = 0;
    this.answerCode = -1;
    this._state = 0;
  },
  __setPortComBaudRate: function __setPortComBaudRate(baudrate) {
    var that = this;
    return new Promise(function (resolve, reject) {
      try {
        that._com.update({ baudRate: baudrate }, function (error) {
          if (error) {
            reject(error, that);
          } else {
            that.debug('Set port speed:' + that._com.options.baudRate);
            setTimeout(function () {
              resolve(that);
            }, 100);
          }
        });
      } catch (error) {
        reject(error, that);
      }
    });
  },
  _executeLoop: function _executeLoop() {
    if (this._loopRun) {
      var that = this;
      setTimeout(function () {
        that.execute(that._loopOptions)
          .then(function (answer) {
            if (that._loopCallback) {
              that._loopCallback(answer);
            }
            that._executeLoop();
          })
          .catch(function (err) {
            that.debug(err);
            that._executeLoop();
          })
      }, this._loopDelay);
    } else {
      this._loopCallback = undefined;
    }
  },
  _write: function (code, data, callback) {
    // var  requestBuffer = Buffer.allocUnsafe(data.length + 4)//Nom compatible noe 0.10.*
    var requestBuffer = new Buffer(data.length + 4);
    requestBuffer.writeUInt8(0xFE, 0);
    requestBuffer.writeUInt8(code, 1);
    requestBuffer.writeUInt16LE(data.length, 2);
    if (data.length > 0) {
      if (!Buffer.isBuffer(data)) {
        // data = Buffer.from(data); //Nom compatible noe 0.10.*
        data = new Buffer(data);
      }
      data.copy(requestBuffer, 4, 0, data.length);
    }
    this.debug('Send : ', requestBuffer);
    this._com.write(requestBuffer, callback);
  },
  _send: function _send(code, data, answerObj, timeout) {
    var that = this;
    var data = data || [];
    var answerObj = answerObj === undefined ? new HvcP2_Driver.CameraAnswer() : answerObj;
    var timeout = timeout || 10000;

    return new Promise(function (resolve, reject) {
      that.Events.once('answer', function (answer) {
        // this.debug('EVENT answer:' + JSON.stringify(answer));
        that.debug('EVENT answer code :' + answer.code);
        if (answer.code < 0) {
          reject(new Error('TIMEOUT'), that);
        } else {
          answerObj.fill(answer);
          resolve(answerObj);
        }
      })

      that.__clearTimeout();
      that._timeout = setTimeout(function () {
        that._timeout = undefined;
        that.debug('Answer Timeout');
        that.__emitAnswerEvent(-1, []);
        that.__razAnswerValues();
      }, timeout);

      that._write(code, data, function (err) {
        if (err) {
          that.debug('Write ERROR :', err);
          that.__clearTimeout();
          that.__emitAnswerEvent(-1, []);
          that.__razAnswerValues();
          reject(err, that);
        }
      });
    });
  },
  open: function open() {
    var that = this;
    return new Promise(function (resolve, reject) {
      that._com.open(function (err) {
        if (err) {
          reject(err, that);
        } else {
          that.debug('Port open ...');
          resolve(that);
        }
      });
    });
  },
  close: function close() {
    var that = this;
    return new Promise(function (resolve, reject) {
      that._com.close(function (err) {
        if (err) {
          reject(err, that);
        }
        else {
          resolve(that);
        }
      });
    });
  },
  foundBaudrate: function foundBaudrate() {
    var that = this;
    return new Promise(function (resolve, reject) {
      that.getVersion()
        .then(function (answer) {
          that.debug('Version:' + answer.major() + '.' + answer.minorChanges() + '.' + answer.minorCorrections() + ' Model:' + answer.modelString() + '.');
          that._currentBaudrateIdx = 0;
          // that.debug(JSON.stringify(that._com));
          resolve(that);
        })
        .catch(function () {
          that._currentBaudrateIdx += 1;
          if (that._currentBaudrateIdx < that._baudrates.length) {
            that.__setPortComBaudRate(that._baudrates[that._currentBaudrateIdx])
              .then(function () {
                return that.foundBaudrate();
              })
              .then(function () {
                resolve(that);
              })
              .catch(function (err) {
                that._currentBaudrateIdx = 0;
                reject(err, that);
              })
          } else {
            that._currentBaudrateIdx = 0;
            reject(new Error('Speed not found'), that);
          }
        });
    });
  },
  getVersion: function getVersion() {
    return this._send(0x00, [], new HvcP2_Driver.VersionAnswer(), 1000);
  },
  setCameraAngle: function setCameraAngle(angle) {
    var p = undefined;
    if (angle === 0) {
      p = this._send(0x01, [0x00]);
    } else if ((angle === 1) || (angle === 90)) {
      p = this._send(0x01, [0x01]);
    } else if ((angle === 2) || (angle === 180)) {
      p = this._send(0x01, [0x02]);
    } else if ((angle === 3) || (angle === 270)) {
      p = this._send(0x01, [0x03]);
    } else {
      p = Promise.reject('bad argument', this);
    }

    return p;
  },
  getCameraAngle: function getCameraAngle() {
    return this._send(0x02, [], new HvcP2_Driver.AngleAnswer());
  },
  setFaceAngles: function setFaceAngles(yaw, roll) {
    var values = new Buffer(2);

    if (yaw === 0 || yaw === 30 || yaw === -30) {
      values.writeUInt8(0x00, 0);
    } else if (yaw === 1 || yaw === 60 || yaw === -60) {
      values.writeUInt8(0x01, 0);
    } else if (yaw === 2 || yaw === 90 || yaw === -90) {
      values.writeUInt8(0x02, 0);
    }

    if (roll === 0 || roll === 15 || roll === -15) {
      values.writeUInt8(0x00, 1);
    } else if (roll === 1 || roll === 45 || roll === -45) {
      values.writeUInt8(0x01, 1);
    }

    return this._send(0x09, values);
  },
  getFaceAngles: function getFaceAngles() {
    return this._send(0x0A, [], new HvcP2_Driver.FaceAngledAnswer());
  },
  execute: function execute(options, imageSize) {
    imageSize = imageSize || HvcP2_Driver.CameraProtocol.ImageSize.noImage;
    var cmd = new Buffer(3);
    cmd.writeUInt16LE(options, 0);
    cmd.writeUInt8(imageSize, 2);
    // this.debug('option', cmd);

    var timeout = (imageSize !== HvcP2_Driver.CameraProtocol.ImageSize.noImage) ? 120000 : 30000;

    return this._send(0x04, cmd, new HvcP2_Driver.ExecuteAnswer(options, imageSize), timeout);
  },
  loopState: function () {
    return { run: this._loopRun, delay: this._loopDelay };
  },
  startLoop: function (options, callback, delay) {
    delay = delay || 5;
    this._loopRun = true;
    this._loopOptions = options;
    this._loopCallback = callback;
    this._loopDelay = delay;
    this._executeLoop();
  },
  stopLoop: function stopLoop() {
    this._loopRun = false;
  }
};

HvcP2_Driver.CameraProtocol.Option = {
  bodyDetection: 0x0001,
  handDetection: 0x0002,
  faceDetection: 0x0004,
  faceDirectionEstimation: 0x0008,
  ageEstimation: 0x0010,
  genderEstimation: 0x0020,
  gazeEstimation: 0x0040,
  blinkEstimation: 0x0080,
  expressionEstimation: 0x0100
  // faceRecognition: 0x0200
};

HvcP2_Driver.CameraProtocol.ImageSize = {
  noImage: 0x00,
  large: 0x01, // 320 x 240
  small: 0x02 // 160 x 120
};

module.exports = HvcP2_Driver;