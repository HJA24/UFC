import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DecisionChartComponent } from './decision-chart.component';

describe('DecisionChartComponent', () => {
  let component: DecisionChartComponent;
  let fixture: ComponentFixture<DecisionChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DecisionChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DecisionChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
