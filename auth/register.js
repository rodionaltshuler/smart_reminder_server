var express = require('express');
var status = require('http-status');
var bodyParser = require('body-parser');

module.exports = function (wagner) {

    var api = express.Router();

    api.use(bodyParser.urlencoded({
        extended: true
    }));

    api.post('/login', wagner.invoke(function (User) {
        return function (req, res) {

            var https = require('https');

            var access_token = req.body.accessToken;

            var options = {
                host: 'graph.facebook.com',
                path: '/me?access_token=' + access_token
            };

            https.get(options, function (response) {
                var data = '';

                response.on('data', function (chunk) {
                    data += chunk;
                });

                response.on('end', function () {
                    console.log(data);
                    var json = JSON.parse(data);
                    if (json.error) {
                        res.status(status.UNAUTHORIZED).json({error: json.error.message});
                    } else {
                        res.send(json);
                    }
                });
            });
        }
    }));

    return api;
};