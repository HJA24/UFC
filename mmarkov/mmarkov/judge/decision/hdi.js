export function hdi(array, p) {
    const sorted = Array.from(array).flat().sort((a, b) => a - b);
    const n = sorted.length;
    const intervalIdxInc = Math.floor(p * n);
    const nIntervals = n - intervalIdxInc;
    let minIdx = 0;
    let minWidth = sorted[intervalIdxInc] - sorted[0];

    for (let i = 1; i < nIntervals; i++) {
        const width = sorted[i + intervalIdxInc] - sorted[i];
        if (width < minWidth) {
            minWidth = width;
            minIdx = i;
        }
    }

    const hdiMin = sorted[minIdx];
    const hdiMax = sorted[minIdx + intervalIdxInc];

    return [hdiMin, hdiMax];
}


export function hdis(array, ps) {
    const d = {};

    for (let i = 0; i < ps.length; i++) {
        const p = ps[i];
        const [hdiMin, hdiMax] = hdi(array, p);
        d[p] = [hdiMin, hdiMax];
    }

    return d;
}