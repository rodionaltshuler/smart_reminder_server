"use strict";

let express = require('express');
let wagner = require('wagner-core');
let swaggerJSDoc = require('swagger-jsdoc');
let config = require('./config');

require('./models/models')(wagner);

let app = express();

// swagger definition
let swaggerDefinition = {
    info: {
        title: 'SmartReminder API',
        version: '1.0.0',
        description: 'node.js server for mobile and web clients'
    },
    host: config.host + ":" + config.port,
    basePath: '/',
};

// options for the swagger docs
let options = {
    // import swaggerDefinitions
    swaggerDefinition: swaggerDefinition,
    // path to the API docs
    apis: ['./routes/*.js', './auth/register.js'],
};

// initialize swagger-jsdoc
let swaggerSpec = swaggerJSDoc(options);


let fs = require("fs");
let decodeKey = fs.readFileSync(__dirname + '/public.pem');

let express_jwt = require('express-jwt');

//var cors = require('cors');
//app.use(cors);

app.use(express.static('public'));

app.use(express_jwt({
    secret: decodeKey,
    algorithms:'RS256',
    credentialsRequired: true,
    getToken: function fromHeaderOrQuerystring (req) {
        if (req.header("Authorization")) {
            return req.header("Authorization");
        }
        return null;
    }
}).unless({path: ['/api/v1/login', '/auth/facebook', '/swagger.json', '/api-docs/:file']}));

app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        res.status(401).send('Invalid access token');
    }
});


wagner.invoke(require('./auth/auth'), {app: app});

app.use('/api/v1', require('./auth/register')(wagner));
app.use('/api/v1', require('./routes/usersRoute')(wagner));
app.use('/api/v1', require('./routes/itemListsRoute')(wagner));
app.use('/api/v1', require('./routes/itemRoute')(wagner));

// serve swagger
app.get('/swagger.json', function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
});

let port = config.port;
app.listen(port);

console.log("SmartReminder server listening on port " + port);