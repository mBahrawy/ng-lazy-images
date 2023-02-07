import { NgModule } from '@angular/core';
import { NgLazyImagesComponent } from './ng-lazy-images.component';
import { LazyLoadImagesDirective } from './directives/lazy-load-images.directive';



@NgModule({
  declarations: [
    NgLazyImagesComponent,
    LazyLoadImagesDirective
  ],
  imports: [
  ],
  exports: [
    NgLazyImagesComponent
  ]
})
export class NgLazyImagesModule { }
