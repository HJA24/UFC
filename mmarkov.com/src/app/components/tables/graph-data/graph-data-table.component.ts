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
    MatIconModule,
    MatSortModule
  ],
  templateUrl: './graph-data-table.component.html',
  styleUrl: './graph-data-table.component.css'
})
export class GraphDataTableComponent implements OnChanges {
  loading = signal(true);

  @Input() data: FightMatchupDto[] | null = null;
  @Input() activeNodeId: number | null = null;

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
    // ✅ Filter rows by active node ID (fighterBlue OR fighterRed)
    this.dataSource.filterPredicate = (row, filter) => {
      const id = filter ? parseInt(filter, 10) : null;
      if (id === null || isNaN(id)) return true;

      return row.fighterBlue.fighterId === id || row.fighterRed.fighterId === id;
    };

    // ✅ Sort ONLY on fighter/opponent columns
    // IMPORTANT: must return a primitive value (string/number), NOT objects.
    this.dataSource.sortingDataAccessor = (row: FightMatchupDto, column: string) => {
      if (column === 'fighter') {
        return (this.getFighter(row)?.lastName ?? '').toLowerCase();
      }

      if (column === 'opponent') {
        return (this.getOpponent(row)?.lastName ?? '').toLowerCase();
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

    // Always reassign to trigger change detection
    this.dataSource.data = [...this.data];
    this.loading.set(false);

    // If sort exists already, re-attach (safe). Helps in some timing cases.
    if (this._sort) this.dataSource.sort = this._sort;

    if (changes['activeNodeId'] || changes['data']) {
      this.applyFilter();
    }
  }

  private applyFilter(): void {
    this.dataSource.filter = this.activeNodeId !== null ? String(this.activeNodeId) : '';
  }

  // -------------------------
  // Template helpers
  // -------------------------

  /**
   * Get fighter from active node's perspective.
   * If active node is in the row, show them as the fighter.
   * Otherwise default to blue.
   */
  getFighter(row: FightMatchupDto) {
    if (this.activeNodeId === null) {
      return row.fighterBlue;
    }
    if (row.fighterRed.fighterId === this.activeNodeId) {
      return row.fighterRed;
    }
    return row.fighterBlue;
  }

  /**
   * Get opponent from active node's perspective.
   */
  getOpponent(row: FightMatchupDto) {
    if (this.activeNodeId === null) {
      return row.fighterRed;
    }
    if (row.fighterRed.fighterId === this.activeNodeId) {
      return row.fighterBlue;
    }
    return row.fighterRed;
  }

  /**
   * Get winner from active node's perspective.
   * Returns 'fighter', 'opponent', or null (draw/NC).
   */
  getWinnerPerspective(row: FightMatchupDto): string | null {
    if (row.winner === null) return null;

    const isSwapped = this.activeNodeId !== null && row.fighterRed.fighterId === this.activeNodeId;

    if (isSwapped) {
      // Perspective is swapped: red is now "fighter"
      return row.winner === 'red' ? 'fighter' : 'opponent';
    } else {
      // Normal: blue is "fighter"
      return row.winner === 'blue' ? 'fighter' : 'opponent';
    }
  }

  iconName(outcome: string, winnerPerspective: string | null) {
    // Map perspective back to blue/red for icon lookup
    const winner = winnerPerspective === 'fighter' ? 'blue' : winnerPerspective === 'opponent' ? 'red' : null;
    return iconNameFromFightDetails(outcome, winner);
  }

  formatClock(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }
}
