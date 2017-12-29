const NPM_MODULE_NAME = 'react-native-fabric';

/**
 * Add ourself to the project.
 */
const add = async function (context) {
    const { ignite, print, filesystem, system } = context;

    // Get android module name
    const NPMPackage = filesystem.read('package.json', 'json');
    const name = NPMPackage.name;

    // install a npm module
    await ignite.addModule(NPM_MODULE_NAME, { link: true });

    const { apiKey } = await context.prompt.ask([
        {
            type: 'input',
            name: 'apiKey',
            message: 'What is your Fabric API Key?',
        },
    ]);

    const podfileExists = await filesystem.exists('./ios/Podfile');
    let spinner;
    // initialize Podfile if it does not exist
    if (!podfileExists) {
        spinner = print.spin('initialize podfile');
        spinner.start();
        await system.spawn('pod init', { cwd: './ios' });
        ignite.patchInFile(`${process.cwd()}/ios/Podfile`, {
            delete: `  target '${name}-tvOSTests' do
    inherit! :search_paths
    # Pods for testing
  end`,
        });
        spinner.succeed('initialized podfile');
    }

    // Add Fabric and Crashlytics pods
    if (!spinner) {
        spinner = print.spin('add pods');
    } else {
        spinner.text = 'add pods';
    }
    spinner.start();
    ignite.patchInFile(`${process.cwd()}/ios/Podfile`, {
        after: `# Pods for ${name}`,
        insert: `  pod 'Fabric'
  pod 'Crashlytics'`,
    });
    spinner.succeed('added pods');

    // install pods
    spinner.text = 'install pods';
    spinner.start();
    await system.spawn('pod install', { cwd: './ios' });
    spinner.succeed('installed pods');

    spinner.text = 'patch native files';
    spinner.start();
    ignite.patchInFile(`${process.cwd()}/android/app/build.gradle`, {
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
    });
    ignite.patchInFile(`${process.cwd()}/android/app/build.gradle`, {
        after: 'apply plugin: "com.android.application"',
        insert: `
apply plugin: 'io.fabric'

repositories {
  maven { url 'https://maven.fabric.io/public' }
}`,
    });
    ignite.patchInFile(`${process.cwd()}/android/app/build.gradle`, {
        after: 'compile "com\\.facebook\\.react:react-native',
        insert: `
    compile('com.crashlytics.sdk.android:crashlytics:2.8.0@aar') {
        transitive = true;
    }`,
    });
    ignite.patchInFile(
        `${process.cwd()}/android/app/src/main/AndroidManifest.xml`,
        {
            before: '</application>',
            insert: `      <meta-data
          android:name="io.fabric.ApiKey"
          android:value="${apiKey || 'FABRIC_API_KEY'}"
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
            before: 'SoLoader.init',
            insert: `    Fabric.with(this, new Crashlytics());`,
        }
    );
    ignite.patchInFile(`${process.cwd()}/ios/${name}/AppDelegate.m`, {
        after: '#import "AppDelegate.h"',
        insert: `#import <Fabric/Fabric.h>
#import <Crashlytics/Crashlytics.h>`,
    });
    ignite.patchInFile(`${process.cwd()}/ios/${name}/AppDelegate.m`, {
        after: 'NSURL \\*jsCodeLocation;',
        insert: `  [Fabric with:@[[Crashlytics class]]];`,
    });
    /* eslint-disable no-tabs */
    ignite.patchInFile(`${process.cwd()}/ios/${name}/Info.plist`, {
        before: '<key>CFBundleDevelopmentRegion</key>',
        insert: `	<key>Fabric</key>
	<dict>
		<key>APIKey</key>
		<string>${apiKey || 'FABRIC_API_KEY'}</string>
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
    });
    /* eslint-enable no-tabs */
    spinner.stop();

    print.info(`
      ${print.colors.yellow('Almost done! You still need to do something!')}

      Finish to Setup Crashlytics manually.
        - iOS: ( Documentation: ${print.colors.blue(
        'https://fabric.io/kits/ios/crashlytics/install'
    )} )
          -> Add the ${print.colors.blue('Script build phase')}
          ${
    !apiKey
        ? `-> Replace the FABRIC_API_KEY in ${print.colors.blue(
            `ios/${name}/Info.plist`
        )}`
        : ''
}
          ${
    !apiKey
        ? `        - Android: (Documentation: ${print.colors.blue(
            'https://fabric.io/kits/android/crashlytics/install'
        )})
          -> Replace the FABRIC_API_KEY in ${print.colors.blue(
        'android/app/src/main/AndroidManifest.xml'
    )}`
        : ''
}
    `);
};

/**
 * Remove ourself from the project.
 */
const remove = async function (context) {
    const { ignite, print, filesystem } = context;

    const spinner = print.spin('remove native files patches');

    // Get android module name
    const NPMPackage = filesystem.read('package.json', 'json');
    const name = NPMPackage.name;

    ignite.patchInFile(`${process.cwd()}/android/app/build.gradle`, {
        delete: `buildscript {
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
    });
    ignite.patchInFile(`${process.cwd()}/android/app/build.gradle`, {
        delete: `

apply plugin: 'io.fabric'

repositories {
  maven { url 'https://maven.fabric.io/public' }
}`,
    });
    ignite.patchInFile(`${process.cwd()}/android/app/build.gradle`, {
        delete: `

    compile('com.crashlytics.sdk.android:crashlytics:2.8.0@aar') {
        transitive = true;
    }`,
    });
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
            delete: `    Fabric.with(this, new Crashlytics());
`,
        }
    );
    ignite.patchInFile(`${process.cwd()}/ios/${name}/AppDelegate.m`, {
        delete: `#import <Fabric/Fabric.h>
#import <Crashlytics/Crashlytics.h>
`,
    });
    ignite.patchInFile(`${process.cwd()}/ios/${name}/AppDelegate.m`, {
        delete: `  [Fabric with:@[[Crashlytics class]]];
`,
    });
    ignite.patchInFile(`${process.cwd()}/ios/Podfile`, {
        delete: `
  pod 'Fabric'
  pod 'Crashlytics'`,
    });
    spinner.succeed(`removed native files patches`);

    // remove the npm module
    await ignite.removeModule(NPM_MODULE_NAME, { unlink: true });

    print.info(`
      ${print.colors.yellow('Almost done! You still need to do something!')}

      Remove your Fabric API Key from:
        - ${process.cwd()}/android/app/src/main/AndroidManifest.xml
        - ${process.cwd()}/ios/${name}/Info.plist

      Remove the iOS script build phase

      If you were not using Pods before adding this plugin, you can delete the following files/folders:
        - ios/Pods
        - ios/Podfile
        - ios/Podfile.lock
        - ios/${name}.xcworkspace
    `);
};

/**
 * Expose an ignite plugin interface.
 */
module.exports = {
    add,
    remove,
};
