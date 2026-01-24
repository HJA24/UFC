import { Component, Input, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TransitionMatrixTableComponent } from "src/app/components/tables/transition-matrix/transition-matrix-table.component";
import { MarkovChainSimulatorComponent } from "src/app/components/markov-chain-simulator/markov-chain-simulator.component";
import { FundamentalMatrixAccordionComponent } from "src/app/components/fundamental-matrix-accordion/fundamental-matrix-accordion.component";

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    TransitionMatrixTableComponent,
    MarkovChainSimulatorComponent,
    FundamentalMatrixAccordionComponent,
  ],
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.css',
})
export class AboutPageComponent {
  @ViewChild('simulator') simulatorRef!: MarkovChainSimulatorComponent;
  @Input() p_strike_blue: number = 0.1;

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

  highlightRegion: 'Q' | 'R' | 'O' | 'I' | null = null;
  highlightCell: { i: number; j: number } | null = null;
  isSimulating = false;

  setHighlight(region: 'Q' | 'R' | 'O' | 'I'): void {
    this.highlightRegion = region;
  }

  clearHighlight(): void {
    this.highlightRegion = null;
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
