import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VerifyAccountPageComponent } from './verify-account-page.component';

describe('VerifyAccountComponent', () => {
  let component: VerifyAccountPageComponent;
  let fixture: ComponentFixture<VerifyAccountPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerifyAccountPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VerifyAccountPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
