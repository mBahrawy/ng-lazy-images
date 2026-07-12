import { Injectable, NgZone, OnDestroy, inject } from '@angular/core';

interface ObserverEntry {
  observer: IntersectionObserver;
  callbacks: Map<Element, () => void>;
}

/**
 * Shares `IntersectionObserver` instances between every lazy image on the
 * page. Images with the same `rootMargin`/`threshold` reuse a single
 * observer, and all observers run outside the Angular zone so scrolling
 * never triggers change detection.
 */
@Injectable({ providedIn: 'root' })
export class LazyImageObserverService implements OnDestroy {
  private readonly ngZone = inject(NgZone);
  private readonly observers = new Map<string, ObserverEntry>();

  /**
   * Starts watching `element` and invokes `onVisible` (once) when it enters
   * the observed area. Returns an unsubscribe function.
   */
  observe(element: Element, init: IntersectionObserverInit, onVisible: () => void): () => void {
    const key = `${init.rootMargin ?? '0px'}|${String(init.threshold ?? 0)}`;

    let entry = this.observers.get(key);
    if (!entry) {
      const callbacks = new Map<Element, () => void>();
      // Constructed outside the zone: intersection callbacks for off-screen
      // scrolling must not wake Angular's change detection.
      const observer = this.ngZone.runOutsideAngular(
        () =>
          new IntersectionObserver((entries) => {
            for (const e of entries) {
              if (!e.isIntersecting) continue;
              const cb = callbacks.get(e.target);
              if (cb) {
                this.unobserve(e.target, key);
                this.ngZone.run(cb);
              }
            }
          }, init),
      );
      entry = { observer, callbacks };
      this.observers.set(key, entry);
    }

    entry.callbacks.set(element, onVisible);
    entry.observer.observe(element);
    return () => this.unobserve(element, key);
  }

  private unobserve(element: Element, key: string): void {
    const entry = this.observers.get(key);
    if (!entry) return;

    entry.observer.unobserve(element);
    entry.callbacks.delete(element);
    if (entry.callbacks.size === 0) {
      entry.observer.disconnect();
      this.observers.delete(key);
    }
  }

  ngOnDestroy(): void {
    for (const { observer } of this.observers.values()) {
      observer.disconnect();
    }
    this.observers.clear();
  }
}
