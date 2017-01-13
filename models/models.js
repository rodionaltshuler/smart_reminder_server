"use strict";

let mongoose = require('mongoose');
let _ = require('underscore');
let dbConfig = require('./../dbconfig');

module.exports = function(wagner) {
    mongoose.connect(dbConfig.dbUri);

    let Item = mongoose.model('Item', require('./item'), 'items');

    let ItemsList = mongoose.model('ItemsList', require('./itemsList'), 'itemLists');

    let User = mongoose.model('User', require('./user'), 'users');

    let models = {
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
