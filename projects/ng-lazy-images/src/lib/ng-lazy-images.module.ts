import { NgModule } from '@angular/core';
import { LazyLoadImagesDirective } from './directives/lazy-load-images.directive';

/**
 * Convenience module for NgModule-based applications.
 *
 * Standalone applications should import `LazyLoadImagesDirective` directly
 * instead.
 */
@NgModule({
  imports: [LazyLoadImagesDirective],
  exports: [LazyLoadImagesDirective],
})
export class NgLazyImagesModule {}
