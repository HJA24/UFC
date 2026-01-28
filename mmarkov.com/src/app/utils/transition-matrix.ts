export interface TransitionMatrixJSON {
  states: Array<{
    description: string;
    id: number;
  }>;
  transitions: Record<string, Record<string, number>>;
}

export interface NormalizedTransitionMatrix {
  stateLabels: string[];          // index -> label (description)
  indexOf: Map<number, number>;   // stateId -> index
  P: number[][];
}

export function transitionMatrixFromJSON(json: TransitionMatrixJSON): NormalizedTransitionMatrix {
  const stateLabels: string[] = json.states.map((s) => s.description);

  const indexOf: Map<number, number> = new Map();
  json.states.forEach((s, i) => indexOf.set(s.id, i));

  const n: number = json.states.length;
  const P: number[][] = Array.from({ length: n }, () => Array(n).fill(0));

  for (const fromIdStr in json.transitions) {
    const i = indexOf.get(Number(fromIdStr))!;
    const row = json.transitions[fromIdStr];

    for (const toIdStr in row) {
      const j = indexOf.get(Number(toIdStr))!;
      P[i][j] = row[toIdStr];
    }
  }

  return { stateLabels, indexOf, P };
}
