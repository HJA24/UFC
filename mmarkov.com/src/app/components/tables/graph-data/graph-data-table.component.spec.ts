import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GraphDataTableComponent } from './graph-data-table.component';

describe('GraphDataTableComponent', () => {
  let component: GraphDataTableComponent;
  let fixture: ComponentFixture<GraphDataTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GraphDataTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GraphDataTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
