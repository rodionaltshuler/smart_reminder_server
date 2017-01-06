let express = require('express');
let status = require('http-status');
let bodyParser = require('body-parser');

module.exports = function (wagner) {

    let api = express.Router();

    api.use(bodyParser.urlencoded({
        extended: true
    }));

    //Get items in the list
    //query params: listId
    api.get('/item', wagner.invoke(function (Item, ItemList) {
        return function (req, res) {
            let listId = req.query.listId;
            if (!listId) {
                return res.status(status.BAD_REQUEST)
                    .json({error: 'Required param listId is missing, cannot add item to the list'});
            }

            let list = ItemList.findOne({_id: listId}, function (error, itemsList) {
                if (!itemsList) {
                    return res.status(status.NOT_FOUND)
                        .json({error: 'Items list with id {' + listId + '} not found'});
                }
                else if (itemsList.collaboratingUsers.indexOf(req.user._id) < 0) {
                    return res.status(status.FORBIDDEN);
                    //.json({error: 'You\'re not among collaborating users of the itemsList requested'});
                } else {
                    let query = {
                        itemsList: listId,
                        deleted: {$ne: true}
                    };
                    Item.find(query, function (error, items) {
                        if (error) {
                            return internalError(res, 'Cannot get items: ' + error.toString());
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
            let id = req.params.itemId;
            let item = Item.findOne({_id: id, deleted: { $ne: true}}, function (error, item) {
                if (error) {
                    return internalError(res, 'Cannot get item: ' + error.toString());
                } else {
                    res.send(item);
                }
            });
        }
    }));

    //Remove item from the list (actually it will be update)

    //Update item
    api.delete('/item/:itemId/remove', wagner.invoke(function (Item, ItemList) {
        return function (req, res) {
            let user = req.user;
            let itemId = req.params.itemId;
            Item.findOne({_id: itemId, deleted: { $ne: true }}, function (error, item) {
                if (error) {
                    return internalError(res, 'Error getting item to update: ' + error.toString());
                }
                if (!item) {
                    return res.status(status.NOT_FOUND)
                        .json({error: 'Item  with id {' + itemId + '} not found'});
                }

                ItemList.findOne({_id: item.itemsList}, function (error, itemsList) {
                    if (itemsList.collaboratingUsers.indexOf(req.user._id) < 0) {
                        return res.status(status.FORBIDDEN)
                            .json({error: 'You\'re not among collaborating users of the itemsList requested'});
                    }
                    item.whoRemoved = user._id;
                    item.timeRemoved = Date.now() / 1000 | 0;
                    item.deleted = true;
                    item.save(function (error, removedItem) {
                        if (error) {
                            return internalError(res, 'Error removing item: ' + error.toString());
                        }
                        res.send(removedItem);
                    });
                });
            });
        }
    }));


    //Add item to the list;
    //params: name, listId
    api.post('/item', wagner.invoke(function (Item) {
        return function (req, res) {

            let listId = req.body.listId;
            if (!listId) {
                return res.status(status.BAD_REQUEST)
                    .json({error: 'Required param listId is missing, cannot add item to the list'});
            }

            let item = new Item({
                name: req.body.name,
                whoAdded: req.user._id,
                timeAdded: Date.now() / 1000 | 0,
                itemsList: listId
            });

            let queryExistingItem = {
                name: req.body.name,
                itemsList: listId,
                $or: [{deleted: null}, {deleted: false}]
            };

            Item.findOne(queryExistingItem, function (err, existingItems) {
                if (existingItems) {
                    return res.status(status.CONFLICT).json({error: 'Item with this name already exists in the list ' + listId});
                }
            });

            item.save(function (error, item) {
                if (error) {
                    return internalError(res, 'Cannot save item: ' + error.toString());
                }
                res.send(item);
            });

        }
    }));

    function internalError(res, message) {
        return res.status(status.INTERNAL_SERVER_ERROR).json({error: message});
    }

    return api;

};