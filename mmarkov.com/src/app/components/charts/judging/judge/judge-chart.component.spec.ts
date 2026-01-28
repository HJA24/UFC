import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JudgeChartComponent } from './judge-chart.component';

describe('JudgeChartComponent', () => {
  let component: JudgeChartComponent;
  let fixture: ComponentFixture<JudgeChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JudgeChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JudgeChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
