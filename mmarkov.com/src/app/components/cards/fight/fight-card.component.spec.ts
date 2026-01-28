import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FightCardComponent } from './fight-card.component';

describe('FightCardComponent', () => {
  let component: FightCardComponent;
  let fixture: ComponentFixture<FightCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FightCardComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FightCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
