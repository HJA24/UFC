import { ComponentFixture, TestBed } from '@angular/core/testing';

import { FightMenuComponent } from './fight-menu.component';

describe('FightMenuComponent', () => {
  let component: FightMenuComponent;
  let fixture: ComponentFixture<FightMenuComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FightMenuComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FightMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
