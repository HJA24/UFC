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
    const row = matrix[currentState];
    const random = Math.random();
    let cumulative = 0;

    for (let j = 0; j < row.length; j++) {
      cumulative += row[j];
      if (random < cumulative) {
        return j;
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
    const fromState = this.simulationStates[this.simulationStates.length - 2];
    const toState = this.simulationStates[this.simulationStates.length - 1];
    this.highlightCellChange.emit({ i: toState, j: fromState });
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
    if (this.isAbsorbed) return;

    const nextState = this.sampleNextState(this.currentStateIndex);
    this.simulationStates.push(nextState);

    // Flash effect: clear highlight briefly, then set new cell
    this.highlightCellChange.emit(null);
    setTimeout(() => {
      this.emitHighlightCell();
    }, 50);

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

  resetSimulation(): void {
    this.stopSimulation();
    this.simulationStates = [];
    this.highlightCellChange.emit(null);
    this.isAbsorbed = false;
    this.isSimulating.set(false);
    this.isSimulatingChange.emit(false);
  }

  onSimulationIconClick(): void {
    if (this.isSimulating()) {
      this.resetSimulation();
    } else {
      this.startSimulation();
    }
  }

  private scrollToEnd(): void {
    setTimeout(() => {
      if (this.stateListRef?.nativeElement) {
        this.stateListRef.nativeElement.scrollLeft = this.stateListRef.nativeElement.scrollWidth;
      }
    }, 0);
  }
}
