# Noor Tasbeeh — Android app source (v1.1)

A fully offline, personal-use digital Tasbeeh app inspired by the general functionality of handheld dhikr counters, with original design and graphics. This is **not** the app published by Rise of Brains / Trk Studio.

## Features
- Realistic, large tactile tap button and LCD display
- **Night Mode in Settings > Preferences**: hides surrounding counter-page controls, dims the device, and lights only the LCD in cyan; keeps counting and reset buttons working. Night Mode is saved across launches. Settings and My Dhikr pages remain readable. Android status/navigation bars also become black while counting in Night Mode.
- Unlimited custom dhikr entries with individual saved counts
- Preset targets: 33, 34, 99, 100, 1,000, unlimited and custom
- Undo, reset with confirmation, and set any counting number
- Count automatically saved after every tap, independently for each dhikr
- Six color themes, click sounds, optional vibration
- Daily tap total, progress bar and goal notification
- No ads, no account, no network connection required
- JSON export via Android Share, plus paste-to-import recovery

## Install on your own Android device

**This ZIP is a source project, not an APK.** The APK has not been built or device-tested in this environment. The Night Mode preference and counter logic were tested with JavaScript checks, but visual rendering and a physical Android device have not been tested.

1. Install the latest Android Studio on your computer from https://developer.android.com/studio
2. Extract the project ZIP into a folder.
3. Android Studio > **Open** > select the `noor_tasbeeh_android` folder. Let Studio configure Gradle (8.9, Android Gradle Plugin 8.7.3) and install Android API 35 if prompted.
4. If the IDE asks you to generate a Gradle wrapper, use its built-in Gradle configuration. This project includes the wrapper properties but not its JAR, because Gradle could not be downloaded in this authoring environment.
5. **Build > Build Bundle(s) / APK(s) > Build APK(s)** (menu wording varies by Studio version).
6. Find the result under `app/build/outputs/apk/debug/app-debug.apk` and transfer the APK to your phone.
7. On your Android phone, open the APK and allow installation from your chosen file-manager source when Android asks. Revoke permission afterward if preferred.

## Quick browser preview

Open `app/src/main/assets/index.html` in Chrome on a laptop to try the app immediately. For smartphone testing, serving the HTML/CSS/JS directory through a local HTTP server is best; source files also work inside the compiled Android WebView application.

## Architecture

This deliberately uses **no third-party libraries**. Android Java WebView hosts three local HTML/CSS/JS files. JavaScript stores counts offline via `localStorage`, which Android's persistent WebView DOM storage supports. The native bridge uses Android's vibration / tone generation and share sheet; no network access is requested. Android 6.0+ (API 23+).

Note: Uninstalling the app can remove its local data. Export backups periodically if the counts matter.

## Future additions

The reference Play Store product also advertises additional modules such as Quran, Qibla, Names of Allah, and reminders. Those **are not included** in this first version; adding them requires decisions on verified source data and language/translation.

## Build an APK in GitHub (without installing Android Studio)

This project also includes `.github/workflows/build-apk.yml`, a GitHub Actions workflow. To use it:

1. Create a private GitHub repository and upload the **contents** of this `noor_tasbeeh_android` directory to the repository root (so `settings.gradle` and `.github/workflows/build-apk.yml` are both at their expected paths).
2. Open the repository's **Actions** tab and select **Build Noor Tasbeeh APK**. Choose **Run workflow**, or push files to the `main`/`master` branch to trigger it.
3. After the workflow completes successfully, open its run and download the **Noor-Tasbeeh-v1.1-APK** artifact ZIP.
4. Extract `app-debug.apk` from the artifact ZIP, copy it to your Android phone, then open it to install. On Android, allow installs from that file manager/browser if prompted.

GitHub Actions must be enabled on the repository and requires network access to download SDK, Gradle and Android Gradle Plugin dependencies. This workflow has been added but **has not been run** in this environment. The resulting debug APK is for personal installation and testing, not for release on Google Play.
