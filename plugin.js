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

    // Add Fabric, Firebase and Crashlytics pods
    if (!spinner) {
        spinner = print.spin('add pods');
    } else {
        spinner.text = 'add pods';
    }
    spinner.start();
    ignite.patchInFile(`${process.cwd()}/ios/Podfile`, {
        after: `# Pods for ${name}`,
        insert: `  pod 'Fabric'
  pod 'Crashlytics'
  pod 'Firebase/Core'`,
    });
    spinner.succeed('added pods');

    // install pods
    spinner.text = 'install pods';
    spinner.start();
    await system.spawn('pod install', { cwd: './ios' });
    spinner.succeed('installed pods');

    spinner.text = 'patch native files';
    spinner.start();
    ignite.patchInFile(`${process.cwd()}/android/build.gradle`, {
        after: 'repositories {',
        insert: `        maven {
            url 'https://maven.fabric.io/public'
        }`,
    });
    ignite.patchInFile(`${process.cwd()}/android/build.gradle`, {
        after: 'dependencies {',
        insert: `        classpath 'io.fabric.tools:gradle:1.25.4'`,
    });
    ignite.patchInFile(`${process.cwd()}/android/build.gradle`, {
        after: 'dependencies {',
        insert: `        classpath 'com.google.gms:google-services:3.2.0'`,
    });
    ignite.patchInFile(`${process.cwd()}/android/build.gradle`, {
        after: 'mavenLocal()',
        insert: `        maven {
            url 'https://maven.google.com/'
        }`,
    });
    ignite.patchInFile(`${process.cwd()}/android/app/build.gradle`, {
        after: 'apply plugin: "com.android.application"',
        insert: `apply plugin: "io.fabric"`,
    });
    ignite.patchInFile(`${process.cwd()}/android/app/build.gradle`, {
        after: 'compile "com\\.facebook\\.react:react-native',
        insert: `    compile "com.crashlytics.sdk.android:crashlytics:2.9.3"`,
    });
    ignite.patchInFile(`${process.cwd()}/android/app/build.gradle`, {
        after: 'compile "com\\.facebook\\.react:react-native',
        insert: `    compile "com.google.firebase:firebase-core:15.0.0"`,
    });
    ignite.patchInFile(`${process.cwd()}/android/app/build.gradle`, {
        before: '// Run this once to be able to run the application with BUCK',
        insert: `apply plugin: 'com.google.gms.google-services'`,
    });
    ignite.patchInFile(`${process.cwd()}/ios/${name}/AppDelegate.m`, {
        before: '@implementation AppDelegate',
        insert: `@import Firebase;
`,
    });
    ignite.patchInFile(`${process.cwd()}/ios/${name}/AppDelegate.m`, {
        after: 'NSURL \\*jsCodeLocation;',
        insert: `  [FIRApp configure];`,
    });
    spinner.stop();

    print.info(`
      ${print.colors.yellow('Almost done! You still need to do something!')}

      Finish to Setup Crashlytics manually:
      - on iOS:
        -> Add the ${print.colors.blue('Script build phase')} ( Documentation: ${print.colors.blue(
            'https://firebase.google.com/docs/crashlytics/get-started'
        )} )
        -> Make sure you have an ${print.colors.blue('ios/GoogleService-Info.plist')} file
      - on Android:
        -> Make sure you have an ${print.colors.blue('android/app/google-services.json')} file
    `);
};

/**
 * Remove ourself from the project.
 */
const remove = async function (context) {
    const { ignite, print, filesystem, prompt, system } = context;

    // Ask if removing firebase as well
    let { removeFirebase, removePods } = await prompt.ask([
        {
            type: 'radio',
            message: 'Should I remove Firebase as well?',
            name: 'removeFirebase',
            choices: ['Yes', 'No'],
        },
        {
            type: 'radio',
            message: 'Should I remove Pods altogether?',
            name: 'removePods',
            choices: ['Yes', 'No'],
        },
    ]);

    if (removeFirebase === undefined) {
        removeFirebase = 'No';
    }
    if (removePods === undefined) {
        removePods = 'No';
    }

    const spinner = print.spin('remove native files patches');

    // Get android module name
    const NPMPackage = filesystem.read('package.json', 'json');
    const name = NPMPackage.name;

    ignite.patchInFile(`${process.cwd()}/android/build.gradle`, {
        delete: `        maven {
            url 'https://maven.fabric.io/public'
        }`,
    });
    ignite.patchInFile(`${process.cwd()}/android/build.gradle`, {
        delete: `        classpath 'io.fabric.tools:gradle:1.25.4'`,
    });
    ignite.patchInFile(`${process.cwd()}/android/build.gradle`, {
        delete: `        maven {
            url 'https://maven.google.com/'
        }`,
    });
    ignite.patchInFile(`${process.cwd()}/android/app/build.gradle`, {
        delete: `apply plugin: "io.fabric"`,
    });
    ignite.patchInFile(`${process.cwd()}/android/app/build.gradle`, {
        delete: `    compile "com.crashlytics.sdk.android:crashlytics:2.9.3"`,
    });
    ignite.patchInFile(`${process.cwd()}/ios/Podfile`, {
        delete: `
  pod 'Fabric'
  pod 'Crashlytics'`,
    });
    if (removeFirebase === 'Yes') {
        ignite.patchInFile(`${process.cwd()}/android/app/build.gradle`, {
            delete: `    compile "com.google.firebase:firebase-core:15.0.0"`,
        });
        ignite.patchInFile(`${process.cwd()}/ios/${name}/AppDelegate.m`, {
            delete: `@import Firebase;
`,
        });
        ignite.patchInFile(`${process.cwd()}/ios/${name}/AppDelegate.m`, {
            delete: `  [FIRApp configure];`,
        });
        ignite.patchInFile(`${process.cwd()}/ios/Podfile`, {
            delete: `  pod 'Firebase/Core'`,
        });
        ignite.patchInFile(`${process.cwd()}/android/build.gradle`, {
            delete: `classpath 'com.google.gms:google-services:3.2.0'`,
        });
        ignite.patchInFile(`${process.cwd()}/android/app/build.gradle`, {
            delete: `apply plugin: 'com.google.gms.google-services'`,
        });
        try {
            filesystem.remove(`${process.cwd()}/android/app/google-services.json`);
        } catch (e) {
            print.info(`${print.colors.yellow(`Could not remove '${process.cwd()}/android/app/google-services.json`)}`)
        }
        try {
            filesystem.remove(`${process.cwd()}/ios/GoogleService-Info.plist`);
        } catch (e) {
            print.info(`${print.colors.yellow(`Could not remove '${process.cwd()}/ios/GoogleService-Info.plist`)}`)
        }
    }
    spinner.succeed(`removed native files patches`);

    if (removePods === 'Yes') {
        // install pods
        spinner.text = 'remove pods';
        spinner.start();
        await system.spawn('pod deintegrate', { cwd: './ios' });
        filesystem.remove(`${process.cwd()}/ios/Pods`);
        filesystem.remove(`${process.cwd()}/ios/Podfile`);
        filesystem.remove(`${process.cwd()}/ios/Podfile.lock`);
        filesystem.remove(`${process.cwd()}/ios/${name}.xcworkspace`);

        spinner.succeed('removed pods');
    }

    // remove the npm module
    await ignite.removeModule(NPM_MODULE_NAME, { unlink: true });

    print.info(`
      ${print.colors.yellow('Almost done! You still need to do something!')}

      Remove the iOS ${print.colors.red('script build phase')} and the ${print.colors.red('GoogleService-Info.plist')} file from XCode
    `);
};

/**
 * Expose an ignite plugin interface.
 */
module.exports = {
    add,
    remove,
};
