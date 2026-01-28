import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TransitionMatrixTableComponent } from './transition-matrix-table.component';

describe('TransitionMatrixComponent', () => {
  let component: TransitionMatrixTableComponent;
  let fixture: ComponentFixture<TransitionMatrixTableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TransitionMatrixTableComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TransitionMatrixTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
