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
            const user = req.user;
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
     * /api/v1/invite/{listId}/{userId}:
     *   post:
     *     tags:
     *       - ItemLists
     *     description: Subscribe device for push messages
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: listId
     *         description: itemsList you want to share with other user
     *         in: path
     *         required: true
     *         type: string
     *       - name: userId
     *         description: userId you want to invite
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
     *         description: Items list with updated collaborating users field
     *         schema:
     *               "$ref": "#/definitions/ItemList"
     *       400:
     *         description: You are trying to share a list with a user already collaborating on this list
     *       401:
     *         description: Authorization token is missing or invalid; you have no access to this list
     *       500:
     *         description: Other error occured
     */
    api.post('/invite/:listId/:userId', wagner.invoke(function (User, ItemList) {
        return function (req, res) {
            const userId = req.params.userId;
            const listId = req.params.listId;
            //update list by id -> add collaborating users to params

            checkUserExists(User, userId)
                .then(user => checkItemsListExist(ItemList, listId))
                .then(itemsList => checkAuthorizedToInvite(req.user, itemsList))
                .then(itemsList => checkUserNotYetInvited(userId, itemsList))
                .then(itemsList => performInvite(itemsList, userId))
                .then(itemsList => res.send(itemsList))
                .catch(error => {
                    console.log(JSON.stringify(error));
                    if (error.status) {
                        return res.status(error.status).json(error.json || {error: error});
                    } else {
                        internalError(res, error);
                    }
                });
        }
    }));

    function performInvite(itemsList, userId) {
        return new Promise(function (resolve, reject) {
            itemsList.collaboratingUsers = [... itemsList.collaboratingUsers, userId];
            itemsList.save(function (err, itemsList) {
                if (err) {
                    console.log(err.message);
                    reject({
                        status: status.INTERNAL_SERVER_ERROR,
                        message: err
                    })
                } else {
                    resolve(itemsList);
                }
            });
        });
    }

    function checkItemsListExist(ItemsList, listId) {
        return new Promise(function (resolve, reject) {
            ItemsList.findOne({_id: listId}, function (err, itemsList) {
                if (err) {
                    console.log(err.message);
                    reject({
                        status: status.NOT_FOUND,
                        message: err.message
                    });
                } else {
                    resolve(itemsList);
                }
            });
        });
    }

    function checkAuthorizedToInvite(me, itemsList) {
        return new Promise(function (resolve, reject) {
            try {
                if (itemsList.collaboratingUsers.indexOf(me._id) >= 0) {
                    //user is among collaborators
                    resolve(itemsList);
                } else {
                    console.log('You are not authorized to invite users to this list');
                    reject({
                        status: status.UNAUTHORIZED,
                        message: 'You are not authorized to invite users to this list'
                    });
                }
            } catch (err) {
                console.log(err);
            }
        });
    }

    function checkUserExists(User, userId) {
        return new Promise(function (resolve, reject) {
            User.findOne({_id: userId}, function (err, user) {
                if (err) {
                    console.log(err.message);
                    reject({
                        status: status.INTERNAL_SERVER_ERROR,
                        message: err.message
                    });
                } else {
                    resolve(user);
                }
            });
        })
    }

    function checkUserNotYetInvited(userId, itemsList) {
        return new Promise(function (resolve, reject) {
            if (itemsList.collaboratingUsers.indexOf(userId) >= 0) {
                //user is among collaborators
                console.log('User already has access to list ' + itemsList.name);
                reject({
                    status: status.BAD_REQUEST,
                    message: 'User already has access to list ' + itemsList.name
                });
            } else {
                resolve(itemsList);
            }
        });
    }

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