import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TiersPageComponent } from './tiers-page.component';

describe('TiersPageComponent', () => {
  let component: TiersPageComponent;
  let fixture: ComponentFixture<TiersPageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TiersPageComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TiersPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
