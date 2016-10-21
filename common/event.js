'use strict';

//Gestion d'evenements (pattern observer)
function ObservableEvents() {
    this._observers = {};
}

ObservableEvents.prototype = {
    constructor: ObservableEvents,
    
    // Ajoute d'une call back sur un evenement
    //  event = nom de l'evenement (String)
    //  callback: function de type : mafucntion(context) { }
    //      avec content contenant : le donné ou l'objet source
    //      possibilité de définir d'autre memebre dans context lors du déclenchement.
    addObserver: function (event, callback) {
        if (typeof event != 'string') {
            throw new Error("Event object missing 'event' property.");
        }
        if (this._observers[event] == undefined) {
            this._observers[event] = [];
        }
        this._observers[event].push(callback);
    },
    
    //Supprime une call back de l'observation d'un evenement
    removeObserver: function (event, callback) {
        if (typeof event != 'string') {
            throw new Error("Event object missing 'event' property.");
        }
        if (this._observers[event] instanceof Array) {
            var callbacks = this._observers[event];
            for (var i = 0, len = callbacks.length; i < len; i++) {
                if (callbacks[i] === callback) {
                    callbacks[i].splice(i, 1);
                    break;
                }
            }
        }
    },
    
    // Déclenchement de l'evenement
    //  event : est une chaine de caractère avec le nom de l'evenement
    //  context (optionnel) est un objet contenant les données associé a l'evénement ou une reference sur la source
    fire: function (event, context) {        
        if (typeof event != 'string') {
            throw new Error("Event object missing 'event' property.");
        }

        if (!context) {
            context = this;
        }               

        if (this._observers[event] instanceof Array) {
            var callbacks = this._observers[event];
            for(var i = 0, len = callbacks.length; i < len; i++ ) {
                callbacks[i].call(this, context);
            }
        }
    }
};