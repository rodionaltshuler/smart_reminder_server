let express = require('express');
let status = require('http-status');
let bodyParser = require('body-parser');

module.exports = function (wagner) {

    let api = express.Router();

    api.use(bodyParser.urlencoded({
        extended: true
    }));

    /** Returns users list
     */
    api.get('/users', wagner.invoke(function (User) {
        return function (req, res) {
            User.find({}, function (err, users) {
                if (err) {
                    return internalError(res, 'Cannot get users: ' + error.toString());
                }
                res.send(users);
            });
        }
    }));

    /**
     * Subscribe user for push message
     * @param deviceId
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

    //get user by id
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