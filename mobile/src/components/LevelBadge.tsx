import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../hooks/ThemeProvider';

export function LevelBadge({ level }: { level: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: colors.surface2 }]}>
      <Text style={[styles.text, { color: colors.ink }]}>{level}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    minHeight: 24,
    paddingHorizontal: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
});
