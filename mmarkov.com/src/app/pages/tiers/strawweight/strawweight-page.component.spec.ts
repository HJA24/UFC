import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StrawweightPageComponent } from './strawweight-page.component';

describe('StrawweightPageComponent', () => {
  let component: StrawweightPageComponent;
  let fixture: ComponentFixture<StrawweightPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StrawweightPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(StrawweightPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
