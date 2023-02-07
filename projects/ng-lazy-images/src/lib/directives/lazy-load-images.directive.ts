import { Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostBinding,
  Input,
} from '@angular/core';

@Directive({
  selector: 'img[lazy-load-image]',
  host: {
    '(error)': 'errorHandler()',
    '(load)': 'imageLoadedCallback()',
  },
})
export class LazyLoadImagesDirective implements AfterViewInit, OnInit {
  @HostBinding('attr.src') srcAttr: string | null = null;
  @HostBinding('attr.class') classAttr: string | undefined;
  @Input() class!: string;
  @Input() lazySrc!: string;
  @Input() errorLazySrc!: string;
  @Input() thumbSrc!: string;
  @Input() thumbIdentifier!: string;
  @Input() debug!: boolean;
  @Input() hasLoader!: boolean;

  image!: string;
  isThumbLoaded: boolean = false;
  isImageLoaded: boolean = false;
  oringinalClasses!: string;

  config = {
    delay: 0,
    root: null,
    rootMargin: '0px 0px 0px 0px',
    thresholds: [0],
    trackVisibility: false,
  };

  constructor(
    private el: ElementRef,
    @Inject(PLATFORM_ID) private platformId: string
  ) {}

  ngOnInit(): void {
    this.image = this.lazySrc || 'no_image_provided';
    !this.thumbIdentifier && (this.thumbIdentifier = 'thumb');
    this.oringinalClasses = this.class || '';
    this.classAttr = this.oringinalClasses;
    this.hasLoader
      ? (this.classAttr = this.oringinalClasses)
      : (this.classAttr = this.oringinalClasses + ' no-loader');
  }

  ngAfterViewInit() {
    this.canLazyLoad() ? this.lazyLoadImage() : this.imageLoadingController();
  }

  // Check is the client is not robot for better SEO indexing
  private isBrowserOnly(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private imageLoadingController() {
    if (this.thumbSrc) {
      !this.isThumbLoaded ? this.loadThumb() : this.loadImage();
      return;
    }
    this.loadImage();
  }

  private canLazyLoad() {
    if (!this.isBrowserOnly()) return false;
    return window && 'IntersectionObserver' in window;
  }

  private lazyLoadImage() {
    const obs = new IntersectionObserver((entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          this.debug && console.log(entry);
          this.imageLoadingController();
          obs.unobserve(this.el.nativeElement);
        }
      });
    }, this.config);
    obs.observe(this.el.nativeElement);
  }

  private loadThumb() {
    if (this.isThumbLoaded) {
      this.loadImage();
      return;
    }

    this.srcAttr = this.thumbSrc;
  }

  private loadImage() {
    this.srcAttr = this.image;
    this.isImageLoaded = true;
  }

  private isThumb() {
    return this.srcAttr?.includes(this.thumbIdentifier) || false;
  }

  private imageLoadedCallback() {
    if (!this.srcAttr) return;

    this.debug &&
      this.isThumb() &&
      this.thumbSrc &&
      console.log('thumb->', this.srcAttr);
    this.debug && !this.isThumb() && console.log('img->', this.srcAttr);

    this.isThumbLoaded = this.isThumb();
    this.isThumbLoaded && this.loadImage();

    this.isThumbLoaded &&
      (this.classAttr = this.oringinalClasses + ' thumb-loaded');
    this.isImageLoaded &&
      (this.classAttr = this.oringinalClasses + ' image-loaded');
  }

  private errorHandler() {
    this.debug && console.error('Error loading->', this.srcAttr);
    this.srcAttr = this.errorLazySrc;
    this.classAttr = this.oringinalClasses + ' image-failed';
  }
}
