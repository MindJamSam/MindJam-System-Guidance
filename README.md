# Salesforce Training — v2 ("Aurora")

A parallel MkDocs site that uses the same content as the v1 Salesforce Training guide, presented in a dark-mode "Aurora" UI. The v1 site at `../salesforce-training/` is untouched.

## Build status

In progress. See `../salesforce-training/housekeeping/notes/v2-build-plan.md` for the staged plan and `v2-build-log.md` for the chronological rationale log.

The plan / log / content-map all live in the v1 project's `housekeeping/notes/` directory and apply to both projects. Single source of truth.

## Run the dev server

```powershell
mkdocs serve --dev-addr=127.0.0.1:8001
```

The v1 site runs on `:8000`. Both can run side-by-side.

## Enable the dev panel (when implemented in Stage 8)

Once Stage 8 is done, append `?dev=1` to any v2 URL once. A floating "Dev" button will appear and stay for that browser. `?dev=0` clears it. The panel writes overrides to `localStorage.auroraDevOverrides` and applies them via CSS variables on `:root`.

## Structure

```
salesforce-training-v2/
├── mkdocs.yml
├── requirements.txt
├── README.md
├── .gitignore
├── docs/
│   ├── index.md              ← welcome page (placeholder until Stage 7)
│   ├── overrides/            ← theme template overrides (populated Stage 3)
│   └── assets/
│       ├── stylesheets/
│       │   └── aurora.css
│       └── javascripts/
│           └── aurora.js
└── housekeeping/
    └── notes/                ← stage-specific reports (e.g. text-preservation report)
```

The build plan and rationale log are NOT duplicated here — they live in the v1 project's `housekeeping/notes/`.
