// app/app/_layout.js
// Layout raiz do app — gerencia autenticação global

import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { supabase } from '../../backend/supabaseClient';
import { useRouter, useSegments } from 'expo-router';

// Mantém a splash screen enquanto carrega
SplashScreen.preventAutoHideAsync();

// Configura como notificações são tratadas quando app está em primeiro plano
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [session, setSession] = useState(undefined); // undefined = carregando

  const [fontsLoaded] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    'SpaceMono-Bold': require('../assets/fonts/SpaceMono-Bold.ttf'),
  });

  useEffect(() => {
    // Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    // Escutar mudanças de autenticação
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session === undefined || !fontsLoaded) return;

    SplashScreen.hideAsync();

    // Redireciona baseado na sessão
    const inAuthGroup = segments[0] === 'login';
    if (!session && !inAuthGroup) {
      router.replace('/login');
    } else if (session && inAuthGroup) {
      router.replace('/(tabs)');
    }
  }, [session, fontsLoaded, segments]);

  // Listener para notificações recebidas
  useEffect(() => {
    const notifListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notificação recebida:', notification);
    });

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      // Quando usuário toca na notificação
      const data = response.notification.request.content.data;
      if (data?.player_id) {
        router.push('/(tabs)/lista');
      }
    });

    return () => {
      Notifications.removeNotificationSubscription(notifListener);
      Notifications.removeNotificationSubscription(responseListener);
    };
  }, []);

  if (session === undefined || !fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0A0A0A', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#00FF87" size="large" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
