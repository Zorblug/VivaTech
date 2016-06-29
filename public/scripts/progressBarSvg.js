'use strict';

var progressBar= {};


progressBar.create = function(element, progress)	{
var svg = d3.select(element).append("svg:svg")
      .attr("id", "progressBar");

/**********Fixed gradient for the contour*************/

var cartoucheGradient = svg.append("svg:defs")
      .append("svg:linearGradient")
      .attr({id:"cartoucheGradient", x1:"0", y1:"37", x2:"0", y2:"0"})
      .attr("gradientUnits", "userSpaceOnUse");

    cartoucheGradient.append("svg:stop")
      .attr("offset", "0%")
      .attr("stop-color", "#13A8A4")
      .attr("stop-opacity", 1);

    cartoucheGradient.append("svg:stop")
      .attr("offset", "100%")
      .attr("stop-color", "#007e7b")
      .attr("stop-opacity", 1);

/************Fixed gradient for the hole***************/

var backGradient = svg.append("svg:defs")
      .append("svg:linearGradient")
      .attr({id: "backGradient", x1: "0", y1: "30", x2: "0", y2: "0"})
      .attr("gradientUnits", "userSpaceOnUse");

    backGradient.append("svg:stop")
      .attr("offset", "0%")
      .attr("stop-color", "rgb(3,6,6)")
      .attr("stop-opacity", 1);

    backGradient.append("svg:stop")
      .attr("offset", "100%")
      .attr("stop-color", "rgb(3,26,31)")
      .attr("stop-opacity", 1);

/************Moving part gradient (reflect)**************/

var lightReflection = svg.append("svg:defs")
      .append("svg:linearGradient")
      .attr({id: "lightReflection", x1: "0", y1: "18", x2: "0", y2: "0"})
      .attr("gradientUnits", "userSpaceOnUse");

    lightReflection.append("svg:stop")
      .attr("offset", "0%")
      .attr("stop-color", "rgba(255,255,255,0.15)")
      .attr("stop-opacity", 1);

    lightReflection.append("svg:stop")
      .attr("offset", "100%")
      .attr("stop-color", "rgba(255,255,255,1)")
      .attr("stop-opacity", 1);

/********Moving part gradient (color gradient)**********/

var progressGradient = svg.append("svg:defs")
      .append("svg:linearGradient")
      .attr({id: "progressGradient", x1: "0", y1: "0", x2: "200", y2: "0"})
      .attr("gradientUnits", "userSpaceOnUse");

    progressGradient.append("svg:stop")
      .attr("offset", "0%")
      .attr("stop-color", "rgb(0,110,135)")
      .attr("stop-opacity", 1);



      progressGradient.append("svg:stop")
        .attr("offset", "100%")
        .attr("stop-color", "rgb(156,40,75)")
        .attr("stop-opacity", 1);

var aura = svg.append("svg:defs").append("filter")
            .attr("id", "drop-shadow");

        aura.append("feGaussianBlur")
            .attr("in", "SourceAlpha")
            .attr("stdDeviation", 5)
            .attr("result", "blur");

        aura.append("feOffset")
        .attr("in", "blur")
        .attr("dx", 2)
        .attr("dy", 2)
        .attr("result", "offsetBlur");

        var feMerge = aura.append("feMerge");

feMerge.append("feMergeNode")
    .attr("in", "offsetBlur");
feMerge.append("feMergeNode")
    .attr("in", "SourceGraphic");

    var innerBarWidth = 200, innerBarHeight = 15;
    var outerBarWidth = 212, outerBarHeight = 27;
    var reflectionWidth = 192, reflectionHeight = 9;
    var x = d3.scale.linear()
        .domain([0, 1])
        .range([0, innerBarWidth]);
    var reflection = progress*innerBarWidth - 8;

    var progressBar = d3.select("svg").attr("viewBox","0 0 "+214+" "+29+" ");

    var bar = progressBar.selectAll("g")
        .data(progress)
        .enter().append("g");

        bar.append("rect")
        .attr({ rx: "8.5", ry: "8.5", x:"1", y:"1", width: outerBarWidth, height: outerBarHeight})
        .style("fill", "url(#cartoucheGradient)");

        bar.append("rect")
        .attr({ rx: "5", ry: "5", x:"7", y:"7", width: innerBarWidth, height: innerBarHeight})
        .style("fill", "url(#backGradient)");

        bar.append("rect")
        .attr({ rx: "5", ry: "5", x:"7", y:"7", width: x, height: innerBarHeight})
        .attr("id", "progress")
        .style("fill", "url(#progressGradient)");

        // .style("filter", "url(#drop-shadow)");

        bar.append("rect")
        .attr({ rx: "5", ry: "5", x:"7", y:"7", width: x, height: innerBarHeight})
        .attr("id", "hash")
        .style("fill", "url(#hashPattern)");

        bar.append("rect")
        .attr({ rx: "3", ry: "3", x:"11", y:"8", width: reflection, height: reflectionHeight})
        .attr("id", "reflection")
        .style("fill", "url(#lightReflection)");
}
