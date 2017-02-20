"use strict";

var mongoose = require('mongoose');

var itemSchema =  {
    name: { type: String, required: true },
    notified: [{ type: String, ref: 'User' }],
    whoAdded: { type: String, ref: 'User', required: true },
    timeAdded: { type: Number, required: true },
    whoRemoved: { type: String, ref: 'User' },
    timeRemoved: { type: Number },
    itemsList: { type: String, ref: 'ItemsList' },
    deleted: { type: Boolean }
};

var schema = new mongoose.Schema(itemSchema);
schema.index({ itemsList: 1, name: 1}, { unique: false });

module.exports = schema;
module.exports.itemSchema = schema;