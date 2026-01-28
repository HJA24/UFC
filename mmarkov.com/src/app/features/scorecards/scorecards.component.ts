import {Component, OnInit} from '@angular/core';
import {ActivatedRoute} from '@angular/router';
import {switchMap, map} from 'rxjs';

import {ScorecardsDto} from '../../models/scorecards.dto';
import {ScorecardDto} from '../../models/scorecard.dto';
import {ScorecardService} from '../../services/scorecard.service';
import { generateRangeNumberOfPoints } from "../../utils/scorecard-range";
import { sortScorecardsBlue, sortScorecardsRed } from "../../utils/scorecard-sort";
import {FightDto} from "../../models/fight.dto";
import {FightService} from '../../services/fight.service';

@Component({
    selector: 'app-scorecards',
    templateUrl: './scorecard.component.html',
    standalone: false
})
export class ScorecardComponent implements OnInit {

  fightId!: number;
  judgeId!: number;

  numberOfRounds!: number;

  scorecardsBlue: { [points: number]: ScorecardDto[] } = {};
  scorecardsRed: { [points: number]: ScorecardDto[] } = {};

  loading = false;
  error?: string;

  constructor(
    private route: ActivatedRoute,
    private scorecardService: ScorecardService,
    private fightService: FightService
  ) {
  }

  ngOnInit(): void {
    this.fightId = Number(this.route.snapshot.paramMap.get('fightId'));
    this.judgeId = Number(this.route.snapshot.queryParamMap.get('judgeId'));

    this.loadData();
  }

  private loadData(): void {
    this.loading = true;
    this.error = undefined;

    this.fightService.getFight(this.fightId).pipe(
      switchMap(fight =>
        this.scorecardService.getScorecardsForFightAndJudge(this.fightId, this.judgeId).pipe(
          map(scorecards => ({fight, scorecards}))
        )
      )
    ).subscribe({
      next: ({fight, scorecards}: { fight: FightDto; scorecards: ScorecardsDto }) => {
        this.numberOfRounds = fight.numberOfRounds;

        const rangeNumberOfPoints = generateRangeNumberOfPoints(this.numberOfRounds);

        const sortedScorecardsBlue: { [points: number]: ScorecardDto[] } = {};
        const sortedScorecardsRed: { [points: number]: ScorecardDto[] } = {};

        rangeNumberOfPoints.forEach(points => {
          const blue = (scorecards.blue && scorecards.blue[points]) || [];
          const red = (scorecards.red && scorecards.red[points]) || [];

          sortedScorecardsBlue[points] = sortScorecardsBlue(blue);
          sortedScorecardsRed[points] = sortScorecardsRed(red);
        });

        this.scorecardsBlue = sortedScorecardsBlue;
        this.scorecardsRed = sortedScorecardsRed;

        this.loading = false;
      },
      error: err => {
        let msg = 'Failed to load fight or scorecards';
        console.error(msg, err);
        this.error = msg;
        this.loading = false;
      }
    });
  }
}
