export interface MarketDto {
  marketId: number;
  marketURL: string;
  impliedProbabilityBid: number;
  impliedProbabilityAsk: number;
  sizeBid: number;
  sizeAsk: number;
  predictionId: number;
}
