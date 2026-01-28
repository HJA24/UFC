import { Component, OnInit } from '@angular/core';
import { JudgeService } from '../services/judge.service';
import { Judge } from './models/judge';

@Component({
    selector: 'app-judges',
    imports: [],
    templateUrl: './judges.component.html',
    styleUrls: ['./judges.component.scss']
})
export class JudgesComponent implements OnInit {

  judges: Judge[] = [];
  isLoading: boolean = true;   // optional: show loading spinner

  constructor(private judgeService: JudgeService) {}

  ngOnInit(): void {
    this.judgeService.getJudges().subscribe({
      next: (data) => {
        this.judges = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Failed to load judges', err);
        this.isLoading = false;
      }
    });
  }
}
