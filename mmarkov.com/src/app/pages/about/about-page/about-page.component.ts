import { Component, Input, ElementRef, ViewChild, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { trigger, transition, style, animate } from '@angular/animations';
import { TransitionMatrixTableComponent } from "src/app/components/tables/transition-matrix/transition-matrix-table.component";
import { KatexPipe } from "src/app/pipes/katex.pipe";

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatChipsModule,
    TransitionMatrixTableComponent,
    KatexPipe,
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(-10px)' }),
        animate('300ms ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ])
  ],
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.css',
})
export class AboutPageComponent {
  @ViewChild('stateList') stateListRef!: ElementRef<HTMLDivElement>;
  @Input() p_strike_blue: number = 0.1;

  // Q: transient to transient (5x5)
  Q: (number | string)[][] = [
    [0.6, 0.7, 1 - this.p_strike_blue, 0.6, 0.8],
    [0.3, 0,   0,   0,   0],
    [0,   0.3, 0,   0,   0],
    [0.1, 0,   0,   0,   0],
    [0,   0,   0,   0.4, 0],
  ];

  // R: absorbing from transient (2x5)
  R: (number | string)[][] = [
    [0, 0, this.p_strike_blue, 0, 0],
    [0, 0, 0, 0, 0.2],
  ];

  labels: string[] = [
    'standing',
    'strike attempted blue',
    'strike attempted red',
    'strike landed blue',
    'strike landed red',
    'knockout landed blue',
    'knockout landed red',
  ];

  highlightRegion: 'Q' | 'R' | 'O' | 'I' | null = null;

  setHighlight(region: 'Q' | 'R' | 'O' | 'I'): void {
    this.highlightRegion = region;
  }

  clearHighlight(): void {
    this.highlightRegion = null;
  }

  // Simulation state
  simulationStates: number[] = [];
  isAbsorbed = false;
  isSimulating = signal(false);
  private simulationInterval: any = null;

  get currentStateIndex(): number {
    return this.simulationStates.length > 0
      ? this.simulationStates[this.simulationStates.length - 1]
      : 0;
  }

  get currentStateLabel(): string {
    return this.labels[this.currentStateIndex] ?? '';
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

  private readonly STANDING_STATE = 0;

  startSimulation(): void {
    this.simulationStates = [this.STANDING_STATE];
    this.isAbsorbed = false;
    this.isSimulating.set(true);
    this.scrollToEnd();

    this.simulationInterval = setInterval(() => {
      this.step();
      if (this.isAbsorbed) {
        this.stopSimulation();
      }
    }, 500);
  }

  step(): void {
    if (this.isAbsorbed) return;

    const nextState = this.sampleNextState(this.currentStateIndex);
    this.simulationStates.push(nextState);

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
    this.isAbsorbed = false;
    this.isSimulating.set(false);
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
