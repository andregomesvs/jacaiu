// app/app/(tabs)/_layout.js
// Layout com tabs inferiores do app

import { Tabs } from 'expo-router';
import { View, Text, StyleSheet } from 'react-native';

function TabIcon({ focused, icon, label, color }) {
  return (
    <View style={[styles.tabItem, focused && styles.tabItemActive]}>
      <Text style={[styles.tabIcon, { color: focused ? '#00FF87' : '#444' }]}>{icon}</Text>
      <Text style={[styles.tabLabel, { color: focused ? '#00FF87' : '#444' }]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0D0D0D',
          borderTopColor: '#1E1E1E',
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
        },
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="⬡" label="Início" />
          ),
        }}
      />
      <Tabs.Screen
        name="lista"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="◈" label="Lista" />
          ),
        }}
      />
      <Tabs.Screen
        name="alertas"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="◉" label="Alertas" />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon focused={focused} icon="○" label="Perfil" />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
    paddingTop: 6,
  },
  tabItemActive: {},
  tabIcon: { fontSize: 18 },
  tabLabel: { fontSize: 9, fontFamily: 'SpaceMono', letterSpacing: 0.5 },
});
