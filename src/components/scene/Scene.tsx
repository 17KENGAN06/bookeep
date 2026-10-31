import type { CSSProperties } from 'react';
import { cn } from '@/utils/cn';

export type SceneName = 'room' | 'library' | 'botanical';

type SceneProps = {
  name: SceneName;
  /** Where the readable side of the picture is: text on the left, centred, or only top/bottom fades. */
  shade?: 'left' | 'center' | 'soft';
  /** Extend the picture up behind the sticky header. */
  underHeader?: boolean;
  className?: string;
};

/** A painted, out-of-focus room behind a section. Purely decorative. */
export function Scene({ name, shade = 'left', underHeader = false, className }: SceneProps) {
  return (
    <div
      aria-hidden
      className={cn('scene', className)}
      data-scene={name}
      data-shade={shade === 'left' ? undefined : shade}
      data-under-header={underHeader ? '' : undefined}
    >
      <div className="scene-img" />
      <div className="scene-shade" />
    </div>
  );
}

/** A blurred, darkened copy of a cover used as a backdrop. The cover file itself is untouched. */
export function CoverScene({ src, underHeader = false, className }: { src: string; underHeader?: boolean; className?: string }) {
  return (
    <div
      aria-hidden
      className={cn('scene scene-cover', className)}
      data-shade="soft"
      data-under-header={underHeader ? '' : undefined}
      style={{ '--scene-cover': `url("${src}")` } as CSSProperties}
    >
      <div className="scene-img" />
      <div className="scene-shade" />
    </div>
  );
}
