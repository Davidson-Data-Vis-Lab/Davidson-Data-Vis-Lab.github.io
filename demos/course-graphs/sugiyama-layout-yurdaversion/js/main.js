console.log("main.js is running...");
import * as d3 from "https://cdn.skypack.dev/d3@7.8.4";
import * as d3dag from "https://cdn.skypack.dev/d3-dag@1.0.0-1";
const rawData = await d3.json("data/courses-inverted.json");
const builder = d3dag.graphStratify();
let graph;
try {
  graph = builder(rawData);
  console.log("Graph built successfully");
  console.log(graph);
} catch (err) {
  console.error("GraphStratify Error:", err);
  console.log("IDs passed to graphStratify:", rawData.map(d => d.id));
}
if (!graph) throw new Error("Graph layout failed due to invalid parentIds");
const nodeWidth = 120;
const nodeHeight = 50;
const nodeSize = [nodeWidth, nodeHeight];
const shape = d3dag.tweakShape(nodeSize, d3dag.shapeRect);
const line = d3.line()
  .curve(d3.curveMonotoneX)
  .x(d => d[1]) // y becomes x
  .y(d => d[0]); // x becomes y
const layout = d3dag.sugiyama()
  .nodeSize(nodeSize)
  .gap([50,200])
  .tweaks([shape]);
const { width, height } = layout(graph);
const arrowTransform = linkData => {
  const points = linkData.points.map(([x, y]) => [y, x]); // flip points
  const [[x1, y1], [x2, y2]] = points.slice(-2);
  const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI + 90;
  return `translate(${x2}, ${y2}) rotate(${angle})`;
};
const colorScale = d3.scaleOrdinal()
  .domain(["core", "starter", "math1", "applications", "systems", "theory"])
  .range(d3.schemeSet2);
const svg = d3.select("#svg")
  .style("width", height + 4)
  .style("height", width + 4);
const trans = svg.transition().duration(750);
svg.select("#nodes")
  .selectAll("g")
  .data(graph.nodes())
  .join(enter => {
    const g = enter.append("g")
      .attr("transform", ({ x, y }) => `translate(${y}, ${x})`) // :point_left: rotate layout
      .attr("opacity", 0);
    g.append("rect")
      .attr("x", -nodeWidth / 2)
      .attr("y", -nodeHeight / 2)
      .attr("width", nodeWidth)
      .attr("height", nodeHeight)
      .attr("rx", 8)
      .attr("fill", d => colorScale(d.data.group || "core"));
    g.append("text")
      .attr("class", "node-label")
      .attr("text-anchor", "middle")
      .attr("alignment-baseline", "middle")
      .text(d => d.data.id);
    g.transition(trans).attr("opacity", 1);
  });
svg.select("#links")
  .selectAll("path")
  .data(graph.links())
  .join(enter =>
    enter.append("path")
      .attr("d", ({ points }) => line(points))
      .attr("fill", "none")
      .attr("stroke-width", 3)
      .attr("stroke", "red")
      .attr("opacity", 0.5)
      .call(enter => enter.transition(trans).attr("opacity", 1))
  );
const arrowSize = 80;
const arrowLen = Math.sqrt((4 * arrowSize) / Math.sqrt(3));
const arrow = d3.symbol().type(d3.symbolTriangle).size(arrowSize);
svg.select("#arrows")
  .selectAll("path")
  .data(graph.links())
  .join(enter =>
    enter.append("path")
      .attr("d", arrow)
      .attr("fill", "red")
      .attr("transform", arrowTransform)
      .attr("opacity", 0)
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      .attr("stroke-dasharray", `${arrowLen},${arrowLen}`)
      .call(enter => enter.transition(trans).attr("opacity", 1))
  );





