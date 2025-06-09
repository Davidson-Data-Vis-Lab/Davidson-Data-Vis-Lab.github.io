const courses= await d3.json("./data/cscources.json");
console.log(courses);

const chart = ForceGraph(courses, {
    nodeId: d => d.id,
    nodeGroup: d => d.group,
    nodeTitle: d => `${d.description}\n${d.group}`,
    linkStrokeWidth: l => Math.sqrt(l.value),
    width: 2000,
    height: 1000,
    linkDistance: 200,

  });

  console.log(chart);

const svg = document.querySelector('#container')
svg.appendChild(chart);

d3.select("button").on("click", () => {
  const inputId = d3.select("#txtName").node().value.trim();

  // Dispatch a custom event to trigger highlighting
  const evt = new CustomEvent("highlight-node", { detail: inputId });
  window.dispatchEvent(evt);
});
    




