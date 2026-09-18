import { useWindowDimensions } from 'react-native';

export const PAGE_PAD = 20;
export const GRID_GAP = 12;
export const STAGE_MAX = 1080;
export const TAB_MAX = 560;
export const FORM_MAX = 440;
export const ARTICLE_MAX = 720;

export function useLayout() {
  const { width, height } = useWindowDimensions();
  const stageWidth = Math.min(width, STAGE_MAX);
  const innerWidth = Math.max(0, stageWidth - PAGE_PAD * 2);
  const isWide = width >= 700;
  const columns = innerWidth >= 900 ? 4 : innerWidth >= 560 ? 3 : 2;
  const cardWidth = Math.floor((innerWidth - GRID_GAP * (columns - 1)) / columns);

  return {
    width,
    height,
    stageWidth,
    innerWidth,
    isWide,
    columns,
    cardWidth,
    gap: GRID_GAP,
    pad: PAGE_PAD,
  };
}
