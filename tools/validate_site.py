"""Validate local links, media paths, and alt text for the training guide.

This is intentionally offline by default. It verifies local files and
internal page links, and checks that external URLs are well-formed without
trying to contact Salesforce, YouTube, or Google Forms.
"""

from __future__ import annotations

import argparse
import re
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.parse import urljoin, urlparse, unquote

try:
    import yaml
except ImportError:  # pragma: no cover - dependency is installed with MkDocs.
    yaml = None


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
MKDOCS = ROOT / "mkdocs.yml"

EXTERNAL_SCHEMES = {"http", "https", "mailto", "tel"}
MEDIA_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".webm", ".mp4", ".svg", ".pdf"}
VIDEO_EXTS = {".webm", ".mp4"}
IMAGE_EXTS = {".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp"}

FRONT_MATTER_RE = re.compile(r"\A---\s*\n(.*?)\n---\s*\n?", re.DOTALL)
HTML_ATTR_RE = re.compile(r"""(?P<tag><(?P<name>a|img|video|source)\b[^>]*?\s(?P<attr>href|src)=["'](?P<url>[^"']+)["'][^>]*>)""", re.IGNORECASE)
ALT_RE = re.compile(r"""\salt=["'](?P<alt>[^"']*)["']""", re.IGNORECASE)
MD_LINK_RE = re.compile(r"""(?P<bang>!?)\[(?P<label>[^\]]*)\]\((?P<url>[^)\s]+)(?:\s+["'][^"']*["'])?\)""")


@dataclass
class Issue:
    severity: str
    path: Path
    line: int
    message: str

    def render(self) -> str:
        rel = self.path.relative_to(ROOT)
        return f"[{self.severity}] {rel}:{self.line} - {self.message}"


def line_for(text: str, index: int) -> int:
    return text.count("\n", 0, index) + 1


def page_url(path: Path) -> str:
    rel = path.relative_to(DOCS).with_suffix("")
    if rel.as_posix() == "index":
        return "/"
    return "/" + rel.as_posix().rstrip("/") + "/"


def is_external(url: str) -> bool:
    parsed = urlparse(url)
    return parsed.scheme in EXTERNAL_SCHEMES or url.startswith("//")


def strip_fragment_and_query(url: str) -> str:
    parsed = urlparse(url)
    return parsed._replace(query="", fragment="").geturl()


def docs_file_for_site_url(url: str) -> Path | None:
    """Map a site-local URL to a docs file or asset path."""
    parsed = urlparse(url)
    clean = unquote(parsed.path)
    if not clean or clean == "/":
        return DOCS / "index.md"
    clean = clean.lstrip("/")
    candidate = DOCS / clean
    if candidate.suffix:
        return candidate
    page_candidate = DOCS / (clean.rstrip("/") + ".md")
    if page_candidate.exists():
        return page_candidate
    return DOCS / clean.rstrip("/") / "index.md"


def resolve_local_url(url: str, source: Path) -> Path | None:
    if not url or url.startswith("#") or is_external(url):
        return None

    clean = strip_fragment_and_query(url)
    if not clean:
        return None

    # Asset-like relative paths in front matter are authored from docs root.
    if clean.startswith("assets/"):
        return DOCS / clean

    # HTML/Markdown links render as page-relative URLs in the built site.
    base = page_url(source)
    site_resolved = urljoin(base, clean)
    site_path = docs_file_for_site_url(site_resolved)
    if site_path and site_path.exists():
        return site_path

    # If the URL has a file extension, it may be a local asset next to the page
    # or a docs-root path used inside raw HTML.
    source_relative = (source.parent / clean).resolve()
    docs_root_relative = (DOCS / clean.lstrip("/")).resolve()
    if Path(clean).suffix:
      if source_relative.exists():
          return source_relative
      return docs_root_relative

    return site_path


def load_front_matter(text: str) -> tuple[dict[str, Any], int]:
    match = FRONT_MATTER_RE.match(text)
    if not match:
        return {}, 1
    if yaml is None:
        return {}, 1
    data = yaml.safe_load(match.group(1)) or {}
    start_line = text[: match.start(1)].count("\n") + 1
    return data if isinstance(data, dict) else {}, start_line


def iter_media_items(meta: dict[str, Any]) -> list[tuple[str, str | None]]:
    items: list[tuple[str, str | None]] = []

    media = meta.get("media")
    if isinstance(media, dict):
        items.append((str(media.get("src", "")), media.get("alt")))

    steps = meta.get("steps")
    if isinstance(steps, list):
        for step in steps:
            if not isinstance(step, dict):
                continue
            step_media = step.get("media")
            if isinstance(step_media, list):
                for item in step_media:
                    if isinstance(item, dict):
                        items.append((str(item.get("src", "")), item.get("alt")))

    return items


def validate_media_file(src: str, source: Path, line: int, issues: list[Issue]) -> None:
    if not src:
        issues.append(Issue("ERROR", source, line, "Media item is missing a src value."))
        return
    if is_external(src):
        return

    target = resolve_local_url(src, source)
    if not target or not target.exists():
        issues.append(Issue("ERROR", source, line, f"Missing local media file: {src}"))
        return

    suffix = target.suffix.lower()
    if suffix == ".webm":
        mp4 = target.with_suffix(".mp4")
        if not mp4.exists():
            issues.append(Issue("WARN", source, line, f"WebM has no MP4 fallback: {src}"))


def validate_url(url: str, source: Path, line: int, issues: list[Issue], kind: str) -> None:
    if not url or url.startswith("#"):
        return
    parsed = urlparse(url)
    if parsed.scheme and parsed.scheme not in EXTERNAL_SCHEMES:
        issues.append(Issue("WARN", source, line, f"Unexpected URL scheme in {kind}: {url}"))
        return
    if is_external(url):
        if parsed.scheme in {"http", "https"} and not parsed.netloc:
            issues.append(Issue("ERROR", source, line, f"Malformed external {kind}: {url}"))
        return

    target = resolve_local_url(url, source)
    if not target or not target.exists():
        issues.append(Issue("ERROR", source, line, f"Broken local {kind}: {url}"))
        return

    if target.suffix.lower() == ".webm":
        mp4 = target.with_suffix(".mp4")
        if not mp4.exists():
            issues.append(Issue("WARN", source, line, f"WebM link has no MP4 fallback: {url}"))


def validate_markdown_file(path: Path) -> list[Issue]:
    text = path.read_text(encoding="utf-8")
    issues: list[Issue] = []
    meta, _ = load_front_matter(text)

    for src, alt in iter_media_items(meta):
        idx = text.find(src) if src else 0
        line = line_for(text, idx if idx >= 0 else 0)
        validate_media_file(src, path, line, issues)
        suffix = Path(strip_fragment_and_query(src)).suffix.lower()
        if suffix in IMAGE_EXTS | VIDEO_EXTS and (alt is None or not str(alt).strip()):
            issues.append(Issue("WARN", path, line, f"Media item has missing alt text: {src}"))

    video = meta.get("video")
    if isinstance(video, dict) and video.get("src"):
        src = str(video["src"])
        idx = text.find(src)
        validate_url(src, path, line_for(text, idx if idx >= 0 else 0), issues, "video URL")

    for match in HTML_ATTR_RE.finditer(text):
        tag = match.group("tag")
        name = match.group("name").lower()
        attr = match.group("attr").lower()
        url = match.group("url")
        line = line_for(text, match.start())
        validate_url(url, path, line, issues, attr)
        if name == "img":
            alt = ALT_RE.search(tag)
            if alt is None or not alt.group("alt").strip():
                issues.append(Issue("WARN", path, line, f"Image has missing alt text: {url}"))

    for match in MD_LINK_RE.finditer(text):
        url = match.group("url")
        line = line_for(text, match.start())
        kind = "image" if match.group("bang") else "link"
        validate_url(url, path, line, issues, kind)
        if kind == "image" and not match.group("label").strip():
            issues.append(Issue("WARN", path, line, f"Markdown image has missing alt text: {url}"))

    return issues


def validate_config() -> list[Issue]:
    issues: list[Issue] = []
    if yaml is None or not MKDOCS.exists():
        return issues
    data = yaml.safe_load(MKDOCS.read_text(encoding="utf-8")) or {}

    for key in ("extra_css", "extra_javascript"):
        for item in data.get(key, []) or []:
            target = DOCS / str(item)
            if not target.exists():
                issues.append(Issue("ERROR", MKDOCS, 1, f"Missing {key} asset: {item}"))

    theme = data.get("theme") or {}
    if isinstance(theme, dict) and theme.get("favicon"):
        favicon = DOCS / str(theme["favicon"])
        if not favicon.exists():
            issues.append(Issue("ERROR", MKDOCS, 1, f"Missing favicon: {theme['favicon']}"))

    return issues


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate local links, media paths, and alt text.")
    parser.add_argument("--quiet", action="store_true", help="Only print issues.")
    args = parser.parse_args()

    if yaml is None:
        print(
            "PyYAML is required for validation (front-matter parsing). "
            "Run: pip install -r requirements.txt",
            file=sys.stderr,
        )
        return 2

    issues: list[Issue] = []
    issues.extend(validate_config())
    for path in sorted(DOCS.glob("*.md")):
        issues.extend(validate_markdown_file(path))

    errors = [i for i in issues if i.severity == "ERROR"]
    warnings = [i for i in issues if i.severity == "WARN"]

    if issues:
        for issue in issues:
            print(issue.render())
    elif not args.quiet:
        print("No broken local links, missing media files, or missing alt text found.")

    if not args.quiet:
        print(f"\nChecked {len(list(DOCS.glob('*.md')))} Markdown pages.")
        print(f"Errors: {len(errors)}")
        print(f"Warnings: {len(warnings)}")

    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
