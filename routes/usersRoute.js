"use strict";

let express = require('express');
let status = require('http-status');
let bodyParser = require('body-parser');

module.exports = function (wagner) {

    let api = express.Router();

    api.use(bodyParser.urlencoded({
        extended: true
    }));

    /**
     * @swagger
     * definition:
     *   User:
     *     properties:
     *       name:
     *         type: string
     *         required: true
     *         example: John Doe
     *       email:
     *         type: string
     *         required: true
     *         example: john.doe@mail.com
     *       picture:
     *         type: string
     *         description: profile picture URL
     *         example: https://graph.facebook.com/664522183622806/picture?type=large
     *       oauth:
     *         description: facebook ID
     *         type: string
     *         required: true
     *         example: 664522183622806
     *       deviceId:
     *         type: string
     *         example: APA91bHPRgkF3JUikC4ENAHEeMrd41Zxv3hVZjC9KtT8OvPVGJ-hQMRKRrZuJAEcl7B338qju59zJMjw2DELjzEvxwYv7hH5Ynpc1ODQ0aT4U4OFEeco8ohsN5PjL1iC2dNtk2BAokeMCg2ZXKqpc8FXKmhX94kIxQ
     *
     * /api/v1/users:
     *   get:
     *     tags:
     *       - Users
     *     description: Returns users list
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: Authorization
     *         description: Auth token
     *         in: header
     *         required: true
     *         type: string
     *       - name: name
     *         description: username or part of it to find, or exact e-mail
     *         in: query
     *         required: false
     *         example: Smith
     *     responses:
     *       200:
     *         description: An array of users
     *         schema: {
     *           "type": "array",
     *            "items": {
     *               "$ref": "#/definitions/User"
     *            }
     *        }
     *       401:
     *         description: Authorization token is missing or invalid
     *       500:
     *         description: Error when getting users from DB
     */
    api.get('/users', wagner.invoke(function (User) {
        const RESULTS_LIMIT = 3;
        return function (req, res) {
            let query = req.query.name ?
                {
                    $or: [
                        {name: new RegExp(req.query.name, "i")},
                        {email: req.query.name.toLowerCase()}
                    ]
                } : {};
            User.find(query).limit(RESULTS_LIMIT).exec(function (err, users) {
                if (err) {
                    return internalError(res, 'Cannot get users: ' + error.toString());
                }
                res.send(users);
            });
        }
    }));

    /**
     * @swagger
     * /api/v1/subscribe:
     *   post:
     *     tags:
     *       - Users
     *     description: Subscribe device for push messages
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: deviceId
     *         description: registration ID of device in GCM
     *         in: query
     *         required: true
     *         type: string
     *       - name: Authorization
     *         description: Auth token
     *         in: header
     *         required: true
     *         type: string
     *     responses:
     *       200:
     *         description: User with updated deviceId
     *         schema:
     *               "$ref": "#/definitions/User"
     *       401:
     *         description: Authorization token is missing or invalid
     *       500:
     *         description: Error when getting users from DB
     */
    api.post('/subscribe', wagner.invoke(function (User) {
        return function (req, res) {
            let deviceId = req.body.deviceId;
            if (!deviceId) {
                return res.status(status.BAD_REQUEST)
                    .json({error: 'Required param for push subscription {deviceId} is missing'});
            }
            user.deviceId = deviceId;
            user.save(function (error, user) {
                if (error) {
                    return internalError(res, 'Cannot save user: ' + error.toString());
                }
                return res.json({user: user});
            });
        }
    }));

    /**
     * @swagger
     * /api/v1/users/{user_id}:
     *   get:
     *     tags:
     *       - Users
     *     description: Gets user by user_id
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: user_id
     *         description: user id
     *         in: path
     *         required: true
     *         type: string
     *       - name: Authorization
     *         description: Auth token
     *         in: header
     *         required: true
     *         type: string
     *     responses:
     *       200:
     *         description: User with updated deviceId
     *         schema:
     *               "$ref": "#/definitions/User"
     *       401:
     *         description: Authorization token is missing or invalid
     *       500:
     *         description: Error when getting users from DB
     */
    api.get('/users/:user_id', wagner.invoke(function (User) {
        return function (req, res) {
            let id = req.params.user_id;
            //TODO check user permission to fetch user with id if needed
            User.findOne({_id: id}, function (err, user) {
                if (err) {
                    return internalError(res, 'Cannot create user: ' + err.toString());
                }
                if (user) {
                    res.send(user);
                } else {
                    return res.status(status.NOT_FOUND).json({error: 'User not found by id ' + id});
                }
            });
        }
    }));

    /**
     * @swagger
     * /api/v1/me:
     *   get:
     *     tags:
     *       - Users
     *     description: Returns info of a user Authorization token belongs to
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: Authorization
     *         description: Auth token
     *         in: header
     *         required: true
     *         type: string
     *     responses:
     *       200:
     *         description: User with updated deviceId
     *         schema:
     *               "$ref": "#/definitions/User"
     *       401:
     *         description: Authorization token is missing or invalid
     *       500:
     *         description: Error when getting users from DB
     */
    api.get('/me', wagner.invoke(function (User) {
        return function (req, res) {
            User.findOne({_id: req.user._id}, function (err, user) {
                if (err) {
                    return res.status(err.status)
                        .json({error: err.message});
                } else {
                    res.send(user);
                }
            });
        }
    }));

    function internalError(res, message) {
        return res.status(status.INTERNAL_SERVER_ERROR).json({error: message});
    }

    return api;
};