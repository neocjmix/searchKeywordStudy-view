var width = document.body.clientWidth;
var height = document.body.clientHeight;
var color = d3.scaleOrdinal(d3.schemeCategory10);

Promise.all([
    d3.csv("google_links.csv"),
    d3.csv("google_nodes.csv")
]).then(function([linksData, nodesData]) {
    const nodes = nodesData.slice();
    const nodeIndex = nodes.reduce((acc, node, i) => ({...acc, ...{[node.id] : i}}), {});
    const links = linksData.filter(link => nodeIndex[link.source] != null && nodeIndex[link.target] != null);

    var graph = {nodes, links};

    d3.forceSimulation(graph.nodes)
        .force("charge", d3.forceManyBody().strength(-3000))
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("x", d3.forceX(width / 2).strength(1))
        .force("y", d3.forceY(height / 2).strength(1))
        .force("link", d3.forceLink(graph.links).id(function(d) {return d.id; }).distance(50).strength(1))
        .on("tick", ticked);

    var adjlist = [];

    graph.links.forEach(function(d) {
        adjlist[d.source.index + "-" + d.target.index] = true;
        adjlist[d.target.index + "-" + d.source.index] = true;
    });

    var svg = d3.select("#viz").attr("width", width).attr("height", height);
    var container = svg.append("g");
    var transform = d3.zoomIdentity.translate(width / 2, height/2).scale(.1);
    var zoom = d3.zoom()
        .scaleExtent([.1, 4])
        .on("zoom", function() { container.attr("transform", d3.event.transform); });
    
    svg.call(zoom).call(zoom.transform, transform);
    container.attr("transform", transform);

    var link = container.append("g").attr("class", "links")
        .selectAll("line")
        .data(graph.links)
        .enter()
        .append("line")
        .attr("stroke", "#aaa")
        .attr("stroke-width", "1px");

    var node = container.append("g").attr("class", "nodes")
        .selectAll("g")
        .data(graph.nodes).enter()
        .append("g");

    node.append("circle")
        .attr("r", 5)
        .attr("fill", "black");

    node.append("text")
        .attr("dy", 20)
        .attr("dx", -20)
        .text(function(d){return d.id});

    function ticked() {
        node.call(updateNode);
        link.call(updateLink);
    }

    function fixna(x) {
        if (isFinite(x)) return x;
        return 0;
    }

    function updateLink(link) {
        link.attr("x1", function(d) { return fixna(d.source.x); })
            .attr("y1", function(d) { return fixna(d.source.y); })
            .attr("x2", function(d) { return fixna(d.target.x); })
            .attr("y2", function(d) { return fixna(d.target.y); });
    }

    function updateNode(node) {
        node.attr("transform", function(d) {
            return "translate(" + fixna(d.x) + "," + fixna(d.y) + ")";
        });
    }
});