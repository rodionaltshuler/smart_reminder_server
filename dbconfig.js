"use strict";

let config = {
    dbUri: process.env.DB_URI || 'mongodb://localhost:27017/test'
};

module.exports = config;
