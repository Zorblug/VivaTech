'use strict';

(function load() {  
  var url ='http://' + config.address + ':' + config.port; 

  var init = function init() {
    var data = {
      count: 0,
      detect: [{
        gender: { value: 'F', acc: 55 },
        age: { value: 28, acc: 89 },
        direction: { leftRight: 5, updown: 0 },
        gaze: { leftRight: 5, updown: 0 }        
      },
      {
        gender: { value: 'H', acc: 33 },
        age: { value: 48, acc: 77 },
        direction: { leftRight: 5, updown: 0 },
        gaze: { leftRight: 20, updown: -10 }
      }]
    }

    var crt = new Vue({
      el: '#controller',
      data: data,
      computed: {
        camera: {
          get: function () {
            return this.detect
          },
          set: function (newData) {
            var det = []
            for (var i = 0; i < newData.list.length; i++) {
              var item = newData.list[i];
              det.push({
                gender: { value: (item.gender.gender === 'male') ? 'H' : 'F', acc: Number(item.gender.conf / 10).toFixed(1) },
                age: { value: item.age.age, acc: Number(item.age.conf / 10).toFixed(1) },
                direction: { leftRight: item.direction.angle.leftRight, updown: item.direction.angle.upDown },
                gaze: { leftRight: item.gaze.leftRight, updown: item.gaze.upDown }
              })
            }
            console.log('DATA:' + JSON.stringify(det))
            this.detect = det
          }
        }
      }
    })

    var mySocket = io.connect(url + '/camera')
    console.log('STARTED !!!')
    mySocket.on('detection_info', function (newData) {
      console.log('DETECTION: ' + JSON.stringify(newData));
      data.count = newData.count
      crt.camera = newData
    })

  }

  document.addEventListener('DOMContentLoaded', init)
})()
