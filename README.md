# The Pacific Crest Trail · เส้นทางแปซิฟิกเครสต์

https://nanobotco.github.io/pct/ · ไทย https://nanobotco.github.io/pct/th/

Built the way the Mae Hong Son Loop is: one inlined stylesheet, system fonts, site-kit parallax bands, a folding top bar, and a Thai edition.

- `python3 tools/build.py` writes `docs/index.html` and `docs/th/index.html`; all copy lives in it, English and Thai side by side.
- `docs/sky.js` draws the trail as a constellation at real coordinates under the current moon phase.
- `tools/card.html` renders `docs/card.jpg` in headless Chrome with `--force-prefers-reduced-motion`.
- `python3 tools/serve.py` serves `docs/` on port 8871.

Text CC BY 4.0. Photos from Wikimedia Commons keep their own licences, credited on each band.
