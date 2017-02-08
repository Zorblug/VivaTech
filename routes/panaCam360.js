'use strict';

var debug = require('debug')('jcdecaux.camera.router');
var express = require('express');
var request = require('request');

var router = express.Router();

router.get('/', function (req, res) {
    debug('CAMERA config :' + JSON.stringify(req.app.locals.netConfig));
    res.render('camera360');
});

router.get('/hm_count', function (req, res) {
    console.log('HEAT MAP COUNT ...');

    var r = request.get({
        uri: 'http://172.21.254.60/cgi-bin/get_metadata?kind=heatmap_mov_info&mode=latest'
    }
        , function (error, response, body) {
            if (error) {
                return console.error('upload failed:', error);
            }
        }
    ).auth('innovation', 'jcd12345', false);

    req.pipe(r);
    r.pipe(res);
});

router.get('/hm_loitering', function (req, res) {
    console.log('HEAT MAP LOITERING ...');

    var r = request.get({
        uri: 'http://172.21.254.60/cgi-bin/get_metadata?kind=heatmap_loi_info&mode=latest'
    }
        , function (error, response, body) {
            if (error) {
                return console.error('upload failed:', error);
            }
        }
    ).auth('innovation', 'jcd12345', false);

    req.pipe(r);
    r.pipe(res);
});

router.get('/pp_count', function (req, res) {
    console.log('PEOPLE COUNT ...');

    var r = request.get({
        uri: 'http://172.21.254.60/cgi-bin/get_metadata?kind=movcnt_info&mode=latest'
    }
        , function (error, response, body) {
            if (error) {
                return console.error('upload failed:', error);
            }
        }
    ).auth('innovation', 'jcd12345', false);

    req.pipe(r);
    r.pipe(res);
});

module.exports = router;