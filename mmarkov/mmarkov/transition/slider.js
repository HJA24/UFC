import { invLogit } from './charts.js';


const redSlider = document.getElementById('redRange');
const blueSlider = document.getElementById('blueRange');

function updateSliderColor(slider, color) {
    const percent = (slider.value - slider.min) / (slider.max - slider.min) * 100;
    slider.style.background = `linear-gradient(to right, ${color} ${percent}%, #ddd ${percent}%)`;
}

// Compute delta and update point on chart
function updateDeltaAndPoint() {
    const blueVal = parseFloat(blueSlider.value);
    const redVal = parseFloat(redSlider.value);
    const deltaValue = blueVal - redVal;
    const y = invLogit(deltaValue);

    // Move the point in the chart
    d3.select('#current-point')
        .attr('cx', xScale(deltaValue))
        .attr('cy', yScale(y));
}

redSlider.addEventListener('input', function () {
    updateSliderColor(this, 'red');
    updateDeltaAndPoint();
});

blueSlider.addEventListener('input', function () {
    updateSliderColor(this, 'blue');
    updateDeltaAndPoint();
});


// Initial render
updateSliderColor(redSlider, 'red');
updateSliderColor(blueSlider, 'blue');
updateDeltaAndPoint();
