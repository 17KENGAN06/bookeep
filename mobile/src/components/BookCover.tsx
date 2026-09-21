import { useState } from 'react';
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

function coverSources(book: Book, variant: 'full' | 'card') {
  const list = variant === 'card' ? [book.thumbnail_path, book.cover_path] : [book.cover_path];
  return list.filter((value, index): value is string => Boolean(value) && list.indexOf(value) === index);
}

type BookCoverProps = {
  book: Book;
  style?: StyleProp<ViewStyle & ImageStyle>;
  labeled?: boolean;
  variant?: 'full' | 'card';
};

export function BookCover({ book, style, labeled = true, variant = 'full' }: BookCoverProps) {
  const { i18n } = useTranslation();
  const title = getLocalizedTitle(book, i18n.resolvedLanguage ?? i18n.language);
  const palette = paletteFor(book.slug);
  const sources = coverSources(book, variant);

  if (sources.length > 0) {
    return <CoverImage key={sources.join('|')} sources={sources} style={style} />;
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

function CoverImage({
  sources,
  style,
}: {
  sources: string[];
  style?: StyleProp<ViewStyle & ImageStyle>;
}) {
  const [index, setIndex] = useState(0);
  const src = sources[index];

  if (!src) return null;

  return (
    <Image
      source={{ uri: src }}
      style={[styles.cover, style as StyleProp<ImageStyle>]}
      resizeMode="cover"
      onError={() => setIndex((current) => current + 1)}
    />
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
