import { NgModule } from '@angular/core';
import { LazyLoadImagesDirective } from './directives/lazy-load-images.directive';

@NgModule({
  declarations: [LazyLoadImagesDirective],
  imports: [],
  exports: [LazyLoadImagesDirective]
})
export class NgLazyImagesModule { }
