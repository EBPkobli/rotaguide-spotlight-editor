import { useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { MarkdownGuideButton, guideTarget } from "rotaguide-spotlight";
import { z } from "zod";
import { MetaForm } from "../features/builder/MetaForm";
import { StepEditor } from "../features/builder/StepEditor";
import { StepList } from "../features/builder/StepList";
import { SelectorPanel } from "../features/selector/SelectorPanel";
import {
  CODE_FORMAT_LABELS,
  parseGuideFromFormat,
  serializeGuideToFormat,
  type CodeFormat,
} from "../lib/code/guideFormats";
import { parseBuilderGuideFromMarkdown } from "../lib/md/adapter";
import { serializeGuideToMarkdown } from "../lib/md/serializeGuide";
import { builderGuideSchema } from "../lib/schema/guideSchema";
import { copyTextToClipboard, downloadTextFile } from "../services/export";
import { useBuilderStore } from "../state/useBuilderStore";
import type { BuilderGuide } from "../types/builder";

const ADVANCED_SECTIONS = [
  {
    id: "overview",
    title: "Overview",
    description: "Current guide status and fast navigation",
  },
  {
    id: "meta",
    title: "Guide Meta",
    description: "Global defaults and display rules",
  },
  {
    id: "flow",
    title: "Step Flow",
    description: "Step list and detailed step editor",
  },
  {
    id: "code",
    title: "Code Studio",
    description: "JSON / Markdown / YAML round-trip",
  },
  {
    id: "projects",
    title: "Project Library",
    description: "Save, import, export and load guides",
  },
] as const;

const CODE_FORMATS: CodeFormat[] = ["markdown", "json", "yaml"];

type WorkspaceMode = "builder" | "advanced";
type EditorTab = "visual" | "code";

function formatZodErrors(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "root";
    return `${path}: ${issue.message}`;
  });
}

function inferNameFromFilename(fileName: string): string {
  const withoutExtension = fileName.replace(/\.[^.]+$/, "").trim();
  return withoutExtension || "Imported Guide Project";
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown time";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function slugifyFileName(value: string): string {
  const normalized = value.trim().toLowerCase();
  const cleaned = normalized.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return cleaned || "guide-project";
}

function looksLikeSelector(target: string): boolean {
  if (!target) return false;
  return /^[.#[]/.test(target) || /[ >:+~]/.test(target);
}

function tryParseImportedGuide(raw: string, fileName: string): {
  project: { name: string; guide: BuilderGuide } | null;
  issues: string[];
} {
  const fallbackName = inferNameFromFilename(fileName);

  try {
    const parsed = JSON.parse(raw) as unknown;

    if (parsed && typeof parsed === "object") {
      const wrapped = parsed as {
        name?: unknown;
        guide?: unknown;
      };

      if (wrapped.guide !== undefined) {
        const validatedWrapped = builderGuideSchema.safeParse(wrapped.guide);
        if (validatedWrapped.success) {
          const wrappedName =
            typeof wrapped.name === "string" && wrapped.name.trim()
              ? wrapped.name.trim()
              : fallbackName;
          return {
            project: {
              name: wrappedName,
              guide: validatedWrapped.data,
            },
            issues: [],
          };
        }
      }
    }

    const validatedDirect = builderGuideSchema.safeParse(parsed);
    if (validatedDirect.success) {
      return {
        project: {
          name: fallbackName,
          guide: validatedDirect.data,
        },
        issues: [],
      };
    }
  } catch {
    // Continue with markdown parse fallback.
  }

  const markdown = parseBuilderGuideFromMarkdown(raw);
  if (markdown.guide) {
    return {
      project: {
        name: fallbackName,
        guide: markdown.guide,
      },
      issues: [],
    };
  }

  return {
    project: null,
    issues: ["Import failed. Expected project JSON, guide JSON, or .guide.md content."],
  };
}

function LivePreview({ markdown, guideTitle, dynamicTargets }: LivePreviewProps) {
  return (
    <section className="panel-card panel-preview">
      <header className="panel-card__header">
        <div>
          <h2 className="panel-card__title">Live Preview</h2>
          <p className="panel-card__subtitle">Guide runs with real `md-spotlight-guide-tool`</p>
        </div>
        <MarkdownGuideButton markdown={markdown} label="Run Guide" />
      </header>

      <div className="panel-card__body">
        <div className="preview-screen">
          <div className="preview-screen__header" {...guideTarget("guide-start-panel")}>
            <strong>{guideTitle}</strong>
            <span>Preview sandbox</span>
          </div>

          <div className="preview-screen__controls">
            <button type="button" className="btn btn-primary" {...guideTarget("open-create")}>
              Open Create
            </button>
            <input {...guideTarget("customer-name")} placeholder="Customer name" />
            <select {...guideTarget("plan-select")} defaultValue="">
              <option value="">Plan</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
            </select>
            <label className="check-field inline">
              <input type="checkbox" {...guideTarget("notify-toggle")} />
              <span>Send notify mail</span>
            </label>
            <button id="save-booking-btn" type="button" className="btn" {...guideTarget("save-booking")}>
              Save Draft
            </button>
          </div>

          {dynamicTargets.length > 0 ? (
            <div className="dynamic-targets">
              <p>Dynamic step targets</p>
              <div>
                {dynamicTargets.map((target) => (
                  <button key={target} type="button" className="chip" {...guideTarget(target)}>
                    {target}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  );
}

interface LivePreviewProps {
  markdown: string;
  guideTitle: string;
  dynamicTargets: string[];
}

export function AppShell() {
  const guide = useBuilderStore((state) => state.guide);
  const selectedStepId = useBuilderStore((state) => state.selectedStepId);
  const projectName = useBuilderStore((state) => state.projectName);
  const activeProjectId = useBuilderStore((state) => state.activeProjectId);
  const projects = useBuilderStore((state) => state.projects);
  const setProjectName = useBuilderStore((state) => state.setProjectName);
  const saveProject = useBuilderStore((state) => state.saveProject);
  const loadProject = useBuilderStore((state) => state.loadProject);
  const deleteProject = useBuilderStore((state) => state.deleteProject);
  const importProject = useBuilderStore((state) => state.importProject);
  const importGuide = useBuilderStore((state) => state.importGuide);
  const resetGuide = useBuilderStore((state) => state.resetGuide);

  const [workspaceMode, setWorkspaceMode] = useState<WorkspaceMode>("builder");
  const [editorTab, setEditorTab] = useState<EditorTab>("visual");
  const [codeFormat, setCodeFormat] = useState<CodeFormat>("markdown");
  const [codeValue, setCodeValue] = useState(() => serializeGuideToFormat(guide, "markdown"));
  const [codeIssues, setCodeIssues] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState("Ready");
  const [advancedIndex, setAdvancedIndex] = useState(0);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const markdown = useMemo(() => serializeGuideToMarkdown(guide), [guide]);

  const schemaValidation = useMemo(() => builderGuideSchema.safeParse(guide), [guide]);

  const schemaIssues = useMemo(() => {
    if (schemaValidation.success) return [];
    return formatZodErrors(schemaValidation.error);
  }, [schemaValidation]);

  const selectedStep = useMemo(() => {
    if (!selectedStepId) return guide.steps[0] ?? null;
    return guide.steps.find((step) => step.id === selectedStepId) ?? guide.steps[0] ?? null;
  }, [guide.steps, selectedStepId]);

  const dynamicTargets = useMemo(
    () => guide.steps.map((step) => step.target).filter((target) => target && !looksLikeSelector(target)),
    [guide.steps]
  );

  const activeAdvancedSection = ADVANCED_SECTIONS[advancedIndex];

  const handleSaveProject = () => {
    saveProject();
    setStatusMessage("Project saved to local library");
  };

  const handleResetDraft = () => {
    resetGuide();
    setEditorTab("visual");
    setCodeIssues([]);
    setStatusMessage("Draft reset to defaults");
  };

  const handleExportMarkdown = () => {
    const filename = `${slugifyFileName(projectName)}.guide.md`;
    downloadTextFile(filename, markdown, "text/markdown;charset=utf-8");
    setStatusMessage(`Exported ${filename}`);
  };

  const handleExportProjectJson = () => {
    const payload = {
      name: projectName,
      exportedAt: new Date().toISOString(),
      guide,
    };
    const filename = `${slugifyFileName(projectName)}.guide-project.json`;
    downloadTextFile(filename, `${JSON.stringify(payload, null, 2)}\n`, "application/json;charset=utf-8");
    setStatusMessage(`Exported ${filename}`);
  };

  const handleCopyCode = async () => {
    const copied = await copyTextToClipboard(codeValue);
    setStatusMessage(copied ? "Code copied to clipboard" : "Clipboard write failed");
  };

  const handleFormatCode = () => {
    const parsed = parseGuideFromFormat(codeValue, codeFormat);
    if (!parsed.guide) {
      setCodeIssues(parsed.issues);
      setStatusMessage("Code has parse errors");
      return;
    }
    setCodeIssues([]);
    setCodeValue(serializeGuideToFormat(parsed.guide, codeFormat));
    setStatusMessage("Code formatted");
  };

  const handleApplyCode = () => {
    const parsed = parseGuideFromFormat(codeValue, codeFormat);
    if (!parsed.guide) {
      setCodeIssues(parsed.issues);
      setStatusMessage("Code cannot be applied (fix issues first)");
      return;
    }

    importGuide(parsed.guide);
    setCodeIssues([]);
    setCodeValue(serializeGuideToFormat(parsed.guide, codeFormat));
    setStatusMessage("Code applied to visual editor");
  };

  const handleImportProjectFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const text = await file.text();
    const imported = tryParseImportedGuide(text, file.name);

    if (!imported.project) {
      setStatusMessage(imported.issues.join(" "));
      return;
    }

    importProject(imported.project);
    setStatusMessage(`Imported ${imported.project.name}`);
  };

  const renderCodeStudio = () => {
    const editorLanguage =
      codeFormat === "markdown" ? "markdown" : codeFormat === "json" ? "json" : "yaml";

    return (
      <section className="panel-card panel-code">
        <header className="panel-card__header panel-code__header">
          <div>
            <h2 className="panel-card__title">Step Code Editor</h2>
            <p className="panel-card__subtitle">
              JSON / Markdown / YAML source for <strong>{projectName || "New Guide Project"}</strong>
            </p>
          </div>

          <div className="panel-code__actions">
            <div className="format-switch">
              {CODE_FORMATS.map((format) => (
                <button
                  key={format}
                  type="button"
                  className={`format-chip ${codeFormat === format ? "is-active" : ""}`.trim()}
                  onClick={() => {
                    setCodeFormat(format);
                    setCodeValue(serializeGuideToFormat(guide, format));
                    setCodeIssues([]);
                  }}
                >
                  {CODE_FORMAT_LABELS[format]}
                </button>
              ))}
            </div>

            <div className="inline-actions">
              <button type="button" className="btn btn-ghost" onClick={handleFormatCode}>
                Format
              </button>
              <button type="button" className="btn btn-ghost" onClick={handleCopyCode}>
                Copy
              </button>
              <button type="button" className="btn btn-primary" onClick={handleApplyCode}>
                Apply To Visual
              </button>
            </div>
          </div>
        </header>

        <div className="panel-card__body">
          <div className="editor-wrap editor-wrap--tall">
            <Editor
              height="420px"
              language={editorLanguage}
              value={codeValue}
              onChange={(value) => setCodeValue(value ?? "")}
              options={{
                minimap: { enabled: false },
                fontSize: 13,
                lineNumbers: "on",
                wordWrap: "on",
                scrollBeyondLastLine: false,
              }}
            />
          </div>

          {codeIssues.length > 0 ? (
            <ul className="issue-list">
              {codeIssues.map((issue) => (
                <li key={issue}>{issue}</li>
              ))}
            </ul>
          ) : (
            <p className="success-note">Code is valid for this format.</p>
          )}
        </div>
      </section>
    );
  };

  const renderProjectLibrary = () => {
    return (
      <section className="panel-card">
        <header className="panel-card__header">
          <div>
            <h2 className="panel-card__title">Project Library</h2>
            <p className="panel-card__subtitle">
              Save multiple guide projects, open old drafts, import or export
            </p>
          </div>
          <span className="pill">{projects.length}</span>
        </header>

        <div className="panel-card__body">
          <div className="inline-actions project-actions">
            <button type="button" className="btn btn-primary" onClick={handleSaveProject}>
              Save Project
            </button>
            <button type="button" className="btn btn-ghost" onClick={handleExportProjectJson}>
              Export JSON
            </button>
            <button type="button" className="btn btn-ghost" onClick={handleExportMarkdown}>
              Export MD
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => importInputRef.current?.click()}
            >
              Import
            </button>
          </div>

          {projects.length === 0 ? (
            <p className="muted">No saved projects yet. Save current guide to build your project list.</p>
          ) : (
            <div className="project-list">
              {projects.map((project) => (
                <article
                  key={project.id}
                  className={`project-row ${project.id === activeProjectId ? "is-active" : ""}`.trim()}
                >
                  <button type="button" className="project-row__main" onClick={() => loadProject(project.id)}>
                    <strong>{project.name}</strong>
                    <small>{formatDateTime(project.updatedAt)}</small>
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => deleteProject(project.id)}
                  >
                    Delete
                  </button>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  };

  const renderAdvancedSection = () => {
    if (activeAdvancedSection.id === "overview") {
      return (
        <section className="panel-card">
          <header className="panel-card__header">
            <div>
              <h2 className="panel-card__title">Feature Coverage</h2>
              <p className="panel-card__subtitle">
                New Guide Project flow + all step/meta features are available in this mode.
              </p>
            </div>
          </header>

          <div className="panel-card__body overview-grid">
            <article className="stat-box">
              <strong>{guide.steps.length}</strong>
              <span>Total Steps</span>
            </article>
            <article className="stat-box">
              <strong>{selectedStep?.title || "Step"}</strong>
              <span>Current Step</span>
            </article>
            <article className="stat-box">
              <strong>{projects.length}</strong>
              <span>Saved Projects</span>
            </article>
            <article className="stat-box">
              <strong>{schemaIssues.length === 0 ? "Valid" : `${schemaIssues.length} Issues`}</strong>
              <span>Schema State</span>
            </article>
          </div>
        </section>
      );
    }

    if (activeAdvancedSection.id === "meta") {
      return <MetaForm />;
    }

    if (activeAdvancedSection.id === "flow") {
      return (
        <div className="advanced-flow-grid">
          <StepList />
          <StepEditor />
        </div>
      );
    }

    if (activeAdvancedSection.id === "code") {
      return renderCodeStudio();
    }

    return renderProjectLibrary();
  };

  return (
    <main className="ide-root">
      <input
        ref={importInputRef}
        type="file"
        className="hidden-file-input"
        accept=".json,.md,.txt"
        onChange={handleImportProjectFile}
      />

      <header className="ide-topbar">
        <div>
          <p className="kicker">md-spotlight-guide-tool</p>
          <h1>New Guide Project IDE</h1>
          <p className="muted">
            Step 1 / Step 2 editor with visual + code view, live preview, project library, and advanced mode.
          </p>
        </div>

        <div className="topbar-actions">
          <label className="project-name-field">
            <span>Project</span>
            <input
              value={projectName}
              onChange={(event) => setProjectName(event.target.value)}
              placeholder="New Guide Project"
            />
          </label>

          <div className="inline-actions">
            <button type="button" className="btn btn-primary" onClick={handleSaveProject}>
              Save
            </button>
            <button type="button" className="btn btn-ghost" onClick={handleExportProjectJson}>
              Export
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => importInputRef.current?.click()}>
              Import
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setWorkspaceMode(workspaceMode === "builder" ? "advanced" : "builder")}
            >
              {workspaceMode === "builder" ? "Advanced" : "Back To Main"}
            </button>
            <button type="button" className="btn" onClick={handleResetDraft}>
              Reset
            </button>
          </div>
        </div>
      </header>

      {workspaceMode === "builder" ? (
        <section className="builder-layout">
          <aside className="column column-left">
            {renderProjectLibrary()}
            <StepList />
          </aside>

          <section className="column column-main">
            <section className="panel-card tabs-card">
              <header className="panel-card__header">
                <div>
                  <h2 className="panel-card__title">Step Editor</h2>
                  <p className="panel-card__subtitle">
                    Visual View + Code View. Selected step: {selectedStep?.title || "None"}
                  </p>
                </div>
                <div className="view-switch">
                  <button
                    type="button"
                    className={`view-switch__btn ${editorTab === "visual" ? "is-active" : ""}`.trim()}
                    onClick={() => setEditorTab("visual")}
                  >
                    Visual View
                  </button>
                  <button
                    type="button"
                    className={`view-switch__btn ${editorTab === "code" ? "is-active" : ""}`.trim()}
                    onClick={() => {
                      setEditorTab("code");
                      setCodeValue(serializeGuideToFormat(guide, codeFormat));
                      setCodeIssues([]);
                    }}
                  >
                    Code View
                  </button>
                </div>
              </header>
            </section>

            {editorTab === "visual" ? (
              <div className="visual-stack">
                <MetaForm />
                <StepEditor />
                <SelectorPanel />
              </div>
            ) : (
              renderCodeStudio()
            )}
          </section>

          <aside className="column column-right">
            <LivePreview
              markdown={markdown}
              guideTitle={guide.meta.title || "New Guide"}
              dynamicTargets={dynamicTargets}
            />

            <section className="panel-card">
              <header className="panel-card__header">
                <div>
                  <h2 className="panel-card__title">Validation</h2>
                  <p className="panel-card__subtitle">Schema checks for the current guide</p>
                </div>
              </header>
              <div className="panel-card__body">
                {schemaIssues.length === 0 ? (
                  <p className="success-note">Guide schema is valid.</p>
                ) : (
                  <ul className="issue-list">
                    {schemaIssues.map((issue) => (
                      <li key={issue}>{issue}</li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </aside>
        </section>
      ) : (
        <section className="advanced-layout">
          <aside className="advanced-nav">
            <h2>Advanced Sections</h2>
            <div className="advanced-nav__list">
              {ADVANCED_SECTIONS.map((section, index) => (
                <button
                  key={section.id}
                  type="button"
                  className={`advanced-nav__item ${index === advancedIndex ? "is-active" : ""}`.trim()}
                  onClick={() => setAdvancedIndex(index)}
                >
                  <strong>{section.title}</strong>
                  <small>{section.description}</small>
                </button>
              ))}
            </div>

            <div className="advanced-nav__actions">
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setAdvancedIndex((prev) => Math.max(prev - 1, 0))}
                disabled={advancedIndex === 0}
              >
                Previous
              </button>
              <button
                type="button"
                className="btn btn-primary"
                onClick={() =>
                  setAdvancedIndex((prev) => Math.min(prev + 1, ADVANCED_SECTIONS.length - 1))
                }
                disabled={advancedIndex === ADVANCED_SECTIONS.length - 1}
              >
                Next
              </button>
              <button type="button" className="btn" onClick={() => setWorkspaceMode("builder")}>
                Back To Main Steps
              </button>
            </div>
          </aside>

          <section className="advanced-content">{renderAdvancedSection()}</section>

          <aside className="advanced-preview">
            <LivePreview
              markdown={markdown}
              guideTitle={guide.meta.title || "New Guide"}
              dynamicTargets={dynamicTargets}
            />

            <section className="panel-card">
              <header className="panel-card__header">
                <div>
                  <h2 className="panel-card__title">Quick Status</h2>
                </div>
              </header>
              <div className="panel-card__body">
                <p className="muted">{statusMessage}</p>
                <p className="muted">Current section: {activeAdvancedSection.title}</p>
                <p className="muted">Saved projects: {projects.length}</p>
              </div>
            </section>
          </aside>
        </section>
      )}

      <footer className="ide-statusbar">
        <span>{statusMessage}</span>
        <span>
          Steps: {guide.steps.length} | Active: {selectedStep?.title || "none"}
        </span>
      </footer>
    </main>
  );
}
