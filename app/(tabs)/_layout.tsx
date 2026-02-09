import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { BookOpen, Library, Settings } from 'lucide-react-native';

export default function TabLayout() {
  // Calculate new sizes (additional 10% increase from current size)
  const baseHeight = Platform.OS === 'web' ? 69 : 92;
  const newHeight = Math.round(baseHeight * 1.1);
  
  const basePaddingBottom = Platform.OS === 'web' ? 9 : 28;
  const newPaddingBottom = Math.round(basePaddingBottom * 1.1);
  
  const basePaddingTop = Platform.OS === 'web' ? 9 : 14;
  const newPaddingTop = Math.round(basePaddingTop * 1.1);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#f0f0f0',
          height: newHeight,
          paddingBottom: newPaddingBottom,
          paddingTop: newPaddingTop,
        },
        tabBarActiveTintColor: '#7C3AED',
        tabBarInactiveTintColor: '#6B7280',
        tabBarLabelStyle: {
          fontFamily: 'Inter-Regular',
          fontSize: 15, // Increased from 14 to maintain proportions
          marginBottom: Platform.OS === 'web' ? 0 : 11, // Increased from 10 to maintain spacing
        },
        tabBarIconStyle: {
          marginTop: Platform.OS === 'web' ? 0 : 5, // Increased from 4 to improve icon positioning
        },
      }}
    >
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create Story',
          tabBarIcon: ({ color, size }) => (
            <BookOpen size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: 'My Stories',
          tabBarIcon: ({ color, size }) => (
            <Library size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Settings size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}