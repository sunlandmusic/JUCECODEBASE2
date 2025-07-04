import React from 'react';
import { Pressable, ViewStyle, StyleProp } from 'react-native';
// Try to use lucide-react-native's Eye icon if available
let EyeIcon: any = null;
try {
  // @ts-ignore
  EyeIcon = require('lucide-react-native').Eye;
} catch {}

interface EyeButtonProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  size?: number;
  color?: string;
  style?: StyleProp<ViewStyle>;
}

export const EyeButton: React.FC<EyeButtonProps> = ({
  currentRoute,
  onNavigate,
  size = 28,
  color = '#222',
  style,
}) => {
  // Example: toggle between two routes for demonstration
  const nextRoute = currentRoute === '/(tabs)/pianoxl' ? '/(tabs)/other' : '/(tabs)/pianoxl';

  return (
    <Pressable
      onPress={() => onNavigate(nextRoute)}
      style={style}
      accessibilityLabel="Navigation Eye Button"
    >
      {EyeIcon ? (
        <EyeIcon size={size} color={color} strokeWidth={1.28} />
      ) : (
        // Fallback SVG eye icon
        <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.28" strokeLinecap="round" strokeLinejoin="round">
          <ellipse cx="12" cy="12" rx="9" ry="5" />
          <circle cx="12" cy="12" r="2" />
        </svg>
      )}
    </Pressable>
  );
}; 