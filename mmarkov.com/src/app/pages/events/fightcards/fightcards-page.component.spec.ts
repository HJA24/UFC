import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FightcardsPageComponent } from './fightcards-page.component';

describe('FightcardsPageComponent', () => {
  let component: FightcardsPageComponent;
  let fixture: ComponentFixture<FightcardsPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FightcardsPageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FightcardsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
