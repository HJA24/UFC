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
    const n = this.Q?.length ?? 0; // transient states
    const m = this.R?.length ?? 0; // absorbing states

    // Build O: n x m zero matrix
    const O: (number | string)[][] = Array.from({ length: n }, () => Array(m).fill(0));

    // Build I: m x m identity matrix
    const I: (number | string)[][] = Array.from({ length: m }, (_, i) =>
      Array.from({ length: m }, (_, j) => (i === j ? 1 : 0))
    );

    // Combine into full matrix: [Q | O] on top, [R | I] on bottom
    this.data = [
      ...this.Q.map((row, i) => [...row, ...O[i]]),
      ...this.R.map((row, i) => [...row, ...I[i]]),
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
    const m = this.R?.length ?? 0; // absorbing states count

    switch (this.highlightRegion) {
      case 'Q': return i < n && j < n;
      case 'O': return i < n && j >= n;
      case 'R': return i >= n && j < n;
      case 'I': return i >= n && j >= n;
      default: return false;
    }
  }
}
