var express = require('express');
var status = require('http-status');
var bodyParser = require('body-parser');

module.exports = function (wagner) {

    var api = express.Router();

    api.use(bodyParser.urlencoded({
        extended: true
    }));

    api.post('/itemLists', wagner.invoke(function (ItemList) {
            return function (req, res) {

                if (notLoggedIn(req, res)) {
                    return res;
                }

                console.log('Creating items list: ' + req.user);

                var list = new ItemList({name: req.body.name});
                ItemList.findOne({name: list.name, collaboratingUsers: req.user._id}, function (err, existingList) {
                    //user with this email already exists
                    if (existingList) {
                        return res.status(status.CONFLICT).json({error: 'ItemList with this name already exists for a user: ' + list.name});
                    }
                    list.collaboratingUsers.push(req.user._id);
                    list.save(function (error, list) {
                        if (error) {
                            return internalError(res, 'Cannot create itemList: ' + error.toString());
                        }
                        res.send(list);
                    });
                });

            }
        }
    ));

    api.get('/itemLists', wagner.invoke(function (ItemList) {
        return function (req, res) {
            if (notLoggedIn(req, res)) {
                return res;
            }
            ItemList.find({collaboratingUsers: req.user._id}, function (error, lists) {
                if (error) {
                    return internalError(res, 'Cannot get item lists: ' + error.toString());
                }
                res.send(lists);
            });
        }
    }));

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