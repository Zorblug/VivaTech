/// <reference path="dominosGameInterface.js" />

"use strict";

(function load() {
    var dominoPosition = [[55,2052,90],[105,2303,0],[355,2253,270],[406,2203,0],[607,2203,0],[758,2153,90],[909,2303,0],[1160,2253,270],[1160,2052,270],[1160,1851,270],[1009,1701,180],[959,1650,270],[1010,1600,0],[1161,1449,270],[1162,1248,270],[1010,1098,180],[859,1148,270],[809,997,0],[1010,997,0],[1160,846,270],[1009,695,180],[858,745,270],[858,544,270],[909,494,0],[1160,444,270],[1110,193,180],[909,193,180],[708,193,180],[558,344,90],[558,545,90],[558,746,90],[558,947,90],[558,1148,90],[558,1349,90],[608,1600,0],[659,1651,90],[659,1852,90],[608,1902,180],[407,1902,180],[256,1952,270],[256,1751,270],[307,1701,0],[456,1550,270],[305,1400,180],[255,1349,270],[205,1198,0],[456,1149,270],[456,948,270],[305,798,180],[254,747,270],[305,697,0],[454,546,270],[303,397,180],[253,346,270],[304,296,0]];
    var dominoTableList = new Array(55);
    var dominosObserver = new Domino.GameInterface('http://' + config.address + ':' + config.port);

    document.addEventListener("DOMContentLoaded", init);

    function init() {
        console.log("LISTE : " + dominoPosition.length + ' - ' + dominoTableList.length);
        dominoTableList = dominoTableList.map(function(val){ return undefined; });
        d3.select('#table').append('svg').attr('viewBox','0 0 980 1820').attr('id', 'partArea');
        dominosObserver.onNewPlayer(function (data) {
            console.log('NEW PLAYER :' + JSON.stringify(data));
            if(data.player.idx === 0) {
              $('#infobar #info_'+ data.player.idx).html(data.player.data.name + ' a lancé une partie');
            }
            else {
              $('#infobar #info_'+ data.player.idx).html(data.player.data.name + ' a rejoint la partie');
            }
        });

        dominosObserver.onStart(function (data) {
            console.log('START :' + JSON.stringify(data));
            $('#registerPage').hide();
            // stopProgress();
            // for (var i = 0; i < 4; i++){
            //   $('#startPage #playerName_'+ i).html('');
            // }
            // for ( var p in data.players.collection ) {
            //   var currentPlayer = data.players.collection[p];
            //   console.log('PLAYER -> ', JSON.stringify(currentPlayer));
            //   $('#startPage #playerName_'+ currentPlayer.idx).html( currentPlayer.data.name + ' - ' + currentPlayer.idx);
            // }

            $('#startPage #infoTurn').html((data.player.idx + 1) + ' : ' + data.player.data.name +   ' joue...');
            $('#startPage').show();

            // startProgress(data.player.idx);
        });

        dominosObserver.onTurnChange(function (data) {
            console.log('TURN :' + JSON.stringify(data));
            $('#startPage #infoTurn').html((data.player.idx + 1) + ' : ' + data.player.data.name +   ' joue...');
            updateTable(data.table, data.first);
            // startProgress(data.player.idx);
        });

        dominosObserver.onGameOver(function (data) {
            console.log('GAME OVER :' + JSON.stringify(data));
            // stopProgress();
            $('#startPage #infoTurn').html((data.winner.idx + 1) + ' : ' + data.winner.data.name +  ' a gagné !');
            $('#gameover').show();
        });

        dominosObserver.onError(function (data) {
            console.log('ERROR :' + JSON.stringify(data));
        });

        dominosObserver.onClose(function (data) {
            console.log('CLOSE :' + JSON.stringify(data));
        });

        dominosObserver.init(function (data) {
            console.log('INIT CALL BACK :' + JSON.stringify(data));
            $('#registerPage').show();
            $('#startPage').hide();
            $('#gameover').hide();
        });
    }

    var val = 30;
    var currentIdx;
    var progressTimer = undefined;

    function startProgress(idx) {
      stopProgress();
      if(!progressTimer) {
        currentIdx = idx;
        val = 30;
        changeProgress(idx,val);
        progressTimer = setInterval(function() {
          val-=1;
          changeProgress(currentIdx,val);
        }, 1000);
      }
    }

    function stopProgress() {
      if(progressTimer) {
        clearInterval(progressTimer);
        progressTimer = undefined;
        for (var i = 0; i < 4; i++) {
          changeProgress(i,0);
        }
      }
    }

    function changeProgress(playerNo,val) {
      var $circle = $('#player_' + playerNo + ' circle:nth-child(2)');
      var r = $circle.attr('r');
      var c = Math.PI*(r*2);

      if (val < 0) { val = 0;}
      if (val > 30) { val = 30;}

      var pct = ((30-val)/30)*c;

      $circle.css({ strokeDashoffset: pct});

      $('#player_' + playerNo).attr('data-pct',val);
    }

    function updateTable(dominoList, indexFirst) {
      var middle = 27;
      dominoList.forEach(function(val,index) {
          dominoTableList[middle + index - indexFirst] = val;
      });
      console.log('TABLE UPDATE :' + JSON.stringify(dominoTableList));
      $('.partArea').remove();
      dominoTableList.forEach(function(val,index) {
        if(val) {
          dominoPartGraphic.create('#partArea',val, dominoPosition[index][0], dominoPosition[index][1], dominoPosition[index][2], true);
        }
      });
    }
})();
