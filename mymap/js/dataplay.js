var qrread_data,
    playintro = false,
    nextindex = 0;

var width = 960,
    height = 800,
    radius = Math.min(width, height) / 2,
    color = d3.scale.category20();

var explain = [
    [" The labor force participation rate  is the percentage of working-age  persons in an economy who:  Are employed and Are unemployed  but looking for a job.  Typically 'working-age persons' is  defined as people between the ages  of 16-64. "], ["explaination part II. "]
];

//////function for QR //////
$(function(){
    
    $('#nextbtn').on('click', function(){
        //alert("click next button");
        if(!playintro){
            dataTitle();
            playintro = true;
        }
        nextindex++;
    });

    $('#reader').html5_qrcode(function(data){
        // 在reader标签实现数据
			$('#read').html(data);
            if(data!= "" && !playintro){
                qrread_data = data;
                dataTitle();
                playintro = true;
                console.log("Play introduction");
            }
		},
		function(error){
			$('#read_error').html(error);
		}, function(videoError){
			$('#vid_error').html(videoError);
		}
	);
});

function dataTitle(){
    
    var svg = d3.select("div.map").append("svg")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + width / 2 + "," + height * 0.5 + ")");
   
    //D3: 参考线
    svg.append("line").attr("x1", -width).attr("y1", 0).attr("x2", width).attr("y2", 0)
        .attr("stroke-width", 2)
        .attr("stroke", "lightgray");

    var partition = d3.layout.partition()
        .sort(d3.descending)
        .size([2 * Math.PI, radius * radius])
        .value(function(d) { return 1; });

    // Start the Angle from the top.
    var arc = d3.svg.arc()
        .startAngle(function(d) { return -(d.x)+Math.PI/2; })
        .endAngle(function(d) { return -(d.x + d.dx)+Math.PI/2; })
        .innerRadius(function(d) { return Math.sqrt(d.y); })
        .outerRadius(function(d) { return Math.sqrt(d.y + d.dy); });

    var _path;

    d3.json("../jsons/Gengaptitle.json", function(error, root) {
        var path = svg.datum(root).selectAll("path")
                .data(partition.nodes)
                .enter();

        var paths = path.append("path")
                .attr("opacity",0)
                .attr("display", function(d) { 
                    return d.depth ? null : "none"; }) // hide inner ring
                .style("stroke", "#fff")
                .style("fill", function(d) { 
                    return color((d.children ? d : d.parent).name); })
                .style("fill-rule", "evenodd")
                .attr("d",arc)
                .each(stash);

        paths.transition()
                .duration(2000)
                .delay( function(d,i){ return i*600;} )
                .attr("opacity",1)
                .attrTween("d", arcTweenTest);

        _path = paths;

        var title = path.append("text") 
                .attr("opacity",0)
                .style("font-size", function(d,i){
                    if(d.depth === 1){
                        return "16px";
                    }else if(d.depth === 0){ return "28px"; }
                    else{	return "14px"; }
                })
                .style("font-family", "PT Sans")
                .attr("text-anchor","middle")
                .text(function(d) { return d.name; })
                .call(wrap, 40);

        title.transition().duration(1500).delay(function(d,i){ return 10000+i*1000; })
            .attr("transform",function(d,i){
                //第一个元素（最中间的），只平移不旋转
                if( i == 0 ){
                    return "translate(" + arc.centroid(d) + ")";
                }
                var r = 0;
                if( -(d.x+d.dx/2)/Math.PI*180 > -1*180 )  // 0 - 180 度以内的
                    r = 180 * (-(d.x + d.dx / 2 - Math.PI / 2) / Math.PI);
                else if(-(d.x+d.dx/2)/Math.PI == - 1/2)
                    r = 0;
                else  // 180 - 360 度以内的d
                    r = - 180 * ((d.x + d.dx / 2 + Math.PI / 2) / Math.PI);

                //既平移也旋转
                //console.log(arc.centroid(d));
                return  "translate(" + arc.centroid(d) + ")" +
                        "rotate(" + r + ")";
            })
            .attr("opacity", 0.9);

     // size/count 按钮，改变状态时候的动画	
      d3.selectAll("input").on("change", function change(){

        var value = this.value === "count"
            ? function() { return 1; }
            : function(d) { return d.size; };

        paths.data(partition.value(value).nodes)
            .transition().duration(1500)
            .attrTween("d", arcTween);
         // console.log(partition.value(value).nodes);

        title.data(partition.value(value).nodes)
            .transition().duration(1500)
                .attr("transform",function(d,i){
                //第一个元素（最中间的），只平移不旋转
                if( i == 0 )
                    return "translate(" + [arc.centroid(d).x+100,arc.centroid(d).y] + ")";

                //其他的元素，既平移也旋转
                var r = 0;
                if( -(d.x+d.dx/2)/Math.PI*180 > -1*180 )  // 0 - 180 度以内的
                    r = 180 * (-(d.x + d.dx / 2 - Math.PI / 2) / Math.PI);
                else if(-(d.x+d.dx/2)/Math.PI == - 1/2)
                    r = 0;
                else  // 180 - 360 度以内的d
                    r = - 180 * ((d.x + d.dx / 2 + Math.PI / 2) / Math.PI);
                //既平移也旋转
                //console.log(arc.centroid(d));
                return  "translate(" + arc.centroid(d) + ")" +
                        "rotate(" + r + ")";
                })
                .attr("opacity", 0.9);
      });
    }); // d3.json
    
    d3.select("#nextbtn").on("click",function(){
        console.log("click next button: " + nextindex + " times");
        /*Create wrapper for center text*/
        var textCenter = svg.append("g")
            .attr("class", "explanationWrapper");
        
        /*Starting text middle top*/
        var middleTextTop = textCenter.append("text")
            .attr("class", "explanation")
            .attr("text-anchor", "middle")
            .attr("x", 0 + "px")
            .attr("y", -24*10/2 + "px")
            .attr("opacity", 1);
        
        if(nextindex == 2){
            console.log("add explain[0] to top" + explain[0]);
            middleTextTop.text(explain[0]).call(wrap, 350);
        }
        
    });
                            
// Stash the old values for transition.
function stash(d){
  d.x0 = d.x;
  d.dx0 = d.dx;
}

// NO one call this function !!
// Interpolate the arcs in data space.
function arcTween(a) {
  var i = d3.interpolate({x: a.x0, dx: a.dx0}, a);
  return function(t) {
    var b = i(t);
    a.x0 = b.x;
    a.dx0 = b.dx;
//		console.log(arc(b));
    return arc(b);
  };
}

function arcTweenTest(a) { // 开始时候的动画函数
  var i = d3.interpolate({x: a.x0, dx: 0}, a);
  return function(t) {
    var b = i(t);
    a.x0 = b.x;
    a.dx0 = b.dx;
    return arc(b);
  };
}

// 文字换行
function wrap(text, width) { 
    console.log(text);
    text.each(function() {
        var text = d3.select(this),
            words = text.text().split(/\s+\s/).reverse(),
            word,
            line = [],
            lineNumber = 0,
            lineHeight = 1.1, // ems
            y = text.attr("y"),
            dy = parseFloat(text.attr("dy")),
            tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em");

        while (word = words.pop()) {

          line.push(word);
          tspan.text(line.join(" "));
          if (tspan.node().getComputedTextLength() > width) {
            line.pop();
            tspan.text(line.join(" "));
            line = [word];
            tspan = text.append("tspan").attr("x", 0).attr("y", y)
                  .attr("dy","1em")
                  .text(word);
          }
        }
    });

}// 文字换行

d3.select(self.frameElement).style("height", height + "px");
}


