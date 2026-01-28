import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PredictionsPageComponent } from './predictions-page.component';

describe('PredictionsPageComponent', () => {
  let component: PredictionsPageComponent;
  let fixture: ComponentFixture<PredictionsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PredictionsPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PredictionsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
