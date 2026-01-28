import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JudgingPageComponent } from './judging-page.component';

describe('JudgingPageComponent', () => {
  let component: JudgingPageComponent;
  let fixture: ComponentFixture<JudgingPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JudgingPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JudgingPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
