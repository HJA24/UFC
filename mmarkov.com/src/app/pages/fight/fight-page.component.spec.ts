import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FightPageComponent } from './fight-page.component';

describe('FightPageComponent', () => {
  let component: FightPageComponent;
  let fixture: ComponentFixture<FightPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FightPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FightPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
