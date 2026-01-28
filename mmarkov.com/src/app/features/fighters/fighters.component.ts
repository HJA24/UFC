import { Component, OnInit } from '@angular/core';
import { FighterService } from '../../services/fighter.service';
import type { FighterDto } from '../../models/fighter.dto';

@Component({
    selector: 'app-fighters',
    templateUrl: './fighters.component.html',
    styleUrls: ['./fighters.component.scss'],
    standalone: false
})
export class FightersComponent implements OnInit {
  fighters: FighterDto[] = [];
  loading = false;
  error: string | null = null;

  constructor(private fighterService: FighterService) {}

  ngOnInit(): void {
    this.loadFighters();
  }

  private loadFighters(): void {
    this.loading = true;
    this.error = null;

    this.fighterService.getFighters().subscribe({
      next: (fighters) => {
        this.fighters = fighters;
        this.loading = false;
      },
      error: (err) => {
        const msg = 'Could not load fighters';
        this.error = msg;
        this.loading = false;
        console.error(msg, err);
      }
    });
  }

  photoUrl(fighter: FighterDto): string | null {
    if (!fighter.hasPhoto) {
      return null;
    }
    return this.fighterService.getFighterPhotoUrl(fighter.fighterId);
  }
}
