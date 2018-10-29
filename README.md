# ignite-crashlytics

An [ignite plugin](https://github.com/infinitered/ignite) for [Crashlytics](https://firebase.google.com/docs/crashlytics/) via [react-native-fabric](https://github.com/corymsmith/react-native-fabric).

⚠️ DISCLAIMER: This was previously `ignite-fabric`, and you can still find `ignite-fabric` on npm, that should work, but we will no longer support it.

This plugin has been adapted to work with the new installation of Crashlytics as stated in [Google's Documentation](https://firebase.google.com/docs/crashlytics/get-started).

Therefore, we can't assure that all features of `react-native-fabric` will work with that installation.

## Compatibility

RN Version | ignite-crashlytics Version
--- | ---
0.57.3+ | 0.0.2+
0.55.4- | 0.0.1

## Prerequisites

You will need to have a Firebase project and the configuration files (`google-services.json` for Android, `GoogleService-Info.plist` for iOS) in your project.

## How to add/remove

```
ignite add ignite-crashlytics
ignite remove ignite-crashlytics
```

## What does it do

Basically: https://firebase.google.com/docs/crashlytics/get-started

* iOS:
    * Creating a `Podfile` in `ios/` if you don't have one
    * Adding the  Fabric and Crashlytics pods to the `Podfile`
    * Installing pods (don't forget to use `YourProject.xcworkspace` and not the `.xcodeproj` afterwards)
    * Add the Firebase initialization to `AppDelegate.m`
* Android:
    * Adding the needed bits of code in `build.gradle` and `MainApplication.java` (if you haven't changed the default `react-native init` structure)
* Adding `react-native-fabric`

## Manual steps left to do

When adding:

```
- iOS:
    -> Add the 'Script build phase' as stated in the documentation (see links above)
- Android: good to go!
```

When removing:
```
Remove the 'Script build phase' from your iOS project
```

## Thanks

Thanks [@skellock](https://github.com/skellock) for the help and [@infinitered](https://github.com/infinitered/) for the awesome job you guys are doing :)
