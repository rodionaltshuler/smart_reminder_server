var express = require('express');
var status = require('http-status');
var bodyParser = require('body-parser');

module.exports = function (wagner) {

    var api = express.Router();

    api.use(bodyParser.urlencoded({
        extended: true
    }));

    //create new user
    api.post('/users', wagner.invoke(function (User) {
        return function (req, res) {
            console.log(req.body);
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

    //get users list
    //form-url encoded, fields: email, name
    api.get('/users', wagner.invoke(function (User) {
        return function (req, res) {
            if (notLoggedIn(req, res)) {
                return res;
            }
            User.find({}, function (err, users) {
                if (err) {
                    return internalError(res, 'Cannot create user: ' + error.toString());
                }
                res.send(users);
            });
        }
    }));

    //get user by id
    api.get('/users/:user_id', wagner.invoke(function (User) {
        return function (req, res) {
            if (notLoggedIn(req, res)) {
                return res;
            }
            var id = req.params.user_id;
            User.findOne({_id: id}, function (err, user) {
                if (err) {
                    return internalError(res, 'Cannot create user: ' + error.toString());
                }
                if (user) {
                    res.send(user);
                } else {
                    return res.status(status.NOT_FOUND).json({error: 'User not found by id ' + id});
                }
            });

        }
    }));

    api.get('/me', function (req, res) {
        if (notLoggedIn(req, res)) {
            return res;
        }
        res.send(req.user);

    });

    function notLoggedIn(req, res) {
        if (!req.user) {
            return res.status(status.UNAUTHORIZED)
                .json({error: 'Not logged in'});
        }
    }

    function internalError(res, message) {
        return res.status(status.INTERNAL_SERVER_ERROR).json({error: message});
    }

    return api;
};