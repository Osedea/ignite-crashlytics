const NPM_MODULE_NAME = 'react-native-fabric'

/**
 * Add ourself to the project.
 */
const add = async function (context) {
  const { ignite, print } = context

  const spinner = print.spin(`adding '${NPM_MODULE_NAME}' npm module`);
  spinner.start();
  // install a npm module
  await ignite.addModule(NPM_MODULE_NAME, { linking: true })
  spinner.succeed(`added '${NPM_MODULE_NAME}' module`);

  const podfileExists = await filesystem.exists('./ios/Podfile');
  // initialize Podfile if it does not exist
  if (!podfileExists) {
    spinner.text = 'initialize podfile';
    spinner.start();
    await system.spawn('pod init', { cwd: './ios' });
    spinner.succeed('initialized podfile');
  }
  // install pods
  spinner.text = 'install pods';
  spinner.start();
  await system.spawn('pod install', { cwd: './ios' });
  spinner.succeed('installed pods');

  ignite.patchInFile(
        `${process.cwd()}/android/app/build.gradle`,
        {
            before: 'apply plugin: "com.android.application"',
            insert: `buildscript {
  repositories {
    maven { url 'https://maven.fabric.io/public' }
  }

  dependencies {
    // These docs use an open ended version so that our plugin
    // can be updated quickly in response to Android tooling updates

    // We recommend changing it to the latest version from our changelog:
    // https://docs.fabric.io/android/changelog.html#fabric-gradle-plugin
    classpath 'io.fabric.tools:gradle:1.+'
  }
}
`,
        }
    );
    ignite.patchInFile(
        `${process.cwd()}/android/app/build.gradle`,
        {
            after: 'apply plugin: "com.android.application"',
            insert: `
apply plugin: 'io.fabric'

repositories {
  maven { url 'https://maven.fabric.io/public' }
}`,
        }
    );
    ignite.patchInFile(
        `${process.cwd()}/android/app/build.gradle`,
        {
            after: 'compile "com\\.facebook\\.react:react-native',
            insert: `
    compile('com.crashlytics.sdk.android:crashlytics:2.8.0@aar') {
        transitive = true;
    }`,
        }
    );
    ignite.patchInFile(
        `${process.cwd()}/android/app/src/main/AndroidManifest.xml`,
        {
            before: '</application>',
            insert: `      <!-- Replace your Fabric API Key here -->
      <meta-data
          android:name="io.fabric.ApiKey"
          android:value="<FABRIC_API_KEY>"
      />`,
        }
    );
    ignite.patchInFile(
        `${process.cwd()}/android/app/src/main/java/com/${name.toLowerCase()}/MainApplication.java`,
        {
            after: 'import com.facebook.soloader.SoLoader;',
            insert: `import com.crashlytics.android.Crashlytics;
import io.fabric.sdk.android.Fabric;`,
        }
    );
    ignite.patchInFile(
        `${process.cwd()}/android/app/src/main/java/com/${name.toLowerCase()}/MainApplication.java`,
        {
            before: 'SoLoader\.init',
            insert: `    Fabric.with(this, new Crashlytics());`,
        }
    );
    ignite.patchInFile(
        `${process.cwd()}/ios/${name}/AppDelegate.m`,
        {
            before: '#import "AppDelegate.h"',
            insert: `#import <Fabric/Fabric.h>
#import <Crashlytics/Crashlytics.h>`,
        }
    );
    ignite.patchInFile(
        `${process.cwd()}/ios/${name}/AppDelegate.m`,
        {
            after: 'NSURL \\*jsCodeLocation;',
            insert: `  [Fabric with:@[[Crashlytics class]]];`,
        }
    );
    ignite.patchInFile(
        `${process.cwd()}/ios/${name}/Info.plist`,
        {
            before: '<key>CFBundleDevelopmentRegion</key>',
            insert: `	<key>Fabric</key>
	<dict>
		<key>APIKey</key>
		<string><FABRIC_API_KEY></string>
		<key>Kits</key>
		<array>
			<dict>
				<key>KitInfo</key>
				<dict/>
				<key>KitName</key>
				<string>Crashlytics</string>
			</dict>
		</array>
	</dict>`,
        }
    );

    print.info(`
      ${print.colors.yellow('Almost done! You still need to do something!')}

      Finish to Setup Crashlytics manually.
        - iOS: (Documentation: ${print.colors.blue('https://fabric.io/kits/ios/crashlytics/install')})
          -> Add the ${print.colors.blue('Script build phase')}
          -> Replace the FABRIC_API_KEY in ${print.colors.blue('ios/${name}/Info.plist')}
        - Android: (Documentation: ${print.colors.blue('https://fabric.io/kits/android/crashlytics/install')})
          -> Replace the FABRIC_API_KEY in ${print.colors.blue('android/app/src/main/AndroidManifest.xml')}
    `)
}

/**
 * Remove ourself from the project.
 */
const remove = async function (context) {
  const { ignite, print, filesystem } = context

  const spinner = print.spin(`removing ${NPM_MODULE_NAME} module`);
  // remove the npm module
  spinner.start();
  await ignite.removeModule(NPM_MODULE_NAME, { unlink: true })
  spinner.succeed(`removed '${NPM_MODULE_NAME}' module`);

  // Get android module name
  const package = filesystem.read("package.json", "json");
  const name = package.name;

  ignite.patchInFile(
        `${process.cwd()}/android/app/build.gradle`,
        {
            delete: `
buildscript {
  repositories {
    maven { url 'https://maven.fabric.io/public' }
  }

  dependencies {
    // These docs use an open ended version so that our plugin
    // can be updated quickly in response to Android tooling updates

    // We recommend changing it to the latest version from our changelog:
    // https://docs.fabric.io/android/changelog.html#fabric-gradle-plugin
    classpath 'io.fabric.tools:gradle:1.+'
  }
}
`,
        }
    );
    ignite.patchInFile(
        `${process.cwd()}/android/app/build.gradle`,
        {
            after: 'apply plugin: "com.android.application"',
            insert: `
apply plugin: 'io.fabric'

repositories {
  maven { url 'https://maven.fabric.io/public' }
}`,
        }
    );
    ignite.patchInFile(
        `${process.cwd()}/android/app/build.gradle`,
        {
            delete: `
    compile('com.crashlytics.sdk.android:crashlytics:2.8.0@aar') {
        transitive = true;
    }`,
        }
    );
    ignite.patchInFile(
        `${process.cwd()}/android/app/src/main/java/com/${name.toLowerCase()}/MainApplication.java`,
        {
            delete: `import com.crashlytics.android.Crashlytics;
import io.fabric.sdk.android.Fabric;`,
        }
    );
    ignite.patchInFile(
        `${process.cwd()}/android/app/src/main/java/com/${name.toLowerCase()}/MainApplication.java`,
        {
            delete: `    Fabric.with(this, new Crashlytics());`,
        }
    );
    ignite.patchInFile(
        `${process.cwd()}/ios/${name}/AppDelegate.m`,
        {
            delete: `#import <Fabric/Fabric.h>
#import <Crashlytics/Crashlytics.h>`,
        }
    );
    ignite.patchInFile(
        `${process.cwd()}/ios/${name}/AppDelegate.m`,
        {
            delete: `  [Fabric with:@[[Crashlytics class]]];`,
        }
    );

    print.info(`
      ${print.colors.yellow('Almost done! You still need to do something!')}

      Remove your Fabric API Key from:
        - ${process.cwd()}/android/app/src/main/AndroidManifest.xml
        - ${process.cwd()}/ios/${name}/Info.plist

      Remove the iOS script build phase
    `)
}

/**
 * Expose an ignite plugin interface.
 */
module.exports = { add, remove }
