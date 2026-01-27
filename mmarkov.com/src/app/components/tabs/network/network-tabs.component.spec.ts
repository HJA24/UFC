import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NetworkTabsComponent } from './network-tabs.component';

describe('NetworkTabsComponent', () => {
  let component: NetworkTabsComponent;
  let fixture: ComponentFixture<NetworkTabsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [NetworkTabsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NetworkTabsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
