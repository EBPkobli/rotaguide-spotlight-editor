# MD Spotlight Guide Builder - MVP

## Goal
Build a visual editor that lets product/ops teams create valid `.guide.md` files without hand-writing markdown.

## Scope
- Separate repository from the core package
- Live preview using `md-spotlight-guide-tool`
- Export/import markdown
- Step CRUD + ordering + per-step settings
- Fast validation feedback

## Stack
- React + Vite + TypeScript
- Zustand for state
- Zod for form schema checks
- Monaco Editor for raw markdown editing
- Local package dependency: `md-spotlight-guide-tool` via `file:../md-spotlight-guide-tool`

## Folder Structure
- `src/app` - app shell and top-level layout
- `src/features/builder` - meta form, step list, step editor
- `src/features/preview` - live preview + markdown editor
- `src/features/selector` - target helper (MVP), record mode placeholder
- `src/lib/md` - markdown serializer + parser adapter
- `src/lib/schema` - zod schema
- `src/state` - zustand store
- `src/services` - export/copy helpers
- `src/components/ui` - shared UI card

## MVP Features
1. Guide meta editor (global defaults)
2. Step add/edit/delete/duplicate/reorder
3. Advanced step settings (highlight, animation, timer, strict rules)
4. Raw markdown editor with parser validation
5. Import markdown back into visual form
6. Export markdown (download + copy)
7. Live guide run inside preview sandbox
8. Draft persistence via local storage (zustand persist)

## Non-MVP (Phase 2)
- Real DOM record mode for target picking
- Multi-guide project management
- Team sharing/versioning
- Role-based publishing flow
- CLI + VSCode extension

## Run
```bash
npm install
npm run dev
```
