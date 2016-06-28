var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function (req, res) {
    res.render('spaceInvadersGame', { title: 'Rocket vs Aliens' });
});

// /* GET users listing. */
// router.get('/player', function (req, res) {
//     res.render('dominoPlayer', { title: 'Domino PLAYER' });
// });

module.exports = router;
