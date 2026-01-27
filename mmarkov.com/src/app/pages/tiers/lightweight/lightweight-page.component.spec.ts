import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LightweightPageComponent } from './lightweight-page.component';

describe('LightweightPageComponent', () => {
  let component: LightweightPageComponent;
  let fixture: ComponentFixture<LightweightPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LightweightPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LightweightPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
