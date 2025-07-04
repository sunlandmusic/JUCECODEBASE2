import React, { useRef, useState } from 'react';
import { StyleSheet, Pressable, Text } from 'react-native';
import { colors } from '@/constants/colors';

interface PlusMinusBarProps {
  type: 'plus' | 'minus';
  onPress: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  disabled?: boolean;
}

export const PlusMinusBar: React.FC<PlusMinusBarProps> = ({
  type,
  onPress,
  onPressIn,
  onPressOut,
  disabled = false,
}) => {
  const [isPressed, setIsPressed] = useState(false);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const acceleratedTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handlePressIn = () => {
    setIsPressed(true);
    if (onPressIn) {
      onPressIn();
    }

    // Start long press timer
    longPressTimerRef.current = setTimeout(() => {
      // Start accelerated presses
      acceleratedTimerRef.current = setInterval(() => {
        onPress();
      }, 50); // Match the 50ms interval from index page
    }, 500);
  };

  const handlePressOut = () => {
    setIsPressed(false);
    if (onPressOut) {
      onPressOut();
    }

    // Clear timers
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
    if (acceleratedTimerRef.current) {
      clearInterval(acceleratedTimerRef.current);
      acceleratedTimerRef.current = null;
    }
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={({ pressed }) => [
        type === 'plus' ? styles.plusButton : styles.minusButton,
        {
          opacity: (pressed || isPressed) ? 0.8 : 1,
        },
      ]}
    >
      <Text style={styles.buttonText}>
        {type === 'plus' ? '+' : '-'}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  plusButton: {
    width: 40,
    height: 140,
    borderRadius: 8,
    backgroundColor: colors.buttonGrey,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  minusButton: {
    width: 40,
    height: 140,
    borderRadius: 8,
    backgroundColor: colors.buttonGrey,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: colors.textOffWhite,
    fontSize: 28,
    fontWeight: 'bold',
  },
}); 