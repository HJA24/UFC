import { TestBed } from '@angular/core/testing';

import { FightLoadingService } from './fight-loading.service';

describe('FightLoadingService', () => {
  let service: FightLoadingService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(FightLoadingService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
