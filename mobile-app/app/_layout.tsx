import { Stack } from 'expo-router';

import 'react-native-reanimated';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen 
        name="index" 
        options={{ title: 'Portfolio' }} 
      />
      <Stack.Screen 
        name="VentureDetails" 
        options={{ title: 'Venture Details', presentation: 'card' }} 
      />
    </Stack>
  );
}