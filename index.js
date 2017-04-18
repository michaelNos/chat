var express = require('express'),
    app = express(),
    fs = require('fs'),
    path = require('path'),
    sassMiddleware = require('node-sass-middleware'),
    cookieParse = require('cookie-parser'),
    session = require('express-session'),
    config = require('./config/config.js'),
    ConnectMongo = require('connect-mongo')(session),
    mongoose = require('mongoose').connect(config.dburl),
    passport = require('passport'),
    FacebookStrategy = require('passport-facebook').Strategy,
    rooms = [];


app.set('views', path.join(__dirname, 'public/views'));
app.engine('html', require('hogan-express'));
app.set('view engine', 'html');

app.use(sassMiddleware({
  src: path.join(__dirname, 'public/sass/'),
  dest: path.join(__dirname, 'public'),
  debug: false,
  outputStyle: 'expanded'
}));

app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParse());

var env = process.env.NODE_ENV || 'development';
if(env == 'development'){
    app.use(session({secret: config.sessionSecret, resave: true, saveUninitialized: true}));
}else{
    app.use(session({
        secret: config.sessionSecret,
        resave: true, 
        saveUninitialized: true,
        store: new ConnectMongo({
            //url: config.dburl,
            mongooseConnection:mongoose.connections[0],
            stringify:true
        })
    }));
}

//var userSchema = mongoose.Schema({
//    username:String,
//    password:String,
//    fullname:String
//});
//
//var Person = mongoose.model('user', userSchema);
//
//var Jhon = new Person({
//    username: 'Jhon',
//    password: 'Jhone pass',
//    fullname: 'Jhon Doe'
//});
//
//Jhon.save(function(err){
//    console.log('Done');
//})

app.use(passport.initialize());
app.use(passport.session());

require('./auth/passportAuth.js')(passport, FacebookStrategy, config, mongoose);

require('./routes/routes.js')(express, app, passport, config, rooms);

app.set('port', process.env.PORT || 3000);
var server = require('http').createServer(app);
var io = require('socket.io').listen(server);
require('./socket/socket.js')(io, rooms);
server.listen(app.get('port'), function(){
    console.log('ChatCAt on Port: ' + app.get('port'));
})