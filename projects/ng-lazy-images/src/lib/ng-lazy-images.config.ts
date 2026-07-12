import { EnvironmentProviders, InjectionToken, makeEnvironmentProviders } from '@angular/core';

/**
 * Global defaults for every `ng-lazy-images` directive instance.
 * Any option can still be overridden per-image through the directive inputs.
 */
export interface NgLazyImagesConfig {
  /**
   * Margin around the viewport used to start loading images *before* they
   * become visible, e.g. `'200px 0px'` preloads images 200px ahead of scroll.
   * Default: `'0px'`.
   */
  rootMargin?: string;

  /**
   * Percentage of the image that must intersect the viewport before loading
   * starts (0 = first pixel, 1 = fully visible). Default: `0`.
   */
  threshold?: number | number[];

  /**
   * Fallback image applied when loading fails and the image has no
   * `errorSrc` of its own.
   */
  errorSrc?: string;

  /** Enable verbose console logging for every instance. Default: `false`. */
  debug?: boolean;
}

export const NG_LAZY_IMAGES_CONFIG = new InjectionToken<NgLazyImagesConfig>('NG_LAZY_IMAGES_CONFIG');

/**
 * Registers application-wide defaults for `ng-lazy-images`.
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideNgLazyImages({ rootMargin: '200px 0px', errorSrc: '/assets/broken.png' }),
 *   ],
 * });
 * ```
 */
export function provideNgLazyImages(config: NgLazyImagesConfig): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: NG_LAZY_IMAGES_CONFIG, useValue: config }]);
}
