import { TestBed } from '@angular/core/testing';

import { NgLazyImagesService } from './ng-lazy-images.service';

describe('NgLazyImagesService', () => {
  let service: NgLazyImagesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NgLazyImagesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
