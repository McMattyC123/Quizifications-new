module.exports = () => {
  return {
    name: "Quizifications",
    slug: "quizifications",
    version: "1.0.0",
    sdkVersion: "54.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#0a0a0b"
    },
    assetBundlePatterns: ["**/*"],
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.quizificationsapp.quizifications",
      buildNumber: "1",
      infoPlist: {
        UIBackgroundModes: ["fetch", "remote-notification"],
        NSCameraUsageDescription: "Quizifications uses your camera to scan handwritten or printed notes for quiz generation.",
        NSPhotoLibraryUsageDescription: "Quizifications uses your photo library to import images of your notes for quiz generation.",
        NSUserTrackingUsageDescription: "This app does not track you across other apps or websites."
      },
      config: {
        usesNonExemptEncryption: false
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0a0a0b"
      },
      package: "com.quizificationsapp.quizifications",
      versionCode: 1,
      permissions: [
        "RECEIVE_BOOT_COMPLETED",
        "VIBRATE",
        "SCHEDULE_EXACT_ALARM",
        "POST_NOTIFICATIONS"
      ]
    },
    plugins: [
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#c8ff00"
        }
      ],
      [
        "expo-camera",
        {
          cameraPermission: "Quizifications uses your camera to scan handwritten or printed notes for quiz generation."
        }
      ],
      [
        "expo-image-picker",
        {
          photosPermission: "Quizifications uses your photo library to import images of your notes for quiz generation."
        }
      ],
      "expo-asset"
    ],
    extra: {
      privacyPolicyUrl: "https://quizifications.com/privacy.html",
      termsOfServiceUrl: "https://quizifications.com/terms.html",
      supportEmail: "matt@quizifications.com",
      eas: {
        projectId: "bc90b542-0c8a-465c-b429-316a9d8d1b19"
      },
    },
    owner: "mtcliett",
    runtimeVersion: {
      policy: "appVersion"
    },
    updates: {
      url: "https://u.expo.dev/bc90b542-0c8a-465c-b429-316a9d8d1b19"
    }
  };
};
