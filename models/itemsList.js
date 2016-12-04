var mongoose = require('mongoose');

var itemsListSchema = {
    name: { type: String, required: true },
    collaboratingUsers: [
        {
            type: String,
            ref: 'User'
        }
    ]
};

module.exports = new mongoose.Schema(itemsListSchema);
module.exports.itemsListSchema = itemsListSchema;