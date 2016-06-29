'use strict';

var debug = require('debug')('domino.app');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');

var dominoGame = require('./routes/dominoGame');
var remote = require('./routes/remoteScreen');
var spaceInvadersGame = require('./routes/spaceInvadersGame')

var app = express();

app.set('port', process.env.PORT || 3000);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/assets/favicon.png'));
//app.use(require('stylus').middleware(path.join(__dirname, 'public')));

app.use(express.static(path.join(__dirname, 'public')));
app.use(function (req, res, next) {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');    
    next();
});

app.use('/', remote);
app.use('/domino', dominoGame);
app.use('/space', spaceInvadersGame);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// development error handler
// will print stack trace
if (app.get('env') === 'development') {
    app.locals.pretty = true;

    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}
else {
  app.locals.pretty = false;
}

// production error handler
// no stack traces leaked to user
app.use(function (err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

module.exports = app;
