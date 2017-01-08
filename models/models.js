"use strict";

var mongoose = require('mongoose');
var _ = require('underscore');

module.exports = function(wagner) {
    mongoose.connect('mongodb://localhost:27017/test');

    var Item = mongoose.model('Item', require('./item'), 'items');

    var ItemsList = mongoose.model('ItemsList', require('./itemsList'), 'itemLists');

    var User = mongoose.model('User', require('./user'), 'users');

    var models = {
        Item: Item,
        ItemList: ItemsList,
        User: User
    };

    // To ensure DRY-ness, register factories in a loop
    _.each(models, function(value, key) {
        wagner.factory(key, function() {
            return value;
        });
    });

    return models;

};
