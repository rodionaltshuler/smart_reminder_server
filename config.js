"use strict";

let config = {
    host: "https://" + process.env.C9_HOSTNAME || 'http://localhost',
    port: process.env.PORT || 3000
};

module.exports = config;
