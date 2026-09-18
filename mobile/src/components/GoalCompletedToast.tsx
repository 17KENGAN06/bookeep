import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';
import { useGoalCompletedListener } from '../hooks/goalCelebration';
import { useTheme } from '../hooks/ThemeProvider';

export function GoalCompletedToast() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const { detail, dismiss } = useGoalCompletedListener();
  const translate = useRef(new Animated.Value(80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!detail) return;

    translate.setValue(80);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(translate, { toValue: 0, duration: 280, useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();

    const hide = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translate, { toValue: 24, duration: 240, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 240, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) dismiss();
      });
    }, 3400);

    return () => clearTimeout(hide);
  }, [detail, dismiss, opacity, translate]);

  if (!detail) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          bottom: insets.bottom + 76,
          opacity,
          transform: [{ translateY: translate }],
          backgroundColor: colors.surface,
          borderColor: colors.accent,
        },
      ]}
    >
      <View style={[styles.mark, { backgroundColor: colors.accentSoft }]}>
        <Icon name="checkmark-circle" size={26} color={colors.accent} />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.title, { color: colors.ink }]}>{t('goals.completedToast')}</Text>
        <Text style={[styles.hint, { color: colors.muted }]}>
          {t('goals.completedToastHint', { pages: detail.pages, target: detail.target })}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  mark: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  hint: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
  },
});
