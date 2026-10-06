import { TestBed } from '@angular/core/testing';

import { ServiceApi } from './service';

describe('Service', () => {
  let service: ServiceApi;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ServiceApi);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
