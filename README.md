# RotaGuide Spotlight Editor

Visual guide builder for [**rotaguide-spotlight**](https://github.com/EBPkobli/rotaguide-spotlight) — the open-source spotlight / tooltip guide engine for React.

> The guide engine lives at **[EBPkobli/rotaguide-spotlight](https://github.com/EBPkobli/rotaguide-spotlight)**.
> This repo is the editor UI that produces guide definitions consumed by that engine.

## Features

- **Visual step editor** — create, reorder, duplicate, and delete guide steps
- **Multi-format output** — export as Markdown (`.guide.md`), JSON, or YAML
- **Live preview** — tooltip, spotlight highlight, and mini-app preview in real time
- **Schema validation** — instant feedback via Zod-powered validation panel
- **Target picker** — click elements in the preview to set step targets
- **Theme editor** — customise colors, border radius, templates, and more
- **i18n editor** — localise every button label and message
- **Project management** — create, save, import, and export multiple projects
- **Monaco code editor** — edit raw guide source with syntax highlighting
- **Export / Import** — download guide files or import existing ones

## Tech Stack

| Layer | Tech |
|-------|------|
| Framework | React 19 + TypeScript |
| Build | Vite |
| Styling | Tailwind CSS v4 |
| State | Zustand (persisted to localStorage) |
| Validation | Zod |
| Code editor | Monaco Editor |
| Guide engine | [`rotaguide-spotlight`](https://github.com/EBPkobli/rotaguide-spotlight) |

## Getting Started

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Related

- **[rotaguide-spotlight](https://github.com/EBPkobli/rotaguide-spotlight)** — the guide engine powering the live preview and exported guides.
