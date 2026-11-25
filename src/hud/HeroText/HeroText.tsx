interface HeroTextProps {
  dimmed: boolean;
}

export function HeroText({ dimmed }: HeroTextProps) {
  return (
    <section
      className={`hud-hero ${dimmed ? 'hud-hero--dimmed' : ''}`}
      aria-label="The Regret Cemetery"
    >
      <h1 className="hud-hero__title">The Regret Cemetery</h1>
      <p className="hud-hero__sub">
        A place where your bad decisions finally rest in peace.
      </p>
      <div className="hud-hero__divider" aria-hidden="true" />
    </section>
  );
}
