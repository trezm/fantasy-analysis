var express = require('express');
var app = express();
const data = require('./data');

// set the view engine to ejs
app.set('view engine', 'ejs');

// use res.render to load up an ejs view file

// index page
app.get('/receiving', async function(req, res) {
    res.render('qbvswr', {
      dataJSON: JSON.stringify(await data.receivingVsPassing())
    });
});

app.get('/rushing', async function(req, res) {
  res.render('qbvsrb', {
    dataJSON: JSON.stringify(await data.rushingVsPassing())
  });
});

app.get('/reddit/qb', async function(req, res) {
  res.render('qbvsreddit', {
    dataJSON: JSON.stringify(await data.redditVsPassing())
  });
});

app.get('/reddit/rb', async function(req, res) {
  const query = req.query.q || "amazing";
  res.render('rbvsreddit', {
    dataJSON: JSON.stringify(await data.redditVsRushing(query)),
    query
  });
});

app.listen(3000);
console.log('starting on 3000...');
