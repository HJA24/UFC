import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CookiesPolicyPageComponent } from './cookies-policy-page.component';

describe('CookiesPolicyPageComponent', () => {
  let component: CookiesPolicyPageComponent;
  let fixture: ComponentFixture<CookiesPolicyPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CookiesPolicyPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CookiesPolicyPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
