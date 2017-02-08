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
     *   Item:
     *     properties:
     *       name:
     *         type: string
     *         required: true
     *         example: Milk
     *       itemsList:
     *         type: string
     *         required: true
     *         description: ItemsList id this item belongs to
     *         example: bc1223455677
     *       notified:
     *         type: array
     *         description: an array of user ids received push notifications
     *         items:
     *              type: string
     *              example: bc2212239494ffkg
     *       whoAdded:
     *         type: string
     *         description: User id who added item to the list
     *         example: 122344556
     *         required: true
     *       timeAdded:
     *         type: number
     *         required: true
     *         example: 1233445566
     *         description: timestamp when item was added
     *       whoRemoved:
     *         type: string
     *         description: User id who removed item from the list
     *         example: 122344556
     *       timeRemoved:
     *         description: timestamp when item was removed from the list
     *         type: number
     *         example: 664522183622806
     *       deleted:
     *         description: true if item was removed from the list
     *         type: boolean
     *         example: false
     */

    /**
     * @swagger
     * /api/v1/item:
     *   get:
     *     tags:
     *       - Item
     *     description: Returns items in the itemsList
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: Authorization
     *         description: Auth token
     *         in: header
     *         required: true
     *         type: string
     *       - name: listId
     *         description: id of the itemsList
     *         in: query
     *         required: true
     *         type: string
     *     responses:
     *       200:
     *         description: An array of items
     *         schema: {
     *           "type": "array",
     *            "items": {
     *               "$ref": "#/definitions/Item"
     *            }
     *        }
     *       400:
     *          description: Required param listId is missing
     *       401:
     *         description: Authorization token is missing or invalid
     *       403:
     *         description: User requesting items list is not among collaborating users for this list
     *       404:
     *         description: Items list with id provided not found
     *       500:
     *         description: Error when getting items from DB
     */
    api.get('/item', wagner.invoke(function (Item, ItemList) {
        return function (req, res) {
            let listId = req.query.listId;
            if (!listId) {
                return res.status(status.BAD_REQUEST)
                    .json({error: 'Required param listId is missing, cannot add item to the list'});
            }

            let list = ItemList.findOne({_id: listId, deleted: { $ne: true}}, function (error, itemsList) {
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

    /**
     * @swagger
     * /api/v1/item/{itemId}:
     *   get:
     *     tags:
     *       - Item
     *     description: Returns item by id
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: Authorization
     *         description: Auth token
     *         in: header
     *         required: true
     *         type: string
     *       - name: itemId
     *         description: id of the item
     *         in: path
     *         required: true
     *         type: string
     *     responses:
     *       200:
     *         description: Item object
     *         schema:
     *               "$ref": "#/definitions/Item"
     *       400:
     *          description: Item was already removed
     *       401:
     *         description: Authorization token is missing or invalid
     *       403:
     *         description: User requesting items list is not among collaborating users for this list
     *       404:
     *         description: Item with id provided not found
     *       500:
     *         description: Error when getting items from DB
     */
    api.get('/item/:itemId', wagner.invoke(function (Item) {
        return function (req, res) {
            let id = req.params.itemId;
            let item = Item.findOne({_id: id}, function (error, item) {
                if (error) {
                    return internalError(res, 'Cannot get item: ' + error.toString());
                } else {
                    //TODO check whether item was found, return NOT_FOUND status otherwise
                    //TODO check whether user is among collaborating users for itemsList this item belongs to, return FORBIDDEN if not
                    res.send(item);
                }
            });
        }
    }));

    /**
     * @swagger
     * /api/v1/item/{itemId}:
     *   delete:
     *     tags:
     *       - Item
     *     description: Deletes item from the list (sets deleted=true)
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: Authorization
     *         description: Auth token
     *         in: header
     *         required: true
     *         type: string
     *       - name: itemId
     *         description: id of the item
     *         in: path
     *         required: true
     *         type: string
     *     responses:
     *       200:
     *         description: Item object
     *         schema:
     *               "$ref": "#/definitions/Item"
     *       401:
     *         description: Authorization token is missing or invalid
     *       403:
     *         description: User requesting items list is not among collaborating users for this list
     *       404:
     *         description: Item with id provided not found
     *       500:
     *         description: Error when getting items from DB
     */
    api.delete('/item/:itemId', wagner.invoke(function (Item, ItemList) {
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
                    //TODO check whether item is already deleted, return BAD_REQUEST status in this case
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


    /**
     * @swagger
     * /api/v1/item:
     *   post:
     *     tags:
     *       - Item
     *     description: Adds item to the list
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: Authorization
     *         description: Auth token
     *         in: header
     *         required: true
     *         type: string
     *       - name: listId
     *         description: id of the ItemsList this item should be added to
     *         in: body
     *         required: true
     *         type: string
     *       - name: name
     *         description: name of the item
     *         in: body
     *         required: true
     *         type: string
     *     responses:
     *       200:
     *         description: Item object
     *         schema:
     *               "$ref": "#/definitions/Item"
     *       400:
     *         description: Required param listId is missing
     *       401:
     *         description: Authorization token is missing or invalid
     *       403:
     *         description: User requesting items list is not among collaborating users for this list
     *       404:
     *         description: Items list with id provided not found
     *       409:
     *         description: items list already has an item with the same name which is not deleted
     *       500:
     *         description: Error when getting items from DB
     */
    api.post('/item', wagner.invoke(function (Item) {
        return function (req, res) {

            let listId = req.body.listId;
            if (!listId) {
                return res.status(status.BAD_REQUEST)
                    .json({error: 'Required param listId is missing, cannot add item to the list'});
            }

            //TODO check whether list with this id exists, return NOT_FOUND status if doesn't
            //TODO check whether user adding item to the list is among collaborating users, return FORBIDDEN otherwise

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
                } else {
                    item.save(function (error, item) {
                        if (error) {
                            return internalError(res, 'Cannot save item: ' + error.toString());
                        }
                        res.send(item);
                    });
                }
            });
        }
    }));

    function internalError(res, message) {
        return res.status(status.INTERNAL_SERVER_ERROR).json({error: message});
    }

    return api;

};