import { isPlatformBrowser } from '@angular/common';
import {
  DestroyRef,
  Directive,
  ElementRef,
  OnInit,
  PLATFORM_ID,
  Renderer2,
  booleanAttribute,
  effect,
  inject,
  input,
  output,
  signal,
  untracked,
} from '@angular/core';
import { NG_LAZY_IMAGES_CONFIG } from '../ng-lazy-images.config';
import { LazyImageObserverService } from '../services/lazy-image-observer.service';

type LazyImageState =
  | 'idle'
  | 'observing'
  | 'loading-thumb'
  | 'thumb-shown'
  | 'loading-image'
  | 'loaded'
  | 'failed';

type RequestKind = 'thumb' | 'image' | 'fallback';

/**
 * Defers loading of an `<img>` until it is about to enter the viewport.
 *
 * ```html
 * <img ng-lazy-images
 *      [lazySrc]="photo.url"
 *      [thumbSrc]="photo.thumbUrl"
 *      [errorLazySrc]="'assets/broken.png'" />
 * ```
 *
 * Do not set the native `src` attribute yourself — the directive owns it.
 * State is reflected through the `thumb-loaded`, `image-loaded`,
 * `image-failed` and `no-loader` CSS classes.
 */
@Directive({
  selector: 'img[ng-lazy-images], img[ngLazyImages]',
  host: {
    '[class.no-loader]': '!hasLoader()',
    '[class.thumb-loaded]': 'state() === "thumb-shown"',
    '[class.image-loaded]': 'state() === "loaded"',
    '[class.image-failed]': 'state() === "failed"',
    '(load)': 'onLoad()',
    '(error)': 'onError()',
  },
})
export class LazyLoadImagesDirective implements OnInit {
  /** URL of the full-resolution image. */
  readonly lazySrc = input.required<string>();

  /** Optional low-resolution placeholder shown while `lazySrc` downloads. */
  readonly thumbSrc = input<string>();

  /** Optional fallback image shown when `lazySrc` fails to load. */
  readonly errorLazySrc = input<string>();

  /** Per-image override of the preload margin, e.g. `'200px 0px'`. */
  readonly rootMargin = input<string>();

  /** Per-image override of the intersection threshold. */
  readonly threshold = input<number | number[]>();

  /** Log the directive's lifecycle to the console. */
  readonly debug = input(false, { transform: booleanAttribute });

  /**
   * Marks the image as styled by a loading effect: leaves out the
   * `no-loader` class so the CSS loading animation applies.
   */
  readonly hasLoader = input(false, { transform: booleanAttribute });

  /** Append a cache-busting query parameter to every request. */
  readonly disableCaching = input(false, { transform: booleanAttribute });

  /** Skip the viewport check and load immediately (above-the-fold images). */
  readonly eager = input(false, { transform: booleanAttribute });

  /** Emits the thumb URL once the placeholder has been displayed. */
  readonly thumbLoaded = output<string>();

  /** Emits the final URL once the full-resolution image has loaded. */
  readonly imageLoaded = output<string>();

  /** Emits the failing URL when the full-resolution image cannot load. */
  readonly imageError = output<string>();

  protected readonly state = signal<LazyImageState>('idle');

  private readonly el: HTMLImageElement = inject(ElementRef).nativeElement;
  private readonly renderer = inject(Renderer2);
  private readonly observerService = inject(LazyImageObserverService);
  private readonly config = inject(NG_LAZY_IMAGES_CONFIG, { optional: true }) ?? {};
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private kind: RequestKind = 'image';
  private cacheBuster: string | null = null;
  private unobserve: (() => void) | null = null;
  private lastSources: string | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopObserving());

    // Restart the load cycle whenever the source inputs change after init
    // (e.g. recycled rows in a virtualized list).
    effect(() => {
      const sources = this.sourcesKey();
      untracked(() => {
        if (this.lastSources !== null && this.lastSources !== sources) {
          this.setup();
        }
      });
    });
  }

  ngOnInit(): void {
    // A pre-existing src means the image was already rendered — typically by
    // SSR before hydration. Adopt it instead of re-triggering a download.
    if (this.isBrowser && this.el.getAttribute('src')) {
      this.adoptExistingImage();
      return;
    }
    this.setup();
  }

  private sourcesKey(): string {
    return `${this.lazySrc()}|${this.thumbSrc() ?? ''}`;
  }

  private setup(): void {
    this.lastSources = untracked(() => this.sourcesKey());
    this.stopObserving();
    this.state.set('idle');
    this.cacheBuster = this.disableCaching() ? String(Date.now()) : null;

    if (!this.isBrowser) {
      // On the server, render the final URL with native lazy loading so
      // crawlers index the real image.
      this.renderer.setAttribute(this.el, 'loading', 'lazy');
      this.setSrc(this.lazySrc(), 'image');
      return;
    }

    if (!this.el.hasAttribute('decoding')) {
      this.renderer.setAttribute(this.el, 'decoding', 'async');
    }

    if (this.eager()) {
      this.beginLoad();
      return;
    }

    if (typeof IntersectionObserver === 'undefined') {
      // No IntersectionObserver support: defer to the browser's native
      // lazy loading instead of loading everything upfront.
      this.renderer.setAttribute(this.el, 'loading', 'lazy');
      this.beginLoad();
      return;
    }

    this.state.set('observing');
    this.unobserve = this.observerService.observe(
      this.el,
      {
        rootMargin: this.rootMargin() ?? this.config.rootMargin ?? '0px',
        threshold: this.threshold() ?? this.config.threshold ?? 0,
      },
      () => {
        this.unobserve = null;
        this.log('entered viewport', this.lazySrc());
        this.beginLoad();
      },
    );
  }

  private adoptExistingImage(): void {
    this.lastSources = this.sourcesKey();
    this.kind = 'image';
    if (!this.el.complete) {
      // Still downloading — the (load)/(error) host listeners take over.
      this.state.set('loading-image');
      return;
    }
    if (this.el.naturalWidth > 0) {
      this.state.set('loaded');
      this.imageLoaded.emit(this.el.currentSrc || this.el.src);
    } else {
      this.onError();
    }
  }

  private beginLoad(): void {
    const thumb = this.thumbSrc();
    if (thumb) {
      this.state.set('loading-thumb');
      this.setSrc(thumb, 'thumb');
    } else {
      this.state.set('loading-image');
      this.setSrc(this.lazySrc(), 'image');
    }
  }

  private setSrc(url: string, kind: RequestKind): void {
    this.kind = kind;
    const finalUrl =
      kind !== 'fallback' && this.cacheBuster
        ? `${url}${url.includes('?') ? '&' : '?'}_ngLazyBust=${this.cacheBuster}`
        : url;
    this.renderer.setAttribute(this.el, 'src', finalUrl);
  }

  private stopObserving(): void {
    this.unobserve?.();
    this.unobserve = null;
  }

  protected onLoad(): void {
    const loadedSrc = this.el.currentSrc || this.el.src;
    switch (this.kind) {
      case 'thumb':
        this.log('thumb loaded', loadedSrc);
        this.state.set('thumb-shown');
        this.thumbLoaded.emit(loadedSrc);
        this.setSrc(this.lazySrc(), 'image');
        break;
      case 'image':
        this.log('image loaded', loadedSrc);
        this.state.set('loaded');
        this.imageLoaded.emit(loadedSrc);
        break;
      case 'fallback':
        this.log('fallback image loaded', loadedSrc);
        break;
    }
  }

  protected onError(): void {
    const failedSrc = this.el.currentSrc || this.el.src;
    switch (this.kind) {
      case 'thumb':
        this.log('thumb failed, loading full image instead', failedSrc);
        this.state.set('loading-image');
        this.setSrc(this.lazySrc(), 'image');
        break;
      case 'image': {
        this.log('image failed', failedSrc);
        this.state.set('failed');
        this.imageError.emit(failedSrc);
        const fallback = this.errorLazySrc() ?? this.config.errorSrc;
        if (fallback) {
          this.setSrc(fallback, 'fallback');
        }
        break;
      }
      case 'fallback':
        this.log('fallback image failed as well, giving up', failedSrc);
        break;
    }
  }

  private log(message: string, detail: string): void {
    if (this.debug() || this.config.debug) {
      console.log(`[ng-lazy-images] ${message}:`, detail);
    }
  }
}
