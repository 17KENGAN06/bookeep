/**
 * Site-wide background: a fine dot field that is denser toward the edges of the screen and two
 * hairline column guides on the container edges (wide screens). Fixed, behind everything, inert.
 */
export function AmbientBackdrop() {
  return (
    <div aria-hidden className="site-backdrop">
      <div className="site-guides" />
    </div>
  );
}
