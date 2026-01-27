import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FightsPageComponent } from './fights-page.component';

describe('FightsPageComponent', () => {
  let component: FightsPageComponent;
  let fixture: ComponentFixture<FightsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FightsPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FightsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
