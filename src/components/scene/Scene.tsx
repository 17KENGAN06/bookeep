export type SceneName = 'room' | 'library' | 'botanical';

type SceneProps = {
  name: SceneName;
  shade?: 'left' | 'center' | 'soft';
  underHeader?: boolean;
  className?: string;
};

/*
 * Section backdrops. The premium-dark system keeps pages on a flat aubergine ground with no
 * pictorial backgrounds, so these render nothing; the props stay so every page keeps its API.
 */
export function Scene(_props: SceneProps) {
  return null;
}

export function CoverScene(_props: { src: string; underHeader?: boolean; className?: string }) {
  return null;
}
