var express = require('express');
var status = require('http-status');
var bodyParser = require('body-parser');

module.exports = function (wagner) {

    var api = express.Router();

    api.use(bodyParser.urlencoded({
        extended: true
    }));

    //Get items in the list
    //query params: listId
    api.get('/item', wagner.invoke(function (Item, ItemList) {
        return function (req, res) {
            if (!req.user) {
                return res.status(status.UNAUTHORIZED)
                    .json({error: 'Not logged in'});
            }

            var listId = req.query.listId;
            if (!listId) {
                return res.status(status.BAD_REQUEST)
                    .json({error: 'Required param listId is missing, cannot add item to the list'});
            }

            var list = ItemList.findOne({_id: listId}, function (error, itemsList) {
                if (!itemsList) {
                    return res.status(status.NOT_FOUND)
                        .json({error: 'Items list with id {' + listId + '} not found'});
                }
                else if (itemsList.collaboratingUsers.indexOf(req.user._id) < 0) {
                    return res.status(status.FORBIDDEN);
                        //.json({error: 'You\'re not among collaborating users of the itemsList requested'});
                } else {
                    Item.find({itemsList: itemsList._id}, function (error, items) {
                        if (error) {
                            return res.status(status.INTERNAL_SERVER_ERROR).json({error: 'Cannot get items: ' + error.toString()});
                        } else {
                            res.send(items);
                        }
                    });
                }


            });
        }

    }));

    //Get item
    api.get('/item/:itemId', wagner.invoke(function (Item) {
        return function (req, res) {
            var id = req.params.itemId;
            if (!req.user) {
                return res.status(status.UNAUTHORIZED)
                    .json({error: 'Not logged in'});
            } else {
                console.log('Returning item id=' + id);
                var item = Item.findOne({_id: id}, function (error, item) {
                    if (error) {
                        return res.status(status.INTERNAL_SERVER_ERROR).json({error: 'Cannot get item: ' + error.toString()});
                    } else {
                        res.send(item);
                    }
                });
            }
        }
    }));

    //Remove item from the list (actually it will be update)

    //Update item

    //Add item to the list;
    //params: name, listId
    api.post('/item', wagner.invoke(function (Item) {
        return function (req, res) {

            if (!req.user) {
                return res.status(status.UNAUTHORIZED)
                    .json({error: 'Not logged in'});
            } else {

                var listId = req.body.listId;
                if (!listId) {
                    return res.status(status.BAD_REQUEST)
                        .json({error: 'Required param listId is missing, cannot add item to the list'});
                }

                var item = new Item({
                    name: req.body.name,
                    whoAdded: req.user._id,
                    timeAdded: Date.now() / 1000 | 0,
                    itemsList: listId
                });

                Item.findOne({name: req.body.name, itemsList: listId}, function (err, existingItems) {
                    if (existingItems) {
                        return res.status(status.CONFLICT).json({error: 'Item with this name already exists in the list ' + listId});
                    }
                });

                item.save(function (error, item) {
                    if (error) {
                        return res.status(status.INTERNAL_SERVER_ERROR).json({error: 'Cannot save item: ' + error.toString()});
                    }
                    res.send(item);
                });


            }
        }
    }));

    return api;

};