export function AmbientBackdrop() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="ambient-orb-a absolute -top-[18%] -left-[12%] h-[52vmax] w-[52vmax] rounded-full bg-[radial-gradient(circle,var(--app-orb-a),transparent_68%)] blur-2xl" />
      <div className="ambient-orb-b absolute top-[28%] -right-[16%] h-[42vmax] w-[42vmax] rounded-full bg-[radial-gradient(circle,var(--app-orb-b),transparent_70%)] blur-2xl" />
      <div className="ambient-orb-c absolute -bottom-[22%] left-[18%] h-[46vmax] w-[46vmax] rounded-full bg-[radial-gradient(circle,var(--app-orb-c),transparent_65%)] blur-3xl" />
    </div>
  );
}
