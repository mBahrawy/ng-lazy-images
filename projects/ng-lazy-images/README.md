# Angular lazy load images

A very efficient image lazy loading tool based on user scroll.
for blazing-fast page loading, with High-resolution images. and also SEO optimized.

### [Demo](https://drive.google.com/file/d/1Od1liVLzJKieo6SSBRCRQHV_FY9vCOiI/view) | [Live Code Example](https://stackblitz.com/edit/angular-ia9mfp?file=README.md)

**Please note that this version is still under development**
[Github repo](https://github.com/mBahrawy/ng-lazy-images)


## Features
1. Lazy load image on scroll
2. Ability to use low-resolution image as a thumb, then it will be replaced with the HQ when loaded. (Beta version)
3. Ability to add a fullback image, It will be loaded when the image URL is broken or not found.
4. Ability to add loading a smooth loading effect
5. Toggle console debugging for scrolling event
6. Toggle force disable images caching
7. SEO, The library dedects if the platfom is a browser, then it fires the scrolling listner event.


## Setup

1. run: `npm i ng-lazy-images`
2. import `NgLazyImagesModule` in your app.module.ts
```
import { NgLazyImagesModule } from 'ng-lazy-images'
@NgModule({
  declarations: [
    AppComponent,
  ],
  imports: [
    BrowserModule,
    NgLazyImagesModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
```

3. Use the dicretive `ng-lazy-images` inside your<img> to enable this package.
```
  <img
    ng-lazy-images                                   -> Required
    [lazySrc]="YOUR_HQ_IMG_URL"                      -> Required
    [thumbSrc]="YOUR_THUMB_IMG_URL"                  -> Optional
    [errorLazySrc]="FALLBACK_ALTERVATIVE_IMG_LINK"   -> Optional
    [debug]="false"                                  -> Optional, Defualt is: false 
    [hasLoader]="true"                               -> Optional, Defualt is: false 
    [disableCaching]="false"                         -> Optional, Defualt is: false 
  />

```
** Cation! don't use the regualr HTMl `src` attribute, this will breake the package function, instead use the provided attributes in the previous example **


4. Adding needed styles inside your global styles file, this code is only required if you need to enable image loading animation effect.
```
::ng-deep img[ng-lazy-images] {
  &:not(.image-loaded, .thumb-loaded, .image-failed, .no-loader) {
    background-color: #000;
    animation-name: animation;
    animation-duration: 1s;
    animation-timing-function: ease-in-out;
    animation-iteration-count: infinite;
    animation-play-state: running;
  }
}

@-webkit-keyframes animation {
  0% {
    background-color: rgb(190, 190, 190);
  }

  50.0% {
    background-color: #ddd;
  }

  100.0% {
    background-color: rgb(190, 190, 190);
  }
}

@keyframes animation {
  0% {
    background-color: rgb(190, 190, 190);
  }

  50.0% {
    background-color: #ddd;
  }

  100.0% {
    background-color: rgb(190, 190, 190);
  }
}

``` 

5. Enjoy lazy load images, and high-speed performance.
