var express = require('express');
var status = require('http-status');
var bodyParser = require('body-parser');

let token = require("./jwt");

module.exports = function (wagner) {

    let api = express.Router();

    api.use(bodyParser.urlencoded({
        extended: true
    }));

     /**
     * @swagger
     * definition:
     *   Login:
     *     type: object
     *     description: User object with accessToken
     *     allOf:
     *       - $ref: '#/definitions/User'
     *     properties:
     *       accessToken:
     *         type: string
     *         example: APA91bHPRgkF3JUikC4ENAHEeMrd41Zxv3hVZjC9KtT8OvPVGJ-hQMRKRrZuJAEcl7B338qju59zJMjw2DELjzEvxwYv7hH5Ynpc1ODQ0aT4U4OFEeco8ohsN5PjL1iC2dNtk2BAokeMCg2ZXKqpc8FXKmhX94kIxQ
     */

    /**
     * @swagger
     * /api/v1/login:
     *   post:
     *     tags:
     *       - Auth
     *     description: Adds item to the list
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: accessToken
     *         description: FB user token
     *         in: body
     *         required: true
     *         type: string
     *     responses:
     *       200:
     *         description: User object with accessToken
     *         schema:
     *               "$ref": "#/definitions/Login"
     *       401:
     *         description: Error getting user data via Facebook token provided
     *       500:
     *         description: Error when getting existing user from DB or saving new
     */
    api.post('/login', wagner.invoke(function (User) {
        return function (req, res) {

            let https = require('https');

            let access_token = req.body.accessToken;

            let options = {
                host: 'graph.facebook.com',
                path: '/me?access_token=' + access_token
            };

            https.get(options, function (response) {
                let data = '';

                response.on('data', function (chunk) {
                    data += chunk;
                });

                response.on('end', function () {
                    console.log(data);
                    let facebookProfile = JSON.parse(data);
                    if (facebookProfile.error) {
                        return res.status(status.UNAUTHORIZED).json({error: facebookProfile.error.message});
                    } else {
                        let query = {};
                        if (facebookProfile.email) {
                            query.email = facebookProfile.email;
                        } else {
                            query.oauth = facebookProfile.id;
                        }
                        User.findOne(query, function (err, existingUser) {
                            if (err) {
                                return res.status(status.INTERNAL_SERVER_ERROR).json({error: err.toString()})
                            }
                            if (existingUser) {
                                console.log("User with id " + facebookProfile.id + " already exists");
                            } else {
                                console.log("Creating new user with fb id " + facebookProfile.id);
                                existingUser = new User({
                                    oauth: facebookProfile.id,
                                    name: facebookProfile.name,
                                    email: facebookProfile.email,
                                });
                                existingUser.save(function (error, user) {
                                    if (error) {
                                        return res.status(status.INTERNAL_SERVER_ERROR).json({error: error.message})
                                    }
                                });
                            }
                            let generated = token.create(existingUser);
                            console.log("jwt in register.js: " + generated);
                            let userJson = existingUser.toJSON();
                            userJson.accessToken = generated;
                            res.send(userJson);
                        });
                    }
                });
            });
        }
    }));

    return api;
};