import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatrixTableComponent } from '../matrix/matrix-table.component';

@Component({
  selector: 'app-transition-matrix-table',
  standalone: true,
  imports: [CommonModule, MatrixTableComponent],
  templateUrl: './transition-matrix-table.component.html',
  styleUrls: ['./transition-matrix-table.component.css'],
})
export class TransitionMatrixTableComponent implements OnChanges {
  @Input({ required: true }) Q!: (number | string)[][];
  @Input({ required: true }) R!: (number | string)[][];
  @Input({ required: true }) showTooltips!: boolean;

  @Input() labels?: string[];
  @Input() highlightRegion?: 'Q' | 'R' | 'O' | 'I' | null;
  @Input() highlightCell?: { i: number; j: number } | null;
  @Input() firstColumn?: (number | string)[];
  @Input() lastColumn?: (number | string)[];

  data: (number | string)[][] = [];

  // Arrow function to maintain correct `this` context when passed to child component
  regionHighlightFn = (i: number, j: number): boolean => {
    if (!this.highlightRegion) return false;

    const n = this.Q?.length ?? 0; // transient states count

    // P[i][j] = P(to i | from j): row = to, col = from
    switch (this.highlightRegion) {
      case 'Q': return i < n && j < n;      // transient → transient
      case 'O': return i < n && j >= n;     // absorbing → transient (impossible)
      case 'R': return i >= n && j < n;     // transient → absorbing
      case 'I': return i >= n && j >= n;    // absorbing → absorbing
      default: return false;
    }
  };

  ngOnChanges(): void {
    this.buildMatrix();
  }

  private buildMatrix(): void {
    // P[i][j] = P(to i | from j), columns sum to 1
    // Q: n×n (transient → transient)
    // R: m×n (transient → absorbing)
    const n = this.Q?.length ?? 0;                    // transient states count
    const m = this.R?.length ?? 0;                    // absorbing states count

    // Build O: n×m zero matrix (absorbing → transient, impossible)
    const O: (number | string)[][] = Array.from({ length: n }, () => Array(m).fill(0));

    // Build I: m×m identity matrix (absorbing → absorbing, stays)
    const I: (number | string)[][] = Array.from({ length: m }, (_, i) =>
      Array.from({ length: m }, (_, j) => (i === j ? 1 : 0))
    );

    // Full matrix T = [Q O; R I], columns sum to 1
    this.data = [
      ...this.Q.map((row, i) => [...row, ...O[i]]),  // [Q | O]
      ...this.R.map((row, i) => [...row, ...I[i]]),  // [R | I]
    ];

    // Override first column if provided
    if (this.firstColumn && this.firstColumn.length === this.data.length) {
      for (let i = 0; i < this.data.length; i++) {
        this.data[i][0] = this.firstColumn[i];
      }
    }

    // Override last column if provided
    if (this.lastColumn && this.lastColumn.length === this.data.length) {
      for (let i = 0; i < this.data.length; i++) {
        this.data[i][this.data[i].length - 1] = this.lastColumn[i];
      }
    }
  }

}
