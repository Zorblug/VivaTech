'use strict';

var dominoPartGraphic = {};

dominoPartGraphic.create = function(element, partArray, posX, posY, rotation, spacing)	{


	/********************Domino dimensions definition*************************/

	var dominoWidth = 200;
	var dominoHeight = 100;
	if (spacing)	{
			var dominoSpacing = 5;
	}
	else {
			var dominoSpacing = 0;
	}
	var dominoEdgeSpacing = 3;

	var barOuterWidth = 10;
	var barOuterHeight = 88;

	var barInnerWidth = 6;
	var barInnerHeight = 84;

	/************************Domino svg generation****************************/

	var viewboxWidth = dominoWidth+2*dominoSpacing;
	var viewboxHeight = dominoHeight+2*dominoSpacing;
	var dominoPartSvg = d3.select(element).append("g").attr("class", "dominoPart").attr("transform", "scale(0.7) translate("+posX+" "+posY+") rotate(" + rotation + " 55 105)");
						// .attr("viewBox","0 0 "+viewboxWidth+" "+viewboxHeight+" ")
						// .append("svg")

	/*********************Domino gradient definitions**************************/

	var edgeGradient = dominoPartSvg.append("svg:defs")
	                  .append("svg:linearGradient")
	                  .attr({id: "edgeGradient", x1: "0", y1: "0", x2: "30", y2: "100"})
	                  .attr("gradientUnits", "userSpaceOnUse");

              	    edgeGradient.append("svg:stop")
              	      .attr("offset", "0%")
              	      .attr("stop-color", "rgb(231,231,231)")
              	      .attr("stop-opacity", 1);

              	    edgeGradient.append("svg:stop")
              	      .attr("offset", "100%")
              	      .attr("stop-color", "rgb(180,181,183)")
              	      .attr("stop-opacity", 1);

	var partGradient = dominoPartSvg.select("defs")
	                    .append("svg:linearGradient")
	                    .attr({id: "partGradient", x1: "0", y1: "0", x2: "30", y2: "100"})
	                    .attr("gradientUnits", "userSpaceOnUse");

                	    partGradient.append("svg:stop")
                	      .attr("offset", "0%")
                	      .attr("stop-color", "rgb(254,254,254)")
                	      .attr("stop-opacity", 1);

                	    partGradient.append("svg:stop")
                	      .attr("offset", "100%")
                	      .attr("stop-color", "rgb(210,211,213)")
                	      .attr("stop-opacity", 1);

	var outerGradient = dominoPartSvg.select("defs")
	                    .append("svg:linearGradient")
	                    .attr({id: "outerGradient", x1: "0", y1: "0", x2: "1", y2: "1"});

                	    outerGradient.append("svg:stop")
                	    .attr("offset", "0%")
                	    .attr("stop-color", "rgb(140,140,140)")
                	    .attr("stop-opacity", 1);

                	    outerGradient.append("svg:stop")
                	    .attr("offset", "100%")
                	    .attr("stop-color", "rgb(255,255,255)")
                	    .attr("stop-opacity", 1);

	var innerGradient = dominoPartSvg.select("defs")
	                    .append("svg:linearGradient")
	                    .attr({id: "innerGradient", x1: "1", y1: "0", x2: "1.5", y2: "1"});

                	    innerGradient.append("svg:stop")
                	      .attr("offset", "0%")
                	      .attr("stop-color", "rgb(20,20,20)")
                	      .attr("stop-opacity", 1);

                	    innerGradient.append("svg:stop")
                	      .attr("offset", "100%")
                	      .attr("stop-color", "rgb(130,130,130)")
                	      .attr("stop-opacity", 1);

	/*******************Domino generic part generation*************************/

		var genericDominoPart = dominoPartSvg.append("g").attr("class", "genericDominoPart");

	  genericDominoPart.append("rect")
	  .attr({ rx: "12", ry: "12", x:dominoSpacing, y:dominoSpacing, width: dominoWidth, height: dominoHeight})
	  .style("fill", "url(#edgeGradient)");

	  genericDominoPart.append("rect")
	  .attr({ rx: "10", ry: "10", x: dominoSpacing+dominoEdgeSpacing, y: dominoSpacing+dominoEdgeSpacing, width: dominoWidth-2*dominoEdgeSpacing, height : dominoHeight-2*dominoEdgeSpacing})
	  .style("fill", "url(#partGradient)");

	  genericDominoPart.append("rect")
	  .attr({ rx: "5", ry: "5", x:"100", y:"11", width: barOuterWidth, height: barOuterHeight})
	  .style("fill", "url(#outerGradient)");

	  genericDominoPart.append("rect")
	  .attr({ rx: "3", ry: "3", x:"102", y:"13", width: barInnerWidth, height: barInnerHeight})
	  .style("fill", "url(#innerGradient)");

	/**************************Domino dot model********************************/

	var dot = dominoPartSvg.select("defs")
						.append("g")
						.attr("id", "dominoDot");

						dot.append("circle")
						.attr({ cx: "12", cy: "12", r:"12"})
						.style("fill", "url(#outerGradient)");

						dot.append("circle")
						.attr({ cx: "12", cy: "12", r:"10"})
						.style("fill", "url(#innerGradient)");

	/*******************Domino generic part generation*************************/
var offset;
var side;
for (var i = 0; i < partArray.length; i++) {
	if (i === 1) {
		offset = 100;
		side = genericDominoPart.append("g").attr('id','top');
	}
	else {
		offset = 0;
		side = genericDominoPart.append("g").attr('id','bottom');
	}

	switch (partArray[i]) {
		case 1 :
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 44, "y": 44});
			break;
		case 2 :
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 18, "y": 18});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 70, "y": 70});
			break;
		case 3 :
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 18, "y": 18});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 44, "y": 44});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 70, "y": 70});
			break;
		case 4 :
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 18, "y": 18});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 18, "y": 70});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 70, "y": 18});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 70, "y": 70});
			break;
		case 5 :
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 18, "y": 18});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 18, "y": 70});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 44, "y": 44});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 70, "y": 18});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 70, "y": 70});
		break;
		case 6 :
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 18, "y": 18});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 44, "y": 18});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 70, "y": 18});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 18, "y": 70});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 44, "y": 70});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 70, "y": 70});
		break;
		case 7 :
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 18, "y": 18});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 44, "y": 18});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 70, "y": 18});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 44, "y": 44});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 18, "y": 70});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 44, "y": 70});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 70, "y": 70});
		break;
		case 8 :
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 18, "y": 18});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 44, "y": 18});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 70, "y": 18});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 18, "y": 44});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 70, "y": 44});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 18, "y": 70});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 44, "y": 70});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 70, "y": 70});
		break;
		case 9 :
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 18, "y": 18});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 44, "y": 18});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 70, "y": 18});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 18, "y": 44});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 44, "y": 44});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 70, "y": 44});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 18, "y": 70});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 44, "y": 70});
		side.append("use")
			.attr("xlink:href","#dominoDot")
			.attr({"x": offset + 70, "y": 70});
		break;
		default:

	}

}

};

dominoPartGraphic.destroy = function(element)  {

};
