'use strict';

(function () {
    var btCam360, btVideo, btGame;

    function init() {
        btCam360 = $('ul li:nth-child(1) span').click(function (event) {            
            $.post('loop1', function(){                
            });
        });
        btVideo = $('ul li:nth-child(2) span').click(function (event) {
            $.post('home');
        });
        btGame = $('ul li:nth-child(3) span').click(function (event) {
            $.post('loop2');
        });
    }

    $(init);
})();
