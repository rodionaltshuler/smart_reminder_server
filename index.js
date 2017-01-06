let express = require('express');
let wagner = require('wagner-core');

require('./models/models')(wagner);

let app = express();

let fs = require("fs");
let decodeKey = fs.readFileSync(__dirname + '/public.pem');

let express_jwt = require('express-jwt');

//var cors = require('cors');
//app.use(cors);

app.use(express_jwt({
    secret: decodeKey,
    algorithms:'RS256',
    credentialsRequired: true,
    getToken: function fromHeaderOrQuerystring (req) {
        if (req.header("Authorization")) {
            return req.header("Authorization");
        }
        return null;
    }
}).unless({path: ['/api/v1/login']}));

app.use(function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
        res.status(401).send('Invalid access token');
    }
});

wagner.invoke(require('./auth/auth'), {app: app});

app.use('/api/v1', require('./auth/register')(wagner));
app.use('/api/v1', require('./routes/usersRoute')(wagner));
app.use('/api/v1', require('./routes/itemListsRoute')(wagner));
app.use('/api/v1', require('./routes/itemRoute')(wagner));

app.listen(3000);

console.log("SmartReminder server listening on port 3000");