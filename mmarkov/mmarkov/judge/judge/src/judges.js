import * as d3 from "https://cdn.jsdelivr.net/npm/d3@7/+esm";

function loadJudgeDropdowns(dropdownIds, csvPath = "judges.csv") {
  d3.csv(csvPath).then(data => {
    const names = Array.from(new Set(data.map(d => d.name)));
    dropdownIds.forEach(id => {
      const select = d3.select(id);
      names.forEach(name => {
        select.append("option")
              .attr("value", name)
              .text(name);
      });
    });
  }).catch(error => {
    console.error("Error loading judges.csv:", error);
  });
}

loadJudgeDropdowns(["#judge1", "#judge2", "#judge3"]);
