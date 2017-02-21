const {Item, ItemsList, User}  = require('../models/models');
const serverKey = process.env.FCM_SERVER_KEY;
const request = require('request');
let status = require('http-status');

module.exports = function () {

    function sendInviteNotification(who = {}, itemsList = {}, whom = {}) {

        if (whom.deviceId) {
            return;
        }

        const headers = {
            Authorization: 'key=' + serverKey,
            'Content-Type': 'application/json'
        };

        const to = whom.deviceId;

        const body = {
            to: to,
            data: {
                action: 'invite',
                whoId: who._id,
                who: who.name,
                listId: itemsList._id,
                listName: itemsList.name,
                whomId: whom._id,
                whomName: whom.name
            }
        };

        const options = {
            url: 'https://fcm.googleapis.com/fcm/send',
            headers,
            json: true,
            body,
            method: 'POST'
        };

        request(options, (error, response, body) => {
                if (!error && response.statusCode == status.OK) {
                    console.log('FCM response body: ' + JSON.stringify(body));
                } else {
                    console.error('Error when sending FCM push message: ' + error);
                    console.error('Error response code: ' + response.statusCode);
                }
            }
        );
    }

    return {
        sendInviteNotification
    };

};

