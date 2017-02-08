"use strict";

let googleCloudConfig = {
    swaggerHost: 'smart-reminder-us.appspot-preview.com',
    host: 'https://smart-reminder-us.appspot-preview.com',
    port: process.env.PORT
};

let localConfig = {
    swaggerHost: 'localhost:3001',
    host: 'http://localhost',
    port: 3001
};

let configs = {
   google: googleCloudConfig,
   local: localConfig
};

let config;
if (process.env.CONFIG && configs[process.env.CONFIG]) {
    config = configs[process.env.CONFIG];
    console.log("Using config %s", JSON.stringify(configs[process.env.CONFIG]));
} else {
    config = configs.local;
    console.log("no process.env.CONFIG variable defined or defined config doesn't exist - using local");
}

module.exports = config;
