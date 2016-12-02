var express = require('express');
var status = require('http-status');
var bodyParser = require('body-parser');

/**
 * endpoints:
 *  create user: POST /users { name: ... }
 *  get user by id : GET /users/{user_id}
 *  get all users: GET /users
 *  list of itemLists for a user: GET /user/{user_id}/itemLists
 *  create itemsList for a user: POST /itemLists/{user_id}
 *  invite user to collaborate on list: PUT /itemLists/{list_id}/invite?user={used_id}
 *  remove user from itemsList: DELETE /itemLists/{list_id}/remove?user={used_id}
 *  add item to itemsList: POST /items, body = { item object with item list data filled }
 *  remove item from itemsList: DELETE /items/{item_id}
 *  get all items for itemsLists: GET /items?itemList={list_id}
 *  update item: PUT /items/{item_id} body: item object
 * @param wagner
 */
module.exports = function (wagner) {

    var api = express.Router();

    api.use(bodyParser.urlencoded({
        extended: true
    }));

    //create new user
    api.post('/users', wagner.invoke(function(User) {
       return function (req, res) {
           console.log(req.body);
           var user = new User({ name: req.body.name, email: req.body.email });
           User.findOne({email: user.email}, function(err, existingUser){
               //user with this email already exists
               if (existingUser) {
                   return res.status(status.CONFLICT).json({error: 'User with e-mail already exists: ' + user.email});
               }
               user.save(function(error, user) {
                   if (error) {
                       return res.status(status.INTERNAL_SERVER_ERROR).json({error: 'Cannot create user: ' + error.toString()});
                   }
                   return res.json({user: user});
               });
           });

       }
    }));

    //get users list
    api.get('/users', wagner.invoke(function (User) {
        return function (req, res) {
            User.find({}, function (err, users) {
                res.send(users);
            });
        }
    }));

    return api;

};