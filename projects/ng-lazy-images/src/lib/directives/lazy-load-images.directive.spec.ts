import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LazyLoadImagesDirective } from './lazy-load-images.directive';
import { provideNgLazyImages } from '../ng-lazy-images.config';

class MockIntersectionObserver implements IntersectionObserver {
  static instances: MockIntersectionObserver[] = [];

  readonly root = null;
  readonly scrollMargin = '0px';
  readonly rootMargin: string;
  readonly thresholds: ReadonlyArray<number>;
  readonly observed = new Set<Element>();

  constructor(
    private readonly callback: IntersectionObserverCallback,
    init?: IntersectionObserverInit,
  ) {
    this.rootMargin = init?.rootMargin ?? '0px';
    const threshold = init?.threshold ?? 0;
    this.thresholds = Array.isArray(threshold) ? threshold : [threshold];
    MockIntersectionObserver.instances.push(this);
  }

  observe(element: Element): void {
    this.observed.add(element);
  }

  unobserve(element: Element): void {
    this.observed.delete(element);
  }

  disconnect(): void {
    this.observed.clear();
  }

  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }

  enterViewport(element: Element): void {
    this.callback([{ isIntersecting: true, target: element } as IntersectionObserverEntry], this);
  }
}

@Component({
  imports: [LazyLoadImagesDirective],
  template: `
    <img
      ng-lazy-images
      [lazySrc]="src()"
      [thumbSrc]="thumb()"
      [errorLazySrc]="fallback()"
      [disableCaching]="disableCaching()"
      [eager]="eager()"
      [hasLoader]="hasLoader()"
      (thumbLoaded)="thumbLoads.push($event)"
      (imageLoaded)="imageLoads.push($event)"
      (imageError)="imageErrors.push($event)"
    />
  `,
})
class HostComponent {
  readonly src = signal('https://images.test/full.jpg');
  readonly thumb = signal<string | undefined>(undefined);
  readonly fallback = signal<string | undefined>(undefined);
  readonly disableCaching = signal(false);
  readonly eager = signal(false);
  readonly hasLoader = signal(false);

  thumbLoads: string[] = [];
  imageLoads: string[] = [];
  imageErrors: string[] = [];
}

describe('LazyLoadImagesDirective', () => {
  const realIntersectionObserver = globalThis.IntersectionObserver;
  let fixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  beforeEach(() => {
    MockIntersectionObserver.instances = [];
    (globalThis as Record<string, unknown>)['IntersectionObserver'] = MockIntersectionObserver;
  });

  afterEach(() => {
    (globalThis as Record<string, unknown>)['IntersectionObserver'] = realIntersectionObserver;
  });

  function createHost(setup?: (component: HostComponent) => void): HTMLImageElement {
    fixture = TestBed.createComponent(HostComponent);
    host = fixture.componentInstance;
    setup?.(host);
    fixture.detectChanges();
    return fixture.nativeElement.querySelector('img') as HTMLImageElement;
  }

  function observer(): MockIntersectionObserver {
    expect(MockIntersectionObserver.instances.length).toBeGreaterThan(0);
    return MockIntersectionObserver.instances[MockIntersectionObserver.instances.length - 1];
  }

  function dispatch(img: HTMLImageElement, type: 'load' | 'error'): void {
    img.dispatchEvent(new Event(type));
    fixture.detectChanges();
  }

  it('does not load the image before it enters the viewport', () => {
    const img = createHost();

    expect(img.getAttribute('src')).toBeNull();
    expect(observer().observed.has(img)).toBe(true);
  });

  it('loads the image once it enters the viewport', () => {
    const img = createHost();

    observer().enterViewport(img);
    fixture.detectChanges();
    expect(img.getAttribute('src')).toBe(host.src());

    dispatch(img, 'load');
    expect(img.classList.contains('image-loaded')).toBe(true);
    expect(host.imageLoads.length).toBe(1);
  });

  it('loads the thumb first, then swaps in the full image', () => {
    const img = createHost((component) => component.thumb.set('https://images.test/thumb.jpg'));

    observer().enterViewport(img);
    fixture.detectChanges();
    expect(img.getAttribute('src')).toBe('https://images.test/thumb.jpg');

    dispatch(img, 'load');
    expect(img.classList.contains('thumb-loaded')).toBe(true);
    expect(img.getAttribute('src')).toBe(host.src());
    expect(host.thumbLoads.length).toBe(1);

    dispatch(img, 'load');
    expect(img.classList.contains('image-loaded')).toBe(true);
    expect(img.classList.contains('thumb-loaded')).toBe(false);
    expect(host.imageLoads.length).toBe(1);
  });

  it('falls back to the error image when loading fails', () => {
    const img = createHost((component) => component.fallback.set('https://images.test/broken.png'));

    observer().enterViewport(img);
    fixture.detectChanges();
    dispatch(img, 'error');

    expect(img.classList.contains('image-failed')).toBe(true);
    expect(img.getAttribute('src')).toBe('https://images.test/broken.png');
    expect(host.imageErrors.length).toBe(1);
  });

  it('skips a failing thumb and loads the full image directly', () => {
    const img = createHost((component) => component.thumb.set('https://images.test/thumb.jpg'));

    observer().enterViewport(img);
    fixture.detectChanges();
    dispatch(img, 'error');

    expect(img.getAttribute('src')).toBe(host.src());
  });

  it('appends a cache-busting parameter when caching is disabled', () => {
    const img = createHost((component) => component.disableCaching.set(true));

    observer().enterViewport(img);
    fixture.detectChanges();

    expect(img.getAttribute('src')).toMatch(/full\.jpg\?_ngLazyBust=\d+$/);
  });

  it('loads immediately when eager is set', () => {
    const img = createHost((component) => component.eager.set(true));

    expect(MockIntersectionObserver.instances.length).toBe(0);
    expect(img.getAttribute('src')).toBe(host.src());
  });

  it('toggles the no-loader class from the hasLoader input', () => {
    const img = createHost();
    expect(img.classList.contains('no-loader')).toBe(true);

    host.hasLoader.set(true);
    fixture.detectChanges();
    expect(img.classList.contains('no-loader')).toBe(false);
  });

  it('shares one IntersectionObserver across images with the same settings', () => {
    @Component({
      imports: [LazyLoadImagesDirective],
      template: `
        <img ng-lazy-images lazySrc="https://images.test/a.jpg" />
        <img ng-lazy-images lazySrc="https://images.test/b.jpg" />
      `,
    })
    class MultiHostComponent {}

    const multiFixture = TestBed.createComponent(MultiHostComponent);
    multiFixture.detectChanges();

    expect(MockIntersectionObserver.instances.length).toBe(1);
    expect(MockIntersectionObserver.instances[0].observed.size).toBe(2);
  });

  it('stops observing when the image is destroyed', () => {
    const img = createHost();
    const activeObserver = observer();
    expect(activeObserver.observed.has(img)).toBe(true);

    fixture.destroy();
    expect(activeObserver.observed.size).toBe(0);
  });

  it('restarts the load cycle when lazySrc changes', () => {
    const img = createHost();

    observer().enterViewport(img);
    fixture.detectChanges();
    dispatch(img, 'load');
    expect(img.classList.contains('image-loaded')).toBe(true);

    host.src.set('https://images.test/other.jpg');
    fixture.detectChanges();

    expect(img.classList.contains('image-loaded')).toBe(false);
    observer().enterViewport(img);
    fixture.detectChanges();
    expect(img.getAttribute('src')).toBe('https://images.test/other.jpg');
  });

  it('uses global defaults from provideNgLazyImages', () => {
    TestBed.configureTestingModule({
      providers: [provideNgLazyImages({ rootMargin: '250px 0px', errorSrc: 'https://images.test/global-broken.png' })],
    });

    const img = createHost();
    expect(observer().rootMargin).toBe('250px 0px');

    observer().enterViewport(img);
    fixture.detectChanges();
    dispatch(img, 'error');
    expect(img.getAttribute('src')).toBe('https://images.test/global-broken.png');
  });
});
