"""Generate the Aurora star field as absolutely-positioned <div>s.

One-shot, seeded so rebuilds don't reflow. Output is a static HTML
fragment served from docs/assets/aurora-stars.html, fetched and
injected by aurora.js after first paint (keeps ~25KB of star markup
off the critical path of every page). Each star is a tiny div with
its own --bo (base opacity), --r (radius in px), --dur (twinkle
duration), --d (delay). Hero stars carry a static box-shadow halo.

Wired as an MkDocs hook (see mkdocs.yml). The on_config entry-point
regenerates docs/assets/aurora-stars.html on every build/serve so
edits to the tuning constants below take effect automatically. Also
runnable from the CLI (`python hooks/gen_stars.py`) for ad-hoc use.
"""
import random
from pathlib import Path

TINTS_SMALL = ['#e8f0ff', '#fff4e0', '#ffffff', '#ffffff', '#dfe8ff']
TINTS_MED   = ['#ffffff', '#f4e9ff', '#fff1d8', '#e0eaff']
TINTS_HERO  = ['#ffffff', '#fff6e0', '#e6efff']

OUT_PATH = Path(__file__).resolve().parents[1] / "docs" / "assets" / "aurora-stars.html"


def rpos(rng):
    return round(rng.uniform(0, 100), 2), round(rng.uniform(0, 100), 2)


def rclock(rng):
    return round(rng.uniform(7.5, 15.5), 2), round(rng.uniform(-18, 0), 2)


def twinkle_style(dur, delay):
    return (
        f'--twinkle-dur:{dur}s;--twinkle-delay:{delay}s;'
        f'animation:aur-twinkle var(--twinkle-dur) ease-in-out var(--twinkle-delay) infinite'
    )


def small(rng, count):
    rows = []
    for _ in range(count):
        x, y = rpos(rng)
        dur, delay = rclock(rng)
        op = round(rng.uniform(0.45, 0.78), 2)
        fill = rng.choice(TINTS_SMALL)
        glow = round(0.08 + (op - 0.45) * 0.28, 2)
        rows.append(
            f'<i class="aur-star" style="left:{x}%;top:{y}%;'
            f'width:1.8px;height:1.8px;color:{fill};'
            f'--bo:{op};--star-glow-blur:3px;--star-glow-alpha:{glow};'
            f'{twinkle_style(dur, delay)}"></i>'
        )
    return '\n      '.join(rows)


def med(rng, count):
    rows = []
    for _ in range(count):
        x, y = rpos(rng)
        dur, delay = rclock(rng)
        op = round(rng.uniform(0.70, 0.92), 2)
        fill = rng.choice(TINTS_MED)
        glow = round(0.16 + (op - 0.70) * 0.36, 2)
        rows.append(
            f'<i class="aur-star" style="left:{x}%;top:{y}%;'
            f'width:2.4px;height:2.4px;color:{fill};'
            f'--bo:{op};--star-glow-blur:5px;--star-glow-alpha:{glow};'
            f'{twinkle_style(dur, delay)}"></i>'
        )
    return '\n      '.join(rows)


def hero(rng, count):
    rows = []
    for _ in range(count):
        x, y = rpos(rng)
        dur, delay = round(rng.uniform(9.0, 18.0), 2), round(rng.uniform(-20, 0), 2)
        fill = rng.choice(TINTS_HERO)
        size = round(rng.uniform(2.6, 3.8), 1)
        bo = round(rng.uniform(0.78, 0.96), 2)
        spike_rot = rng.randint(0, 89)
        spike_len = rng.randint(19, 32)
        ray_main = round(rng.uniform(0.76, 1.08), 2)
        ray_cross = round(rng.uniform(0.58, 0.82), 2)
        ray_main_opacity = round(rng.uniform(0.60, 0.82), 2)
        ray_cross_opacity = round(rng.uniform(0.48, 0.68), 2)
        brightness = round(rng.uniform(0.88, 1.14), 2)
        size_t = (size - 2.6) / (3.8 - 2.6)
        halo_warm = round(0.18 + size_t * 0.20 + rng.uniform(-0.03, 0.04), 2)
        halo_cool = round(0.08 + size_t * 0.12 + rng.uniform(-0.02, 0.03), 2)
        halo_blur = round(5.0 + size_t * 7.0, 1)
        ray_glow = round(0.24 + size_t * 0.22, 2)
        rows.append(
            f'<i class="aur-star aur-star--hero" style="left:{x}%;top:{y}%;'
            f'width:{size}px;height:{size}px;color:{fill};'
            f'--hero-size:{size}px;--bo:{bo};--spike-rot:{spike_rot}deg;--spike-len:{spike_len}px;'
            f'--ray-main:{ray_main};--ray-cross:{ray_cross};'
            f'--ray-main-opacity:{ray_main_opacity};--ray-cross-opacity:{ray_cross_opacity};'
            f'--hero-brightness:{brightness};--hero-halo-warm:{halo_warm};--hero-halo-cool:{halo_cool};'
            f'--hero-halo-blur:{halo_blur}px;--ray-glow:{ray_glow};'
            f'{twinkle_style(dur, delay)}"></i>'
        )
    return '\n      '.join(rows)


def render():
    """Build the star markup and return it as a string.

    Uses a fresh seeded RNG each call so output is deterministic and
    rebuilds don't reflow stars. Stars are rendered twice per layer
    inside stacked "lanes": a 200vh-tall layer with two identical
    copies lets the CSS @keyframes translate the wrapper by -50%
    over a long duration with a seamless visual loop — what's at the
    top after the snap is what was at the bottom just before, pixel
    for pixel.
    """
    rng = random.Random(42)
    far_stars = small(rng, 88) + '\n      ' + med(rng, 33)
    near_stars = hero(rng, 9)
    return f'''<!-- Static star field fragment. 139 absolutely-positioned <i> elements:
     88 small (1.8px), 33 medium (2.4px), 9 hero (varied 2.6-3.8px + soft halo).
     Two parallax-warp layers (FAR slow, NEAR fast); each layer is the
     stars rendered twice in stacked lanes so the @keyframes aur-warp
     can translate -50% infinitely without a visible snap. Each star
     carries its own --bo, visual variation, and random twinkle timing.
     Generated by hooks/gen_stars.py (seed=42). Fetched and injected
     by aurora.js after first paint. -->
<div class="aur-starfield" aria-hidden="true">
  <div class="aur-starfield__dust"></div>
  <div class="aur-starfield__layer aur-starfield__layer--far">
    <div class="aur-starfield__lane">
      {far_stars}
    </div>
    <div class="aur-starfield__lane">
      {far_stars}
    </div>
  </div>
  <div class="aur-starfield__layer aur-starfield__layer--near">
    <div class="aur-starfield__lane">
      {near_stars}
    </div>
    <div class="aur-starfield__lane">
      {near_stars}
    </div>
  </div>
</div>
'''


def write_if_changed(out_path: Path, content: str) -> bool:
    """Write only when content differs — avoids triggering mkdocs serve
    livereload loops when nothing actually changed."""
    if out_path.exists() and out_path.read_text(encoding="utf-8") == content:
        return False
    out_path.write_text(content, encoding="utf-8")
    return True


def on_config(config, **kwargs):
    """MkDocs hook: regenerate the star include before the build runs."""
    write_if_changed(OUT_PATH, render())
    return config


if __name__ == "__main__":
    content = render()
    changed = write_if_changed(OUT_PATH, content)
    print(f"{'Wrote' if changed else 'Unchanged'} {OUT_PATH.name} "
          f"({len(content)} chars, {content.count('aur-star')} star tags)")
