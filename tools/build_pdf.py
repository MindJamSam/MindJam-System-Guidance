"""Build the print-edition PDF from the site's markdown + front-matter.

Clean dark theme (no starfield, no aurora blobs). Every section header and
page gets a bookmark + outline entry so PDF readers show a real navigable
sidebar TOC. The printed Contents page uses clickable in-document links.
"""

from __future__ import annotations

import html
import re
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import yaml
from PIL import Image as PILImage, ImageDraw, ImageFont
from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.pdfdoc import PDFName
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas as _rl_canvas_mod
from reportlab.platypus import Flowable, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle


# --- Style PDF viewer hover-highlight on link annotations -----------------
# Firefox (and some other viewers) draw a bright coloured box over every
# link annotation on hover, which reads as garish. The PDF spec lets us
# choose the highlight mode via the annotation's `H` key. Paragraph's
# <link> tag doesn't expose that kwarg, so we patch the two canvas
# methods that actually create link annotations to inject a sensible
# default unless the caller already set one.
_orig_linkURL = _rl_canvas_mod.Canvas.linkURL
_orig_linkRect = _rl_canvas_mod.Canvas.linkRect


def _linkURL_no_hover(self, url, rect, relative=0, thickness=0, color=None,
                      dashArray=None, kind="URI", **kw):
    # H (Highlight Mode): /O = thin outline on hover. /N would kill the
    # hover cue entirely; /P (default) draws the ugly filled box some
    # viewers render as bright yellow.
    kw.setdefault("H", PDFName("O"))
    return _orig_linkURL(self, url, rect, relative, thickness, color, dashArray, kind, **kw)


def _linkRect_no_hover(self, contents, destinationname, Rect=None, addtopage=1,
                       name=None, relative=1, thickness=0, color=None,
                       dashArray=None, **kw):
    # H (Highlight Mode): /O = thin outline on hover. /N would kill the
    # hover cue entirely; /P (default) draws the ugly filled box some
    # viewers render as bright yellow.
    kw.setdefault("H", PDFName("O"))
    return _orig_linkRect(self, contents, destinationname, Rect, addtopage,
                          name, relative, thickness, color, dashArray, **kw)


_rl_canvas_mod.Canvas.linkURL = _linkURL_no_hover
_rl_canvas_mod.Canvas.linkRect = _linkRect_no_hover
# --------------------------------------------------------------------------


ROOT = Path(__file__).resolve().parents[1]
DOCS = ROOT / "docs"
OUT = DOCS / "assets" / "PDFs" / "Salesforce_Training_Guide_Print_Edition.pdf"
PAGE_W, PAGE_H = A4

# Dark-mode palette.
BG            = colors.HexColor("#0e0a1c")   # page background
PANEL         = colors.HexColor("#191230")   # base tile fill
PANEL_2       = colors.HexColor("#1e1637")   # nested tile fill
PANEL_BORDER  = colors.Color(1, 1, 1, 0.08)
ACCENT        = colors.HexColor("#e56bc5")   # pink accent
ACCENT_SOFT   = colors.HexColor("#d074c9")
INK           = colors.HexColor("#ead7f5")   # heading text
SOFT          = colors.HexColor("#d7c2e6")   # body text
MUTED         = colors.HexColor("#a995b8")   # captions/small text
RULE          = colors.Color(1, 1, 1, 0.10)  # subtle horizontal rule

try:
    pdfmetrics.registerFont(TTFont("SegoeEmoji", r"C:\Windows\Fonts\seguiemj.ttf"))
except Exception:
    pass


def fix_text(value: str) -> str:
    replacements = {
        "Â£": "£",
        "Â ": " ",
        "Â": "",
        "â€™": "'",
        "â€œ": '"',
        "â€": '"',
        "â€“": "-",
        "â€”": "-",
        "â†’": "->",
        "Ã¢â€ â€™": "->",
    }
    for old, new in replacements.items():
        value = value.replace(old, new)
    value = value.replace(" — ", ": ")
    value = value.replace("—", "-")
    value = re.sub(r"\s+", " ", value)
    return value.strip()


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-") or "section"


def split_front_matter(raw: str) -> tuple[dict, str]:
    raw = raw.lstrip("﻿")
    if raw.startswith("---"):
        _, front, body = raw.split("---", 2)
        return yaml.safe_load(front) or {}, body
    return {}, raw


def strip_html(value: str) -> str:
    def anchor(match: re.Match[str]) -> str:
        url = match.group(1)
        label = fix_text(strip_html(match.group(2)))
        return f"[{label}]({url})"

    value = re.sub(r"<!--.*?-->", "", value, flags=re.S)
    value = re.sub(r"<script\b.*?</script>", "", value, flags=re.I | re.S)
    value = re.sub(r"<style\b.*?</style>", "", value, flags=re.I | re.S)
    value = re.sub(r"<svg\b.*?</svg>", "", value, flags=re.I | re.S)
    value = re.sub(r"<table\b[^>]*class=[\"'][^\"']*aur-status-table[^\"']*[\"'][^>]*>.*?</table>", "", value, flags=re.I | re.S)
    value = re.sub(r"<button\b[^>]*class=[\"'][^\"']*aur-steps-toggle[^\"']*[\"'][^>]*>.*?</button>", "", value, flags=re.I | re.S)
    value = re.sub(
        r"<button\b[^>]*class=[\"'][^\"']*aur-copy[^\"']*[\"'][^>]*data-aur-copy=[\"']([^\"']+)[\"'][^>]*>.*?</button>",
        lambda m: f"\nDiscord: {fix_text(m.group(1))}\n",
        value,
        flags=re.I | re.S,
    )
    value = re.sub(r"<button\b[^>]*class=[\"'][^\"']*aur-copy[^\"']*[\"'][^>]*>.*?</button>", "", value, flags=re.I | re.S)
    value = re.sub(r"<nav\b[^>]*class=[\"'][^\"']*aur-page-nav[^\"']*[\"'][^>]*>.*?</nav>", "", value, flags=re.I | re.S)
    value = re.sub(r"<span\b[^>]*class=[\"'][^\"']*aur-copy__label-done[^\"']*[\"'][^>]*>.*?</span>", "", value, flags=re.I | re.S)
    value = re.sub(r"<span\b[^>]*aria-hidden=[\"']true[\"'][^>]*>.*?</span>", "", value, flags=re.I | re.S)
    value = re.sub(r"<(h[1-6]|p|div|article|section|details|summary|dt|dd|tr|th|td)\b[^>]*>", "\n", value, flags=re.I)
    value = re.sub(r"</(h[1-6]|p|div|article|section|details|summary|dt|dd|tr|th|td)>", "\n", value, flags=re.I)
    value = re.sub(r"<a\b[^>]*href=[\"']([^\"']+)[\"'][^>]*>(.*?)</a>", anchor, value, flags=re.I | re.S)
    value = re.sub(r"<br\s*/?>", "\n", value, flags=re.I)
    value = re.sub(r"</p\s*>", "\n\n", value, flags=re.I)
    value = re.sub(r"</li\s*>", "\n", value, flags=re.I)
    value = re.sub(r"<li[^>]*>", "\n", value, flags=re.I)
    value = re.sub(r"<[^>]+>", "", value)
    return html.unescape(value)


def markdown_to_chunks(value: str) -> list[str]:
    value = strip_html(value)
    value = re.sub(r"!\[[^\]]*\]\([^)]+\)", "", value)
    value = value.replace("`", "")
    chunks: list[str] = []
    paragraph: list[str] = []

    def flush_paragraph() -> None:
        if paragraph:
            cleaned = fix_text(" ".join(paragraph))
            if cleaned:
                chunks.extend(split_long_chunk(cleaned))
            paragraph.clear()

    for line in value.splitlines():
        raw_line = line.rstrip()
        line = raw_line.strip()
        if not line or line.startswith("---") or line == "**Key:**":
            flush_paragraph()
            continue
        if line.startswith("#"):
            line = line.lstrip("#").strip()
        bullet = re.match(r"^[-*]\s+(.+)$", line)
        if bullet:
            flush_paragraph()
            item = bullet.group(1).strip()
            item = re.sub(r"^\*\*([^*]+)\*\*\s*[:\-]\s*", r"\1: ", item)
            item = re.sub(r"^\*([^*]+)\*\s*[:\-]\s*", r"\1: ", item)
            item = item.replace(" — ", ": ")
            item = item.replace("—", ":")
            chunks.append(fix_text(item))
        else:
            paragraph.append(line)
    flush_paragraph()
    return chunks


def split_long_chunk(cleaned: str) -> list[str]:
    if len(cleaned) <= 520:
        return [cleaned]
    chunks: list[str] = []
    sentences = re.split(r"(?<=[.!?])\s+", cleaned)
    current = ""
    for sentence in sentences:
        if current and len(current) + len(sentence) > 520:
            chunks.append(current.strip())
            current = sentence
        else:
            current = f"{current} {sentence}".strip()
    if current:
        chunks.append(current.strip())
    return chunks


def nav_entries(nav: list) -> list[tuple[str | None, str, Path]]:
    entries: list[tuple[str | None, str, Path]] = []
    for item in nav:
        if not isinstance(item, dict):
            continue
        section, value = next(iter(item.items()))
        if isinstance(value, str):
            entries.append((None, section, DOCS / value))
        elif isinstance(value, list):
            for child in value:
                if not isinstance(child, dict):
                    continue
                title, page = next(iter(child.items()))
                entries.append((section, title, DOCS / page))
    return entries


@dataclass
class PageData:
    section: str | None
    nav_title: str
    title: str
    description: str
    steps: list[dict]
    body: list[str]
    video: dict | None
    path: Path


def load_pages() -> list[PageData]:
    config = yaml.safe_load((ROOT / "mkdocs.yml").read_text(encoding="utf-8"))
    pages: list[PageData] = []
    for section, nav_title, path in nav_entries(config["nav"]):
        raw = path.read_text(encoding="utf-8")
        meta, body = split_front_matter(raw)
        pages.append(
            PageData(
                section=section,
                nav_title=nav_title,
                title=fix_text(str(meta.get("title") or nav_title)),
                description=fix_text(str(meta.get("description") or "")),
                steps=meta.get("steps") or [],
                body=markdown_to_chunks(body),
                video=meta.get("video") if isinstance(meta.get("video"), dict) else None,
                path=path,
            )
        )
    return pages


def draw_background(canvas, doc) -> None:
    """Solid dark page + thin accent hairline near the bottom, plus page number."""
    canvas.saveState()
    canvas.setFillColor(BG)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)

    # Hairline separator above the page number
    canvas.setStrokeColor(RULE)
    canvas.setLineWidth(0.4)
    canvas.line(18 * mm, 14 * mm, PAGE_W - 18 * mm, 14 * mm)

    canvas.setFillColor(MUTED)
    canvas.setFont("Helvetica", 8.6)
    canvas.drawString(18 * mm, 10 * mm, "MindJam · Salesforce Training Guide")
    canvas.drawRightString(PAGE_W - 18 * mm, 10 * mm, str(canvas.getPageNumber()))
    canvas.restoreState()


class BookmarkAnchor(Flowable):
    """Zero-height flowable that records a PDF bookmark + outline entry
    at its position. Populates the sidebar TOC that PDF readers show and
    provides destinations for in-document links.
    """

    def __init__(self, key: str, title: str, level: int = 0):
        super().__init__()
        self.key = key
        self.title = title
        self.level = level
        self.width = 0
        self.height = 0

    def wrap(self, avail_width, avail_height):
        return 0, 0

    def draw(self):
        self.canv.bookmarkPage(self.key)
        # Sections closed by default; pages/steps hang beneath their section.
        self.canv.addOutlineEntry(self.title, self.key, self.level, closed=(self.level == 0))


class Card(Flowable):
    """Rounded panel with body flowables inside."""

    def __init__(self, story: Iterable[Flowable], stack: int = 1, pad: float = 7 * mm, align: str = "left"):
        super().__init__()
        self.story = list(story)
        self.stack = stack
        self.pad = pad
        self.align = align
        self.width = 0
        self.height = 0

    def wrap(self, avail_width, avail_height):
        inner = avail_width - self.pad * 2
        height = self.pad * 2
        for item in self.story:
            _, h = item.wrap(inner, avail_height)
            height += h
        height += max(0, len(self.story) - 1) * 3.2 * mm
        self.width = avail_width
        self.height = height
        return avail_width, height

    def split(self, avail_width, avail_height):
        if avail_height < 70 * mm:
            return []
        if self.height <= avail_height or len(self.story) <= 1:
            return []
        chunks: list[Flowable] = []
        current: list[Flowable] = []
        used = self.pad * 2
        inner = avail_width - self.pad * 2
        for item in self.story:
            _, h = item.wrap(inner, avail_height)
            extra = h + (3.2 * mm if current else 0)
            if current and used + extra > avail_height * 0.92:
                chunks.append(Card(current, self.stack, self.pad, self.align))
                current = [item]
                used = self.pad * 2 + h
            else:
                current.append(item)
                used += extra
        if current:
            chunks.append(Card(current, self.stack, self.pad, self.align))
        return chunks

    def draw(self):
        fill = PANEL if self.stack <= 1 else PANEL_2
        self.canv.saveState()
        self.canv.setFillColor(fill)
        self.canv.setStrokeColor(PANEL_BORDER)
        self.canv.setLineWidth(0.55)
        self.canv.roundRect(0, 0, self.width, self.height, 4.5 * mm, fill=1, stroke=1)
        y = self.height - self.pad
        inner = self.width - self.pad * 2
        for item in self.story:
            _, h = item.wrap(inner, self.height)
            y -= h
            x = self.pad
            if self.align == "center":
                x = self.pad + max(0, (inner - getattr(item, "width", inner)) / 2)
            item.drawOn(self.canv, x, y)
            y -= 3.2 * mm
        self.canv.restoreState()


class SectionDivider(Flowable):
    """Big centred section title on its own page, with an accent rule."""

    def __init__(self, title: str):
        super().__init__()
        self.title = title
        self.width = 0
        self.height = 0

    def wrap(self, avail_width, avail_height):
        self.width = avail_width
        self.height = avail_height
        return avail_width, avail_height

    def draw(self):
        c = self.canv
        c.saveState()
        # Eyebrow "Section" label
        c.setFillColor(ACCENT_SOFT)
        c.setFont("Helvetica-Bold", 10)
        c.drawCentredString(self.width / 2, self.height / 2 + 22 * mm, "SECTION")
        # Title
        c.setFillColor(INK)
        c.setFont("Helvetica-Bold", 30)
        c.drawCentredString(self.width / 2, self.height / 2 + 8 * mm, self.title)
        # Accent rule
        c.setStrokeColor(ACCENT)
        c.setLineWidth(1.2)
        c.line(self.width / 2 - 30 * mm, self.height / 2 - 2 * mm, self.width / 2 + 30 * mm, self.height / 2 - 2 * mm)
        c.restoreState()


class RoundedImage(Flowable):
    def __init__(self, path: Path, width: float, height: float, radius: int = 14):
        super().__init__()
        self.path = path
        self.draw_width = width
        self.draw_height = height
        self.radius = radius
        self.width = width
        self.height = height
        self.reader = ImageReader(self._rounded())

    def _alpha_base(self, img: PILImage.Image) -> tuple[int, int, int, int]:
        name = self.path.stem.lower()
        if "flow" in name:
            return (16, 9, 26, 255)
        sample = img.resize((max(1, min(80, img.width)), max(1, min(80, img.height))))
        visible = []
        for r, g, b, alpha in sample.getdata():
            if alpha > 24:
                visible.append(0.2126 * r + 0.7152 * g + 0.0722 * b)
        if not visible:
            return (16, 9, 26, 255)
        mean_luma = sum(visible) / len(visible)
        return (255, 255, 255, 255) if mean_luma > 135 else (16, 9, 26, 255)

    def _rounded(self) -> PILImage.Image:
        with PILImage.open(self.path) as source:
            img = source.convert("RGBA")
        if img.getchannel("A").getextrema()[0] < 255:
            base = PILImage.new("RGBA", img.size, self._alpha_base(img))
            img = PILImage.alpha_composite(base, img)
        mask = PILImage.new("L", img.size, 0)
        draw = ImageDraw.Draw(mask)
        draw.rounded_rectangle((0, 0, img.size[0] - 1, img.size[1] - 1), radius=self.radius, fill=255)
        img.putalpha(mask)
        return img

    def wrap(self, avail_width, avail_height):
        self.width = avail_width
        self.height = self.draw_height
        return avail_width, self.draw_height

    def draw(self):
        x = max(0, (self.width - self.draw_width) / 2)
        self.canv.saveState()
        self.canv.drawImage(self.reader, x, 0, self.draw_width, self.draw_height, mask="auto")
        self.canv.setStrokeColor(colors.Color(1, 1, 1, 0.10))
        self.canv.setLineWidth(0.5)
        self.canv.roundRect(x, 0, self.draw_width, self.draw_height, 3.2 * mm, fill=0, stroke=1)
        self.canv.restoreState()


class EmojiIcon(Flowable):
    def __init__(self, symbol: str):
        super().__init__()
        self.symbol = symbol
        self.width = 10 * mm
        self.height = 10 * mm
        self.reader = ImageReader(self._make_icon())

    def _make_icon(self) -> PILImage.Image:
        size = 96
        img = PILImage.new("RGBA", (size, size), (0, 0, 0, 0))
        draw = ImageDraw.Draw(img)
        font_path = r"C:\Windows\Fonts\seguiemj.ttf"
        try:
            font = ImageFont.truetype(font_path, 58)
        except Exception:
            font = ImageFont.load_default()
        try:
            bbox = draw.textbbox((0, 0), self.symbol, font=font, embedded_color=True)
            x = (size - (bbox[2] - bbox[0])) / 2 - bbox[0]
            y = (size - (bbox[3] - bbox[1])) / 2 - bbox[1]
            draw.text((x, y), self.symbol, font=font, embedded_color=True)
        except Exception:
            fill = {
                "🆕": "#7a3fd1",
                "⬜": "#ffffff",
                "✅": "#35b779",
                "❌": "#ef5350",
                "🆘": "#4aa3ff",
                "🟧": "#ff9f43",
                "🟨": "#ffd84d",
            }.get(self.symbol, "#ffffff")
            draw.rounded_rectangle((18, 18, 78, 78), radius=14, fill=fill)
        return img

    def wrap(self, avail_width, avail_height):
        return self.width, self.height

    def draw(self):
        x = max(0, (self._availWidth - self.width) / 2) if hasattr(self, "_availWidth") else 0
        self.canv.drawImage(self.reader, x, 0, self.width, self.height, mask="auto")


def styles():
    return {
        "cover_eyebrow": ParagraphStyle("cover_eyebrow", fontName="Helvetica-Bold", fontSize=11, leading=14, textColor=ACCENT_SOFT, alignment=TA_CENTER, spaceAfter=4 * mm),
        "title": ParagraphStyle("title", fontName="Helvetica-Bold", fontSize=36, leading=40, textColor=INK, alignment=TA_CENTER, spaceAfter=6 * mm),
        "subtitle": ParagraphStyle("subtitle", fontName="Helvetica", fontSize=13, leading=18, textColor=SOFT, alignment=TA_CENTER),
        "body_center": ParagraphStyle("body_center", fontName="Helvetica", fontSize=10.8, leading=15.8, textColor=SOFT, alignment=TA_CENTER),
        "h1": ParagraphStyle("h1", fontName="Helvetica-Bold", fontSize=22, leading=27, textColor=INK, spaceAfter=5 * mm),
        "h2": ParagraphStyle("h2", fontName="Helvetica-Bold", fontSize=15, leading=19, textColor=ACCENT, spaceAfter=2 * mm),
        "h3": ParagraphStyle("h3", fontName="Helvetica-Bold", fontSize=12.6, leading=16, textColor=INK, spaceAfter=1.5 * mm),
        "body": ParagraphStyle("body", fontName="Helvetica", fontSize=10.5, leading=15.2, textColor=SOFT, alignment=TA_LEFT),
        "small": ParagraphStyle("small", fontName="Helvetica", fontSize=9.2, leading=12.8, textColor=MUTED),
        "toc_section": ParagraphStyle("toc_section", fontName="Helvetica-Bold", fontSize=13, leading=18, textColor=INK, spaceBefore=5 * mm, spaceAfter=1.5 * mm),
        "toc_item": ParagraphStyle("toc_item", fontName="Helvetica", fontSize=10.8, leading=16, textColor=SOFT, leftIndent=6 * mm),
        "emoji": ParagraphStyle("emoji", fontName="SegoeEmoji" if "SegoeEmoji" in pdfmetrics.getRegisteredFontNames() else "Helvetica", fontSize=14, leading=17, textColor=INK, alignment=TA_CENTER),
    }


def reportlab_link(url: str) -> str:
    url = html.escape(url.strip(), quote=True)
    if url.startswith("assets/"):
        url = "../" + url
    return url


def inline_markup(text: str) -> str:
    text = fix_text(text)
    pieces: list[str] = []
    pos = 0
    for match in re.finditer(r"\[([^\]]+)\]\(([^)]+)\)", text):
        pieces.append(html.escape(text[pos : match.start()]))
        label = html.escape(fix_text(match.group(1)))
        url = reportlab_link(match.group(2))
        # Underlined + pink accent so URLs read as links in body copy.
        # The canvas patch adds H=/N to the underlying annotation so PDF
        # viewers won't draw a hover-highlight box over the link.
        pieces.append(f'<link href="{url}" color="#e56bc5"><u>{label}</u></link>')
        pos = match.end()
    pieces.append(html.escape(text[pos:]))
    marked = "".join(pieces)
    marked = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", marked)
    marked = re.sub(r"__([^_]+)__", r"<b>\1</b>", marked)
    marked = re.sub(r"\*([^*]+)\*", r"\1", marked)
    marked = re.sub(r"_([^_]+)_", r"\1", marked)
    return marked


def p(text: str, style: ParagraphStyle) -> Paragraph:
    return Paragraph(inline_markup(text), style)


def toc_link(anchor: str, label: str, style: ParagraphStyle) -> Paragraph:
    """A clickable TOC entry that jumps to a bookmark inside this PDF.

    Renders as plain typography (no colour override, no underline) so
    it blends in with the printed contents list. The link annotation
    has H=/N applied by the module-level canvas patch, so PDF viewers
    won't draw a hover-highlight box over it.
    """
    escaped = html.escape(fix_text(label))
    return Paragraph(f'<link href="#{anchor}">{escaped}</link>', style)


def video_url(video: dict | None) -> str | None:
    if not video:
        return None
    src = str(video.get("src") or "").strip()
    if not src:
        return None
    match = re.search(r"/embed/([^?]+)", src)
    if match:
        return f"https://youtu.be/{match.group(1)}"
    return src


def media_flowables(step: dict, style_map: dict) -> list[Flowable]:
    flows: list[Flowable] = []
    for media in step.get("media") or []:
        src = media.get("src")
        if not src:
            continue
        path = DOCS / src
        if not path.exists():
            continue
        if path.suffix.lower() not in {".png", ".jpg", ".jpeg"}:
            label = media.get("alt") or "Open media"
            flows.append(p(f"[{label}]({src})", style_map["small"]))
            continue
        try:
            with PILImage.open(path) as img:
                w, h = img.size
            max_w = 150 * mm
            max_h = 65 * mm
            scale = min(max_w / w, max_h / h, 1)
            flows.append(RoundedImage(path, width=w * scale, height=h * scale))
            alt = media.get("alt")
            if alt:
                flows.append(p(alt, style_map["small"]))
        except Exception:
            continue
    return flows


def status_table(style_map: dict) -> Table:
    rows = [
        ("🆕", "Draft", "A placeholder for a Parent/Carer meeting added by the assigning team."),
        ("⬜", "Scheduled", "A future session that is confirmed but has not yet taken place."),
        ("✅", "Completed", "A successful session where the mentee attended and the wrap-up is finished."),
        ("❌", "Cancelled", "A session cancelled within the official policy. No charge to the parent/carer."),
        ("🆘", "Admin Required", "A wrapped-up session that is missing funding contact details. The MindJam Finance Team will sort this for you."),
        ("🟧", "Late Notice Cancellation", "A cancellation outside the official policy. The parent/carer will be charged."),
        ("🟨", "Did Not Attend", "The mentee did not show up for the session. The parent/carer will be charged."),
    ]
    data = [[p("Icon", style_map["h3"]), p("Status", style_map["h3"]), p("Meaning", style_map["h3"])]]
    for icon, status, meaning in rows:
        data.append([EmojiIcon(icon), p(status, style_map["body"]), p(meaning, style_map["body"])])
    table = Table(data, colWidths=[18 * mm, 40 * mm, 98 * mm], hAlign="CENTER", repeatRows=1)
    table_style = [
        ("BACKGROUND", (0, 0), (-1, 0), colors.Color(229 / 255, 107 / 255, 197 / 255, 0.20)),
        ("TEXTCOLOR", (0, 0), (-1, 0), INK),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.Color(1, 1, 1, 0.12)),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
        ("ALIGN", (0, 1), (0, -1), "CENTER"),
        ("LEFTPADDING", (0, 0), (-1, -1), 6),
        ("RIGHTPADDING", (0, 0), (-1, -1), 6),
        ("TOPPADDING", (0, 0), (-1, -1), 6),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
    ]
    for idx, _ in enumerate(rows, start=1):
        table_style.append(("BACKGROUND", (0, idx), (-1, idx), PANEL_2))
    table.setStyle(TableStyle(table_style))
    return table


def chunked(items: list[str], size: int) -> Iterable[list[str]]:
    for i in range(0, len(items), size):
        yield items[i : i + size]


def build() -> None:
    style = styles()
    pages = load_pages()
    doc = SimpleDocTemplate(
        str(OUT),
        pagesize=A4,
        rightMargin=18 * mm,
        leftMargin=18 * mm,
        topMargin=22 * mm,
        bottomMargin=22 * mm,
        title="Salesforce Training Guide",
        author="MindJam",
    )

    story: list[Flowable] = []

    # ---------- Cover page ----------
    story.append(BookmarkAnchor("cover", "Cover", 0))
    story.append(Spacer(1, 60 * mm))
    story.append(p("MINDJAM", style["cover_eyebrow"]))
    story.append(p("Salesforce Training Guide", style["title"]))
    story.append(p("Mentor edition", style["subtitle"]))
    story.append(Spacer(1, 18 * mm))
    intro = next((page for page in pages if page.path.name == "index.md"), None)
    if intro:
        intro_text = [text for text in intro.body[:4] if fix_text(text) != "Salesforce Training Guide"]
        story.append(Card([p(text, style["body_center"]) for text in intro_text], stack=1, align="center"))
    story.append(PageBreak())

    # ---------- Contents (clickable) ----------
    story.append(BookmarkAnchor("contents", "Contents", 0))
    story.append(p("Contents", style["h1"]))
    current_section = None
    toc_items: list[Flowable] = []
    for idx, page in enumerate([pg for pg in pages if pg.path.name != "index.md"], start=1):
        if page.section != current_section:
            current_section = page.section
            section_anchor = f"sec-{slugify(str(current_section))}"
            toc_items.append(toc_link(section_anchor, str(current_section), style["toc_section"]))
        page_anchor = f"page-{idx}"
        toc_items.append(toc_link(page_anchor, f"{idx}. {page.nav_title}", style["toc_item"]))
    story.append(Card(toc_items, stack=1))
    story.append(PageBreak())

    # ---------- Body ----------
    section = None
    number = 0
    for page in pages:
        if page.path.name == "index.md":
            continue
        number += 1

        # Section divider page (starts a new section) — with outline entry.
        if page.section != section:
            section = page.section
            section_anchor = f"sec-{slugify(str(section))}"
            story.append(BookmarkAnchor(section_anchor, str(section), 0))
            story.append(SectionDivider(str(section)))
            story.append(PageBreak())

        # Page starts here — bookmark hangs off its section in the outline.
        page_anchor = f"page-{number}"
        story.append(BookmarkAnchor(page_anchor, f"{number}. {page.nav_title}", 1))

        story.append(Card(
            [p(f"{number}. {page.nav_title}", style["h2"]), p(page.description or page.title, style["body"])],
            stack=1,
        ))
        story.append(Spacer(1, 4 * mm))

        watch_url = video_url(page.video)
        if watch_url:
            video_title = fix_text(str(page.video.get("title") or f"{page.nav_title} video"))
            story.append(Card([p(f"Watch video: [{video_title}]({watch_url})", style["body"])], stack=2))
            story.append(Spacer(1, 4 * mm))

        if page.steps:
            for step_idx, step in enumerate(page.steps, start=1):
                title = str(step.get("title") or "Step")
                raw_body = str(step.get("body") or "")
                is_status_step = page.path.name == "using-calendar-events.md" and "Coloured Square" in title
                if is_status_step:
                    raw_body = raw_body.split("**Key:**", 1)[0]
                chunks = markdown_to_chunks(raw_body)

                # Bookmark each step as a level-2 outline entry so the sidebar
                # tree lets the reader jump straight to a specific step.
                step_anchor = f"page-{number}-step-{step_idx}"
                story.append(BookmarkAnchor(step_anchor, f"{step_idx}. {fix_text(title)}", 2))

                first = True
                for group in chunked(chunks, 3):
                    flows: list[Flowable] = []
                    if first:
                        flows.append(p(title, style["h3"]))
                    flows.extend(p(chunk, style["body"]) for chunk in group)
                    story.append(Card(flows, stack=2))
                    story.append(Spacer(1, 4 * mm))
                    first = False
                media = media_flowables(step, style)
                if is_status_step:
                    story.append(Card([status_table(style)], stack=2))
                    story.append(Spacer(1, 4 * mm))
                for item in media:
                    story.append(Card([item], stack=2))
                    story.append(Spacer(1, 4 * mm))
                if first:
                    story.append(Card([p(title, style["h3"])], stack=2))
                    story.append(Spacer(1, 4 * mm))
        else:
            if page.path.name == "terminology.md":
                for chunk in page.body[:80]:
                    if chunk.startswith("Session Statuses"):
                        story.append(Card([p(chunk, style["h3"])], stack=2))
                        story.append(Spacer(1, 4 * mm))
                        continue
                    story.append(Card([p(chunk, style["body"])], stack=2))
                    story.append(Spacer(1, 4 * mm))
                    if chunk.startswith("Each session has a status"):
                        story.append(Card([status_table(style)], stack=2))
                        story.append(Spacer(1, 4 * mm))
            else:
                for group in chunked(page.body[:24], 4):
                    body_flows = [p(chunk, style["body"]) for chunk in group]
                    story.append(Card(body_flows, stack=2))
                    story.append(Spacer(1, 4 * mm))
        story.append(PageBreak())

    doc.build(story, onFirstPage=draw_background, onLaterPages=draw_background)
    print(f"Wrote {OUT} ({OUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    build()
