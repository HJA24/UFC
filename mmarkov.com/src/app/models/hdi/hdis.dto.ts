import { HDI_CONFIG } from "../../config/hdi.config";
import { HDIDto } from "./hdi.dto";


export type Probability =
  `${typeof HDI_CONFIG[keyof typeof HDI_CONFIG]['level']}`;


export type HdisDto = Record<Probability, HDIDto>;
