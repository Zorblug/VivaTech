/// <reference path="dominosPlayerInterface.js" />

"use strict";
(function load() {
    var dominosObserver = new Domino.PlayerInterface('http://' + config.address + ':' + config.port);

    document.addEventListener("DOMContentLoaded", init);

    function updateHand() {
      $('.partElement').remove();
      dominosObserver.getHand().hand.map(function(val, index)  {
        d3.select('#hand').append("div").attr('id', 'part_'+index).attr('class', 'partElement')
        dominoPartGraphic.create('#part_'+index, val)
      });
    }

    function togglePlayableParts()  {
      if(dominosObserver.isActivated()) {
        var hand =   dominosObserver.getHand();
        console.log(JSON.stringify(hand));
        //if(_.some(_.flatten(dominosObserver.getHand().playablesDom)))  {
        if(hand.canPlay)  {
          hand.playablesDom.map(function(val, index) {
            //if (val[0] === false && val[1] === true)  {
            if (val[0] >= 0)  {
              var part = '#part_'+index;
              d3.select(part).select("#top").insert("rect", ":first-child").attr("x", 11).attr("y", 11).attr("z","10000").attr("width", 88).attr("height", 88 ).attr("rx", 5).attr("ry", 5).attr("fill", "#95f724").style("opacity", 0.4);
              d3.select(part).select('#top').on('click', function()  {
                console.log(part + ' top' + val[0]);
                dominosObserver.play(index, val[0], function(turnInfos)  {
                  console.log('JOUER :'+JSON.stringify(turnInfos));
                  updateHand();
                  stopProgress();
                });
              });
              // d3.select(part).select("#top").append("rect").attr("x", 111).attr("y", 11).attr("z", 1000).attr("width", 88).attr("height", 88 ).attr("rx", 5).attr("ry", 5).attr("fill", "#cc1a0c").style("opacity", 0.4);
            }

            // if (val[0] === true && val[1] === false)  {
            if (val[1] >= 0)  {
              var part = '#part_'+index;
              // d3.select(part).select("#top").append("rect").attr("x", 11).attr("y", 11).attr("z", 1000).attr("width", 88).attr("height", 88 ).attr("rx", 5).attr("ry", 5).attr("fill", "#cc1a0c").style("opacity", 0.4);
              d3.select(part).select("#bottom").insert("rect", ":first-child").attr("x", 111).attr("y", 11).attr("z","10000").attr("rx", 5).attr("ry", 5).attr("width", 88).attr("height", 88 ).attr("fill", "#95f724").style("opacity", 0.4);
              var selectedPart = d3.select(part).select('#bottom').select('rect');
              d3.select(part).select('#bottom').on('click', function()  {
                console.log(part + ' bottom' + val[1]);
                dominosObserver.play(index, val[1], function(turnInfos)  {
                  console.log('JOUER :'+JSON.stringify(turnInfos));
                  updateHand();
                  stopProgress();
                });
              });
            }

            // if( (val[0] === true) && ( val[1] === true) ) {
            //   var part = '#part_'+index;
            //   d3.select(part).select("#bottom").insert("rect", ":first-child").attr("x", 110).attr("y", 10).attr("z", 1000).attr("rx", 5).attr("ry", 5).attr("width", 90).attr("height", 90 ).attr("fill", "#95f724").style("opacity", 0.4);
            //   d3.select(part).select("#bottom").insert("rect", ":first-child").attr("x", 10).attr("y", 10).attr("z", 1000).attr("rx", 5).attr("ry", 5).attr("width", 90).attr("height", 90 ).attr("fill", "#95f724").style("opacity", 0.4);
            // }

            // if( (val[0] === true) || ( val[1] === true) ) {
            //   var part = '#part_'+index;
            //   console.log(part);
            //
            //   var selectedPart = d3.select(part).select('.dominoPart');
            //   $(selectedPart).on('click', function()  {
            //     console.log('toto');
            //   });
            // }
          });
        }
        else {
          $('#shaderPicker').show();
          setTimeout(function(){dominosObserver.pick(function(turnInfo) {
            updateHand();
            stopProgress();
            $('#shaderPicker').hide();
          });
        }, 5000);

        }
      }
    }

    var progressTimer = undefined;
    var progressValue = [0.13];


    function startProgress() {
      stopProgress();
      progressTimer = setInterval(function()  {
        progressValue[0] += 0.03;
        d3.select('#progressBar').select('#reflection').transition().attr('width', progressValue[0]*200-8);
        d3.select('#progressBar').select('#hash').transition().attr('width', progressValue[0]*200);
        d3.select('#progressBar').select('#progress').transition().attr('width', progressValue[0]*200);
        if(  progressValue[0] >= 1) {
          stopProgress();
        }
      }, 1000)
    }

      function stopProgress() {
        if(progressTimer){
          clearInterval(progressTimer);
          progressTimer = undefined;
          progressValue = [0.1];
          d3.select('#progressBar').select('#reflection').transition().attr('width', progressValue[0]*200-8);
          d3.select('#progressBar').select('#hash').transition().attr('width', progressValue[0]*200);
          d3.select('#progressBar').select('#progress').transition().attr('width', progressValue[0]*200);
        }
      }

    function init() {
        progressBar.create('#divProgressBar', progressValue);
        $('#shaderPicker').hide();
        dominosObserver.onStart(function () {
          console.log(JSON.stringify(dominosObserver.getHand()));
          $('#startPage').hide();
          $('#handPage').show();
          $('#handPageTitle').html("Joueur : " + dominosObserver._playerData.data.name);
          console.log(dominosObserver.getHand().hand);
          updateHand();
          togglePlayableParts();
          startProgress();
        });


        dominosObserver.onNewPlayer(function (data) {
            $('#infobar').html(data.player.data.name + ' a rejoint la partie');
            if(data.count > 1)  {
              $('#start').attr('disabled',false);
            }
            console.log('NEW PLAYER :' + JSON.stringify(data));
        });

        dominosObserver.onTurnChange(function (data) {
            console.log('TURN :' + JSON.stringify(data));
            togglePlayableParts();
            if(dominosObserver.isActivated()) {
            startProgress();
            }
            else {
            stopProgress();
            }
        });

        dominosObserver.onGameOver(function (data) {
          $('#handPage').hide();
          $('#gameOver').show();
            console.log('GAME OVER :' + JSON.stringify(data));
            if(data.iWin) {
              $('#winner').html("Bravo! Vous avez gagné!");
            }
            else
            {
              $('#winner').html("Dommage... Vous avez perdu...");
              $('#winnerName').html("Le gagnant est "+ data.winner.data.name);
            }
        });

        dominosObserver.onError(function (data) {
            console.log('ERROR :' + JSON.stringify(data));
        });

        dominosObserver.onTimeout(function(data) {
          console.log('TIMEOUT :' + JSON.stringify(data));
          updateHand();
          stopProgress();
        });


        dominosObserver.onClose(function (data) {
            console.log('CLOSE :' + JSON.stringify(data));
        });

        var registerButton = document.getElementById('register');
        var startButton = document.getElementById('start');
        registerButton.addEventListener('click', function () {
            var playerName = $('#playerName').val();
            if (!playerName)  {
              playerName = 'player';
            }
            console.log(playerName);
            dominosObserver.init({ name: playerName }, function (data) {
                console.log("INIT callback: " + JSON.stringify(data));
                $('#registerPage').hide();
                $('#startPage').show();
                if(data.idx === 0)  {
                  $('#start').attr('disabled',true);
                  $('#start').show();
                  $('#accueil').html('Bienvenue ' + playerName +'! La partie va bientôt débuter. Vous êtes le premier joueur, attendez au moins un autre participant et vous pourrez lancer la partie avec le bouton START.');
                }
                else {
                  $('#start').hide();
                  $('#accueil').html("Bienvenue " + playerName +"! La partie va bientôt débuter. Patientez l'arrivée d'autres joueurs ou le lancement de la partie par le premier joueur inscrit.");
                }
            });
        });
        startButton.addEventListener('click', function () {
          dominosObserver.start();
          console.log('start');
        });
    }

})();
