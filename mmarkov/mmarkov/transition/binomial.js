export function binomialPMF(n, theta) {
    const pmf = [];
    for (let k = 0; k <= n; k++) {
        const coeff = binomialCoefficient(n, k);
        const prob = coeff * Math.pow(theta, k) * Math.pow(1 - theta, n - k);
        pmf.push({ k, prob });
    }
    return pmf;
}

function binomialCoefficient(n, k) {
    let coeff = 1;
    for (let i = 1; i <= k; i++) {
        coeff *= (n - (k - i)) / i;
    }
    return coeff;
}
