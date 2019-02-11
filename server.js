'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');

var cors = require('cors');

var app = express();
var bodyParser  = require('body-parser');

var dns = require('dns');

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/ 
var MONGODB_CONNECTION_STRING = process.env.DB;
console.log(MONGODB_CONNECTION_STRING);
mongoose.connect(MONGODB_CONNECTION_STRING, { useNewUrlParser: true });
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

var Schema = mongoose.Schema;

var urlSchema = new Schema({
    link: String,
    original_url: String,
    short_url: Number
});

var Url= mongoose.model('Url', urlSchema);

app.use(cors());


app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
  
// your first API endpoint... 
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.get("/api/shorturl/:url", function (req, res) {
  var url = parseInt(req.params.url);
  //console.log(typeof url);
  Url.findOne({ short_url: url }, function (err, doc) {
    if(err) return console.error(err);
    res.redirect(doc.link);
  });
});

app.post("/api/shorturl/new", function (req, res) {
  var clean_regex = /^https?:\/\//i;
  var name = req.body.url.replace(clean_regex , '');
  dns.lookup(name, function (err, addresses, family) {
    if (addresses === undefined){
      res.json({"error":"invalid URL"});
    }else{
        Url.countDocuments({}, function (err, count) {
        if (err) return console.error(err);
          var url = new Url({link: req.body.url, original_url: name, short_url: count});
          url.save(function(err, data) {
            if(err) return console.error(err);
            res.json({original_url: url.original_url, short_url: url.short_url});
          });
      });
      
    }
  });
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});