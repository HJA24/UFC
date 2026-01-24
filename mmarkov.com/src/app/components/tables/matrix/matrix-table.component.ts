import { Component, Input, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-matrix-table',
  standalone: true,
  imports: [CommonModule, MatTableModule, MatTooltipModule],
  templateUrl: './matrix-table.component.html',
  styleUrls: ['./matrix-table.component.css'],
})
export class MatrixTableComponent implements OnChanges {
  @Input({ required: true }) data!: (number | string)[][];
  @Input() labels?: string[];
  @Input() showTooltips: boolean = false;
  @Input() highlightCell?: { i: number; j: number } | null;
  @Input() highlightFn?: (i: number, j: number) => boolean;

  displayedColumns: string[] = [];
  colIndices: number[] = [];
  dataSource: Array<{ i: number; row: (number | string)[] }> = [];

  ngOnChanges(): void {
    this.initializeTable();
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
    // Check specific cell first
    if (this.highlightCell) {
      return i === this.highlightCell.i && j === this.highlightCell.j;
    }
    // Check custom highlight function
    if (this.highlightFn) {
      return this.highlightFn(i, j);
    }
    return false;
  }
}
