import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        // 1. Global Header Styling
        headerStyle: {
          backgroundColor: '#F9FAFB', // Matches your index background
        },
        headerShadowVisible: false, // Removes the ugly bottom border
        headerTintColor: '#111827', // Dark text for the "Back" button
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 17,
        },
        // 2. Smooth Transitions
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: '#F9FAFB' },
      }}
    >
      {/* Main Dashboard: Hide the header because we built a custom one in index.tsx */}
      <Stack.Screen 
        name="index" 
        options={{ 
          headerShown: false 
        }} 
      />

      {/* Details Screen: Use a card presentation for a native feel */}
      <Stack.Screen 
        name="VentureDetails" 
        options={{ 
          title: '', // Keep title empty for a "Minimalist" look
          headerShown: false, 
          headerBackTitle: 'Back',
          presentation: 'card', 
          headerTintColor: '#FFFFFF', // Assuming your Detail header is dark
        }} 
      />
    </Stack>
  );
}