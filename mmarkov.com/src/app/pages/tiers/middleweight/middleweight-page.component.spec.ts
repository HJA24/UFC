import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MiddleweightPageComponent } from './middleweight-page.component';

describe('MiddleweightPageComponent', () => {
  let component: MiddleweightPageComponent;
  let fixture: ComponentFixture<MiddleweightPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MiddleweightPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MiddleweightPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
