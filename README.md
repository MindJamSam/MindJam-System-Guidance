# Salesforce Training — v2 ("Aurora")

A MkDocs training site for MindJam Salesforce mentors, built with a custom dark-mode "Aurora" theme.

---

## Setup (first time on a new machine)

**Requirements:** Python 3.10 or newer. Check with:

```
python --version
```

**Install dependencies:**

```
pip install -r requirements.txt
```

That installs MkDocs and all required packages. You only need to do this once.

---

## Run the dev server

```
python -m mkdocs serve
```

The site is served at `http://127.0.0.1:8000/`. Changes to any file are reflected live in the browser without restarting the server.

---

## Build a static copy

```
python -m mkdocs build
```

Output goes to `site/`. This folder is excluded from git — it is always re-generated.

---

## Validate links and media

Run this before sharing or publishing the guide:

```
python tools/validate_site.py
```

It checks local page links, local image/video/PDF files, WebM to MP4 fallbacks, and missing alt text. External links are checked for valid URL shape only; it does not contact Salesforce, YouTube, or Google Forms.

---

## Rebuild the PDF version

```
python tools/build_pdf.py
python -m mkdocs build
```

The PDF is written to `docs/assets/PDFs/Salesforce_Training_Guide_Print_Edition.pdf`, then copied into `site/` by the MkDocs build.

---

## Dev panel

Append `?dev=1` to any URL once. A floating "Dev" button appears and stays for that browser session. `?dev=0` clears it. The panel writes CSS overrides to `localStorage.auroraDevOverrides`.

---

## Restore points (git)

Create a restore point before making significant changes:

```
git add .
git commit -m "Restore point — describe what you are about to change"
```

Check what has changed since the last commit:

```
git diff HEAD
```

Roll back to a specific commit:

```
git log --oneline
git checkout <hash> -- .
```

Undo a rollback:

```
git checkout HEAD -- .
```

---

## Project structure

```
salesforce-training-v2/
├── mkdocs.yml              ← site config (nav, theme, plugins)
├── requirements.txt        ← Python dependencies
├── README.md
├── .gitignore
├── hooks/
│   ├── lesson_meta.py      ← injects lesson number + section into page meta
│   └── gen_stars.py        ← generates the SVG star field include
├── docs/
│   ├── overrides/
│   │   ├── base.html       ← full custom theme template
│   │   └── _aurora-stars.html
│   ├── assets/
│   │   ├── stylesheets/
│   │   │   └── aurora.css
│   │   └── javascripts/
│   │       └── aurora.js
│   └── *.md                ← content pages
└── housekeeping/
    └── notes/              ← build notes and stage reports
```
