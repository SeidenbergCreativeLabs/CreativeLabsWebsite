var w = window.innerWidth > 960 ? 960 :(window.innerWidth || 960),
	h = window.innerHeight > 500 ? 500 :(window.innerHeight || 500),
	radius = 5.25,
	links = [],
	simulate = true,
	zoomToAdd = true,
	// https://github.com/mbostock/d3/blob/master/lib/colorbrewer/colorbrewer.js#L105
	color = d3.scale.quantize().domain([10000, 7250]).range(["#29b2cf","#1296B3","#00728A"]);
 
var numVertices =(w*h)/ 3000;
var vertices = d3.range(numVertices).map(function(i){
	angle = radius *(i+10);
	return{x: angle*Math.cos(angle)+(w/2), y: angle*Math.sin(angle)+(h/2)};
});
var d3_geom_voronoi = d3.geom.voronoi().x(function(d){ return d.x; }).y(function(d){ return d.y; });
var prevEventScale = 1;
var zoom = d3.behavior.zoom().on("zoom", function(d,i){
	if(zoomToAdd){
		if(d3.event.scale > prevEventScale){
			angle = radius * vertices.length;
			vertices.push({x: angle*Math.cos(angle)+(w/2), y: angle*Math.sin(angle)+(h/2)});
		}else if(vertices.length > 2 && d3.event.scale != prevEventScale){
			vertices.pop();
		}
		force.nodes(vertices).start();
	}else{
		if(d3.event.scale > prevEventScale){
			radius += .01;
		}else{
			radius -= .01;
		}
		vertices.forEach(function(d, i){
			angle = radius *(i+10);
			vertices[i] ={x: angle*Math.cos(angle)+(w/2), y: angle*Math.sin(angle)+(h/2)};
		});
		force.nodes(vertices).start();
	}
	prevEventScale = d3.event.scale;
});

d3.select(window)
	.on("keydown", function(){
		// shift
		if(d3.event.keyCode == 16){
			zoomToAdd = false;
		}

		// s
		if(d3.event.keyCode == 83){
			simulate = !simulate;
			if(simulate){
				force.start();
			}else{
				force.stop();
			}
		}
	})
	.on("keyup", function(){
		zoomToAdd = true;
	});

var svg = d3.select("#chart")
			.append("svg")
			.attr("width", w)
			.attr("height", h)
			.call(zoom);

var force = d3.layout.force()
			.charge(-300)
			.size([w, h])
			.on("tick", update);

force.nodes(vertices).start();

var circle = svg.selectAll("circle");
var path = svg.selectAll("path");
var link = svg.selectAll("line");

function update(e){
	path = path.data(d3_geom_voronoi(vertices));
	path.enter().append("path")
		// drag node by dragging cell
		.call(d3.behavior.drag().on("drag", function(d, i){vertices[i] ={x: vertices[i].x + d3.event.dx, y: vertices[i].y + d3.event.dy};}))
		.style("fill", function(d, i){ return color(0)});
	path.attr("d", function(d){ return "M" + d.join("L")+ "Z"; })
		.transition().duration(150).style("fill", function(d, i){ return color(d3.geom.polygon(d).area())});
	path.exit().remove();

	// circle = circle.data(vertices)
	// circle.enter().append("circle")
	//			 .attr("r", 0)
	//			 .transition().duration(1000).attr("r", 5);
	// circle.attr("cx", function(d){ return d.x; })
	//			 .attr("cy", function(d){ return d.y; });
	// circle.exit().transition().attr("r", 0).remove();

	link = link.data(d3_geom_voronoi.links(vertices));
	link.enter().append("line");
	link.attr("x1", function(d){ return d.source.x; })
		.attr("y1", function(d){ return d.source.y; })
		.attr("x2", function(d){ return d.target.x; })
		.attr("y2", function(d){ return d.target.y; });

	link.exit().remove();

	if(!simulate)force.stop();
}