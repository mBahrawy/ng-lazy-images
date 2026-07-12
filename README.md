# ng-lazy-images

> Blazing-fast, zoneless-ready image lazy loading for Angular — IntersectionObserver-based, with blur-up thumbnails, error fallbacks and SSR support.

[![npm](https://img.shields.io/npm/v/ng-lazy-images?color=cb3837&logo=npm)](https://www.npmjs.com/package/ng-lazy-images)
[![Angular](https://img.shields.io/badge/Angular-22-dd0031?logo=angular)](https://angular.dev)
[![Signals](https://img.shields.io/badge/signals-native-blueviolet)](https://angular.dev/guide/signals)
[![Zoneless](https://img.shields.io/badge/zoneless-ready-success)](https://angular.dev/guide/zoneless)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Images are only downloaded when they are about to scroll into view. Until then the browser does nothing — no wasted bandwidth, no layout jank, and a much faster initial page load.

```html
<img ng-lazy-images
     [lazySrc]="photo.url"
     [thumbSrc]="photo.tinyUrl"
     [errorLazySrc]="'assets/broken.png'" />
```

That's it. The directive owns the `src` attribute and walks the image through
`thumb → full resolution → (fallback on error)` as the user scrolls.

---

## Table of contents

- [Features](#features)
- [Version compatibility](#version-compatibility)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Examples](#examples)
- [API reference](#api-reference)
- [Styling & CSS hooks](#styling--css-hooks)
- [SSR & SEO](#ssr--seo)
- [Performance notes](#performance-notes)
- [Migrating from 1.x](#migrating-from-1x)

---

## Features

- 🚀 **Lazy loading on scroll** — powered by a single shared `IntersectionObserver`, not one per image
- 🖼️ **Blur-up thumbnails** — show a tiny placeholder instantly, swap in the full image when it arrives
- 🛟 **Error fallbacks** — broken URL? A fallback image takes its place automatically
- ⚡ **Zoneless & signals native** — built on Angular signals; scrolling never triggers change detection
- 🌐 **SSR & SEO friendly** — server renders the real URL with native `loading="lazy"` so crawlers index your images; hydration adopts the already-rendered image without re-downloading it
- 🎯 **Preload margin** — start downloads *before* images enter the viewport (`rootMargin`)
- 🧩 **Standalone directive** — import it directly, or keep using `NgLazyImagesModule`
- 📡 **Load events** — `(thumbLoaded)`, `(imageLoaded)`, `(imageError)` outputs
- 🧯 **Graceful degradation** — falls back to native `loading="lazy"` on browsers without `IntersectionObserver`

## Version compatibility

| ng-lazy-images | Angular | Change detection | TypeScript | Status |
|:--------------:|:-------:|:-----------------|:----------:|:-------|
| **2.x** | ^22.0.0 | Zoneless ✅ (works with zone.js apps too) | ≥ 6.0 | ✅ Active |
| **1.x** | ^13.3.0 | zone.js required | ≥ 4.6 | 🛑 Legacy — bug fixes only |

```bash
npm install ng-lazy-images        # 2.x — Angular 22+
npm install ng-lazy-images@1      # 1.x — Angular 13 era apps
```

> The 1.x docs and StackBlitz demo live on the [v1 npm page](https://www.npmjs.com/package/ng-lazy-images/v/1.0.0).

## Installation

```bash
npm install ng-lazy-images
```

## Quick start

### Standalone (recommended)

```ts
import { Component } from '@angular/core';
import { LazyLoadImagesDirective } from 'ng-lazy-images';

@Component({
  selector: 'app-gallery',
  imports: [LazyLoadImagesDirective],
  template: `
    <img ng-lazy-images [lazySrc]="'https://picsum.photos/1200/800'" />
  `,
})
export class GalleryComponent {}
```

### NgModule apps

```ts
import { NgLazyImagesModule } from 'ng-lazy-images';

@NgModule({
  imports: [NgLazyImagesModule],
})
export class AppModule {}
```

> ⚠️ Never set the native `src` attribute yourself — the directive owns it.
> Use `[lazySrc]` instead.

## Examples

### Blur-up thumbnail (LQIP)

Show a tiny low-quality image immediately; the full image replaces it once downloaded:

```html
<img ng-lazy-images
     [lazySrc]="'https://cdn.example.com/photo-1600.jpg'"
     [thumbSrc]="'https://cdn.example.com/photo-24.jpg'" />
```

```css
img[ng-lazy-images].thumb-loaded { filter: blur(8px); }
img[ng-lazy-images].image-loaded { filter: none; transition: filter 300ms ease-out; }
```

### Error fallback

```html
<img ng-lazy-images
     [lazySrc]="user.avatarUrl"
     [errorLazySrc]="'assets/default-avatar.png'" />
```

If `lazySrc` fails, the fallback is shown and the element gets the `image-failed` class. If the thumb fails, the directive skips straight to the full image.

### Start loading before the image is visible

Give the browser a head start so users never see an empty box:

```html
<img ng-lazy-images
     [lazySrc]="photo.url"
     rootMargin="300px 0px" />
```

Or set it once for the whole app:

```ts
import { bootstrapApplication } from '@angular/platform-browser';
import { provideNgLazyImages } from 'ng-lazy-images';

bootstrapApplication(AppComponent, {
  providers: [
    provideNgLazyImages({
      rootMargin: '300px 0px',
      errorSrc: 'assets/broken.png',   // global fallback for every image
    }),
  ],
});
```

### Above-the-fold images

Hero images should not wait for an intersection — load them eagerly and keep all the other goodies (thumb, fallback, events):

```html
<img ng-lazy-images eager
     [lazySrc]="hero.url"
     [thumbSrc]="hero.thumbUrl" />
```

### React to load events

```html
<img ng-lazy-images
     [lazySrc]="photo.url"
     (thumbLoaded)="onThumb($event)"
     (imageLoaded)="onLoaded($event)"
     (imageError)="onError($event)" />
```

Each output emits the URL involved, so analytics and retry logic are one-liners.

### Lists & recycled rows

`lazySrc` is a signal input — change it and the directive restarts the whole cycle (observe → thumb → full). Perfect for virtual scrolling:

```html
@for (item of items(); track item.id) {
  <img ng-lazy-images [lazySrc]="item.imageUrl" [thumbSrc]="item.thumbUrl" />
}
```

### Cache busting

Force a fresh request on every load (e.g. images regenerated server-side under the same URL):

```html
<img ng-lazy-images [lazySrc]="report.chartUrl" disableCaching />
```

## API reference

### Directive: `img[ng-lazy-images]` (alias `img[ngLazyImages]`)

Exported as `LazyLoadImagesDirective` (standalone).

#### Inputs

| Input | Type | Default | Description |
|---|---|---|---|
| `lazySrc` | `string` | **required** | URL of the full-resolution image. |
| `thumbSrc` | `string` | — | Low-res placeholder loaded first, swapped for `lazySrc` once it arrives. |
| `errorLazySrc` | `string` | — | Fallback image used when `lazySrc` fails. |
| `rootMargin` | `string` | `'0px'` | Margin around the viewport that triggers loading early, e.g. `'300px 0px'`. |
| `threshold` | `number \| number[]` | `0` | How much of the image must be visible before loading starts. |
| `eager` | `boolean` | `false` | Skip the viewport check and load immediately. |
| `hasLoader` | `boolean` | `false` | Marks the image as styled by a loading animation (omits the `no-loader` class). |
| `disableCaching` | `boolean` | `false` | Appends a cache-busting query parameter to every request. |
| `debug` | `boolean` | `false` | Logs the directive's lifecycle to the console. |

#### Outputs

| Output | Payload | Fired when |
|---|---|---|
| `thumbLoaded` | `string` (URL) | The placeholder has been displayed. |
| `imageLoaded` | `string` (URL) | The full-resolution image finished loading. |
| `imageError` | `string` (URL) | The full-resolution image failed to load. |

### Global configuration: `provideNgLazyImages(config)`

| Option | Type | Description |
|---|---|---|
| `rootMargin` | `string` | Default preload margin for all images. |
| `threshold` | `number \| number[]` | Default intersection threshold. |
| `errorSrc` | `string` | App-wide fallback image for failed loads. |
| `debug` | `boolean` | Enable logging for every instance. |

Per-image inputs always win over global config.

## Styling & CSS hooks

The directive reflects its state as CSS classes on the `<img>` element:

| Class | Meaning |
|---|---|
| `thumb-loaded` | The placeholder is displayed; the full image is downloading. |
| `image-loaded` | The full-resolution image is displayed. |
| `image-failed` | Loading failed (fallback shown if configured). |
| `no-loader` | Present unless `hasLoader` is set — lets your CSS skip the loading animation. |

### Pulsing skeleton while loading

Add this to your **global** stylesheet and set `hasLoader` on the images that should pulse:

```css
img[ng-lazy-images]:not(.image-loaded):not(.thumb-loaded):not(.image-failed):not(.no-loader) {
  background-color: #bebebe;
  animation: ng-lazy-pulse 1s ease-in-out infinite;
}

@keyframes ng-lazy-pulse {
  0%, 100% { background-color: #bebebe; }
  50%      { background-color: #dddddd; }
}
```

> 💡 Give images an explicit `width`/`height` (or `aspect-ratio`) so the page doesn't shift when they load — good for CLS scores too.

## SSR & SEO

- **On the server** the directive renders the *final* image URL with native `loading="lazy"` — crawlers index the real image, and browsers without JavaScript still show it.
- **During hydration** an image already rendered by the server is *adopted*, not re-downloaded: no flash, no duplicate request.
- **Bots and non-browser platforms** never depend on scroll events or `IntersectionObserver`.

Nothing to configure — this is automatic.

## Performance notes

What makes 2.x fast:

1. **One `IntersectionObserver` for the whole page.** All images sharing the same `rootMargin`/`threshold` are served by a single observer instead of one observer per image.
2. **Zero change detection while scrolling.** Observers run outside Angular; the app is only woken up at the moment an image actually needs to load. Fully compatible with zoneless applications.
3. **Signal-based state.** Class changes are fine-grained host bindings — no `ngClass` juggling, no full-attribute rewrites.
4. **`decoding="async"`** is applied automatically so image decode never blocks the main thread.
5. **Observers are released** the instant they're no longer needed (image loaded or destroyed) — no leaks in long-lived SPAs.

## Migrating from 1.x

Templates keep working — the selector, all 1.x inputs and all CSS classes are unchanged. What's different:

| | 1.x | 2.x |
|---|---|---|
| Angular | 13 (zone.js) | 22 (zoneless-ready) |
| Import | `NgLazyImagesModule` | `LazyLoadImagesDirective` (module still available) |
| `class` input | Required for custom classes | **Removed** — plain `class`/`[ngClass]` now work natively |
| Observers | One per image, never released | Shared, auto-released |
| Thumb URL | Mutated with an internal marker suffix | Requested exactly as provided |
| Events | — | `(thumbLoaded)`, `(imageLoaded)`, `(imageError)` |
| Global defaults | — | `provideNgLazyImages({...})` |
| SSR | Thumb chain rendered on server | Final URL + native `loading="lazy"`, hydration-safe |

Steps:

1. `npm install ng-lazy-images@2`
2. If you passed `[class]="..."` to the directive, replace it with a regular `class` attribute or `[ngClass]`.
3. Optionally switch `NgLazyImagesModule` imports to the standalone `LazyLoadImagesDirective`.

## Development

This repo is an Angular CLI library workspace. It requires **Node.js ^22.22.3 || ^24.15.0 || >=26** (Angular 22 tooling).

```bash
npm install
npm run build     # builds dist/ng-lazy-images with ng-packagr
npm test          # runs the vitest unit tests
```

The publishable package lives in [projects/ng-lazy-images/](projects/ng-lazy-images/); publish from `dist/ng-lazy-images` after a production build.

## License

MIT © [Mohamed Bahrawy](https://www.linkedin.com/in/mbahrawy)
