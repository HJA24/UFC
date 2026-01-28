import { Component, OnInit, Output, EventEmitter, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

import { TransitionMatrixTableComponent } from '../tables/transition-matrix/transition-matrix-table.component';
import { invLogit } from '../charts/inv-logit-chart/inv-logit-chart.component';


@Component({
  selector: 'app-stacked-matrices',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    TransitionMatrixTableComponent
  ],
  templateUrl: './stacked-matrices.component.html',
  styleUrl: './stacked-matrices.component.css'
})
export class StackedMatricesComponent implements OnInit {
  readonly visibleCards = 12;  // 10 cards (0-9) + gap (10 skipped) + last card (11)
  readonly visibleBackground = 12;

  @Output() indexChange = new EventEmitter<number>();

  currentIndex = 0;

  // Pre-sampled matrices for all 11 cards (indices 0-9 and 11)
  samples: { Q: (number | string)[][]; R: (number | string)[][]; theta: number }[] = [];

  get Q(): (number | string)[][] {
    return this.samples[this.currentIndex]?.Q ?? [];
  }

  get R(): (number | string)[][] {
    return this.samples[this.currentIndex]?.R ?? [];
  }

  labels: string[] = [
    'standing',
    'strike attempted by blue',
    'strike attempted by red',
    'strike landed by blue',
    'strike landed by red',
    'knockout blue',
    'knockout red',
  ];

  get leftIndices(): number[] {
    // When at index 11, mirror effect: no cards on left
    if (this.currentIndex === 11) return [];

    const indices: number[] = [];
    for (let i = this.currentIndex - 1; i >= Math.max(0, this.currentIndex - this.visibleBackground); i--) {
      if (i !== 10) indices.push(i); // Skip index 10 (gap before T_5000)
    }
    return indices;
  }

  get rightIndices(): number[] {
    // When at index 11, mirror effect: show history cards on right
    if (this.currentIndex === 11) {
      const indices: number[] = [];
      for (let i = 9; i >= 0; i--) {
        indices.push(i);
      }
      return indices;
    }

    const indices: number[] = [];
    for (let i = this.currentIndex + 1; i <= Math.min(this.visibleCards - 1, this.currentIndex + this.visibleBackground); i++) {
      if (i !== 10) indices.push(i); // Skip index 10 (gap before T_5000)
    }
    return indices;
  }

  ngOnInit(): void {
    this.generateAllSamples();
    this.indexChange.emit(this.currentIndex);
  }

  getQ(index: number): (number | string)[][] {
    return this.samples[index]?.Q ?? [];
  }

  getR(index: number): (number | string)[][] {
    return this.samples[index]?.R ?? [];
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowLeft') {
      this.prev();
    } else if (event.key === 'ArrowRight') {
      this.next();
    }
  }

  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent): void {
    event.preventDefault();
    if (event.deltaY < 0) {
      this.next();
    } else if (event.deltaY > 0) {
      this.prev();
    }
  }

  prev(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
      if (this.currentIndex === 10) this.currentIndex--; // Skip gap
      this.indexChange.emit(this.currentIndex);
    }
  }

  next(): void {
    if (this.currentIndex < this.visibleCards - 1) {
      this.currentIndex++;
      if (this.currentIndex === 10) this.currentIndex++; // Skip gap
      this.indexChange.emit(this.currentIndex);
    }
  }

  readonly dotsLastColumn: (number | string)[] = ['', '', '', '...', '', '', ''];
  readonly dotsFirstColumn: (number | string)[] = ['', '', '', '...', '', '', ''];

  // Blank matrices for the gap card
  readonly blankQ: (number | string)[][] = [
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
    ['', '', '', '', ''],
  ];
  readonly blankR: (number | string)[][] = [
    ['', '', '', '', ''],
    ['', '', '', '', ''],
  ];

  private generateAllSamples(): void {
    // Generate samples for all 12 indices (0-9 and 11, skipping 10)
    for (let i = 0; i < this.visibleCards; i++) {
      // Box-Muller transform to generate normal sample
      const u1 = Math.random();
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      const sample = z * 2;
      const theta = invLogit(sample);

      const Q: (number | string)[][] = [
        [ 0.65, 0.7, 1 - theta, 0.8, 0.9 ],
        [ 0.25, 0, 0, 0,  0  ],
        [ 0.1, 0, 0,  0,  0  ],
        [ 0, 0.3, 0,  0,  0  ],
        [ 0, 0,  theta, 0.4, 0 ],
      ];

      const R: (number | string)[][] = [
        [ 0, 0, 0, 0.2, 0 ],
        [ 0, 0, 0, 0, 0.1 ],
      ];

      this.samples[i] = { Q, R, theta };
    }
  }
}
