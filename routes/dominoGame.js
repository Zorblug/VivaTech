var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
    res.render('dominoGame', { title: 'Domino GAME', address: res.locals.config.address, port: res.locals.config.port });
});

/* GET users listing. */
router.get('/player', function (req, res) {
    res.render('dominoPlayer', { title: 'Domino PLAYER', address: res.locals.config.address, port: res.locals.config.port });
});

module.exports = router;
