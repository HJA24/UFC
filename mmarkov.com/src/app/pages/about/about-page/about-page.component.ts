import { Component, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatSliderModule } from '@angular/material/slider';
import { TransitionMatrixTableComponent } from "src/app/components/tables/transition-matrix/transition-matrix-table.component";
import { MarkovChainSimulatorComponent } from "src/app/components/markov-chain-simulator/markov-chain-simulator.component";
import { FundamentalMatrixAccordionComponent } from "src/app/components/fundamental-matrix-accordion/fundamental-matrix-accordion.component";
import { MatrixTableComponent } from "src/app/components/tables/matrix/matrix-table.component";
import { InvLogitChartComponent } from "src/app/components/charts/inv-logit-chart/inv-logit-chart.component";

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    MatSliderModule,
    TransitionMatrixTableComponent,
    MarkovChainSimulatorComponent,
    FundamentalMatrixAccordionComponent,
    MatrixTableComponent,
    InvLogitChartComponent,
  ],
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.css',
})
export class AboutPageComponent {
  @ViewChild('simulator') simulatorRef!: MarkovChainSimulatorComponent;
  @Input() p_strike_blue: number = 0.1;

  lambdaBlue: number = 5;
  lambdaRed: number = 5;

  get deltaSkill(): number {
    return this.lambdaBlue - this.lambdaRed;
  }

  // P[i][j] = P(to i | from j), columns sum to 1
  // Q: transient → transient (5x5), column j = from state j
  Q: (number | string)[][] = [
    [0.6, 0.7, 1 - this.p_strike_blue, 0.6, 0.8],  // to standing
    [0.3, 0,   0,                      0,   0  ],  // to strike attempted blue
    [0,   0.3, 0,                      0,   0  ],  // to strike attempted red
    [0.1, 0,   0,                      0,   0  ],  // to strike landed blue
    [0,   0,   0,                      0.4, 0  ],  // to strike landed red
  ];

  // R: transient → absorbing (2x5), column j = from transient state j
  R: (number | string)[][] = [
    [0, 0, this.p_strike_blue, 0, 0  ],  // to knockout blue
    [0, 0, 0,                  0, 0.2],  // to knockout red
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

  // Fundamental matrix N = (I - Q)^(-1)
  N_matrix: number[][] = [
    [102.56, 101.28, 97.43, 96.41, 87.18],
    [30.77, 31.38, 29.23, 28.92, 26.15],
    [7.69, 7.85, 8.31, 7.23, 6.54],
    [10.26, 10.13, 9.74, 10.64, 8.72],
    [4.10, 4.05, 3.90, 4.26, 4.49]
  ];

  // Absorption probabilities RN = R * N
  RN_matrix: number[][] = [
    [0.38, 0.39, 0.42, 0.36, 0.33],
    [0.62, 0.61, 0.58, 0.64, 0.67]
  ];

  highlightRegion: 'Q' | 'R' | 'O' | 'I' | null = null;
  highlightCell: { i: number; j: number } | null = null;
  highlightNCell: { i: number; j: number } | null = null;
  highlightRNCell: { i: number; j: number } | null = null;
  isSimulating = false;

  setHighlight(region: 'Q' | 'R' | 'O' | 'I'): void {
    this.highlightRegion = region;
  }

  clearHighlight(): void {
    this.highlightRegion = null;
  }

  setHighlightN(i: number, j: number): void {
    this.highlightNCell = { i, j };
  }

  clearHighlightN(): void {
    this.highlightNCell = null;
  }

  setHighlightRN(i: number, j: number): void {
    this.highlightRNCell = { i, j };
  }

  clearHighlightRN(): void {
    this.highlightRNCell = null;
  }

  onHighlightCellChange(cell: { i: number; j: number } | null): void {
    this.highlightCell = cell;
  }

  onIsSimulatingChange(isSimulating: boolean): void {
    this.isSimulating = isSimulating;
  }

  onSimulationIconClick(): void {
    if (this.isSimulating) {
      this.simulatorRef.resetSimulation();
    } else {
      this.simulatorRef.startSimulation();
    }
  }
}
