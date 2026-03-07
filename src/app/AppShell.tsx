import { useMemo } from "react";
import { z } from "zod";
import { MetaForm } from "../features/builder/MetaForm";
import { StepEditor } from "../features/builder/StepEditor";
import { StepList } from "../features/builder/StepList";
import { PreviewPanel } from "../features/preview/PreviewPanel";
import { SelectorPanel } from "../features/selector/SelectorPanel";
import { parseBuilderGuideFromMarkdown } from "../lib/md/adapter";
import { serializeGuideToMarkdown } from "../lib/md/serializeGuide";
import { builderGuideSchema } from "../lib/schema/guideSchema";
import { useBuilderStore } from "../state/useBuilderStore";

function formatZodErrors(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "root";
    return `${path}: ${issue.message}`;
  });
}

export function AppShell() {
  const guide = useBuilderStore((state) => state.guide);
  const resetGuide = useBuilderStore((state) => state.resetGuide);
  const importGuide = useBuilderStore((state) => state.importGuide);

  const markdown = useMemo(() => serializeGuideToMarkdown(guide), [guide]);
  const zodValidation = useMemo(() => builderGuideSchema.safeParse(guide), [guide]);

  const schemaIssues = useMemo(() => {
    if (zodValidation.success) return [];
    return formatZodErrors(zodValidation.error);
  }, [zodValidation]);

  return (
    <main className="builder-root">
      <header className="builder-hero">
        <div>
          <p className="kicker">Builder MVP</p>
          <h1>RotaGuide Spotlight Editor</h1>
          <p>
            Visual editor for creating `.guide.md` files. Edit form fields, reorder steps, validate,
            and run live preview with the real spotlight tool.
          </p>
        </div>
        <div className="inline-actions">
          <button type="button" className="btn btn-ghost" onClick={resetGuide}>
            Reset Draft
          </button>
        </div>
      </header>

      <section className="builder-grid">
        <aside className="column column-left">
          <MetaForm />
          <StepList />
          <SelectorPanel />
        </aside>

        <section className="column column-middle">
          <StepEditor />
          <section className="panel-card">
            <header className="panel-card__header">
              <div>
                <h2 className="panel-card__title">Form Validation</h2>
                <p className="panel-card__subtitle">Fast checks from local zod schema</p>
              </div>
            </header>
            <div className="panel-card__body">
              {schemaIssues.length === 0 ? (
                <p className="success-note">Schema is valid.</p>
              ) : (
                <ul className="issue-list">
                  {schemaIssues.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </div>
          </section>
        </section>

        <section className="column column-right">
          <PreviewPanel
            markdown={markdown}
            onImportMarkdown={(value) => {
              const parsed = parseBuilderGuideFromMarkdown(value);
              if (parsed.guide) {
                importGuide(parsed.guide);
              }
            }}
          />
        </section>
      </section>
    </main>
  );
}
