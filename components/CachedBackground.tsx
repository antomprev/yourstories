import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { Image } from 'expo-image';

// Low-quality blurred placeholder encoded as blurhash for the main background image
// Generated from the Unsplash book image — provides instant visual feedback while loading
const DEFAULT_BLURHASH = 'LKG8wt~qIU-;_3WBt7Rj%Mxut7of';

interface CachedBackgroundProps {
  uri: string;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
  blurhash?: string;
}

export default function CachedBackground({
  uri,
  style,
  children,
  blurhash = DEFAULT_BLURHASH,
}: CachedBackgroundProps) {
  return (
    <View style={[styles.container, style]}>
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="disk"
        placeholder={{ blurhash }}
        transition={200}
        recyclingKey={uri}
      />
      {children}
    </View>
  );
}

export const BACKGROUND_IMAGES = {
  main: 'https://images.unsplash.com/photo-1519791883288-dc8bd696e667?q=80&w=1080&auto=format&fit=crop',
  story: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1080&auto=format&fit=crop',
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
  },
});
