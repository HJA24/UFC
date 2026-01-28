function decimalToMoneyline(odds) {
  const moneyline = odds >= 2
    ? (odds - 1) * 100
    : -100 / (odds - 1);

  return Math.round(moneyline);
}

function moneylineToDecimal(odds) {
  return odds > 0
    ? (odds / 100) + 1
    : (100 / Math.abs(odds)) + 1;
}