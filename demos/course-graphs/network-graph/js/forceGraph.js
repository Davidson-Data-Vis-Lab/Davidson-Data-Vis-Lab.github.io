// Copyright 2021-2024 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/force-directed-graph
function ForceGraph({
    nodes,
    links
  }, {
    nodeId = d => d.id,
    nodeGroup,
    nodeGroups,
    nodeTitle,
    nodeFill = "currentColor",
    nodeStroke = "green",
    nodeStrokeWidth = 1.5,
    nodeStrokeOpacity = 1,
    nodeRadius = 5,
    nodeStrength,
    linkSource = ({source}) => source,
    linkTarget = ({target}) => target,
    linkStroke = "#999",
    linkStrokeOpacity = 0.6,
    linkStrokeWidth = 1.5,
    linkStrokeLinecap = "round",
    linkStrength,
    linkDistance,
    colors = d3.schemeTableau10,
    width = 640,
    height = 400,
    invalidation
  } = {}) {

    const N = d3.map(nodes, nodeId).map(intern);
    const R = typeof nodeRadius !== "function" ? null : d3.map(nodes, nodeRadius);
    const LS = d3.map(links, linkSource).map(intern);
    const LT = d3.map(links, linkTarget).map(intern);
    if (nodeTitle === undefined) nodeTitle = (_, i) => N[i];
    const T = nodeTitle == null ? null : d3.map(nodes, d => d.id);
    const tooltipText = nodeTitle == null ? null : d3.map(nodes, nodeTitle);
    const labelText = d3.map(nodes, d => d.id);

    const G = nodeGroup == null ? null : d3.map(nodes, nodeGroup).map(intern);
    const W = typeof linkStrokeWidth !== "function" ? null : d3.map(links, linkStrokeWidth);
    const L = typeof linkStroke !== "function" ? null : d3.map(links, linkStroke);




    nodes = d3.map(nodes, (_, i) => ({id: N[i]}));
    links = d3.map(links, (_, i) => ({source: LS[i], target: LT[i]}));

    if (G && nodeGroups === undefined) nodeGroups = d3.sort(G);
    const color = nodeGroup == null ? null : d3.scaleOrdinal(nodeGroups, colors);

    const forceNode = d3.forceManyBody();
    const forceLink = d3.forceLink(links)
        .id(({index: i}) => N[i])
        .strength(0.05);

    if (linkDistance !== undefined) forceLink.distance(linkDistance);
    if (nodeStrength !== undefined) forceNode.strength(nodeStrength);
    if (linkStrength !== undefined) forceLink.strength(linkStrength);

    const simulation = d3.forceSimulation(nodes)
        .force("link", forceLink)
        .force("charge", forceNode)
        .force("center", d3.forceCenter())
        .on("tick", ticked);

    const svg = d3.create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [-width / 2, -height / 2, width, height])
        .attr("style", "max-width: 100%; height: auto; height: intrinsic;");

    svg.append("defs")
        .append("marker")
        .attr("id","arrowhead")
        .attr("viewBox","-0 -5 10 10")
        .attr("refX",20)
        .attr("refY",0)
        .attr("orient","auto")
        .attr("markerWidth",13)
        .attr("markerHeight",13)
        .attr("xoverflow","visible")
        .append("path")
        .attr("d", "M 0,-5 L 10 ,0 L 0,5")
        .attr("fill", "#999")
        .style("stroke","none");

    const link = svg.append("g")
        .attr("stroke", typeof linkStroke !== "function" ? linkStroke : null)
        .attr("stroke-opacity", linkStrokeOpacity)
        .attr("stroke-width", typeof linkStrokeWidth !== "function" ? linkStrokeWidth : null)
        .attr("stroke-linecap", linkStrokeLinecap)
        .selectAll("line")
        .data(links)
        .join("line")
        .attr("marker-end", "url(#arrowhead)");

    const node = svg.append("g")
        .selectAll("g")
        .data(nodes)
        .join("g")
        .call(drag(simulation));

    const nodeWidth = 100;
    const nodeHeight = 60;

    node.append("rect")
        .attr("x", d => {
        const w = d.id.length > 30
            ? nodeWidth * 4
            : d.id.length > 10
            ? nodeWidth * 3
            : nodeWidth;
        return -w / 2;
        })
        .attr("y", -nodeHeight / 2)
        .attr("width", (d)=>{
            if(d.id.length>30){
                return nodeWidth*4;
            }
            else if(d.id.length>10){
                return nodeWidth*3;
            }
            else{
                return nodeWidth;
            }
        })
        .attr("height", nodeHeight)
        .attr("fill", ({index: i}) => G ? color(G[i]) : nodeFill)
        .attr("stroke", nodeStroke)
        .attr("stroke-opacity", nodeStrokeOpacity)
        .attr("stroke-width", nodeStrokeWidth);

    node.append("text")
        .text(({index: i}) => labelText[i])
        .attr("x", 0)
        .attr("y", 0)
        .attr("text-anchor", "middle")
        .attr("font-size", 20)
        .attr("fill", "#333")
        .attr("font-weight", "600")
        .attr("pointer-events", "none");

    
    window.addEventListener("highlight-node", (e) => {
    const inputId = e.detail;

    // Step 1: Find the node that matches the input (partial, case-insensitive)
    const matchedNode = nodes.find(d =>
        d.id.toLowerCase().includes(inputId.toLowerCase())
    );

    if (!matchedNode) return; // no match

    // Step 2: Get all descendants
    const descendants = getAncestors(matchedNode.id);

    // Step 3: Reset all styles
    link.attr("stroke-opacity", 0.1).attr("stroke", "#999");
    node.attr("opacity", 0.1);
    node.select("rect")
        .attr("stroke", nodeStroke)
        .attr("stroke-width", nodeStrokeWidth);

    // Step 4: Highlight matching node
    node.filter(d => d.id === matchedNode.id)
        .attr("opacity", 1)
        .select("rect")
        .attr("stroke", "red")
        .attr("stroke-width", 3);

    // Step 5: Highlight descendants
    link.filter(l => descendants.has(l.source.id) && descendants.has(l.target.id))
        .attr("stroke-opacity", 1)
        .attr("stroke", "blue");

    node.filter(d => descendants.has(d.id))
        .attr("opacity", 1);
    });


    if (tooltipText) {
        node.append("title")
            .text(({index: i}) => tooltipText[i]);
    }

    if (W) link.attr("stroke-width", ({index: i}) => W[i]);
    if (L) link.attr("stroke", ({index: i}) => L[i]);
    if (G) node.attr("fill", ({index: i}) => color(G[i]));
    if (R) node.attr("r", ({index: i}) => R[i]);
    if (T) node.append("title").text(({index: i}) => T[i]);
    if (invalidation != null) invalidation.then(() => simulation.stop());

    const adjacencyMap = new Map();
    links.forEach(link => {
        if (!adjacencyMap.has(link.target.id)) adjacencyMap.set(link.target.id, []);
        adjacencyMap.get(link.target.id).push(link.source.id);
    });

    function getAncestors(nodeId, visited = new Set()) {
        if (visited.has(nodeId)) return;
        visited.add(nodeId);
        const sources = adjacencyMap.get(nodeId) || [];
        sources.forEach(src => getAncestors(src, visited));
        return visited;
    }

    node.on("click", (event, d) => {
        const highlighted = getAncestors(d.id);
        link.attr("stroke-opacity", 0.1).attr("stroke", "#999");
        node.attr("opacity", 0.1);
        link.filter(l => highlighted.has(l.source.id) && highlighted.has(l.target.id))
            .attr("stroke-opacity", 1)
            .attr("stroke", "red");
        node.filter(d => highlighted.has(d.id))
            .attr("opacity", 1);
    });


    svg.on("click", (event) => {
        if (event.target.tagName === "svg") {
            link.attr("stroke-opacity", 0.6).attr("stroke", "#999");
            node.attr("opacity", 1);
        }
    });
    svg.on("click", (event) => {
  // Only reset if user clicked directly on the background (not a node or link)
    if (event.target.tagName === "svg") {
        link.attr("stroke-opacity", 0.6).attr("stroke", "#999");
        node.attr("opacity", 1);
     

    // Optionally, reset custom stroke styles on rects
    node.select("rect")
      .attr("stroke", nodeStroke)
      .attr("stroke-width", nodeStrokeWidth);
    }
    });


    function intern(value) {
        return value !== null && typeof value === "object" ? value.valueOf() : value;
    }

    function ticked() {
        link
            .attr("x1", d => d.source.x)
            .attr("y1", d => d.source.y)
            .attr("x2", d => d.target.x)
            .attr("y2", d => d.target.y);
        node.attr("transform", d => `translate(${d.x},${d.y})`);
    }

    function drag(simulation) {
        function dragstarted(event) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            event.subject.fx = event.subject.x;
            event.subject.fy = event.subject.y;
        }
        function dragged(event) {
            event.subject.fx = event.x;
            event.subject.fy = event.y;
        }
        function dragended(event) {
            if (!event.active) simulation.alphaTarget(0);
        }
        return d3.drag().on("start", dragstarted).on("drag", dragged).on("end", dragended);
    }

    return Object.assign(svg.node(), {scales: {color}});

}