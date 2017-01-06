let status = require('http-status');
let jwt = require('jsonwebtoken');
let fs = require("fs");

module.exports = function (req, res) {

    let authHeaderKey = "Authorization";
    let token = req.header(authHeaderKey);
    if (!token) {
        console.log("Auth token is missing");
        return res.status(status.UNAUTHORIZED)
            .json({error: 'Auth header {' + authHeaderKey + '} is missing'});
    }
    let decodeKey = fs.readFileSync(__dirname + '/public.pem');

    let options = {
        algorithms: 'RS256'
    };

    let decoded = jwt.verify(token, decodeKey, options, function (err, decoded) {

        if (err) {
            console.log(err.message);
            return res.status(status.UNAUTHORIZED)
                .json({error: 'Invalid token'});
        }

        console.log(JSON.stringify(decoded));

    });

};
