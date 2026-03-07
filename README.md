# md-spotlight-guide-builder

Visual builder MVP for creating `md-spotlight-guide-tool` markdown guides.

## What It Does
- Edit guide meta and step settings via form UI
- Reorder / duplicate / delete steps
- Generate markdown in real time
- Validate markdown with the real parser
- Run live preview with `MarkdownGuideButton`
- Import edited markdown back into the form
- Export guide markdown via copy/download

## Run
```bash
npm install
npm run dev
```

## Build
```bash
npm run build
```

## Notes
- This app consumes the local package using `"md-spotlight-guide-tool": "file:../md-spotlight-guide-tool"`.
- Drafts persist in local storage (`md-spotlight-guide-builder-draft-v1`).
