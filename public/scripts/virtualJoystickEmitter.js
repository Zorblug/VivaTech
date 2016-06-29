'use strict';

var VirtualJoystick = VirtualJoystick || {};//Espace de nom

VirtualJoystick.Pointer = function (id, x, y) {
    this.id = id;
    this.position = new Vector2(x, y);
};

VirtualJoystick.Pointer.prototype.set = function (id, x, y) {
    this.id = id;
    this.position.reset(x, y);
};

VirtualJoystick.Pointer.prototype.reset = function (x, y) {
    this.position.reset(x, y);
};

VirtualJoystick.Pointer.prototype.copyFromVector = function (v) {
    this.position.copyFrom(v);
};


VirtualJoystick.Emiter = function (serverAddress) {
    this._serverUrl = serverAddress + '/joystick';
    this._socket;
    this._connected = false;

    this._move = { x: 0, y: 0 };
    this._button = 0;

    this.leftPointer = new VirtualJoystick.Pointer(-1, 0, 0);
    this.leftPointerStartPos = new Vector2(0, 0),
    this.leftVector = new Vector2(0, 0);
    this.pointersList = new Collection();

    this._events = new ObservableEvents();

    // enable vibration support
    navigator.vibrate = navigator.vibrate || navigator.webkitVibrate || navigator.mozVibrate || navigator.msVibrate;
    if (navigator.vibrate) {
        console.log('VIBRATE OK');
        navigator.vibrate(1000);
    }
};

VirtualJoystick.Emiter.prototype.connect = function () {
    this._socket = io.connect(this._serverUrl);
    this._socket.emit('remote');
    this._connected = true;

    var that = this;

    this._socket.on('info', function (message) {
        console.log("INFO :" + JSON.stringify(message));
        that._events.fire('info', message.data);
    });

    this._socket.on('close', function () {
        console.log("CLOSE ");
        this._connected = false;
        that._socket.disconnect();
        that._events.fire('close');
    });

    this._socket.on('server', function (message) {
        that._events.fire('server', { data: message.data });
    });
};

VirtualJoystick.Emiter.prototype.close = function () {
    this._connected = false;
    this._socket.emit('close');
    this._socket.disconnect();
};

VirtualJoystick.Emiter.prototype._sendMove = function () {
    if (this._connected) {
        console.log("MOVE :" + JSON.stringify(this._move));
        this._socket.emit('move', this._move);
    }
};

VirtualJoystick.Emiter.prototype._sendButton = function () {
    if (this._connected) {
        console.log("RIGHT BUTTON :" + this._button);
        this._socket.emit('button', { value: this._button });
    }
};

VirtualJoystick.Emiter.prototype._sendClick = function (data) {
    if (this._connected) {
        console.log("CLICK :" + JSON.stringify(data));
        this._socket.emit('click', data);
    }
};

VirtualJoystick.Emiter.prototype.setLeftPointer = function (id, x, y) {
    console.log('LEFT X=' + x + ' Y=' + y + ' ID=' + id);
    this.leftPointer.set(id, x, y);
    this.leftPointerStartPos.reset(x, y);
    this.leftVector.reset(0, 0);
    this.pointersList.add(this.leftPointer.id, this.leftPointer);
    this.vibrate(15);
};

VirtualJoystick.Emiter.prototype.movePointer = function (id, x, y) {
    if (this.leftPointer.id == id) {
        //LEFT POINTER
        var moveUpdated = false;
        var distanceX = ((x - this.leftPointerStartPos.x) * (x - this.leftPointerStartPos.x));
        var distanceY = ((y - this.leftPointerStartPos.y) * (y - this.leftPointerStartPos.y));

        var distance = distanceX + distanceY;

        if (distanceX > 400) {
            //GESTION DES X
            if ((x > this.leftPointerStartPos.x) && (this._move.x !== 1)) {
                this._move.x = 1;
                moveUpdated = true;
            }
            else if ((x < this.leftPointerStartPos.x) && (this._move.x !== -1)) {
                this._move.x = -1;
                moveUpdated = true;
            }
        }
        else if (this._move.x !== 0) {
            this._move.x = 0;
            moveUpdated = true;
        }


        if (distanceY > 400) {
            //GESTION DES Y
            if ((y > this.leftPointerStartPos.y) && (this._move.y !== 1)) {
                this._move.y = 1;
                moveUpdated = true;
            }
            else if ((y < this.leftPointerStartPos.y) && (this._move.y !== -1)) {
                this._move.y = -1;
                moveUpdated = true;
            }
        }
        else if (this._move.y !== 0) {
            this._move.y = 0;
            moveUpdated = true;
        }

        //ENVOIE MOUVEMENT
        if (moveUpdated) {
            this._sendMove();
        }

        if (distance < 3600) {
            this.leftPointer.reset(x, y);
            this.leftVector.copyFrom(this.leftPointer.position);
            this.leftVector.minusEq(this.leftPointerStartPos);
        }
    }
    else {
        //RIGHT POINTER
        if (this.pointersList.item(id)) {
            this.pointersList.item(id).reset(x, y);
        }
    }
};

VirtualJoystick.Emiter.prototype.setRightPointer = function (id, x, y) {
    console.log('RIGHT X=' + x + ' Y=' + y + ' ID=' + id);
    this.pointersList.add(id, new VirtualJoystick.Pointer(id, x, y));
    this._button += 1;
    this._sendButton();
    this.vibrate(20);
};

VirtualJoystick.Emiter.prototype.removePointer = function (id) {
    if (this.leftPointer.id == id) {
        this.leftPointer.set(-1, 0, 0);
        if ((this._move.x !== 0) || (this._move.y !== 0)) {
            this._move.x = 0;
            this._move.y = 0;
            this._sendMove();
        }
        this.vibrate(15);
    }
    else {
        if (this.pointersList.item(id)) {
            this._button -= 1;
            this._sendButton();
        }
    }
    this.leftVector.reset(0, 0);
    var count = this.pointersList.remove(id);
    if ((count <= 0) && (this._button > 0)) {
        this._button = 0;
        this._sendButton();
    }
};

VirtualJoystick.Emiter.prototype.isLeftPointer = function (id) {
    return this.leftPointer.id == id;
};

VirtualJoystick.Emiter.prototype.onReceivedInfos = function (callback) {
    this._events.addObserver('info', callback);
};

VirtualJoystick.Emiter.prototype.onReceivedClose = function (callback) {
    this._events.addObserver('close', callback);
};

VirtualJoystick.Emiter.prototype.onReceivedServerMessage = function (callback) {
    this._events.addObserver('server', callback);
};

VirtualJoystick.Emiter.prototype.vibrate = function (val) {
    if (navigator.vibrate && this._connected) {
        navigator.vibrate(val);
    }
};

VirtualJoystick.Emiter.prototype.click = function (data) {
    _sendClick(data);
};
