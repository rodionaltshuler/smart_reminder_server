let status = require('http-status');
let jsonwebtoken = require('jsonwebtoken');
let fs = require("fs");

const ALGORITHM = 'RS256';

let decodeOptions = {
    algorithms: ALGORITHM
};

let encodeOptions = {
    algorithm: ALGORITHM
};

let jwt = module.exports;

jwt.create = function (user) {
    let encodeKey = fs.readFileSync(__dirname + '/private.pem');
    let payload = {
        id: user._id
    };
    try {
        let token = jsonwebtoken.sign(payload, encodeKey, encodeOptions);
        console.log("Token generated: " + token);
        return token;
    } catch (err) {
        console.log("Error creating jwt: " + err.toString());
    }
};

jwt.payload = function (token) {
    let decodeKey = fs.readFileSync(__dirname + '/public.pem');
    return jsonwebtoken.verify(token, decodeKey, decodeOptions);
};