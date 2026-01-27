import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeavyweightPageComponent } from './heavyweight-page.component';

describe('HeavyweightPageComponent', () => {
  let component: HeavyweightPageComponent;
  let fixture: ComponentFixture<HeavyweightPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeavyweightPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(HeavyweightPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
