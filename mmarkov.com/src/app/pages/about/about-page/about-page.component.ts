import { Component, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { TransitionMatrixTableComponent } from "src/app/components/tables/transition-matrix/transition-matrix-table.component";
import { MarkovChainSimulatorComponent } from "src/app/components/simulations/markov-chain-simulator/markov-chain-simulator.component";
import { TheoryFundamentalMatrixAccordionComponent } from "src/app/components/accordions/theory-fundamental-matrix-accordion/theory-fundamental-matrix-accordion.component";
import { MatrixTableComponent } from "src/app/components/tables/matrix/matrix-table.component";
import { TransformationPlotComponent, invLogit } from "src/app/components/charts/transformation-plot/transformation-plot.component";
import { StackedMatricesComponent } from "src/app/components/stacked-matrices/stacked-matrices.component";
import { SkillSliderComponent } from "src/app/components/sliders/skill-slider/skill-slider.component";
import { ArcDiagramComponent } from "src/app/components/charts/arc-diagram/arc-diagram.component";
import { NodeDto, EdgeDto } from "src/app/models/network/graph.dto";

@Component({
  selector: 'app-about-page',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatIconModule,
    TransitionMatrixTableComponent,
    MarkovChainSimulatorComponent,
    TheoryFundamentalMatrixAccordionComponent,
    MatrixTableComponent,
    TransformationPlotComponent,
    StackedMatricesComponent,
    SkillSliderComponent,
    ArcDiagramComponent,
  ],
  templateUrl: './about-page.component.html',
  styleUrl: './about-page.component.css',
})
export class AboutPageComponent {
  @ViewChild('simulator') simulatorRef!: MarkovChainSimulatorComponent;

  lambdaBlue: number = 5;
  lambdaRed: number = 5;

  get deltaSkill(): number {
    return this.lambdaBlue - this.lambdaRed;
  }

  get theta(): number {
    return invLogit(this.deltaSkill);
  }

  // P[i][j] = P(to i | from j), columns sum to 1
  // Q: transient → transient (5x5), column j = from state j
  get Q(): (number | string)[][] {
    return [
      [0.65, 0.7, 1 - this.theta, 0.8, 0.9],  // to standing
      [0.25, 0,   0,              0,   0  ],  // to strike attempted blue
      [0.1, 0,   0,              0,   0  ],  // to strike attempted red
      [0,   0.3, 0,              0,   0  ],  // to strike landed blue
      [0,   0,   this.theta,     0, 0  ],  // to strike landed red
    ];
  }

  // R: transient → absorbing (2x5), column j = from transient state j
  get R(): (number | string)[][] {
    return [
      [0, 0, 0, 0.2, 0  ],  // to knockout blue
      [0, 0, 0, 0, 0.1],  // to knockout red
    ];
  }

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
    [50, 47, 47.5, 40, 45],
    [12.5, 12.75, 11.875, 10, 11.25],
    [5, 4.7, 5.75, 4, 4.5],
    [3.75, 3.825, 3.625, 4, 3.375],
    [2.5, 2.35, 2.875, 2, 3.25]
  ];

  // Absorption probabilities RN = R * N
  RN_matrix: number[][] = [
    [0.75, 0.765, 0.7125, 0.8, 0.675],
    [0.25, 0.235, 0.2875, 0.2, 0.325]
  ];

  highlightRegion: 'Q' | 'R' | 'O' | 'I' | null = null;
  highlightCell: { i: number; j: number } | null = null;
  highlightNCell: { i: number; j: number } | null = null;
  highlightRNCell: { i: number; j: number } | null = null;
  isSimulating = false;
  stackedMatrixIndex = 0;

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
    this.simulatorRef.startSimulation();
  }

  onReplayClick(): void {
    this.simulatorRef.resetSimulation();
    this.simulatorRef.startSimulation();
  }

  onFastForwardClick(): void {
    this.simulatorRef.fastForward();
  }

  onStackedMatrixIndexChange(index: number): void {
    this.stackedMatrixIndex = index;
  }

  get stackedMatrixLabel(): string {
    // Last card (index 11) shows 5000, others show 1-10
    if (this.stackedMatrixIndex === 11) return '5000';
    return String(this.stackedMatrixIndex + 1);
  }

  // Arc diagram data for Markov chain visualization
  // Order: KO blue - Strike landed blue - Strike attempt blue - Standing - Strike attempt red - Strike landed red - KO red
  arcNodes: NodeDto[] = [
    { nodeId: 0, fighter: { lastName: 'knockout landed by blue' } as any, pos: { x: 0, y: 0, theta: 0 }, color: 'BLUE', cluster: 0 },
    { nodeId: 1, fighter: { lastName: 'strike landed by blue' } as any, pos: { x: 0, y: 0, theta: 0 }, color: 'BLUE', cluster: 0 },
    { nodeId: 2, fighter: { lastName: 'strike attempt by blue' } as any, pos: { x: 0, y: 0, theta: 0 }, color: 'BLUE', cluster: 0 },
    { nodeId: 3, fighter: { lastName: 'standing' } as any, pos: { x: 0, y: 0, theta: 0 }, color: null, cluster: 0 },
    { nodeId: 4, fighter: { lastName: 'strike attempt by red' } as any, pos: { x: 0, y: 0, theta: 0 }, color: 'RED', cluster: 0 },
    { nodeId: 5, fighter: { lastName: 'strike landed by red' } as any, pos: { x: 0, y: 0, theta: 0 }, color: 'RED', cluster: 0 },
    { nodeId: 6, fighter: { lastName: 'knockout landed by red' } as any, pos: { x: 0, y: 0, theta: 0 }, color: 'RED', cluster: 0 },
  ];

  arcEdges: EdgeDto[] = [
    // From standing (3)
    { source: 3, target: 2, weight: 0.25 },  // standing -> strike attempt blue
    { source: 3, target: 4, weight: 0.10 },  // standing -> strike attempt red
    // From strike attempt blue (2)
    { source: 2, target: 3, weight: 0.70 },  // strike attempt blue -> standing
    { source: 2, target: 1, weight: 0.30 },  // strike attempt blue -> strike landed blue
    // From strike attempt red (4)
    { source: 4, target: 3, weight: 0.50 },  // strike attempt red -> standing
    { source: 4, target: 5, weight: 0.50 },  // strike attempt red -> strike landed red
    // From strike landed blue (1)
    { source: 1, target: 3, weight: 0.80 },  // strike landed blue -> standing
    { source: 1, target: 0, weight: 0.20 },  // strike landed blue -> KO blue
    // From strike landed red (5)
    { source: 5, target: 3, weight: 0.90 },  // strike landed red -> standing
    { source: 5, target: 6, weight: 0.10 },  // strike landed red -> KO red
  ];
}
