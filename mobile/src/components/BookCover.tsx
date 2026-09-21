import { useEffect, useState } from 'react';
import { Image, StyleSheet, Text, View, type StyleProp, type ImageStyle, type ViewStyle } from 'react-native';
import { useTranslation } from 'react-i18next';
import type { Book } from '../types/book';
import { getLocalizedTitle } from '../utils/bookCopy';

const palettes = [
  ['#1F3D32', '#2E7D66'],
  ['#122E26', '#3CD6A0'],
  ['#17382E', '#256653'],
  ['#0D2720', '#2E7D66'],
] as const;

function paletteFor(slug: string) {
  const total = slug.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return palettes[total % palettes.length] ?? palettes[0];
}

type BookCoverProps = {
  book: Book;
  style?: StyleProp<ViewStyle & ImageStyle>;
  labeled?: boolean;
  variant?: 'full' | 'card';
};

export function BookCover({ book, style, labeled = true, variant = 'full' }: BookCoverProps) {
  const { i18n } = useTranslation();
  const [failed, setFailed] = useState(false);
  const [useFallback, setUseFallback] = useState(false);
  const title = getLocalizedTitle(book, i18n.resolvedLanguage ?? i18n.language);
  const palette = paletteFor(book.slug);
  const preferred = variant === 'card' ? book.thumbnail_path || book.cover_path : book.cover_path;
  const src = useFallback ? book.cover_path : preferred;

  useEffect(() => {
    setFailed(false);
    setUseFallback(false);
  }, [book.id, variant, preferred]);

  if (src && !failed) {
    return (
      <Image
        source={{ uri: src }}
        style={[styles.cover, style as StyleProp<ImageStyle>]}
        resizeMode="cover"
        onError={() => {
          if (variant === 'card' && book.thumbnail_path && !useFallback && book.cover_path) {
            setUseFallback(true);
            return;
          }
          setFailed(true);
        }}
      />
    );
  }

  return (
    <View style={[styles.cover, styles.fallback, { backgroundColor: palette[1] }, style]}>
      <View style={[styles.band, { backgroundColor: palette[0] }]} />
      {labeled ? (
        <Text numberOfLines={3} style={styles.fallbackTitle}>
          {title}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  cover: {
    width: '100%',
    height: '100%',
  },
  fallback: {
    justifyContent: 'flex-end',
    padding: 12,
  },
  band: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '46%',
    opacity: 0.55,
  },
  fallbackTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    lineHeight: 19,
  },
});
