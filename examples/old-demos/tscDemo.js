///<reference path="exampleReference.ts" />
var TSCDemo;
(function (TSCDemo) {
    var svg = d3.select("#table");

    svg.attr("width", 480).attr("height", 320);

    var xScale = new Plottable.LinearScale();
    var xAxis = new Plottable.XAxis(xScale, "bottom");
    var xAxis2 = new Plottable.XAxis(xScale, "top");

    var yScale = new Plottable.LinearScale();
    var yAxis = new Plottable.YAxis(yScale, "left");
    var yAxis2 = new Plottable.YAxis(yScale, "right");

    var dataseries = makeRandomData(20);

    var renderAreaD1 = new Plottable.CircleRenderer(dataseries, xScale, yScale);
    var colorAccessor = function (d) {
        var r = Math.floor(d.x * 1000 % 255);
        var g = Math.floor(d.y * 1000 % 255);
        var b = r + g % 255;
        return d3.rgb(r, g, b).toString();
    };

    renderAreaD1.colorAccessor(colorAccessor);
    var basicTable = new Plottable.Table().addComponent(1, 0, yAxis).addComponent(1, 2, yAxis2).addComponent(1, 1, renderAreaD1).addComponent(2, 1, xAxis).addComponent(0, 1, xAxis2);

    basicTable.anchor(svg).computeLayout().render();
})(TSCDemo || (TSCDemo = {}));
