export function gaussianKernel(sigma) {
    const invS = 1 / sigma;
    const norm = invS / Math.sqrt(2 * Math.PI);
    const c = -0.5 * invS * invS;

    return (u) => norm * Math.exp(c * u * u);
}

export function kernelDensityEstimator(kernel, xVals) {
    return function (samples = []) {
        const n = samples.length;
        if (!n) return xVals.map(x => ({x, y: 0}));

        return xVals.map(x => {
            let sum = 0;
            for (let i = 0; i < n; i++) sum += kernel(x - samples[i]);
              return {x, y: sum / n};
        });
    };
}