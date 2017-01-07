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
     *       oauth:
     *         description: facebook ID
     *         type: string
     *         required: true
     *       deviceId:
     *         type: string
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