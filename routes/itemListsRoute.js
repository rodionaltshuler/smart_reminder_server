let express = require('express');
let status = require('http-status');
let bodyParser = require('body-parser');

module.exports = function (wagner) {

    let api = express.Router();

    api.use(bodyParser.urlencoded({
        extended: true
    }));

    api.post('/itemLists', wagner.invoke(function (ItemList) {
            return function (req, res) {
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

    api.get('/itemLists',
        wagner.invoke(function (ItemList) {
        return function (req, res) {
            console.log("Getting item lists for user id = " + req.user._id);
            let query = {collaboratingUsers: req.user._id};
            ItemList.find(query, function (error, lists) {
                if (error) {
                    return internalError(res, 'Cannot get item lists: ' + error.toString());
                }
                res.send(lists);
            });
        }
    }));

    function internalError(res, message) {
        return res.status(status.INTERNAL_SERVER_ERROR).json({error: message});
    }

    return api;

};