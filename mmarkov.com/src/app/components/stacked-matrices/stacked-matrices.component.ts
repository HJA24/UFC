import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TransitionMatrixTableComponent } from '../tables/transition-matrix/transition-matrix-table.component';
import { invLogit } from '../charts/inv-logit-chart/inv-logit-chart.component';

@Component({
  selector: 'app-stacked-matrices',
  standalone: true,
  imports: [CommonModule, TransitionMatrixTableComponent],
  templateUrl: './stacked-matrices.component.html',
  styleUrl: './stacked-matrices.component.css'
})
export class StackedMatricesComponent implements OnInit {
  readonly totalSamples = 5000;
  readonly visibleEdges = 5;

  samples: number[] = [];
  edgeIndices: number[] = [];

  labels: string[] = [
    'standing',
    'strike attempted blue',
    'strike attempted red',
    'strike landed blue',
    'strike landed red',
    'knockout blue',
    'knockout red',
  ];

  ngOnInit(): void {
    this.samples = this.generatePosteriorSamples();
    this.edgeIndices = Array.from({ length: this.visibleEdges }, (_, i) => i);
  }

  private generatePosteriorSamples(): number[] {
    const samples: number[] = [];
    for (let i = 0; i < this.totalSamples; i++) {
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      samples.push(z * 2);
    }
    return samples;
  }

  getQ(sampleIndex: number): (number | string)[][] {
    const theta = invLogit(this.samples[sampleIndex]);
    return [
      [0.6, 0.7, 1 - theta, 0.6, 0.8],
      [0.3, 0,   0,         0,   0  ],
      [0,   0.3, 0,         0,   0  ],
      [0.1, 0,   0,         0,   0  ],
      [0,   0,   0,         0.4, 0  ],
    ];
  }

  getR(sampleIndex: number): (number | string)[][] {
    const theta = invLogit(this.samples[sampleIndex]);
    return [
      [0, 0, theta, 0, 0  ],
      [0, 0, 0,     0, 0.2],
    ];
  }
}
