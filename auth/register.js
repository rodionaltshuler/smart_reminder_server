"use strict";

let express = require('express');
let status = require('http-status');
let bodyParser = require('body-parser');
let https = require('https');
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
     *     description: Returns existing user or creates new one
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: accessToken
     *         description: FB user token
     *         in: formData
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

            let accessToken = req.body.accessToken;
            console.log('fetchFacebookProfile with access token ' + accessToken);
            fetchFacebookProfile(accessToken)
                .then(facebookProfile =>
                    findUserByFacebookUserProfile(facebookProfile, User))
                .then(
                    function fulfilled(userJson) {
                        res.send(userJson);
                    },
                    function rejected(err) {
                        console.log('Rejected: ' + JSON.stringify(err));
                        return res
                            .status(err.status || status.INTERNAL_SERVER_ERROR)
                            .json({error: err.message || 'Error logging in'});
                    }
                );
        }
    }));


    function fetchFacebookProfile(accessToken) {
        let options = {
            host: 'graph.facebook.com',
            path: '/me?access_token=' + accessToken + "&fields=name,email"
        };
        return new Promise(function (resolve, reject) {
            https.get(options, function (response) {
                let data = '';

                response.on('data', function (chunk) {
                    data += chunk;
                });

                response.on('end', function () {
                    console.log('Facebook data fetched: ' + data);
                    let facebookProfile = JSON.parse(data);
                    console.log('Facebook profile: ' + JSON.stringify(facebookProfile));
                    if (facebookProfile.error) {
                        console.log('Error in fetchFacebookProfile: ' + JSON.stringify(facebookProfile.error));
                        reject({
                            status: status.UNAUTHORIZED,
                            message: facebookProfile.error.message
                        });
                    } else {
                        resolve(facebookProfile);
                    }
                });
            });
        });
    }

    function findUserByFacebookUserProfile(facebookProfile, User) {
        return new Promise(function (resolve, reject) {
            User.findOneAndUpdate(
                {email: facebookProfile.email},
                {
                    $set: {
                        'oauth': facebookProfile.id,
                        'email': facebookProfile.email.toLowerCase(),
                        'name': facebookProfile.name,
                        'picture': 'http://graph.facebook.com/' + facebookProfile.id.toString() + '/picture?type=large'
                    }
                },
                {'new': true, upsert: true, runValidators: true},
                function (error, user) {
                    if (error) {
                        console.log('Error saving user: ' + JSON.stringify(error));
                        reject({
                            status: status.INTERNAL_SERVER_ERROR,
                            message: error.toString()
                        });
                    } else {
                        let generated = token.create(user);
                        let userJson = user.toJSON();
                        userJson.accessToken = generated;
                        resolve(userJson);
                    }
                });
        });
    }

    return api;
}
;