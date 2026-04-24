// app/app.config.js
export default {
  expo: {
    name: "Já Caiu?",
    slug: "jacaiu",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "dark",
    splash: {
      image: "./assets/splash.png",
      resizeMode: "contain",
      backgroundColor: "#0A0A0A"
    },
    ios: {
      supportsTablet: false,
      bundleIdentifier: "app.jacaiu.monitor",
      buildNumber: "1",
      infoPlist: {
        NSCameraUsageDescription: "Para você adicionar uma foto de perfil.",
        NSPhotoLibraryUsageDescription: "Para você escolher uma foto de perfil."
      }
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#0A0A0A"
      },
      package: "app.jacaiu.monitor",
      versionCode: 1,
      permissions: [
        "NOTIFICATIONS",
        "RECEIVE_BOOT_COMPLETED"
      ]
    },
    plugins: [
      "expo-router",
      [
        "expo-notifications",
        {
          icon: "./assets/notification-icon.png",
          color: "#00FF87"
        }
      ]
    ],
    scheme: "jacaiu",
    extra: {
      supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
      supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
      oneSignalAppId: process.env.EXPO_PUBLIC_ONESIGNAL_APP_ID,
      eas: {
        projectId: "SEU-PROJECT-ID-AQUI"
      }
    }
  }
};
