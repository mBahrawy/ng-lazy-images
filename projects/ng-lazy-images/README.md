# Angular lazy load images

A very efficient image lazy loading tool based on user scroll.
for blazing-fast page loading, with High-resolution images.

### [Demo](https://drive.google.com/file/d/1Od1liVLzJKieo6SSBRCRQHV_FY9vCOiI/view) | [Live Code Example](https://stackblitz.com/edit/angular-ia9mfp?file=README.md)

**Please note that this version is still under development**
[Github repo](https://github.com/mBahrawy/ng-lazy-images)


## Features
1. Lazy load image on scroll
2. Ability to use low-resolution image as a thumb, then it will be replaced with the HQ when loaded. (this feature is coming soon)
3. Ability to add a fullback image, It will be loaded when the image URL is broken or not found.
4. Ability to add loading a smooth loading effect
5. Toggle debugging 


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
    [errorLazySrc]="FALLBACK_ALTERVATIVE_IMG_LINK"   -> Optional
    [debug]="false"                                  -> Optional
    [hasLoader]="true"                               -> Optional
  />

```

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
