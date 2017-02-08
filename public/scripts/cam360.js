'use strict';

(function () {

    var camera360Module = (function () {
        var urlView = 'http://172.21.254.60/cgi-bin/camera?stream=2';
        var svgns = "http://www.w3.org/2000/svg";
        var fps = 500;//2FPS

        var cameraView, view;
        var intervalTimer = null;

        function parseBodyCSV(body) {
            var contentType = 'multipart/form-data; boundary=myboundary';
            var m = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
            var s = '';

            if (!m) {
                throw new Error('Bad content-type header, no multipart boundary');
            }

            var boundary = m[1] || m[2];

            function Header_parse(header) {
                var headerFields = {};
                var matchResult = header.match(/^.*name="([^"]*)"$/);
                if (matchResult) headerFields.name = matchResult[1];
                return headerFields;
            }

            function rawStringToBuffer(str) {
                var idx, len = str.length, arr = new Array(len);
                for (idx = 0 ; idx < len ; ++idx) {
                    arr[idx] = str.charCodeAt(idx) & 0xFF;
                }
                return new Uint8Array(arr).buffer;
            }

            // \r\n is part of the boundary.
            var boundary = '\r\n--' + boundary;

            s = body;

            // Prepend what has been stripped by the body parsing mechanism.
            s = '\r\n' + s;

            var parts = s.split(new RegExp(boundary)),
                partsByName = {};

            // First part is a preamble, last part is closing '--'
            var subparts = parts[1].split('\r\n\r\n');

            return subparts[2];
        }

        //#region HEAT MAP MODULE
        var heatMapModule = (function () {
            var chromatic = 200;
            var luminanceMax = 60;
            var luminanceMin = 16;

            var deltaLuminance = luminanceMax - luminanceMin;

            var squareSize = 16;
            var view, squareArray;
            var timer;

            var urlHeatMap = [location.origin + '/p360/hm_count', location.origin + '/p360/hm_loitering'];
            var currentHeatUrl = '0';

            function initialize() {
                view = document.getElementById('matrix');
            }

            function setScreenSize(screenSize) {
                squareSize = screenSize / 64;
                if (squareArray) {
                    clearTimeout(timer);
                    eraseMatrix();
                    update();
                }
            }

            function parseCSV(body) {
                var csv = parseBodyCSV(body);

                var maxValue = 0;
                var minValue = 0;
                var values = [];
                var lines = csv.split('\r\n');
                for (var i = 1; i < lines.length - 1; i++) {
                    var val = lines[i].split(',');

                    for (var j = 0; j < val.length; j++) {
                        var v = parseInt(val[j]);

                        //MAX
                        if (v > maxValue) {
                            maxValue = v;
                        }
                        //MIN > 0
                        if (v > 0) {
                            if (minValue == 0) {
                                minValue = v;
                            }
                            else {
                                if (minValue > v) {
                                    minValue = v;
                                }
                            }
                        }

                        values.push(v);
                    }
                }

                return { values: values, min: minValue, max: maxValue };
            }

            function createMatrix() {
                for (var i = 0; i < 4096; i++) {
                    var x = (i % 64) * squareSize;
                    var y = (~~(i / 64)) * squareSize;

                    var rect = document.createElementNS(svgns, 'rect');
                    rect.setAttributeNS(null, 'x', x);
                    rect.setAttributeNS(null, 'y', y);
                    rect.setAttributeNS(null, 'width', squareSize);
                    rect.setAttributeNS(null, 'height', squareSize);
                    rect.setAttributeNS(null, 'class', 'spot');
                    view.appendChild(rect);
                }

                squareArray = view.getElementsByTagName('rect');
            }

            function updateMatrix(parts) {
                //var coefChroma = chromatic / ((parts.max * 0.6) - parts.min);
                //var coefLuma = deltaLuminance / parts.max;

                //for (var i = 0, length = parts.values.length; i < length; i++) {
                //    var currentChroma = parts.values[i] * coefChroma;
                //    if (currentChroma > 0) {
                //        if (currentChroma > chromatic) {
                //            var luma = luminanceMax - (parts.values[i] * coefLuma);

                //            squareArray[i].style.fill = 'hsla(0,100%,' + luma + '%, 0.5)';
                //            squareArray[i].style.stroke = 'hsla(0,100%,' + luma + '%, 0.5)';

                //        }
                //        else {
                //            var chroma = chromatic - currentChroma;

                //            squareArray[i].style.fill = 'hsla(' + chroma + ',100%,' + luminanceMax + '%, 0.4)';
                //            squareArray[i].style.stroke = 'hsla(' + chroma + ',100%,' + luminanceMax + '%, 0.4)';
                //        }

                //    }
                //    else {
                //        squareArray[i].style.fill = 'hsla(0,100%,0%,0)';
                //        squareArray[i].style.stroke = 'hsla(0,100%,0%,0)';
                //    }
                //}
                //console.log('coef : ' + coefChroma + ' - ' + coefLuma);



                //LOGARITHME VERSION
                var coefChroma = chromatic / (Math.log(parts.max) - Math.log(parts.min));
                var coefLuma = deltaLuminance / Math.log(parts.max);

                for (var i = 0, length = parts.values.length; i < length; i++) 
                {
                    var currentValue = parts.values[i];
                        
                    if (currentValue > 0) {
                        var currentChroma = Math.log(currentValue) * coefChroma;

                        if (currentChroma > chromatic) {
                            var luma = luminanceMax - (currentValue * coefLuma);

                            squareArray[i].style.fill = 'hsla(0,100%,' + luma + '%, 0.5)';
                            squareArray[i].style.stroke = 'hsla(0,100%,' + luma + '%, 0.5)';

                        }
                        else {
                            var chroma = chromatic - currentChroma;

                            squareArray[i].style.fill = 'hsla(' + chroma + ',100%,' + luminanceMax + '%, 0.4)';
                            squareArray[i].style.stroke = 'hsla(' + chroma + ',100%,' + luminanceMax + '%, 0.4)';
                        }

                    }
                    else {
                        squareArray[i].style.fill = 'hsla(0,100%,0%,0)';
                        squareArray[i].style.stroke = 'hsla(0,100%,0%,0)';
                    }
                }
            }

            function update() {
                var request = new XMLHttpRequest();

                var url = urlHeatMap[currentHeatUrl];

                request.open('get', url, true);

                request.onload = function (e) {
                    var response = request.response;

                    var parts = parseCSV(response);

                    console.log(JSON.stringify(parts));

                    if (squareArray) {
                        updateMatrix(parts);
                    }
                    else {
                        createMatrix();
                        updateMatrix(parts);
                    }
                };

                request.onerror = function (e) {
                    console.log('error : ' + JSON.stringify(e));
                };

                request.send();

                timer = setTimeout(update, 20000);
            }

            function clearMatrix() {
                if (squareArray) {
                    for (var i = 0, length = squareArray.length; i < length; i++) {
                        squareArray[i].style.fill = 'hsla(0,100%,0%, 0)';
                        squareArray[i].style.stroke = 'hsla(0,100%,0%, 0)';
                    }
                }
            }

            function eraseMatrix() {
                squareArray = null;
                while (view.firstChild) {
                    view.removeChild(view.firstChild);
                }
            }

            return {
                TypeEnum: {
                    count: 0,
                    loitering: 1
                },
                init: initialize,
                setScreenSize: setScreenSize,
                start: function (type) {
                    currentHeatUrl = type;
                    clearTimeout(timer);
                    clearMatrix();
                    update();
                },
                stop: function () {
                    clearTimeout(timer);
                    clearMatrix();
                }
            };
        })();
        //#endregion
        
        //#region PEOPLES COUNT MODULE
        var peoplesCountModule = (function () {
            var _initialSize = 320;

            var scaleCoef = 1;
            var view;
            var timer;
            var textBoxArray;


            function initialize() {
                view = document.getElementById('countLines');
            }

            function setScreenSize(screenSize) {
                scaleCoef = screenSize / _initialSize;
                if (textBoxArray) {
                    clearTimeout(timer);
                    clear();
                    update();
                }
            }

            function parseCSV(body) {
                var csv = parseBodyCSV(body);

                var dateBegin;
                var dateEnd;
                var values = [];
                var sumUp = 0;
                var sumDown = 0;
                var lines = csv.split('\r\n');

                var length = lines.length;
                if (length > 2) {
                    //Date des données
                    var dateValues = lines[0].split(',');
                    dateBegin = new Date(dateValues[0].substr(0, 4), dateValues[0].substr(4, 2) - 1, dateValues[0].substr(6, 2), dateValues[1].substr(0, 2), dateValues[1].substr(2, 2), 0,0);
                    dateEnd = new Date(dateValues[2].substr(0, 4), dateValues[2].substr(4, 2) - 1, dateValues[2].substr(6, 2), dateValues[3].substr(0, 2), dateValues[3].substr(2, 2), 0,0);

                    //Passe la première ligne (date des données)
                    for (var i = 1; i < length; i++) {
                        var elements = lines[i].split(',');
                        if (elements.length == 6) {
                            var upValue = parseInt(elements[4]);
                            var downValue = parseInt(elements[5]);
                            if (i < 3) { //Somme des deux premières lignes
                                sumUp += upValue;
                                sumDown += downValue;
                            }

                            values.push({ x1: parseInt(elements[0]), y1: parseInt(elements[1]), x2: parseInt(elements[2]), y2: parseInt(elements[3]), down:downValue, up:upValue });
                        }
                    }
                }

                return { begin: dateBegin, end: dateEnd, values: values, sumUp:sumUp, sumDown:sumDown };
            }

            function createLines(parts) {
                var lines = parts.values;
                //Creation des lignes
                for (var i = 0, length = lines.length; i < length; i++) {

                    var lineValue = lines[i];
                    if ((lineValue.x1 != lineValue.x2) || (lineValue.y1 != lineValue.y2)) { //Si la ligne existe
                        var line = document.createElementNS(svgns, 'line');

                        line.setAttributeNS(null, 'x1', lineValue.x1 * scaleCoef);
                        line.setAttributeNS(null, 'y1', lineValue.y1 * scaleCoef);
                        line.setAttributeNS(null, 'x2', lineValue.x2 * scaleCoef);
                        line.setAttributeNS(null, 'y2', lineValue.y2 * scaleCoef);
                        line.setAttributeNS(null, 'class', 'line'+i);

                        view.appendChild(line);

                        var croissant = (lineValue.x1 < lineValue.x2) ? ((lineValue.y1 < lineValue.y2) ? 1 : -1) : ((lineValue.y1 < lineValue.y2) ? -1 : 1);

                        var midX = ((lineValue.x1 + lineValue.x2) / 2) * scaleCoef;
                        var midY = ((lineValue.y1 + lineValue.y2) / 2) * scaleCoef;
                        var hypotenuseLength = Math.sqrt(Math.pow(lineValue.x1 - lineValue.x2, 2) + Math.pow(lineValue.y1 - lineValue.y2, 2));
                        var adjacentLength = Math.abs(lineValue.x1 - lineValue.x2);
                        var angle = ((Math.acos(adjacentLength / hypotenuseLength) * 180) / Math.PI) * croissant;

                        var textUp = document.createElementNS(svgns, 'text');

                        textUp.setAttributeNS(null, 'x', midX);
                        textUp.setAttributeNS(null, 'y', midY - 10);
                        textUp.setAttributeNS(null, 'class', 'text text'+i);
                        textUp.setAttributeNS(null, 'transform', 'rotate(' + Math.round(angle) + ',' + midX + ',' + midY + ')');
                        textUp.textContent = lineValue.up;

                        view.appendChild(textUp);

                        var textDown = document.createElementNS(svgns, 'text');

                        textDown.setAttributeNS(null, 'x', midX);
                        textDown.setAttributeNS(null, 'y', midY + 25);
                        textDown.setAttributeNS(null, 'class', 'text text'+i);
                        textDown.setAttributeNS(null, 'transform', 'rotate(' + Math.round(angle) + ',' + midX + ',' + midY + ')');
                        textDown.textContent = lineValue.down;

                        view.appendChild(textDown);                        
                    }
                }

                //Comptage dans l'aire délimitée par les lignes:
                var textCount = document.createElementNS(svgns, 'text');
                var pos = (_initialSize/2)* scaleCoef;
                var count = parts.sumDown - parts.sumUp;

                textCount.setAttributeNS(null, 'x', pos);
                textCount.setAttributeNS(null, 'y', pos);
                textCount.setAttributeNS(null, 'class', 'textCount');
                textCount.textContent = (count > 0) ? count : 0;

                view.appendChild(textCount);

                textBoxArray = view.getElementsByTagName('text');
            }

            function updateLines(parts) {

                var length = textBoxArray.length;
                if (length > 1) {
                    var lines = parts.values;

                    for (var i = 0, j = 0; i < length - 1; j++) {
                        if (j == 2) {

                            textBoxArray[i++].innerHTML = ( lines[j].up > 0)?lines[j].up:' ';
                            textBoxArray[i++].innerHTML = (lines[j].down > 0)?lines[j].down:' ';
                        }
                        else if( j == 3) {
                            textBoxArray[i++].innerHTML =  lines[j].up;
                            textBoxArray[i++].innerHTML =  lines[j].down;
                        }
                        else {
                            textBoxArray[i++].innerHTML = lines[j].up;
                            textBoxArray[i++].innerHTML = lines[j].down;
                        }
                    }

                    var count = parts.sumDown - parts.sumUp;

                    textBoxArray[length - 1].innerHTML = (count > 0) ? count : 0;
                }
            }

            function update() {
                var request = new XMLHttpRequest();
                var url =  location.origin + '/p360/pp_count';

                request.open('get', url, true);

                request.onload = function (e) {
                    var response = request.response;

                    var parts = parseCSV(response);

                    console.log(JSON.stringify(parts));

                    if (textBoxArray) {
                        //Rafraichissement des valeurs
                        updateLines(parts);
                    }
                    else {
                        createLines(parts);
                    }
                };

                request.onerror = function (e) {
                    console.log('error : ' + JSON.stringify(e));
                };

                request.send();

                timer = setTimeout(update, 10000);
            }

            function clear() {
                textBoxArray = null;
                while (view.firstChild) {
                    view.removeChild(view.firstChild);
                }
            }

            return {
                init: initialize,
                setScreenSize: setScreenSize,
                start: function () {
                    clearTimeout(timer);
                    clear();
                    update();
                },
                stop: function () {
                    clearTimeout(timer);
                    clear();
                }
            };
        })();
        //#endregion

        function initialize() {
            view = document.getElementById('globalCameraView');
            cameraView = document.getElementById('camera');

            heatMapModule.init();
            peoplesCountModule.init();

            heatMapModule.setScreenSize(view.clientWidth);
            peoplesCountModule.setScreenSize(view.clientWidth);
        }

        function setScreenSize(screenSize) {
            view.width.baseVal.value = screenSize;
            view.height.baseVal.value = screenSize;
            //view.style.width = screenSize;
            //view.style.height = screenSize;

            heatMapModule.setScreenSize(view.clientWidth);
            peoplesCountModule.setScreenSize(view.clientWidth);
        }

        function update() {
            var tmp = new Date();
            tmp = "?" + tmp.getTime();

            var imgUrl = urlView + tmp;

            var i = new Image();
            i.onload = function () {
                cameraView.setAttribute('xlink:href', imgUrl);
            }
            i.src = imgUrl;
        }
        
        return {
            init: initialize,
            setScreenSize:setScreenSize,
            startVideo: function () {
                intervalTimer = setInterval(update, fps);
            },
            stopVideo: function () {
                heatMapModule.stop();
                peoplesCountModule.stop();

                if (intervalTimer) {
                    clearInterval(intervalTimer);
                    intervalTimer = null;
                }
            },
            HeatMapTypeEnum:heatMapModule.TypeEnum,
            startHeatMap: heatMapModule.start,
            stopHeatMap: heatMapModule.stop,
            startPeoplesCount: peoplesCountModule.start,
            stopPeoplesCount:peoplesCountModule.stop
        };
    })();

    var resizeTimer = null;

    function getSize() {
        var width = window.innerWidth || html.clientWidth || body.clientWidth || screen.availWidth;
        var height = window.innerHeight || html.clientHeight || body.clientHeight || screen.availHeight;

        return Math.min(width, height);
    }

    function init() {
        camera360Module.init();
        // camera360Module.setScreenSize(getSize());

        // window.addEventListener('resize', function (event) {
        //     clearTimeout(resizeTimer);
        //     resizeTimer = setTimeout(function () {
        //         camera360Module.setScreenSize(getSize());
        //     }, 10);
        // }, true);

        camera360Module.startVideo();
        camera360Module.startPeoplesCount();
        camera360Module.startHeatMap(camera360Module.HeatMapTypeEnum.count);
    }

    document.addEventListener("DOMContentLoaded", init);

})();