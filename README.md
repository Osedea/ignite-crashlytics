# ignite-fabric

An [ignite plugin](https://github.com/infinitered/ignite) for [react-native-fabric](https://github.com/corymsmith/react-native-fabric).

## How to add/remove

```
ignite add ignite-fabric
ignite remove ignite-fabric
```

## What does it do

Basically, most of: [https://fabric.io/kits/ios/crashlytics/install](https://fabric.io/kits/ios/crashlytics/install) and [https://fabric.io/kits/android/crashlytics/install](https://fabric.io/kits/android/crashlytics/install)

* Adding `react-native-fabric`
* iOS:
    * Creating a `Podfile` in `ios/` if you don't have one
    * Adding the  Fabric and Crashlytics pods to the `Podfile`
    * Installing pods (don't forget to use `YourProject.xcworkspace` and not the `.xcodeproj` afterwards)
    * Adding a placeholder in your `Info.plist` to put your FABRIC_API_KEY
* Android:
    * Adding the needed bits of code in `build.gradle` and `MainApplication.java` (if you haven't changed the default `react-native init` structure)
    * Adding a placeholder in `AndroidManifest.xml` to put your FABRIC_API_KEY

## Manual steps left to do

When adding:

```
- iOS:
    -> Add the 'Script build phase' as stated in the documentation (see links above)
    -> Replace the FABRIC_API_KEY in 'ios/${name}/Info.plist'
- Android:
    -> Replace the FABRIC_API_KEY in 'android/app/src/main/AndroidManifest.xml'
```

When removing:
```
Remove your Fabric API Key from:
    - ${process.cwd()}/android/app/src/main/AndroidManifest.xml
    - ${process.cwd()}/ios/${name}/Info.plist

Remove the iOS script build phase
```

**Disclosure**: I totally copied and modified [ignite-animatable](https://github.com/infinitered/ignite-animatable). Thanks [@skellock](https://github.com/skellock) for the help and [@infinitered](https://github.com/infinitered/) for the awesome job you guys are doing :)
