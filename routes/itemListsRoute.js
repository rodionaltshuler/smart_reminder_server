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
     *   ItemsList:
     *     properties:
     *       name:
     *         type: string
     *         required: true
     *         example: Sample list #1
     *       collaboratingUsers:
     *         type: array
     *         description: id's of users collaborating on this list
     *         items:
     *              type: string
     *              example: bc2212239494ffkg
     *       timeAdded:
     *         type: number
     *         required: true
     *         example: 1233445566
     *         description: timestamp when itemsList was added
     *       whoRemoved:
     *         type: string
     *         description: User id who removed itemsList
     *         example: 122344556
     *       timeRemoved:
     *         description: timestamp when itemsList was deleted
     *         type: number
     *         example: 664522183622806
     *       deleted:
     *         description: true if itemsList was removed
     *         type: boolean
     *         example: false
     */

    /**
     * @swagger
     * /api/v1/itemLists:
     *   post:
     *     tags:
     *       - ItemLists
     *     description: Returns list of all ItemLists
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: Authorization
     *         description: Auth token
     *         in: header
     *         required: true
     *         type: string
     *       - name: name
     *         description: new items list name
     *         in: body
     *         required: true
     *         type: string
     *     responses:
     *       200:
     *         description: ItemsList created
     *         schema:
     *               "$ref": "#/definitions/ItemsList"
     *       401:
     *         description: Authorization token is missing or invalid
     *       500:
     *         description: Error when getting users from DB
     */
    api.post('/itemLists', wagner.invoke(function (ItemList) {
            return function (req, res) {
                console.log('Creating items list: ' + req.user);
                var list = new ItemList({name: req.body.name});
                ItemList.findOne({name: list.name, collaboratingUsers: req.user._id}, function (err, existingList) {
                    //user with this email already exists
                    if (existingList) {
                        return res.status(status.CONFLICT).json({error: 'ItemList with this name already exists for a user: ' + list.name});
                    }
                    list.timeAdded = Date.now() / 1000 | 0;
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

    /**
     * @swagger
     * /api/v1/itemLists:
     *   delete:
     *     tags:
     *       - ItemLists
     *     description: Returns list of all ItemLists
     *     produces:
     *       - application/json
     *     parameters:
     *       - name: Authorization
     *         description: Auth token
     *         in: header
     *         required: true
     *         type: string
     *       - name: _id
     *         description: itemsList._id to delete
     *         in: path
     *         required: true
     *         type: string
     *     responses:
     *       200:
     *         description: ItemsList removed
     *         schema:
     *               "$ref": "#/definitions/ItemsList"
     *       401:
     *         description: Authorization token is missing or invalid
     *       404:
     *         description: ItemsList to delete not found (or doesn't belong to this user)
     *       500:
     *         description: Error when deleting list from DB
     */
    api.delete('/itemLists/:listId', wagner.invoke(function (ItemList) {
            return function (req, res) {
                console.log('Deleting items list: ' + req.user);
                ItemList.findOne({_id: req.params.listId, collaboratingUsers: req.user._id}, function (err, existingList) {
                    //user with this email already exists
                    if (existingList) {
                        existingList.remove(function (error, removedList) {
                            if (error) {
                                return internalError(res, 'Cannot remove itemList: ' + error.toString());
                            } else {
                                res.send(removedList);
                            }
                        });
                    } else {
                        return res.status(404).json({error: "Cannot find itemsList to delete wit id " + req.params.listId});
                    }
                });
            }
        }
    ));

    /**
     * @swagger
     * /api/v1/itemLists:
     *   get:
     *     tags:
     *       - ItemLists
     *     description: Returns list of all ItemLists where current user is among collaborating users
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
     *         description: An array of item lists
     *         schema: {
     *           "type": "array",
     *            "items": {
     *               "$ref": "#/definitions/ItemsList"
     *            }
     *        }
     *       401:
     *         description: Authorization token is missing or invalid
     *       500:
     *         description: Error when getting users from DB
     */
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