'use strict';

var VirtualJoystick = VirtualJoystick || {};//Espace de nom

//#region JOYSTICK
VirtualJoystick.Joystick = function (id, parent) {
    this._parent = parent;

    this.id = id;
    this.left = false;
    this.right = false;
    this.up = false;
    this.down = false;
    this.button = 0;
};

VirtualJoystick.Joystick.prototype.reset = function reset () {
    this.left = false;
    this.right = false;
    this.up = false;
    this.down = false;
    this.button = 0;
};

    //Positionne le joystick en fonction du message du REMOTE
VirtualJoystick.Joystick.prototype.setXY =  function setXY (data) {
    console.log('MOVE' + JSON.stringify(data));
    //X
    if (data.x == 0) {
        this.left = false;
        this.right = false;
    } else if (data.x > 0) {
        this.left = false;
        this.right = true;
    } else if (data.x < 0) {
        this.left = true;
        this.right = false;
    }

    //Y
    if (data.y == 0) {
        this.up = false;
        this.down = false;
    } else if (data.y > 0) {
        this.up = true;
        this.down = false;

    } else if (data.y < 0) {
        this.up = false;
        this.down = true;
    }
};

VirtualJoystick.Joystick.prototype.setButton = function setButton (data) {
    console.log('BUTTON CLICK' + JSON.stringify(data));
    this.button = data.value;
};

VirtualJoystick.Joystick.prototype.send = function send (data) {
    this._parent.send(this.id, data);
};

VirtualJoystick.Joystick.prototype.stringify = function stringify () {
    return JSON.stringify({ id: this.id, left: this.left, right: this.right, up: this.up, down: this.down, button: this.button })
};
//#endregion


VirtualJoystick.Receiver = function (serverAddress) {
    this._serverUrl = serverAddress + '/joystick';
    this._socket;

    this._events = new ObservableEvents();
    this._joysticks = new Collection();
}

VirtualJoystick.Receiver.prototype.connect = function () {
    this._socket = io.connect(this._serverUrl);
    this._socket.emit('game');

    var that = this;

    this._socket.on('remote', function (message) {
        if (!that._joysticks.item(message.id)) {
            var j = new VirtualJoystick.Joystick(message.id, that);
            that._joysticks.add(message.id, j);
            that._events.fire('new_remote', { id: message.id, joystick: j });
        }
    });

    this._socket.on('close', function (message) {
        that._joysticks.remove(message.id);
        that._events.fire('clear_remote', { id: message.id });
    });

    this._socket.on('move', function (message) {
        if (that._joysticks.item(message.id)) {
            that._joysticks.item(message.id).setXY(message.data);
        }
    });

    this._socket.on('button', function (message) {
        if (that._joysticks.item(message.id)) {
            that._joysticks.item(message.id).setButton(message.data);
        }
    });

    this._socket.on('click', function (message) {
        that._events.fire('click', { id: message.id, data: message.data, joystick: that._joysticks.item(message.id) });
    });

    this._socket.on('server', function (message) {
        that._events.fire('server', { data: message.data });
    });
};

//Necessite une reconnection
VirtualJoystick.Receiver.prototype.close = function close() {
    this._socket.emit('close');
    this._socket.disconnect();
    this._socket = null;
}

//Envoie un message a un recepteur (remote)
VirtualJoystick.Receiver.prototype.send = function (id, data) {
    console.log("SEND to " + id + " : " + JSON.stringify(data));
    this._socket.emit('info', { id: id, data: data });
};

//Envoie un message a tous les recepteurs (remotes)
VirtualJoystick.Receiver.prototype.broadcast = function (data) {
    console.log("BROADCAST : " + JSON.stringify(data));
    this._socket.emit('info', { id: undefined, data: data });
};

//suprime le joystick de la liste des joysticks gérés
VirtualJoystick.Receiver.prototype.remove = function (id) {
    this._joysticks.remove(id);
};

VirtualJoystick.Receiver.prototype.stringify = function () {
    var out = '[';
    this._joysticks.forEach(function (j) {
        out = out + ',' + j.stringify();
    });
    out = out + ']';
    return out;
};

VirtualJoystick.Receiver.prototype.onNewRemote = function (callback) {
    this._events.addObserver('new_remote', callback);
};

VirtualJoystick.Receiver.prototype.onClearRemote = function (callback) {
    this._events.addObserver('clear_remote', callback);
};

VirtualJoystick.Receiver.prototype.onRemoteClick = function (callback) {
    this._events.addObserver('click', callback);
};

VirtualJoystick.Receiver.prototype.onReceivedServerMessage = function (callback) {
    this._events.addObserver('server', callback);
};
