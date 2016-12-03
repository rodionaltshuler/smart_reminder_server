var express = require('express');
var wagner = require('wagner-core');

require('./models')(wagner);

var app = express();

wagner.invoke(require('./auth'), {app: app});

var routes = require('./api')(wagner);
app.use('/api/v1', routes);

app.listen(3000);

console.log("SmartReminder server listening on port 3000");