"use strict";

var mongoose = require('mongoose');

var itemsListSchema = {
    name: { type: String, required: true },
    collaboratingUsers: [
        {
            type: String,
            ref: 'User'
        }
    ],
    timeAdded: { type: Number, required: true },
    whoRemoved: { type: String, ref: 'User' },
    timeRemoved: { type: Number },
    deleted: { type: Boolean}
};

module.exports = new mongoose.Schema(itemsListSchema);
module.exports.itemsListSchema = itemsListSchema;