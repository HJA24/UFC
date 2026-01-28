import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PredictionsChartComponent } from './predictions-chart.component';

describe('PredictionsChartComponent', () => {
  let component: PredictionsChartComponent;
  let fixture: ComponentFixture<PredictionsChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PredictionsChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PredictionsChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
