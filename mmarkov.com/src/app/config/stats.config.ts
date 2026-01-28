import { Stats } from "../models/stats/stats.dto"
import { StatsCategory } from "../models/stats/stats-category";

export interface Stat {
  definition: Stats,
  category: StatsCategory;
  label: string;
}

export const STATS_CONFIG: readonly Stat[] = [
  {
    definition: "numberOfStrikesAttempted",
    category: "STRIKING",
    label: "number of strikes attempted"
  },
  {
    definition: "numberOfStrikesLanded",
    category: "STRIKING",
    label: "number of strikes landed"
  },
  {
    definition: "numberOfTakedownsLanded",
    category: "GRAPPLING",
    label: "number of takedowns landed"
  },
  {
    definition: "numberOfSubmissionAttempts",
    category: "GRAPPLING",
    label: "number of submission attempts"
  },
  {
    definition: "timeSpentInControl",
    category: "CONTROL",
    label: "time spent in control (seconds)"
  }
];
