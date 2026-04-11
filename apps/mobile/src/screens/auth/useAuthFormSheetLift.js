import { useEffect, useMemo, useRef } from 'react';
import { Animated, Dimensions, Keyboard, Platform } from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const FORM_SHEET_LIFT_DISTANCE = Math.min(160, Math.round(SCREEN_HEIGHT * 0.18));
const DEFAULT_ANIMATION_DURATION_MS = 220;

export function useAuthFormSheetLift() {
  const sheetTranslateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showEventName = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEventName = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const animateSheet = (toValue, duration) => {
      Animated.timing(sheetTranslateY, {
        toValue,
        duration,
        useNativeDriver: true
      }).start();
    };

    const handleKeyboardShow = (event) => {
      animateSheet(-FORM_SHEET_LIFT_DISTANCE, event?.duration ?? DEFAULT_ANIMATION_DURATION_MS);
    };

    const handleKeyboardHide = (event) => {
      animateSheet(0, event?.duration ?? DEFAULT_ANIMATION_DURATION_MS);
    };

    const showSubscription = Keyboard.addListener(showEventName, handleKeyboardShow);
    const hideSubscription = Keyboard.addListener(hideEventName, handleKeyboardHide);

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, [sheetTranslateY]);

  return useMemo(
    () => ({
      transform: [{ translateY: sheetTranslateY }]
    }),
    [sheetTranslateY]
  );
}
