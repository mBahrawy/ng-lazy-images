import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NgLazyImagesComponent } from './ng-lazy-images.component';

describe('NgLazyImagesComponent', () => {
  let component: NgLazyImagesComponent;
  let fixture: ComponentFixture<NgLazyImagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NgLazyImagesComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NgLazyImagesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
