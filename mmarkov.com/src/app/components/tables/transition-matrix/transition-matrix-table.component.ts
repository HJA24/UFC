import { Component, Input, OnInit, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-transition-matrix-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatTooltipModule],
  templateUrl: './transition-matrix-table.component.html',
  styleUrls: ['./transition-matrix-table.component.css'],
})
export class TransitionMatrixTableComponent implements OnInit, OnChanges {
  @Input({ required: true }) Q!: (number | string)[][];
  @Input({ required: true }) R!: (number | string)[][];
  @Input({ required: true }) showTooltips!: boolean;

  @Input() labels?: string[];
  @Input() highlightRegion?: 'Q' | 'R' | 'O' | 'I' | null;
  @Input() highlightCell?: { i: number; j: number } | null;

  data: (number | string)[][] = [];
  displayedColumns: string[] = [];
  colIndices: number[] = [];
  dataSource: Array<{ i: number; row: (number | string)[] }> = [];

  ngOnInit(): void {
    this.buildMatrix();
    this.initializeTable();
  }

  ngOnChanges(): void {
    this.buildMatrix();
    this.initializeTable();
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
  }

  private initializeTable(): void {
    const rowCount = this.data?.length ?? 0;
    const colCount = rowCount > 0 ? (this.data[0]?.length ?? 0) : 0;

    this.dataSource = Array.from({ length: rowCount }, (_, i) => ({
      i,
      row: this.data[i] ?? [],
    }));

    this.colIndices = Array.from({ length: colCount }, (_, j) => j);
    this.displayedColumns = this.colIndices.map(j => `c${j}`);
  }

  value(i: number, j: number): number | string {
    return this.data[i][j];
  }

  tooltip(i: number, j: number): string {
    // P[i][j] = P(to i | from j)
    const fromLabel = this.labels?.[j] ?? j.toString();
    const toLabel = this.labels?.[i] ?? i.toString();
    return `P(${fromLabel}, ${toLabel}) = ${this.data[i][j]}`;
  }

  isHighlighted(i: number, j: number): boolean {
    // Check for specific cell highlighting first
    if (this.highlightCell) {
      return i === this.highlightCell.i && j === this.highlightCell.j;
    }

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
  }
}
