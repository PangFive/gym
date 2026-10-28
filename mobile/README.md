# Wegym for Android

A Flutter shell that opens https://pangfive.github.io/gym/ in a WebView, so the app always shows the
latest web version. It also handles the things a WebView cannot do on its own. The page reaches it
through the `WegymNative` channel (`native()` in `public/index.html`):

- **Google sign-in.** Native, and the ID token is handed to Firebase. Google blocks its sign-in page
  inside WebViews.
- **Sharing and saving exports.** Done with the Android share sheet.
- **Picking photos and files.** The camera opens for `capture`.
- **Keeping the screen on** during rest timers.
- **Outside links** (YouTube, AI Studio) open in their own apps.

## Build

Tools live in `D:\dev`: `flutter`, `jdk17` and `android-sdk`.

```
cd mobile
flutter build apk --release
```

The APK is written to `build/app/outputs/flutter-apk/app-release.apk`.

To install it on a phone connected over USB with USB debugging on, run `flutter install --release`.

## Release key

`android/key.properties` points to `D:/dev/keys/wegym-release.jks`. Neither file is in git. Back them
up: Android only accepts updates signed with the same key. Without `key.properties`, the build is
signed with the debug key.

## Google sign-in

The Firebase project `why-gym` needs an Android app with package `io.github.pangfive.wegym` and the
release key's SHA-1. Read it with:

```
keytool -list -v -keystore D:/dev/keys/wegym-release.jks -alias wegym
```

Until that is set up, sign-in with email works and Google sign-in shows an error.
