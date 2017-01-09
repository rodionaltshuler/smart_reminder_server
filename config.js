"use strict";

let config = {
    host: process.env.IP || 'http://localhost',
    port: process.env.PORT || 3000
};

module.exports = config;
