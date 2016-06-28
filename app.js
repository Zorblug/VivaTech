'use strict';

var debug = require('debug')('DominosApp');
var bodyParser = require('body-parser');
var express = require('express');
var logger = require('morgan');
var path = require('path');
var favicon = require('serve-favicon');
var os = require('os');

var dominoGame = require('./routes/dominoGame');
var spaceInvadersGame = require('./routes/spaceInvadersGame')

var myIpAdress = '';
var networkInterfaces = os.networkInterfaces();
debug(networkInterfaces);

search:
for (var i in networkInterfaces) {
    var subNet = networkInterfaces[i];

        for (var j in subNet) {
            debug('LIST : ' + JSON.stringify(subNet[j]));
            if ((subNet[j].family == 'IPv4') && (subNet[j].internal == false)) {
                debug('FOUND : ' + JSON.stringify(subNet[j]));
                myIpAdress = subNet[j].address;
                debug('BREAK');
                break search;
            }
        }
    }
debug('END LOOP');

var app = express();

app.set('port', process.env.PORT || 3000);
// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
app.use(favicon(__dirname + '/public/assets/favicon.png'));
//app.use(require('stylus').middleware(path.join(__dirname, 'public')));

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
pub.use(function (req, res, next) {
    res.header('Cache-Control', 'private, no-cache, no-store, must-revalidate');
    res.header('Expires', '-1');
    res.header('Pragma', 'no-cache');

    res.locals.config.address = myIpAdress;
    res.locals.config.port = app.settings.port;

    next()
});

app.use(logger('dev'));

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
    app.use(function (err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
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
