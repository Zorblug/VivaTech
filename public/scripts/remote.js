'use strict';

(function () {
    function postRequest(url) {
        var r = new XMLHttpRequest();
        r.open("POST", url, true);
        r.onreadystatechange = function () {
            if (r.readyState != 4 || r.status != 200) return;
            console.log(r.responseText);
        };
        r.send(null);
    }

    var urlServer;

    var loopEricssonBtn, loopNfcBtn, loopHomeBtn;

    function init() {
        urlServer = 'http://' + config.address + ':' + config.port;

        loopEricssonBtn = document.getElementById('space');
        loopEricssonBtn.addEventListener('click', function () {
            postRequest(urlServer + '/loop1');
        });

        // loopNfcBtn = document.getElementById('domino');
        // loopNfcBtn.addEventListener('click', function () {
        //     postRequest(urlServer + '/loop2');
        // });

		  //     loopNfcBtn = document.getElementById('button3');
      //   loopNfcBtn.addEventListener('click', function () {
      //       postRequest(urlServer + 'loop3');
      //   });
      //
      //   loopNfcBtn = document.getElementById('button4');
      // loopNfcBtn.addEventListener('click', function () {
      //     postRequest(urlServer + 'loop4');
      // });

		loopHomeBtn = document.getElementById('home');
        loopHomeBtn.addEventListener('click', function () {
            postRequest(urlServer + '/home');
        });

    }
    document.addEventListener("DOMContentLoaded", init);
})();
