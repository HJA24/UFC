import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DualProgressBarComponent } from './dual-progress-bar.component';

describe('DualProgressBarComponent', () => {
  let component: DualProgressBarComponent;
  let fixture: ComponentFixture<DualProgressBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DualProgressBarComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DualProgressBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
