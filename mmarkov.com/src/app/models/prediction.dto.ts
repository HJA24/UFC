import { HDIDto } from './hdi.dto';

export interface PredictionDto {
  predictionId: number;
  predictionTypeId: number;
  fightId: number;
  hdis: HDIDto[];
}
