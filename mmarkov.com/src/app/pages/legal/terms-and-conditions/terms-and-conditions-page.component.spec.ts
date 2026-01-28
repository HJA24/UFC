import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TermsAndConditionsPageComponent } from './terms-and-conditions-page.component';

describe('TermsAndConditionsComponent', () => {
  let component: TermsAndConditionsPageComponent;
  let fixture: ComponentFixture<TermsAndConditionsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TermsAndConditionsPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TermsAndConditionsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
