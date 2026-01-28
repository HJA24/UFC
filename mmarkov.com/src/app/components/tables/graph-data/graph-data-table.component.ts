import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  ViewChild,
  signal
} from '@angular/core';

import { CommonModule, DatePipe } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatIconModule } from '@angular/material/icon';
import { MatSort, MatSortModule } from '@angular/material/sort';

import { iconNameFromFightDetails } from '../../../utils/icon-name';
import { FightMatchupDto } from '../../../models/fight-matchup.dto';

@Component({
  selector: 'app-graph-data-table',
  standalone: true,
  imports: [
    CommonModule,
    DatePipe,
    MatTableModule,
    MatPaginatorModule,
    MatIconModule,
    MatSortModule
  ],
  templateUrl: './graph-data-table.component.html'
})
export class GraphDataTableComponent implements OnChanges {
  loading = signal(true);

  @Input() data: FightMatchupDto[] | null = null;
  @Input() activeNodeIds: number[] | null = null;

  dataSource = new MatTableDataSource<FightMatchupDto>();

  displayedColumns = [
    'fighter',
    'opponent',
    'outcome',
    'rounds',
    'clock',
    'event',
    'date'
  ];

  // -------------------------
  // Robust ViewChild setters
  // -------------------------

  private _paginator: MatPaginator | null = null;
  @ViewChild(MatPaginator)
  set paginator(p: MatPaginator) {
    this._paginator = p;
    this.dataSource.paginator = p;
  }
  get paginator(): MatPaginator | null {
    return this._paginator;
  }

  private _sort: MatSort | null = null;
  @ViewChild(MatSort)
  set sort(s: MatSort) {
    this._sort = s;
    this.dataSource.sort = s; // attach sort as soon as it exists
  }
  get sort(): MatSort | null {
    return this._sort;
  }

  // -------------------------
  // Init: filter + sort logic
  // -------------------------

  constructor() {
    // ✅ Filter rows by active node IDs (fighterBlue OR fighterRed)
    this.dataSource.filterPredicate = (row, filter) => {
      const ids: number[] = JSON.parse(filter || '[]');
      if (ids.length === 0) return true;

      return ids.includes(row.fighterBlue.fighterId) || ids.includes(row.fighterRed.fighterId);
    };

    // ✅ Sort ONLY on fighter/opponent columns
    // IMPORTANT: must return a primitive value (string/number), NOT objects.
    this.dataSource.sortingDataAccessor = (row: any, column: string) => {
      if (column === 'fighter') {
        // fighter column = blue
        // pick whatever you render in the table cell (lastName, fullName, etc.)
        return (row.fighterBlue?.lastName ?? '').toLowerCase();
      }

      if (column === 'opponent') {
        // opponent column = red
        return (row.fighterRed?.lastName ?? '').toLowerCase();
      }

      // all other columns are not sortable (no mat-sort-header on them)
      return '';
    };
  }

  // -------------------------
  // React to inputs
  // -------------------------

  ngOnChanges(changes: SimpleChanges): void {
    if (this.data === null) {
      this.loading.set(true);
      return;
    }

    this.dataSource.data = this.data;
    this.loading.set(false);

    // If sort exists already, re-attach (safe). Helps in some timing cases.
    if (this._sort) this.dataSource.sort = this._sort;

    if (changes['activeNodeIds'] || changes['data']) {
      this.applyFilter();
    }
  }

  private applyFilter(): void {
    this.dataSource.filter = JSON.stringify(this.activeNodeIds ?? []);
  }

  // -------------------------
  // Template helpers
  // -------------------------

  iconName(outcome: string, winner: string | null) {
    return iconNameFromFightDetails(outcome, winner);
  }

  formatClock(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
