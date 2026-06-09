"""Render markdown-formatted lesson front-matter fields to HTML, and
stamp each page with its position in the linear nav.

Front-matter on a lesson page can contain markdown in:
- `steps[].body`
- `tip.body`

Mkdocs only renders the page body as markdown, not front-matter strings.
This hook fills `*_html` siblings on each markdown-bearing key so the
lesson template can `{{ step.body_html | safe }}` without inventing a
Jinja markdown filter.

`on_nav` also assigns `page.lesson_pos` (1-based index, 0 for the
homepage) and `page.lesson_total` (count of non-home pages) so both
base.html and main.html can read the same numbers instead of each
walking nav.pages independently.
"""

from __future__ import annotations

import markdown as _md


def _renderer():
    return _md.Markdown(extensions=["extra", "sane_lists"], output_format="html5")


def on_nav(nav, config, files, **kwargs):
    pages = list(nav.pages)
    total = sum(1 for p in pages if not p.is_homepage)
    for idx, p in enumerate(pages):
        p.lesson_pos = idx
        p.lesson_total = total
    return nav


def on_page_markdown(markdown_content, page, config, **kwargs):
    meta = page.meta or {}
    md = _renderer()

    def render(s):
        md.reset()
        return md.convert(s)

    steps = meta.get("steps")
    if isinstance(steps, list):
        for step in steps:
            if isinstance(step, dict) and isinstance(step.get("body"), str):
                step["body_html"] = render(step["body"])

    tip = meta.get("tip")
    if isinstance(tip, dict) and isinstance(tip.get("body"), str):
        tip["body_html"] = render(tip["body"])

    return markdown_content
