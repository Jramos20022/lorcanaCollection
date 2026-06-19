# The Inkcaster iPhone App

This client is set up to be wrapped as a private iPhone app with Capacitor.

## First-Time Setup

Run these commands from the `client` folder:

```bash
npm install
npm run ios:add
```

That creates the native `ios` project.

If the iOS step says Xcode is required, install the full Xcode app from the Mac App Store, open it once, then run:

```bash
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept
```

If the iOS step says CocoaPods or `pod` is missing, install CocoaPods:

```bash
brew install cocoapods
```

If you do not use Homebrew, this usually works too:

```bash
sudo gem install cocoapods
```

If CocoaPods says it cannot create `/Users/justinramos/.cocoapods` or cannot add the `trunk` source, reset that folder:

```bash
mkdir -p ~/.cocoapods/repos
chmod -R u+rwX ~/.cocoapods
pod setup
```

Then retry:

```bash
npm run ios:sync
```

## Point The App At Your Backend

For normal browser development, no API URL is required.

For an iPhone build that talks to the server running on your Mac, create `client/.env` and add your Mac's local network IP:

```bash
VITE_API_BASE_URL=http://YOUR-MAC-IP:3001
```

Example:

```bash
VITE_API_BASE_URL=http://192.168.1.25:3001
```

Your iPhone and Mac need to be on the same Wi-Fi network.

## Rebuild And Open In Xcode

After frontend changes, run:

```bash
npm run ios:sync
npm run ios:open
```

In Xcode, choose your connected iPhone as the run target and press Run.

## Notes

- A free Apple ID can install the app on your phone for personal testing, but it may need to be re-signed periodically.
- A paid Apple Developer account makes private installs smoother.
- For the app to work away from your home Wi-Fi, the backend needs to be hosted online.
