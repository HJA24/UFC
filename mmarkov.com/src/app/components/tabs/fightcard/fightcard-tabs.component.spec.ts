import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FightcardTabsComponent } from './fightcard-tabs.component';

describe('FightcardTabsComponent', () => {
  let component: FightcardTabsComponent;
  let fixture: ComponentFixture<FightcardTabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FightcardTabsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FightcardTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
