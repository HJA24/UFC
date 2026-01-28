import { Component, Input, Output, EventEmitter, ElementRef, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatChipsModule } from '@angular/material/chips';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-markov-chain-simulator',
  standalone: true,
  imports: [
    CommonModule,
    MatChipsModule,
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  templateUrl: './markov-chain-simulator.component.html',
  styleUrl: './markov-chain-simulator.component.css',
})
export class MarkovChainSimulatorComponent {
  @ViewChild('stateList') stateListRef!: ElementRef<HTMLDivElement>;

  @Input({ required: true }) Q!: (number | string)[][];
  @Input({ required: true }) R!: (number | string)[][];
  @Input({ required: true }) labels!: string[];

  @Output() highlightCellChange = new EventEmitter<{ i: number; j: number } | null>();
  @Output() isSimulatingChange = new EventEmitter<boolean>();

  simulationStates: number[] = [];
  isAbsorbed = false;
  isSimulating = signal(false);
  private simulationInterval: any = null;

  private readonly STANDING_STATE = 0;

  get currentStateIndex(): number {
    return this.simulationStates.length > 0
      ? this.simulationStates[this.simulationStates.length - 1]
      : 0;
  }

  private buildFullMatrix(): number[][] {
    // P[i][j] = P(to i | from j), columns sum to 1
    // Q: n×n, R: m×n, O: n×m, I: m×m
    const n = this.Q.length;
    const m = this.R.length;

    const O = Array.from({ length: n }, () => Array(m).fill(0));
    const I = Array.from({ length: m }, (_, i) =>
      Array.from({ length: m }, (_, j) => (i === j ? 1 : 0))
    );

    return [
      ...this.Q.map((row, i) => [...row.map(v => Number(v)), ...O[i]]),
      ...this.R.map((row, i) => [...row.map(v => Number(v)), ...I[i]]),
    ];
  }

  private sampleNextState(currentState: number): number {
    const matrix = this.buildFullMatrix();
    const random = Math.random();
    let cumulative = 0;

    // P[i][j] = P(to i | from j), so read column currentState
    for (let nextState = 0; nextState < matrix.length; nextState++) {
      cumulative += matrix[nextState][currentState];
      if (random < cumulative) {
        return nextState;
      }
    }
    return currentState;
  }

  private isAbsorbingState(stateIndex: number): boolean {
    const n = this.Q.length;
    return stateIndex >= n;
  }

  private emitHighlightCell(): void {
    if (this.simulationStates.length < 2) {
      this.highlightCellChange.emit(null);
      return;
    }
    const currentState = this.simulationStates[this.simulationStates.length - 1];

    // If absorbed, highlight the self-loop in the I region
    if (this.isAbsorbingState(currentState)) {
      this.highlightCellChange.emit({ i: currentState, j: currentState });
      return;
    }

    // Otherwise, highlight the transition that got us here
    const fromState = this.simulationStates[this.simulationStates.length - 2];
    // P[i][j] = P(to i | from j), so i = to, j = from
    this.highlightCellChange.emit({ i: currentState, j: fromState });
  }

  startSimulation(): void {
    this.simulationStates = [this.STANDING_STATE];
    this.isAbsorbed = false;
    this.isSimulating.set(true);
    this.isSimulatingChange.emit(true);
    this.highlightCellChange.emit(null);
    this.scrollToEnd();

    this.simulationInterval = setInterval(() => {
      this.step();
      if (this.isAbsorbed) {
        this.stopSimulation();
      }
    }, 1000);
  }

  step(): void {
    const nextState = this.sampleNextState(this.currentStateIndex);
    this.simulationStates.push(nextState);

    this.highlightCellChange.emit(null);
    setTimeout(() => {
      this.emitHighlightCell();
    }, 100);

    if (this.isAbsorbingState(nextState)) {
      this.isAbsorbed = true;
    }

    this.scrollToEnd();
  }

  stopSimulation(): void {
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
  }

  fastForward(): void {
    this.stopSimulation();
    while (!this.isAbsorbed) {
      const nextState = this.sampleNextState(this.currentStateIndex);
      this.simulationStates.push(nextState);
      if (this.isAbsorbingState(nextState)) {
        this.isAbsorbed = true;
      }
    }
    this.emitHighlightCell();
    this.scrollToEnd();
  }

  resetSimulation(): void {
    this.stopSimulation();
    this.simulationStates = [];
    this.highlightCellChange.emit(null);
    this.isAbsorbed = false;
    this.isSimulating.set(false);
    this.isSimulatingChange.emit(false);
  }

  private scrollToEnd(): void {
    setTimeout(() => {
      if (this.stateListRef?.nativeElement) {
        this.stateListRef.nativeElement.scrollLeft = this.stateListRef.nativeElement.scrollWidth;
      }
    }, 0);
  }
}
