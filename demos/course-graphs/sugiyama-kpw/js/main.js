console.log("main.js is running...");
/**
 * Based on Erik Brinkman's https://codepen.io/brinkbot/pen/oNQwNRv
 * 
 * 
 */

import * as d3 from "https://cdn.skypack.dev/d3@7.8.4";
import * as d3dag from "https://cdn.skypack.dev/d3-dag@1.0.0-1";

const data = await d3.json("data/courses-inverted.json");

/**
 * Create clusters based on identical prerequisites
 */
function createClusters(originalData) {
    // Group nodes by their prerequisite signature
    const prereqGroups = d3.group(originalData, d => {
        // Create a sorted string key of prerequisites
        const prereqs = d.parentIds || [];
        return prereqs.sort().join(',') || 'NO_PREREQS';
    });
    console.log(prereqGroups);
    // katy check here for groups w/370 and 371 (have proof and data structures as PRQ not just DS)

    const clusteredData = [];
    let clusterIdCounter = 0;
    
    for (const [prereqKey, nodesWithSamePrereqs] of prereqGroups) {
        if (prereqKey === 'NO_PREREQS') {
            // Don't cluster courses with no prerequisites - add each individually
            for (const node of nodesWithSamePrereqs) {
                clusteredData.push(node);
            }
        } else if (nodesWithSamePrereqs.length === 1) {
            // Single node with prerequisites - keep as-is
            clusteredData.push(nodesWithSamePrereqs[0]);
        } else {
            // Multiple nodes with same prerequisites - only cluster if 300+ level
            const nodeLevel = getNodeLevel(nodesWithSamePrereqs[0]);
            const courseNumber = parseInt(nodesWithSamePrereqs[0].id.match(/\d+/)?.[0] || "0");
            
            if (courseNumber >= 300) {
                // Create a cluster for 300+ level courses
                const clusterId = `CLUSTER_${clusterIdCounter++}`;
                const clusterNode = {
                    id: clusterId,
                    parentIds: nodesWithSamePrereqs[0].parentIds || [],
                    isCluster: true,
                    clusterMembers: nodesWithSamePrereqs.map(n => n.id),
                    clusterSize: nodesWithSamePrereqs.length,
                    // Add level information for grouping
                    level: nodeLevel,
                    prereqSignature: prereqKey
                };
                clusteredData.push(clusterNode);
            } else {
                // Below 300 level - add each node individually
                for (const node of nodesWithSamePrereqs) {
                    clusteredData.push(node);
                }
            }
        }
    }
    
    console.log("Clustered data:", clusteredData);
    console.log("Clusters created:", clusteredData.filter(d => d.isCluster));
    
    return clusteredData;
}

/**
 * Get course level (100, 200, 300, 400+)
 */
function getNodeLevel(node) {
    const courseNumber = parseInt(node.id.match(/\d+/)?.[0] || "0");
    if (courseNumber >= 400) return "400+";
    if (courseNumber >= 300) return "300";
    if (courseNumber >= 200) return "200";
    if (courseNumber >= 100) return "100";
    return "Other";
}


/**
  * Group assignment for visual styling
 */
function assignNodeGroup(node) {
    if (node.data.isCluster) {
        return `${node.data.level}-level Cluster (${node.data.clusterSize} courses)`;
    }
    
    const courseId = node.data.id;
    
    // Group by course prefix
    if (courseId.startsWith("CSC")) return "Computer Science";
    if (courseId.startsWith("MAT")) return "Mathematics";
    if (courseId.startsWith("PHY")) return "Physics";
    if (courseId.startsWith("DIG")) return "Digital Studies";
    
    // Group by level
    const level = getNodeLevel(node.data);
    return `${level}-level Courses`;
}


/**
 * Arrow transform function
 */
function arrowTransform(linkData) {
    const points = linkData.points;
    const lastTwoPoints = points.slice(-2);
    const [x1, y1] = lastTwoPoints[0];
    const [x2, y2] = lastTwoPoints[1];
    
    const angle = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI + 90;
    return `translate(${x2}, ${y2}) rotate(${angle})`;
}

// -------------- //
// Compute Layout //
// -------------- //
var clusteredData = createClusters(data);

// create our builder and turn the raw data into a graph
const builder = d3dag.graphStratify();
const graph = builder(clusteredData);

console.log(graph);
// set the layout functions
const baseNodeRadius = 30;
const nodeSize = [baseNodeRadius * 2, baseNodeRadius * 2];
const shape = d3dag.tweakShape(nodeSize, d3dag.shapeEllipse);
const line = d3.line().curve(d3.curveMonotoneY);


// here's the layout operator, uncomment some of the settings
const layout = d3dag
    .sugiyama()
    .layering(d3dag.layeringSimplex())
    .nodeSize(nodeSize)
    .gap([baseNodeRadius, baseNodeRadius])
    .tweaks([shape]);

// actually perform the layout and get the final size
const { width, height } = layout(graph);
// --------- //
// Rendering //
// --------- //


// Create group-based colors
const groups = [...new Set([...graph.nodes()].map(assignNodeGroup))];
const groupColorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(groups);
const colorMap = new Map(
    [...graph.nodes()].map((node) => [
        node.data.id, 
        groupColorScale(assignNodeGroup(node))
    ])
);

// global
const svg = d3
  .select("#svg")
  // pad a little for link thickness
  .style("width", width + 4)
  .style("height", height + 40);
const trans = svg.transition().duration(550);


// Create legend
// Create legend
const legend = svg.append("g")
    .attr("class", "legend")
    .attr("transform", `translate(20, 20)`);

legend.selectAll(".legend-item")
    .data(groups)
    .join("g")
    .attr("class", "legend-item")
    .attr("transform", (d, i) => `translate(0, ${i * 20})`)
    .style("cursor", "pointer")
    .call(g => {
        g.append("rect")
            .attr("x", -6)
            .attr("y", -6)
            .attr("width", 12)
            .attr("height", 12)
            .attr("fill", d => groupColorScale(d))
            .attr("stroke", "white")
            .attr("stroke-width", 1);
        
        g.append("text")
            .attr("x", 12)
            .attr("y", 0)
            .attr("dy", "0.35em")
            .style("font-family", "sans-serif")
            .style("font-size", "10px")
            .style("fill", "#333")
            .text(d => d);
    });


// Track highlighted groups
let highlightedGroups = new Set();

function toggleGroupHighlight(groupName) {
    if (highlightedGroups.has(groupName)) {
        highlightedGroups.delete(groupName);
    } else {
        highlightedGroups.add(groupName);
    }
    updateHighlighting();
}

function updateHighlighting() {
    const hasHighlights = highlightedGroups.size > 0;
    
    svg.selectAll("#nodes g")
        .transition()
        .duration(300)
        .attr("opacity", d => {
            if (!hasHighlights) return 1;
            return highlightedGroups.has(assignNodeGroup(d)) ? 1 : 0.2;
        });
    
    svg.selectAll("#links path")
        .transition()
        .duration(300)
        .attr("opacity", d => {
            if (!hasHighlights) return 0.7;
            const sourceGroup = assignNodeGroup(d.source);
            const targetGroup = assignNodeGroup(d.target);
            return (highlightedGroups.has(sourceGroup) || highlightedGroups.has(targetGroup)) ? 0.7 : 0.1;
        });
    
    svg.selectAll("#arrows path")
        .transition()
        .duration(300)
        .attr("opacity", d => {
            if (!hasHighlights) return 1;
            return highlightedGroups.has(assignNodeGroup(d.target)) ? 1 : 0.1;
        });
}

    

// Render nodes with different styles for clusters
svg.select("#nodes")
    .selectAll("g")
    .data(graph.nodes())
    .join(enter =>
        enter.append("g")
            .attr("transform", ({ x, y }) => `translate(${x}, ${y})`)
            .attr("opacity", 0)
            .style("cursor", "pointer")
            .call(enter => {
                // Different rendering for clusters vs individual nodes
                enter.each(function(d) {
                    const g = d3.select(this);
                    const isCluster = d.data.isCluster;
                    const nodeRadius = baseNodeRadius;
                    
                    if (isCluster) {
                        // Cluster node - larger rectangle with dashed border
                        const rectWidth = nodeRadius * 2.2;
                        const courseCount = d.data.clusterMembers.length;
                        const lineHeight = 12; // Height per course line
                        const padding = 8; // Top and bottom padding
                        const rectHeight = (courseCount * lineHeight) + padding;
                        
                        
                        g.append("rect")
                            .attr("x", -(rectWidth + 8) / 2)
                            .attr("y", -(rectHeight + 8) / 2)
                            .attr("width", rectWidth + 8)
                            .attr("height", rectHeight + 8)
                            .attr("rx", 8)
                            .attr("ry", 8)
                            .attr("fill", "none")
                            .attr("stroke", colorMap.get(d.data.id))
                            .attr("stroke-width", 2)
                            .attr("stroke-dasharray", "5,3");
                        
                        g.append("rect")
                            .attr("x", -rectWidth / 2)
                            .attr("y", -rectHeight / 2)
                            .attr("width", rectWidth)
                            .attr("height", rectHeight)
                            .attr("rx", 6)
                            .attr("ry", 6)
                            .attr("fill", colorMap.get(d.data.id))
                            .attr("stroke", "white")
                            .attr("stroke-width", 3);
                        
                        // Cluster size indicator
                        const textGroup = g.append("g");
                        d.data.clusterMembers.forEach((courseName, index) => {
                            textGroup.append("text")
                                .text(courseName)
                                .attr("x", 0)
                                .attr("y", -(rectHeight/2) + padding/2 + (index * lineHeight) + lineHeight/2)
                                .attr("font-weight", "bold")
                                .attr("font-family", "sans-serif")
                                .attr("font-size", "9px")
                                .attr("text-anchor", "middle")
                                .attr("alignment-baseline", "middle")
                                .attr("fill", "white")
                                .style("pointer-events", "none");
                        });
                        
                    } else {
                        // Individual node - rectangle
                        const rectWidth = nodeRadius * 2.2;
                        const rectHeight = nodeRadius * 1.4;
                        
                        g.append("rect")
                            .attr("x", -rectWidth / 2)
                            .attr("y", -rectHeight / 2)
                            .attr("width", rectWidth)
                            .attr("height", rectHeight)
                            .attr("rx", 6)
                            .attr("ry", 6)
                            .attr("fill", colorMap.get(d.data.id))
                            .attr("stroke", "white")
                            .attr("stroke-width", 2);
                        
                        g.append("text")
                            .text(d.data.id)
                            .attr("font-weight", "bold")
                            .attr("font-family", "sans-serif")
                            .attr("font-size", "8px")
                            .attr("text-anchor", "middle")
                            .attr("alignment-baseline", "middle")
                            .attr("fill", "white")
                            .style("pointer-events", "none");
                    }
                    
                    // Tooltip for all nodes
                    g.append("title")
                        .text(d => {
                            if (d.data.isCluster) {
                                return `Cluster: ${d.data.clusterSize} courses\nCourses: ${d.data.clusterMembers.join(', ')}\nPrerequisites: ${d.data.parentIds?.join(', ') || 'None'}`;
                            } else {
                                return `Course: ${d.data.id}\nGroup: ${assignNodeGroup(d)}\nPrerequisites: ${d.data.parentIds?.join(', ') || 'None'}`;
                            }
                        });
                });
                
                enter.transition(trans).attr("opacity", 1);
            })
            .on("click", function(event, d) {
                toggleGroupHighlight(assignNodeGroup(d));
            })
    );


// link paths
svg
  .select("#links")
  .selectAll("path")
  .data(graph.links())
  .join((enter) =>
    enter
      .append("path")
      .attr("d", ({ points }) => line(points))
      .attr("fill", "none")
      .attr("stroke-width", 3)
      .attr( "stroke", "black")
      .attr("opacity", 0)
      .call((enter) => enter.transition(trans).attr("opacity", 0.7))
  );

// Arrows
const arrowSize = 80;
const arrowLen = Math.sqrt((4 * arrowSize) / Math.sqrt(3));
const arrow = d3.symbol().type(d3.symbolTriangle).size(arrowSize);
svg
  .select("#arrows")
  .selectAll("path")
  .data(graph.links())
  .join((enter) =>
    enter
      .append("path")
      .attr("d", arrow)
      .attr("fill",  "black") //({ target }) => colorMap.get(target.data.id)!)
      .attr("transform", arrowTransform)
      .attr("opacity", 0.7)
      .attr("stroke", "white")
      .attr("stroke-width", 2)
      // use this to put a white boundary on the tip of the arrow
      .attr("stroke-dasharray", `${arrowLen},${arrowLen}`)
      .call((enter) => enter.transition(trans).attr("opacity", 1))
  );
