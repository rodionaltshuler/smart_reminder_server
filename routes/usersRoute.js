var express = require('express');
var status = require('http-status');
var bodyParser = require('body-parser');

var jwt = require("../auth/jwt");

module.exports = function (wagner) {

    var api = express.Router();

    api.use(bodyParser.urlencoded({
        extended: true
    }));

    //create new user
    api.post('/users', wagner.invoke(function (User) {
        return function (req, res) {
            var user = new User({name: req.body.name, email: req.body.email});
            User.findOne({email: user.email}, function (err, existingUser) {
                //user with this email already exists
                if (existingUser) {
                    return res.status(status.CONFLICT).json({error: 'User with e-mail already exists: ' + user.email});
                }
                user.save(function (error, user) {
                    if (error) {
                        return internalError(res, 'Cannot create user: ' + error.toString());
                    }
                    return res.json({user: user});
                });
            });

        }
    }));


    /** Returns users list
     */
    api.get('/users', wagner.invoke(function (User) {
        return function (req, res) {
            findUser(req, User, function (err, user) {
                if (err) {
                    return res.status(err.status)
                        .json({error: err.message});
                } else {
                    User.find({}, function (err, users) {
                        if (err) {
                            return internalError(res, 'Cannot get users: ' + error.toString());
                        }
                        res.send(users);
                    });
                }
            })
        }
    }));

    /**
     * Subscribe user for push message
     * @param deviceId
     */
    api.post('/subscribe', wagner.invoke(function (User) {
        return function (req, res) {
            findUser(req, User, function (err, user) {
                if (err) {
                    return res.status(err.status)
                        .json({error: err.message});
                } else {
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
            });
        }
    }));

    //get user by id
    api.get('/users/:user_id', wagner.invoke(function (User) {
        return function (req, res) {
            findUser(req, User, function (err, user) {
                if (err) {
                    return res.status(err.status)
                        .json({error: err.message});
                } else {
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
            });
        }
    }));

    api.get('/me', wagner.invoke(function (User) {
        return function (req, res) {
            findUser(req, User, function (err, user) {
                if (err) {
                    return res.status(err.status)
                        .json({error: err.message});
                } else {
                    res.send(user);
                }
            })
        }
    }));

    function findUser(req, User, callback) {
        let authHeaderKey = "Authorization";
        let token = req.header(authHeaderKey);

        if (!token) {
            console.log("Auth jwt is missing");
            callback({
                status: status.UNAUTHORIZED,
                message: 'Auth header {' + authHeaderKey + '} is missing'
            });
        }

        try {
            let payload = jwt.payload(token);
            console.log("Payload decoded: " + JSON.stringify(payload));
            let query = {_id: payload.id};
            User.findOne(query, function (err, user) {
                console.log("User found in DB: " + user.name);
                if (err) {
                    callback({
                        status: status.INTERNAL_SERVER_ERROR,
                        message: 'Cannot get user from DB'
                    });
                } else {
                    callback(null, user);
                }
            });
        } catch (err) {
            console.log("Error getting user from jwt payload: " + err.toString());
            callback({
                status: status.UNAUTHORIZED,
                message: 'Invalid token'
            });
        }
    }

    function internalError(res, message) {
        return res.status(status.INTERNAL_SERVER_ERROR).json({error: message});
    }

    return api;
};