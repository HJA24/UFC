// src/axes.js
import {setLocked, isLocked} from "./lock.js";
import {plotAggregatedMarginal} from "./marginals.js";

/**
 * Axis tick interactions (no hitboxes).
 * - Hover: highlight tick, dim non-matching row/column, and plot aggregated marginal
 *          only if there is at least one colored (feasible & value>0) cell on that tick.
 * - Click: LOCK and on the OPPOSITE axis:
 *          * italicize feasible opponent ticks
 *          * hide infeasible opponent ticks
 * - Dblclick: UNLOCK and restore all ticks & styles.
 *
 * Expects an `isFeasible(red, blue)` predicate from the caller.
 */
export function attachAxisHover({
                                    jointPlot,
                                    selector,            // ".x-axis .tick text" or ".y-axis .tick text"
                                    offsetAttr,          // "x" for x-axis labels, "y" for y-axis labels
                                    offsetVal,           // e.g., cellWidth/2 or -cellWidth/2
                                    isRed,               // true => x-axis (red), false => y-axis (blue)
                                    rows,                // flattened data for aggregates
                                    blueMarginal,        // SVG selection
                                    redMarginal,         // SVG selection
                                    margin, width, height,
                                    isFeasible           // function (r, b) => boolean
                                }) {
    // Ensure axes sit on top so tick labels receive pointer events
    jointPlot.select(".x-axis").raise();
    jointPlot.select(".y-axis").raise();

    // Nudge label text only (visual)
    const texts = jointPlot.selectAll(selector)
        .attr(offsetAttr, offsetVal)
        .style("pointer-events", "all");

    // Bind events on the parent <g.tick>
    const ticks = texts
        .select(function () {
            return this.parentNode;
        })
        .style("pointer-events", "all")
        .style("cursor", "pointer");

    function showTicks(selectedVal, isRed) {
        const r = +selectedVal;

        if (isRed) {
            // X-axis (red): show ONLY the selected value, italic
            jointPlot.selectAll(".x-axis .tick")
                .style("display", x => (+x === r ? null : "none"))
                .select("text")
                .style("font-style", x => (+x === r ? "italic" : null));

            // Y-axis (blue): show ONLY feasible opponent scores for this red, italicize them
            jointPlot.selectAll(".y-axis .tick")
                .style("display", y => (isFeasible(r, +y) ? null : "none"))
                .select("text")
                .style("font-style", y => (isFeasible(r, +y) ? "italic" : null));

        } else {
            const b = r; // selected blue

            // Y-axis (blue): show ONLY the selected value, italic
            jointPlot.selectAll(".y-axis .tick")
                .style("display", y => (+y === b ? null : "none"))
                .select("text")
                .style("font-style", y => (+y === b ? "italic" : null));

            // X-axis (red): show ONLY feasible opponent scores for this blue, italicize them
            jointPlot.selectAll(".x-axis .tick")
                .style("display", x => (isFeasible(+x, b) ? null : "none"))
                .select("text")
                .style("font-style", x => (isFeasible(+x, b) ? "italic" : null));
        }
    }

    function resetAllTicksVisibilityAndStyle() {
        jointPlot.selectAll(".x-axis .tick, .y-axis .tick")
            .style("display", null)
            .select("text")
            .style("font-style", null);
    }

    ticks
        .on("pointerover.axes", function (event, val) {
          if (isLocked()) return;
            d3.select(this).select("text").classed("highlight-tick", true);

            // Dim non-matching cells along the corresponding axis
            jointPlot.selectAll("rect")
                .classed("invisible", d => (isRed ? d.red !== val : d.blue !== val));

            // Check if there is at least one colored (feasible & >0) cell on this tick
            const axisRects = jointPlot.selectAll("rect")
                .filter(d => isRed ? d.red === val : d.blue === val);

            const hasColored = axisRects
                .filter(d => !d.infeasible && d.value > 0.0001)
                .size() > 0;

            if (!hasColored) {
                d3.selectAll(".kde").remove();
                return; // skip plotting aggregated marginal
            }
            showTicks(val, isRed);
            plotAggregatedMarginal({
                isRed,
                Y: val,
                flatData: rows,
                blueMarginal,
                redMarginal,
                margin, width, height,
                transitionDuration: 500
            });
        })
        .on("pointerout.axes", function () {
            if (isLocked()) return;
            jointPlot.selectAll(".x-axis .tick, .y-axis .tick")
              .style("display", null)
              .select("text").style("font-style", null);
            jointPlot.selectAll("rect").classed("invisible", false);
            d3.selectAll(".kde").remove();
        })
        .on("click.axes", (event, val) => {
            event.stopPropagation();
            setLocked(true);               // lock the state
        })
        .on("dblclick.axes", function () {
            d3.select(this).select("text").classed("highlight-tick", false);
            d3.selectAll(".kde").remove();
            setLocked(false);                // unlock state
            jointPlot.selectAll("rect").classed("invisible", false);
            jointPlot.selectAll(".x-axis .tick, .y-axis .tick")
              .style("display", null)
              .select("text").style("font-style", null);
        });
}
