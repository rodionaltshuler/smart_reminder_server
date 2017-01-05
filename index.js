var express = require('express');
var wagner = require('wagner-core');

require('./models/models')(wagner);

var app = express();

//var cors = require('cors');
//app.use(cors);

wagner.invoke(require('./auth/auth'), {app: app});

app.use('/api/v1', require('./auth/register')(wagner));
app.use('/api/v1', require('./routes/usersRoute')(wagner));
app.use('/api/v1', require('./routes/itemListsRoute')(wagner));
app.use('/api/v1', require('./routes/itemRoute')(wagner));

app.listen(3000);

console.log("SmartReminder server listening on port 3000");