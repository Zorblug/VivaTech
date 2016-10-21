'use strict'

function Collection () {
  this.count = 0;
  this.collection = {};
}

// Collection.prototype.constructor = Collection

// #region  Fonctions

// ajout d'un nouvel element
Collection.prototype.add = function (key, item) {
  if (this.collection[key] != undefined) {
    return undefined;
  }
  this.collection[key] = item;
  return ++this.count;
};
// Supprime un element
Collection.prototype.remove = function (key) {
  if (this.collection[key] == undefined) {
    return undefined;
  }
  delete this.collection[key];
  return --this.count;
};
// accès à un element
Collection.prototype.item = function (key) {
  return this.collection[key];
};

Collection.prototype.forEach = function (block) {
  for (var key in this.collection) {
    if (this.collection.hasOwnProperty(key)) {
      block(this.collection[key])
    }
  }
}
// Vide le dictionnaires
Collection.prototype.clear = function () {
  var keysArray = Object.keys(this.collection)
  for (var i in keysArray) {
    this.remove(keysArray[i])
  }
}

// Tableau des clés du dictionnaire
Collection.prototype.keys = function () {
  return Object.keys(this.collection)
}

// Tableau des valeurs présentes dans le dictionnaire
Collection.prototype.values = function () {
  var valuesArray = []
  for (var key in this.collection) {
    if (this.collection.hasOwnProperty(key)) {
      valuesArray.push(this.collection[key])
    }
  }
  return valuesArray
}

Collection.prototype.stringify = function () {
  return JSON.stringify(this.collection)
}

Collection.prototype.debug = function () {
  console.log('DICO :' + JSON.stringify(this.collection))
}

// #endregion

// #region node module
if (typeof module !== 'undefined') {
  module.exports = Collection
}
// #endregion
