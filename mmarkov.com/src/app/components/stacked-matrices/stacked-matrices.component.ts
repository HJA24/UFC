import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { TransitionMatrixTableComponent } from '../tables/transition-matrix/transition-matrix-table.component';
import { invLogit } from '../charts/inv-logit-chart/inv-logit-chart.component';

@Component({
  selector: 'app-stacked-matrices',
  standalone: true,
  imports: [CommonModule, MatIconModule, TransitionMatrixTableComponent],
  templateUrl: './stacked-matrices.component.html',
  styleUrl: './stacked-matrices.component.css'
})
export class StackedMatricesComponent implements OnInit {
  readonly visibleCards = 10;
  readonly visibleBackground = 10;

  @Output() indexChange = new EventEmitter<number>();

  currentIndex = 0;
  currentSample = 0;

  Q: (number | string)[][] = [];
  R: (number | string)[][] = [];

  labels: string[] = [
    'standing',
    'strike attempted blue',
    'strike attempted red',
    'strike landed blue',
    'strike landed red',
    'knockout blue',
    'knockout red',
  ];

  get leftIndices(): number[] {
    const indices: number[] = [];
    for (let i = this.currentIndex - 1; i >= Math.max(0, this.currentIndex - this.visibleBackground); i--) {
      indices.push(i);
    }
    return indices;
  }

  get rightIndices(): number[] {
    const indices: number[] = [];
    for (let i = this.currentIndex + 1; i <= Math.min(this.visibleCards - 1, this.currentIndex + this.visibleBackground); i++) {
      indices.push(i);
    }
    return indices;
  }

  ngOnInit(): void {
    this.simulate();
    this.indexChange.emit(this.currentIndex);
  }

  prev(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      this.simulate();
      this.indexChange.emit(this.currentIndex);
    }
  }

  next(): void {
    if (this.currentIndex < this.visibleCards - 1) {
      this.currentIndex++;
      this.simulate();
      this.indexChange.emit(this.currentIndex);
    }
  }

  private simulate(): void {
    // Box-Muller transform to generate normal sample
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    this.currentSample = z * 2;

    const theta = invLogit(this.currentSample);

    this.Q = [
      [0.6, 0.7, 1 - theta, 0.6, 0.8],
      [0.3, 0,   0,         0,   0  ],
      [0,   0.3, 0,         0,   0  ],
      [0.1, 0,   0,         0,   0  ],
      [0,   0,   0,         0.4, 0  ],
    ];

    this.R = [
      [0, 0, theta, 0, 0  ],
      [0, 0, 0,     0, 0.2],
    ];
  }
}
