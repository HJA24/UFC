import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FightTabsComponent } from './fight-tabs.component';

describe('FightTabsComponent', () => {
  let component: FightTabsComponent;
  let fixture: ComponentFixture<FightTabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FightTabsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FightTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
