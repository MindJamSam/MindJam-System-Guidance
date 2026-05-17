"""Render markdown-formatted lesson front-matter fields to HTML.

Front-matter on a lesson page can contain markdown in:
- `steps[].body`
- `tip.body`

Mkdocs only renders the page body as markdown, not front-matter strings.
This hook fills `*_html` siblings on each markdown-bearing key so the
lesson template can `{{ step.body_html | safe }}` without inventing a
Jinja markdown filter.

No new dependencies — `markdown` is already a mkdocs runtime dependency.
"""

from __future__ import annotations

import markdown as _md


def _renderer():
    return _md.Markdown(extensions=["extra", "sane_lists"], output_format="html5")


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
