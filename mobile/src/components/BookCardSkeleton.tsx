import { StyleSheet, View } from 'react-native';
import { useTheme } from '../hooks/ThemeProvider';

export function BookCardSkeleton() {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.line }]}>
      <View style={[styles.cover, { backgroundColor: colors.surface2 }]} />
      <View style={styles.meta}>
        <View style={[styles.line, { backgroundColor: colors.surface2 }]} />
        <View style={[styles.lineShort, { backgroundColor: colors.surface2 }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  cover: {
    width: '100%',
    aspectRatio: 16 / 10,
  },
  meta: {
    padding: 12,
    gap: 8,
  },
  line: {
    height: 12,
    borderRadius: 6,
    width: '88%',
  },
  lineShort: {
    height: 10,
    borderRadius: 5,
    width: '46%',
  },
});
