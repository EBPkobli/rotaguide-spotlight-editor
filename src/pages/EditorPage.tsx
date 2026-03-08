import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Editor from "@monaco-editor/react";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import ColorPicker from "../components/ui/ColorPicker";
import TemplateThumbnail from "../components/ui/TemplateThumbnail";
import { Icon } from "../components/ui/Icon";
import { LivePreview } from "../components/preview/LivePreview";
import { StatusBar } from "../components/layout/StatusBar";
import {
  CODE_FORMAT_LABELS,
  parseGuideFromFormat,
  serializeGuideToFormat,
  type CodeFormat,
} from "../lib/code/guideFormats";
import { serializeGuideToMarkdown } from "../lib/md/serializeGuide";
import { builderGuideSchema } from "../lib/schema/guideSchema";
import { downloadTextFile } from "../services/export";
import { useBuilderStore } from "../state/useBuilderStore";
import type { BuilderStep } from "../types/builder";
import {
  STEP_KINDS,
  ADVANCE_MODES,
  HIGHLIGHT_STYLES,
  HIGHLIGHT_ANIMATIONS,
  TOOLTIP_PLACEMENTS,
  TOOLTIP_TEMPLATES,
} from "../types/builder";
import type { GuideI18n, GuideTheme } from "../types/builder";
import { z } from "zod";

/* ───── types ───── */
type EditorTab = "visual" | "code";
const CODE_FORMATS: CodeFormat[] = ["markdown", "json", "yaml"];

/* ───── helpers ───── */
function formatZodErrors(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "root";
    return `${path}: ${issue.message}`;
  });
}

/* ───── Main Component ───── */
export function EditorPage() {
  /* store selectors */
  const guide = useBuilderStore((s) => s.guide);
  const selectedStepId = useBuilderStore((s) => s.selectedStepId);
  const projectName = useBuilderStore((s) => s.projectName);
  const projectFormat = useBuilderStore((s) => s.projectFormat);
  const selectStep = useBuilderStore((s) => s.selectStep);
  const addStep = useBuilderStore((s) => s.addStep);
  const removeStep = useBuilderStore((s) => s.removeStep);
  const updateStep = useBuilderStore((s) => s.updateStep);
  const moveStep = useBuilderStore((s) => s.moveStep);
  const duplicateStep = useBuilderStore((s) => s.duplicateStep);
  const setMeta = useBuilderStore((s) => s.setMeta);
  const saveProject = useBuilderStore((s) => s.saveProject);
  const importGuide = useBuilderStore((s) => s.importGuide);
  const resetGuide = useBuilderStore((s) => s.resetGuide);

  /* local state */
  const [editorTab, setEditorTab] = useState<EditorTab>("visual");
  const [codeFormat, setCodeFormat] = useState<CodeFormat>(projectFormat || "json");
  const [codeValue, setCodeValue] = useState(() =>
    serializeGuideToFormat(guide, projectFormat || "json")
  );
  const [codeIssues, setCodeIssues] = useState<string[]>([]);
  const [statusMessage, setStatusMessage] = useState("Ready");
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedTab, setAdvancedTab] = useState<"behavior" | "theme" | "i18n">("behavior");
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [saveToast, setSaveToast] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{ type: "reset" | "deleteStep"; stepId?: string } | null>(null);
  const [newTargetValue, setNewTargetValue] = useState("");
  const [pickingTarget, setPickingTarget] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);
  const themeImportRef = useRef<HTMLInputElement | null>(null);
  const saveToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  /* derived */
  const markdown = useMemo(() => serializeGuideToMarkdown(guide), [guide]);
  const schemaValidation = useMemo(() => builderGuideSchema.safeParse(guide), [guide]);
  const schemaIssues = useMemo(() => {
    if (schemaValidation.success) return [];
    return formatZodErrors(schemaValidation.error);
  }, [schemaValidation]);

  // Auto-open debug panel when errors appear
  useEffect(() => {
    if (schemaIssues.length > 0) setDebugOpen(true);
  }, [schemaIssues.length]);

  const selectedStep = useMemo(() => {
    if (!selectedStepId) return guide.steps[0] ?? null;
    return guide.steps.find((s) => s.id === selectedStepId) ?? guide.steps[0] ?? null;
  }, [guide.steps, selectedStepId]);

  const filteredSteps = guide.steps;

  /* handlers */
  const handleSave = useCallback(() => {
    saveProject();
    setStatusMessage("Project saved");
    setSaveToast(true);
    if (saveToastTimer.current) clearTimeout(saveToastTimer.current);
    saveToastTimer.current = setTimeout(() => setSaveToast(false), 2500);
  }, [saveProject]);

  const handleExport = useCallback((format: CodeFormat) => {
    const content = serializeGuideToFormat(guide, format);
    const ext = format === "markdown" ? "guide.md" : format === "yaml" ? "yaml" : "json";
    const filename = `${projectName || "guide"}.${ext}`;
    const mime = format === "json" ? "application/json" : format === "yaml" ? "text/yaml" : "text/markdown";
    downloadTextFile(filename, content, mime);
    setExportMenuOpen(false);
    setStatusMessage(`Exported as ${format.toUpperCase()}`);
  }, [guide, projectName, setStatusMessage]);

  // Close export menu on outside click
  useEffect(() => {
    if (!exportMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [exportMenuOpen]);

  // cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (saveToastTimer.current) clearTimeout(saveToastTimer.current);
    };
  }, []);

  const handleApplyCode = () => {
    const parsed = parseGuideFromFormat(codeValue, codeFormat);
    if (!parsed.guide) {
      setCodeIssues(parsed.issues);
      setStatusMessage("Code has errors — fix them first");
      return;
    }
    importGuide(parsed.guide);
    setCodeIssues([]);
    setCodeValue(serializeGuideToFormat(parsed.guide, codeFormat));
    setStatusMessage("Code applied to visual editor");
  };

  const handleFormatCode = () => {
    const parsed = parseGuideFromFormat(codeValue, codeFormat);
    if (!parsed.guide) {
      setCodeIssues(parsed.issues);
      return;
    }
    setCodeIssues([]);
    setCodeValue(serializeGuideToFormat(parsed.guide, codeFormat));
    setStatusMessage("Code formatted");
  };

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(codeValue);
      setStatusMessage("Code copied to clipboard");
    } catch {
      setStatusMessage("Clipboard write failed");
    }
  };

  const handleStepChange = (field: keyof BuilderStep, value: unknown) => {
    if (!selectedStep) return;
    updateStep(selectedStep.id, { [field]: value } as Partial<BuilderStep>);
  };

  const handleI18nChange = (key: keyof GuideI18n, value: string) => {
    const current = guide.meta.i18n ?? {};
    setMeta({ i18n: { ...current, [key]: value } });
  };

  const handleThemeChange = (key: keyof GuideTheme, value: string | number) => {
    const current = guide.meta.theme ?? {};
    setMeta({ theme: { ...current, [key]: value } });
  };

  const handleExportTheme = () => {
    const themeData = {
      tooltipTemplate: guide.meta.tooltipTemplate,
      overlayColor: guide.meta.overlayColor,
      highlightColor: guide.meta.highlightColor,
      highlightStyle: guide.meta.highlightStyle,
      highlightAnimation: guide.meta.highlightAnimation,
      tooltipWidth: guide.meta.tooltipWidth,
      theme: guide.meta.theme,
    };
    const json = JSON.stringify(themeData, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${(guide.meta.title || "guide").replace(/\s+/g, "-").toLowerCase()}-theme.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportTheme = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      const patch: Record<string, unknown> = {};
      if (data.tooltipTemplate) patch.tooltipTemplate = data.tooltipTemplate;
      if (data.overlayColor) patch.overlayColor = data.overlayColor;
      if (data.highlightColor) patch.highlightColor = data.highlightColor;
      if (data.highlightStyle) patch.highlightStyle = data.highlightStyle;
      if (data.highlightAnimation) patch.highlightAnimation = data.highlightAnimation;
      if (data.tooltipWidth) patch.tooltipWidth = data.tooltipWidth;
      if (data.theme) patch.theme = data.theme;
      setMeta(patch);
      setStatusMessage("Theme imported successfully");
    } catch {
      setStatusMessage("Failed to import theme file");
    }
  };

  const handleTargetPicked = (target: string) => {
    if (selectedStep) {
      const existing = selectedStep.target
        ? selectedStep.target.split(",").map((t) => t.trim()).filter(Boolean)
        : [];
      if (!existing.includes(target)) {
        existing.push(target);
      }
      handleStepChange("target", existing.join(", "));
    }
    setPickingTarget(false);
  };

  const editorLanguage =
    codeFormat === "markdown" ? "markdown" : codeFormat === "json" ? "json" : "yaml";

  /* ───── RENDER ───── */
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* ═══ VS Code–style Editor Toolbar ═══ */}
      <div className="h-10 flex items-center justify-between px-3 bg-[#252526] border-b border-[#3c3c3c] shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-[#2d2d2d] rounded text-[11px] font-medium text-slate-400">
            <Icon name="folder_open" className="text-sm text-[#ec5b13]" />
            <span className="text-slate-500">/</span>
            <span className="text-white font-semibold">{projectName}</span>
          </div>
          <div className="h-4 w-px bg-[#3c3c3c]" />
          <span className="text-[10px] text-slate-500 font-mono">{guide.steps.length} steps</span>
          <span className="text-[10px] text-slate-600">•</span>
          <span className="text-[10px] text-slate-500 font-mono">{projectFormat.toUpperCase()}</span>
          {!schemaValidation.success && (
            <>
              <span className="text-[10px] text-slate-600">•</span>
              <span className="text-[10px] text-red-400 flex items-center gap-1">
                <Icon name="error" className="text-xs" />
                {schemaIssues.length} error{schemaIssues.length !== 1 ? "s" : ""}
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setConfirmAction({ type: "reset" })}
            className="flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium text-slate-400 hover:text-white hover:bg-[#3c3c3c] rounded transition-colors"
            title="Reset guide"
          >
            <Icon name="restart_alt" className="text-sm" /> Reset
          </button>
          <div className="h-4 w-px bg-[#3c3c3c]" />
          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded transition-all ${
              saveToast
                ? "bg-green-600 text-white"
                : "bg-[#ec5b13] text-white hover:brightness-110"
            }`}
            title="Save project (Ctrl+S)"
          >
            <Icon name={saveToast ? "check_circle" : "save"} className="text-sm" />
            {saveToast ? "Saved!" : "Save"}
          </button>
          <div className="relative" ref={exportMenuRef}>
            <button
              onClick={() => setExportMenuOpen((v) => !v)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded transition-all bg-[#2d2d2d] border border-[#3c3c3c] text-slate-300 hover:bg-[#3c3c3c] hover:text-white"
              title="Export project file"
            >
              <Icon name="download" className="text-sm" />
              Export
              <Icon name="expand_more" className="text-xs text-slate-500" />
            </button>
            {exportMenuOpen && (
              <div className="absolute right-0 top-full mt-1 z-50 w-44 bg-[#252526] border border-[#3c3c3c] rounded-lg shadow-2xl py-1 animate-in fade-in">
                <button
                  onClick={() => handleExport(projectFormat)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-white hover:bg-[#ec5b13]/20 transition-colors text-left"
                >
                  <Icon name="download" className="text-sm text-[#ec5b13]" />
                  Export as {projectFormat.toUpperCase()}
                  <span className="ml-auto text-[9px] text-[#ec5b13] font-mono bg-[#ec5b13]/10 px-1.5 py-0.5 rounded">default</span>
                </button>
                <div className="h-px bg-[#3c3c3c] mx-2 my-1" />
                {CODE_FORMATS.filter((f) => f !== projectFormat).map((f) => (
                  <button
                    key={f}
                    onClick={() => handleExport(f)}
                    className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium text-slate-400 hover:text-white hover:bg-[#3c3c3c] transition-colors text-left"
                  >
                    <Icon
                      name={f === "json" ? "data_object" : f === "yaml" ? "code" : "description"}
                      className="text-sm text-slate-500"
                    />
                    Export as {f.toUpperCase()}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <main className="flex flex-1 overflow-hidden">

        {/* ═══════════════ LEFT SIDEBAR: Guide Flow ═══════════════ */}
        <aside
          className="flex flex-col border-r border-[#3c3c3c] bg-[#252526] shrink-0 overflow-hidden transition-all duration-300 ease-in-out"
          style={{ width: showLeftSidebar ? 304 : 0, minWidth: showLeftSidebar ? 304 : 0 }}
        >
          <div className="w-[304px] flex flex-col h-full">
            {/* Sidebar header */}
            <div className="h-9 flex items-center justify-between px-3 border-b border-[#3c3c3c] bg-[#252526] shrink-0">
              <h3 className="text-[11px] font-semibold uppercase tracking-widest text-slate-500 flex items-center gap-1.5">
                <Icon name="account_tree" className="text-sm text-[#ec5b13]" /> Explorer
              </h3>
              <span className="text-[10px] bg-[#ec5b13]/20 text-[#ec5b13] px-1.5 py-0.5 rounded font-bold">
                {guide.steps.length}
              </span>
            </div>

            <div className="p-3 space-y-2">
              <button
                onClick={addStep}
                className="w-full bg-[#2d2d2d] hover:bg-[#3c3c3c] text-slate-300 hover:text-white flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium border border-[#3c3c3c] transition-all"
              >
                <Icon name="add" className="text-sm" /> Add Step
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
              {filteredSteps.map((step, index) => {
                const isActive = step.id === (selectedStepId ?? guide.steps[0]?.id);
                const hasIssues = !step.target || !step.title;
                return (
                  <div
                    key={step.id}
                    onClick={() => selectStep(step.id)}
                    className={`p-3 rounded-xl cursor-pointer transition-all group ${
                      isActive
                        ? "bg-[#ec5b13]/10 border border-[#ec5b13]/30"
                        : hasIssues
                          ? "bg-red-500/5 border border-red-500/20 hover:bg-red-500/10"
                          : "border border-transparent hover:bg-[#3c3c3c]/50"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className={`text-[10px] font-mono font-bold ${isActive ? "text-[#ec5b13]" : hasIssues ? "text-red-400/70" : "text-slate-500"}`}>
                        ID: {step.id.slice(0, 16).toUpperCase()}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded uppercase font-bold ${
                        isActive ? "bg-[#ec5b13] text-white" : hasIssues ? "bg-red-500 text-white" : "bg-[#3c3c3c]/60 text-slate-400"
                      }`}>
                        {step.kind}
                      </span>
                    </div>
                    <p className={`text-sm font-medium ${isActive ? "text-white" : "text-slate-300"}`}>
                      {index + 1}. {step.title || "Untitled Step"}
                    </p>
                    {step.target && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-slate-500">
                        <Icon name="ads_click" className="text-sm" />
                        <span className="truncate font-mono">{step.target}</span>
                      </div>
                    )}
                    {hasIssues && (
                      <div className="mt-1.5 flex items-center gap-1.5 text-xs text-red-400">
                        <Icon name="error" className="text-sm" />
                        <span>Missing required fields</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ═══════════════ CENTER: Editor ═══════════════ */}
        <section className="flex-1 flex flex-col bg-[#1e1e1e] min-w-0">
          {/* Editor Tab Bar — VS Code style */}
          <div className="h-9 border-b border-[#3c3c3c] flex items-center justify-between px-1 bg-[#252526] shrink-0">
            <div className="flex items-center h-full">
              {/* Toggle left sidebar */}
              <button
                onClick={() => setShowLeftSidebar(!showLeftSidebar)}
                className="flex items-center justify-center h-full px-2 text-slate-500 hover:text-white hover:bg-[#3c3c3c] transition-colors"
                title={showLeftSidebar ? "Hide sidebar" : "Show sidebar"}
              >
                <Icon name={showLeftSidebar ? "left_panel_close" : "left_panel_open"} className="text-base" />
              </button>

              <div className="h-full w-px bg-[#3c3c3c]" />

              {/* Tab buttons — VS Code file tab style */}
              {([
                { id: "visual" as const, label: "Visual Editor", icon: "edit_note" },
                { id: "code" as const, label: "Code View", icon: "code" },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setEditorTab(tab.id);
                    if (tab.id === "code") {
                      setCodeValue(serializeGuideToFormat(guide, codeFormat));
                      setCodeIssues([]);
                    }
                  }}
                  className={`flex items-center gap-1.5 px-4 h-full text-[11px] font-medium border-r border-[#3c3c3c] transition-colors ${
                    editorTab === tab.id
                      ? "bg-[#1e1e1e] text-white border-t-2 border-t-[#ec5b13]"
                      : "text-slate-500 hover:text-slate-300 bg-[#252526] border-t-2 border-t-transparent"
                  }`}
                >
                  <Icon name={tab.icon} className="text-sm" />
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="flex items-center h-full">
              {/* Toggle right sidebar */}
              <button
                onClick={() => setShowRightSidebar(!showRightSidebar)}
                className="flex items-center justify-center h-full px-2 text-slate-500 hover:text-white hover:bg-[#3c3c3c] transition-colors"
                title={showRightSidebar ? "Hide preview" : "Show preview"}
              >
                <Icon name={showRightSidebar ? "right_panel_close" : "right_panel_open"} className="text-base" />
              </button>
            </div>
          </div>

          {/* ─── Tab Content ─── */}

          {/* VISUAL EDITOR TAB */}
          {editorTab === "visual" && (
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {selectedStep ? (
                <div className="max-w-3xl mx-auto py-6 px-6 space-y-6">
                  {/* Step Header */}
                  <div>
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2.5 mb-1">
                          <div className="size-8 rounded-lg bg-[#ec5b13]/15 flex items-center justify-center">
                            <Icon name="edit_note" className="text-[#ec5b13] text-lg" />
                          </div>
                          <h1 className="text-xl font-bold text-white">
                            {selectedStep.title || "Untitled Step"}
                          </h1>
                        </div>
                        <div className="flex gap-3 text-[10px] font-mono text-slate-500 ml-[42px]">
                          <span>
                            Step{" "}
                            {guide.steps.findIndex((s) => s.id === selectedStep.id) + 1}/{guide.steps.length}
                          </span>
                          <span className="text-slate-700">•</span>
                          <span>{selectedStep.kind.toUpperCase()}</span>
                          <span className="text-slate-700">•</span>
                          <span className="text-slate-600">{selectedStep.id.slice(0, 8)}</span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => moveStep(selectedStep.id, -1)}
                          className="p-1.5 border border-[#3c3c3c] rounded-lg text-slate-400 hover:text-white hover:bg-[#3c3c3c] transition-colors"
                          title="Move Up"
                        >
                          <Icon name="arrow_upward" className="text-lg" />
                        </button>
                        <button
                          onClick={() => moveStep(selectedStep.id, 1)}
                          className="p-1.5 border border-[#3c3c3c] rounded-lg text-slate-400 hover:text-white hover:bg-[#3c3c3c] transition-colors"
                          title="Move Down"
                        >
                          <Icon name="arrow_downward" className="text-lg" />
                        </button>
                        <button
                          onClick={() => duplicateStep(selectedStep.id)}
                          className="p-1.5 border border-[#3c3c3c] rounded-lg text-slate-400 hover:text-white hover:bg-[#3c3c3c] transition-colors"
                          title="Duplicate"
                        >
                          <Icon name="content_copy" className="text-lg" />
                        </button>
                        <button
                          onClick={() => setConfirmAction({ type: "deleteStep", stepId: selectedStep.id })}
                          className="p-1.5 border border-red-500/30 rounded-lg text-red-400 hover:bg-red-500/20 transition-colors"
                          title="Delete"
                        >
                          <Icon name="delete" className="text-lg" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Content Fields */}
                  <div className="grid grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-300">Step Title</label>
                      <input
                        value={selectedStep.title}
                        onChange={(e) => handleStepChange("title", e.target.value)}
                        className="w-full bg-[#2d2d2d] border border-[#3c3c3c] rounded-xl px-4 py-2.5 text-sm text-white focus:ring-2 focus:ring-[#ec5b13]/50 focus:border-[#ec5b13] outline-none transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-slate-300">
                        Step Content (Markdown)
                      </label>
                      <textarea
                        value={selectedStep.description}
                        onChange={(e) =>
                          handleStepChange("description", e.target.value)
                        }
                        className="w-full h-32 bg-[#2d2d2d] border border-[#3c3c3c] rounded-xl px-4 py-2.5 text-sm font-mono text-white focus:ring-2 focus:ring-[#ec5b13]/50 focus:border-[#ec5b13] outline-none transition-all resize-none"
                        placeholder="Enter instructions for the user..."
                      />
                    </div>
                  </div>

                  {/* ─── Separator ─── */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-[#3c3c3c]" />
                    <img src="/icon.svg" alt="" className="size-4 opacity-20" />
                    <div className="flex-1 h-px bg-[#3c3c3c]" />
                  </div>

                  {/* Main Fields Grid */}                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">
                          Step Kind
                        </label>
                        <select
                          value={selectedStep.kind}
                          onChange={(e) => handleStepChange("kind", e.target.value)}
                          className="bg-[#ec5b13]/5 border border-[#ec5b13]/20 rounded-lg px-3 py-2 text-sm text-white focus:ring-[#ec5b13] focus:border-[#ec5b13] outline-none"
                        >
                          {STEP_KINDS.map((k) => (
                            <option key={k} value={k}>
                              {k}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">
                          Target Selector
                        </label>

                        {/* Target chips */}
                        {(() => {
                          const targets = selectedStep.target
                            ? selectedStep.target.split(",").map((t) => t.trim()).filter(Boolean)
                            : [];
                          return targets.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {targets.map((t) => (
                                <span
                                  key={t}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#ec5b13]/15 border border-[#ec5b13]/30 rounded-md text-[10px] font-mono text-[#ec5b13] font-bold"
                                >
                                  {t}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = targets.filter((x) => x !== t);
                                      handleStepChange("target", updated.join(", "));
                                    }}
                                    className="ml-0.5 text-[#ec5b13]/60 hover:text-red-500 transition-colors"
                                    title="Remove target"
                                  >
                                    <Icon name="close" className="text-xs" />
                                  </button>
                                </span>
                              ))}
                            </div>
                          ) : null;
                        })()}

                        <div className="relative flex gap-2">
                          <div className="relative flex-1">
                            <input
                              value={newTargetValue}
                              onChange={(e) => setNewTargetValue(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const val = newTargetValue.trim();
                                  if (!val) return;
                                  const existing = selectedStep.target
                                    ? selectedStep.target.split(",").map((t) => t.trim()).filter(Boolean)
                                    : [];
                                  if (!existing.includes(val)) {
                                    existing.push(val);
                                    handleStepChange("target", existing.join(", "));
                                  }
                                  setNewTargetValue("");
                                }
                              }}
                              className="w-full bg-[#ec5b13]/5 border border-[#ec5b13]/20 rounded-lg pl-3 pr-10 py-2 text-sm font-mono text-white focus:ring-[#ec5b13] focus:border-[#ec5b13] outline-none"
                              placeholder="Type selector & press Enter"
                            />
                            <Icon
                              name="add"
                              className="absolute right-3 top-2.5 text-slate-500 text-sm"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => setPickingTarget(!pickingTarget)}
                            className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 ${
                              pickingTarget
                                ? "bg-[#ec5b13] text-white shadow-lg shadow-[#ec5b13]/30"
                                : "bg-[#ec5b13]/10 border border-[#ec5b13]/30 text-[#ec5b13] hover:bg-[#ec5b13]/20"
                            }`}
                            title="Pick target from preview"
                          >
                            <Icon name="ads_click" className="text-sm" />
                            {pickingTarget ? "Cancel" : "Pick"}
                          </button>
                        </div>
                        {pickingTarget && (
                          <p className="text-[10px] text-[#ec5b13] font-medium animate-pulse">
                            Click an element in Live Preview to add as target.
                          </p>
                        )}
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">
                          Advance Mode
                        </label>
                        <select
                          value={selectedStep.advanceOn || "auto"}
                          onChange={(e) =>
                            handleStepChange("advanceOn", e.target.value)
                          }
                          className="bg-[#ec5b13]/5 border border-[#ec5b13]/20 rounded-lg px-3 py-2 text-sm text-white focus:ring-[#ec5b13] focus:border-[#ec5b13] outline-none"
                        >
                          {ADVANCE_MODES.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">
                          Tooltip Placement
                        </label>
                        <select
                          value={selectedStep.tooltipPlacement || "auto"}
                          onChange={(e) =>
                            handleStepChange("tooltipPlacement", e.target.value)
                          }
                          className="bg-[#ec5b13]/5 border border-[#ec5b13]/20 rounded-lg px-3 py-2 text-sm text-white focus:ring-[#ec5b13] focus:border-[#ec5b13] outline-none"
                        >
                          {TOOLTIP_PLACEMENTS.map((p) => (
                            <option key={p} value={p}>
                              {p}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">
                          Highlight Style
                        </label>
                        <div className="flex gap-2">
                          {HIGHLIGHT_STYLES.map((style) => (
                            <button
                              key={style}
                              onClick={() =>
                                handleStepChange("highlightStyle", style)
                              }
                              className={`flex-1 py-2 border-2 rounded-lg text-xs font-bold transition-colors ${
                                selectedStep.highlightStyle === style
                                  ? "border-[#ec5b13] bg-[#ec5b13]/5 text-[#ec5b13]"
                                  : "border-[#3c3c3c] text-slate-500 hover:bg-[#ec5b13]/5"
                              }`}
                            >
                              {style.charAt(0).toUpperCase() + style.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-500 uppercase">
                          Highlight Animation
                        </label>
                        <select
                          value={selectedStep.highlightAnimation || "none"}
                          onChange={(e) =>
                            handleStepChange("highlightAnimation", e.target.value)
                          }
                          className="bg-[#ec5b13]/5 border border-[#ec5b13]/20 rounded-lg px-3 py-2 text-sm text-white focus:ring-[#ec5b13] focus:border-[#ec5b13] outline-none"
                        >
                          {HIGHLIGHT_ANIMATIONS.map((a) => (
                            <option key={a} value={a}>
                              {a}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* ─── Separator ─── */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-[#3c3c3c]" />
                    <img src="/icon.svg" alt="" className="size-4 opacity-20" />
                    <div className="flex-1 h-px bg-[#3c3c3c]" />
                  </div>

                  {/* Behavior Toggles */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-wider flex items-center gap-2">
                      <Icon name="toggle_on" className="text-sm text-[#ec5b13]" /> Behavior &amp; Validation
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      {(
                        [
                          {
                            key: "mustClickTarget" as const,
                            label: "Must Click Target",
                            desc: "Wait for user click to proceed",
                          },
                          {
                            key: "mustEnterValue" as const,
                            label: "Must Enter Value",
                            desc: "Validate input field content",
                          },
                          {
                            key: "skippable" as const,
                            label: "Allow Skip",
                            desc: "User can bypass this step",
                          },
                          {
                            key: "draggable" as const,
                            label: "Draggable",
                            desc: "Allow tooltip drag",
                          },
                        ] as const
                      ).map((toggle) => (
                        <div
                          key={toggle.key}
                          onClick={() =>
                            handleStepChange(
                              toggle.key,
                              !selectedStep[toggle.key]
                            )
                          }
                          className="flex items-center gap-3 p-3 border border-[#3c3c3c] rounded-xl cursor-pointer hover:bg-[#3c3c3c]/30 transition-colors"
                        >
                          <button
                            type="button"
                            role="switch"
                            aria-checked={!!selectedStep[toggle.key]}
                            onClick={() =>
                              handleStepChange(
                                toggle.key,
                                !selectedStep[toggle.key]
                              )
                            }
                            className={`w-10 h-6 rounded-full relative p-1 transition-colors shrink-0 cursor-pointer ${
                              selectedStep[toggle.key]
                                ? "bg-[#ec5b13]"
                                : "bg-slate-700"
                            }`}
                          >
                            <div
                              className={`w-4 h-4 bg-white rounded-full transition-transform ${
                                selectedStep[toggle.key]
                                  ? "translate-x-4"
                                  : ""
                              }`}
                            />
                          </button>
                          <div>
                            <p className="text-sm font-bold text-slate-200">
                              {toggle.label}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {toggle.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ─── Separator ─── */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-[#3c3c3c]" />
                    <img src="/icon.svg" alt="" className="size-4 opacity-20" />
                    <div className="flex-1 h-px bg-[#3c3c3c]" />
                  </div>

                  {/* Auto Advance */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">
                        Auto Advance (ms)
                      </label>
                      <input
                        type="number"
                        value={selectedStep.autoAdvanceMs || 0}
                        onChange={(e) =>
                          handleStepChange(
                            "autoAdvanceMs",
                            Number(e.target.value) || undefined
                          )
                        }
                        className="bg-[#ec5b13]/5 border border-[#ec5b13]/20 rounded-lg px-3 py-2 text-sm text-white outline-none"
                        placeholder="0 = disabled"
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase">
                        Input Idle (ms)
                      </label>
                      <input
                        type="number"
                        value={selectedStep.inputIdleMs || 0}
                        onChange={(e) =>
                          handleStepChange(
                            "inputIdleMs",
                            Number(e.target.value) || undefined
                          )
                        }
                        className="bg-[#ec5b13]/5 border border-[#ec5b13]/20 rounded-lg px-3 py-2 text-sm text-white outline-none"
                        placeholder="0 = disabled"
                      />
                    </div>
                  </div>

                  {/* ─── Separator ─── */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-[#3c3c3c]" />
                    <img src="/icon.svg" alt="" className="size-4 opacity-20" />
                    <div className="flex-1 h-px bg-[#3c3c3c]" />
                  </div>

                  {/* Styling Overrides Section */}
                  <div className="bg-[#2d2d2d] border border-[#3c3c3c] rounded-xl p-5 space-y-5">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#ec5b13] flex items-center gap-2">
                      <Icon name="palette" className="text-sm" /> Styling Overrides
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">
                          Highlight Color
                        </label>
                        <ColorPicker
                          value={selectedStep.highlightColor || ""}
                          onChange={(c) => handleStepChange("highlightColor", c)}
                          placeholder={guide.meta.highlightColor || "#ffc700"}
                        />
                      </div>
                    </div>
                    {/* Full-width Tooltip Template select */}
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-slate-500 uppercase">
                        Tooltip Template (Step Override)
                      </label>
                      <select
                        value={selectedStep.tooltipTemplate || ""}
                        onChange={(e) =>
                          handleStepChange(
                            "tooltipTemplate",
                            e.target.value || undefined
                          )
                        }
                        className="w-full bg-[#252526] border border-[#3c3c3c] rounded-xl px-4 py-2.5 text-sm text-white outline-none focus:ring-1 focus:ring-[#ec5b13] focus:border-[#ec5b13] transition-colors appearance-none"
                        style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23999' d='M6 8L1 3h10z'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
                      >
                        <option value="">Inherit from guide</option>
                        {TOOLTIP_TEMPLATES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* ─── Separator ─── */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-[#3c3c3c]" />
                    <img src="/icon.svg" alt="" className="size-4 opacity-20" />
                    <div className="flex-1 h-px bg-[#3c3c3c]" />
                  </div>

                  {/* Guide Meta Section */}
                  <div className="bg-[#2d2d2d] border border-[#3c3c3c] rounded-xl p-5 space-y-5">
                    <h4 className="text-xs font-bold uppercase tracking-widest text-[#ec5b13] flex items-center gap-2">
                      <Icon name="settings" className="text-sm" /> Guide Settings
                    </h4>
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">
                          Guide Title
                        </label>
                        <input
                          value={guide.meta.title}
                          onChange={(e) => setMeta({ title: e.target.value })}
                          className="w-full bg-[#252526] border border-[#3c3c3c] rounded-lg px-3 py-2 text-sm text-white focus:ring-[#ec5b13] focus:border-[#ec5b13] outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">
                          Guide ID
                        </label>
                        <input
                          value={guide.meta.id}
                          onChange={(e) => setMeta({ id: e.target.value })}
                          className="w-full bg-[#252526] border border-[#3c3c3c] rounded-lg px-3 py-2 text-sm font-mono text-white focus:ring-[#ec5b13] focus:border-[#ec5b13] outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">
                          Button Label
                        </label>
                        <input
                          value={guide.meta.buttonLabel || ""}
                          onChange={(e) =>
                            setMeta({ buttonLabel: e.target.value })
                          }
                          className="w-full bg-[#252526] border border-[#3c3c3c] rounded-lg px-3 py-2 text-sm text-white focus:ring-[#ec5b13] focus:border-[#ec5b13] outline-none"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">
                          Tooltip Width
                        </label>
                        <input
                          type="number"
                          value={guide.meta.tooltipWidth || 400}
                          onChange={(e) =>
                            setMeta({ tooltipWidth: Number(e.target.value) })
                          }
                          className="w-full bg-[#252526] border border-[#3c3c3c] rounded-lg px-3 py-2 text-sm text-white focus:ring-[#ec5b13] focus:border-[#ec5b13] outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">
                          Overlay Color
                        </label>
                        <ColorPicker
                          value={guide.meta.overlayColor || ""}
                          onChange={(c) => setMeta({ overlayColor: c })}
                          placeholder="#002b45"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">
                          Highlight Color
                        </label>
                        <ColorPicker
                          value={guide.meta.highlightColor || ""}
                          onChange={(c) => setMeta({ highlightColor: c })}
                          placeholder="#ffc700"
                        />
                      </div>
                    </div>
                  </div>

                  {/* ─── Separator ─── */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-[#3c3c3c]" />
                    <img src="/icon.svg" alt="" className="size-4 opacity-20" />
                    <div className="flex-1 h-px bg-[#3c3c3c]" />
                  </div>

                  {/* ═══ Advanced Settings ═══ */}
                  <div className="border border-[#3c3c3c] rounded-xl overflow-hidden">
                    <button
                      onClick={() => setShowAdvanced(!showAdvanced)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-[#2d2d2d] hover:bg-[#3c3c3c]/50 transition-colors"
                    >
                      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Icon name="tune" className="text-sm text-[#ec5b13]" /> Advanced Settings
                      </span>
                      <Icon
                        name={showAdvanced ? "expand_less" : "expand_more"}
                        className="text-slate-500 text-base"
                      />
                    </button>
                    {showAdvanced && (
                      <div className="border-t border-[#3c3c3c]">
                        {/* Advanced Sub-Tabs */}
                        <div className="flex border-b border-[#3c3c3c] bg-[#252526]/40 px-4 pt-3 gap-1">
                          {([
                            { id: "behavior" as const, label: "Behavior", icon: "toggle_on" },
                            { id: "theme" as const, label: "Theme & Styling", icon: "palette" },
                            { id: "i18n" as const, label: "i18n", icon: "translate" },
                          ] as const).map((tab) => (
                            <button
                              key={tab.id}
                              onClick={() => setAdvancedTab(tab.id)}
                              className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-t-lg transition-all border border-b-0 ${
                                advancedTab === tab.id
                                  ? "bg-[#2d2d2d] border-[#3c3c3c] text-[#ec5b13] -mb-px"
                                  : "border-transparent text-slate-500 hover:text-slate-300"
                              }`}
                            >
                              <Icon name={tab.icon} className="text-sm" />
                              {tab.label}
                            </button>
                          ))}
                        </div>

                        <div className="p-6 space-y-8">
                          {/* ── BEHAVIOR TAB ── */}
                          {advancedTab === "behavior" && (
                            <>
                              {/* Step Advanced Toggles */}
                              <div>
                                <h4 className="text-xs font-bold text-[#ec5b13] uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <Icon name="toggle_on" className="text-sm" /> Step Behavior Overrides
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                  {([
                                    { key: "showHighlight" as const, label: "Show Highlight", desc: "Toggle highlight ring on this step" },
                                    { key: "showAutoAdvanceProgress" as const, label: "Auto Advance Progress", desc: "Show countdown progress bar" },
                                    { key: "allowSkip" as const, label: "Allow Skip (alt)", desc: "Alternative skip flag for this step" },
                                  ] as const).map((toggle) => (
                                    <div
                                      key={toggle.key}
                                      onClick={() => handleStepChange(toggle.key, !selectedStep[toggle.key])}
                                      className="flex items-center gap-3 p-3 border border-[#3c3c3c] rounded-xl cursor-pointer hover:bg-[#3c3c3c]/30 transition-colors"
                                    >
                                      <button
                                        type="button"
                                        role="switch"
                                        aria-checked={!!selectedStep[toggle.key]}
                                        className={`w-10 h-6 rounded-full relative p-1 transition-colors shrink-0 ${
                                          selectedStep[toggle.key] ? "bg-[#ec5b13]" : "bg-slate-700"
                                        }`}
                                      >
                                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                                          selectedStep[toggle.key] ? "translate-x-4" : ""
                                        }`} />
                                      </button>
                                      <div>
                                        <p className="text-sm font-bold text-slate-200">{toggle.label}</p>
                                        <p className="text-[10px] text-slate-500">{toggle.desc}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Guide Meta Advanced */}
                              <div>
                                <h4 className="text-xs font-bold text-[#ec5b13] uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <Icon name="settings" className="text-sm" /> Guide Advanced
                                </h4>
                                <div className="grid grid-cols-2 gap-6">
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Tooltip Title</label>
                                    <input
                                      value={guide.meta.tooltipTitle || ""}
                                      onChange={(e) => setMeta({ tooltipTitle: e.target.value })}
                                      className="w-full bg-[#252526] border border-[#3c3c3c] rounded-lg px-3 py-2 text-sm text-white outline-none"
                                      placeholder="Optional tooltip title"
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Tooltip Placement (Guide)</label>
                                    <select
                                      value={guide.meta.tooltipPlacement || "auto"}
                                      onChange={(e) => setMeta({ tooltipPlacement: e.target.value as never })}
                                      className="w-full bg-[#252526] border border-[#3c3c3c] rounded-lg px-3 py-2 text-sm text-white outline-none"
                                    >
                                      {TOOLTIP_PLACEMENTS.map((p) => <option key={p} value={p}>{p}</option>)}
                                    </select>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Highlight Style (Guide)</label>
                                    <select
                                      value={guide.meta.highlightStyle || "line"}
                                      onChange={(e) => setMeta({ highlightStyle: e.target.value as never })}
                                      className="w-full bg-[#252526] border border-[#3c3c3c] rounded-lg px-3 py-2 text-sm text-white outline-none"
                                    >
                                      {HIGHLIGHT_STYLES.map((s) => <option key={s} value={s}>{s}</option>)}
                                    </select>
                                  </div>
                                  <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-500 uppercase">Highlight Animation (Guide)</label>
                                    <select
                                      value={guide.meta.highlightAnimation || "none"}
                                      onChange={(e) => setMeta({ highlightAnimation: e.target.value as never })}
                                      className="w-full bg-[#252526] border border-[#3c3c3c] rounded-lg px-3 py-2 text-sm text-white outline-none"
                                    >
                                      {HIGHLIGHT_ANIMATIONS.map((a) => <option key={a} value={a}>{a}</option>)}
                                    </select>
                                  </div>
                                </div>
                              </div>

                              {/* Per-Step I18n Overrides */}
                              <div>
                                <h4 className="text-xs font-bold text-[#ec5b13] uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <Icon name="translate" className="text-sm" /> Step I18n Overrides
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                  {([
                                    { key: "backButtonLabel" as const, label: "Back Button", placeholder: "Back" },
                                    { key: "nextButtonLabel" as const, label: "Next Button", placeholder: "Next" },
                                    { key: "skipButtonLabel" as const, label: "Skip Button", placeholder: "Skip" },
                                    { key: "finishButtonLabel" as const, label: "Finish Button", placeholder: "Finish" },
                                    { key: "requireClickMessage" as const, label: "Require Click Msg", placeholder: "Click the highlighted element" },
                                    { key: "requireInputMessage" as const, label: "Require Input Msg", placeholder: "Fill in the field" },
                                  ] as const).map((field) => (
                                    <div key={field.key} className="space-y-1">
                                      <label className="text-[10px] font-bold text-slate-500 uppercase">{field.label}</label>
                                      <input
                                        value={(selectedStep.i18n as Record<string, string> | undefined)?.[field.key] || ""}
                                        onChange={(e) => {
                                          const current = selectedStep.i18n ?? {};
                                          handleStepChange("i18n", { ...current, [field.key]: e.target.value });
                                        }}
                                        className="w-full bg-[#252526] border border-[#3c3c3c] rounded-lg px-3 py-1.5 text-xs text-white outline-none"
                                        placeholder={field.placeholder}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </>
                          )}

                          {/* ── THEME TAB ── */}
                          {advancedTab === "theme" && (
                            <>
                              {/* Template Picker */}
                              <div>
                                <h4 className="text-xs font-bold text-[#ec5b13] uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <Icon name="dashboard" className="text-sm" /> Template Picker
                                </h4>
                                <div className="grid grid-cols-3 gap-3">
                                  {TOOLTIP_TEMPLATES.map((template) => {
                                    const isActive = (guide.meta.tooltipTemplate || "default") === template;
                                    return (
                                      <button
                                        key={template}
                                        onClick={() => setMeta({ tooltipTemplate: template })}
                                        className={`group relative flex flex-col items-center p-3 rounded-xl border-2 transition-all ${
                                          isActive
                                            ? "border-[#ec5b13] bg-[#ec5b13]/5 text-[#ec5b13]"
                                            : "border-transparent bg-[#2d2d2d] hover:border-[#ec5b13]/30"
                                        }`}
                                      >
                                        <div className="w-full aspect-video rounded-lg bg-[#252526] mb-2 overflow-hidden shadow-inner">
                                          <TemplateThumbnail template={template} />
                                        </div>
                                        <span className={`text-[11px] font-bold capitalize ${isActive ? "" : "text-slate-400"}`}>
                                          {template}
                                        </span>
                                        {isActive && (
                                          <div className="absolute top-1.5 right-1.5 size-4 bg-[#ec5b13] rounded-full flex items-center justify-center text-white">
                                            <Icon name="check" className="text-[10px]" />
                                          </div>
                                        )}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>

                              {/* Color Palette */}
                              <div>
                                <h4 className="text-xs font-bold text-[#ec5b13] uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <Icon name="palette" className="text-sm" /> Color Palette
                                </h4>
                                <div className="grid grid-cols-2 gap-6">
                                  <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2 block">Overlay Background</label>
                                    <ColorPicker
                                      value={guide.meta.overlayColor || ""}
                                      onChange={(c) => setMeta({ overlayColor: c })}
                                      placeholder="#252526"
                                    />
                                  </div>
                                  <div>
                                    <label className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 mb-2 block">Highlight Accent</label>
                                    <ColorPicker
                                      value={guide.meta.highlightColor || ""}
                                      onChange={(c) => setMeta({ highlightColor: c })}
                                      placeholder="#EC5B13"
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Theme Properties */}
                              <div>
                                <h4 className="text-xs font-bold text-[#ec5b13] uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <Icon name="tune" className="text-sm" /> Theme Properties
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                  {([
                                    { key: "tooltipBackgroundColor" as const, label: "Tooltip Background", placeholder: "#ffffff" },
                                    { key: "tooltipTextColor" as const, label: "Tooltip Text", placeholder: "#1a1a1a" },
                                    { key: "tooltipBorderColor" as const, label: "Tooltip Border", placeholder: "#ec5b13" },
                                    { key: "titleColor" as const, label: "Title Color", placeholder: "#1a1a1a" },
                                    { key: "primaryButtonBackgroundColor" as const, label: "Primary Button BG", placeholder: "#ec5b13" },
                                    { key: "primaryButtonTextColor" as const, label: "Primary Button Text", placeholder: "#ffffff" },
                                  ] as const).map((field) => (
                                    <div key={field.key} className="space-y-1">
                                      <label className="text-[10px] font-semibold text-slate-500 uppercase">{field.label}</label>
                                      <ColorPicker
                                        value={(guide.meta.theme?.[field.key] as string) || ""}
                                        onChange={(c) => handleThemeChange(field.key, c)}
                                        placeholder={field.placeholder}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Surface Properties */}
                              <div>
                                <h4 className="text-xs font-bold text-[#ec5b13] uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <Icon name="aspect_ratio" className="text-sm" /> Surface Properties
                                </h4>
                                <div className="grid grid-cols-2 gap-6">
                                  <div>
                                    <div className="flex justify-between mb-2">
                                      <label className="text-xs font-medium text-slate-300">Tooltip Width</label>
                                      <span className="text-xs font-bold text-[#ec5b13]">{guide.meta.tooltipWidth || 400}px</span>
                                    </div>
                                    <input type="range" min={200} max={800} step={10} value={guide.meta.tooltipWidth || 400} onChange={(e) => setMeta({ tooltipWidth: Number(e.target.value) })} className="w-full h-1.5 bg-[#3c3c3c] rounded-lg appearance-none cursor-pointer accent-[#ec5b13]" />
                                  </div>
                                  <div>
                                    <div className="flex justify-between mb-2">
                                      <label className="text-xs font-medium text-slate-300">Border Radius</label>
                                      <span className="text-xs font-bold text-[#ec5b13]">{(guide.meta.theme?.tooltipBorderRadius as number) || 12}px</span>
                                    </div>
                                    <input type="range" min={0} max={24} step={1} value={(guide.meta.theme?.tooltipBorderRadius as number) || 12} onChange={(e) => handleThemeChange("tooltipBorderRadius", Number(e.target.value))} className="w-full h-1.5 bg-[#3c3c3c] rounded-lg appearance-none cursor-pointer accent-[#ec5b13]" />
                                  </div>
                                </div>
                              </div>

                              {/* All Theme Colors */}
                              <div>
                                <h4 className="text-xs font-bold text-[#ec5b13] uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <Icon name="color_lens" className="text-sm" /> All Theme Colors
                                </h4>
                                <p className="text-[10px] text-slate-500 mb-4">Override any theme token at guide level. Leave empty to use template defaults.</p>
                                <div className="grid grid-cols-3 gap-4">
                                  {([
                                    { key: "fontFamily", label: "Font Family", placeholder: "sans-serif", isColor: false },
                                    { key: "tooltipBackgroundColor", label: "Tooltip BG", placeholder: "#ffffff", isColor: true },
                                    { key: "tooltipTextColor", label: "Tooltip Text", placeholder: "#1a1a1a", isColor: true },
                                    { key: "tooltipBorderColor", label: "Tooltip Border", placeholder: "#e5e5e5", isColor: true },
                                    { key: "tooltipShadow", label: "Tooltip Shadow", placeholder: "0 4px 24px...", isColor: false },
                                    { key: "titleColor", label: "Title", placeholder: "#1a1a1a", isColor: true },
                                    { key: "descriptionColor", label: "Description", placeholder: "#555", isColor: true },
                                    { key: "hintColor", label: "Hint", placeholder: "#888", isColor: true },
                                    { key: "warningColor", label: "Warning", placeholder: "#e65100", isColor: true },
                                    { key: "stepPillBackgroundColor", label: "Step Pill BG", placeholder: "#f0f0f0", isColor: true },
                                    { key: "stepPillTextColor", label: "Step Pill Text", placeholder: "#333", isColor: true },
                                    { key: "kindPillBackgroundColor", label: "Kind Pill BG", placeholder: "#e3f2fd", isColor: true },
                                    { key: "kindPillTextColor", label: "Kind Pill Text", placeholder: "#1565c0", isColor: true },
                                    { key: "primaryButtonBackgroundColor", label: "Primary Btn BG", placeholder: "#ec5b13", isColor: true },
                                    { key: "primaryButtonTextColor", label: "Primary Btn Text", placeholder: "#fff", isColor: true },
                                    { key: "primaryButtonBorderColor", label: "Primary Btn Border", placeholder: "#ec5b13", isColor: true },
                                    { key: "primaryButtonHoverBackgroundColor", label: "Primary Hover BG", placeholder: "#d44e0f", isColor: true },
                                    { key: "primaryButtonHoverBorderColor", label: "Primary Hover Border", placeholder: "#d44e0f", isColor: true },
                                    { key: "ghostButtonBackgroundColor", label: "Ghost Btn BG", placeholder: "transparent", isColor: true },
                                    { key: "ghostButtonTextColor", label: "Ghost Btn Text", placeholder: "#555", isColor: true },
                                    { key: "ghostButtonBorderColor", label: "Ghost Btn Border", placeholder: "#ddd", isColor: true },
                                    { key: "timerTrackColor", label: "Timer Track", placeholder: "#e0e0e0", isColor: true },
                                    { key: "timerFillColor", label: "Timer Fill", placeholder: "#ec5b13", isColor: true },
                                  ] as const).map((field) => (
                                    <div key={field.key} className="space-y-1">
                                      <label className="text-[10px] font-bold text-slate-500 uppercase truncate block">{field.label}</label>
                                      {field.isColor ? (
                                        <ColorPicker
                                          compact
                                          value={(guide.meta.theme as Record<string, unknown> | undefined)?.[field.key] as string || ""}
                                          onChange={(c) => handleThemeChange(field.key as keyof GuideTheme, c)}
                                          placeholder={field.placeholder}
                                        />
                                      ) : (
                                        <input
                                          value={(guide.meta.theme as Record<string, unknown> | undefined)?.[field.key] as string || ""}
                                          onChange={(e) => handleThemeChange(field.key as keyof GuideTheme, e.target.value)}
                                          className="w-full bg-[#252526] border border-[#3c3c3c] rounded-lg px-2 py-1.5 text-[10px] font-mono text-white outline-none focus:border-[#ec5b13] transition-colors"
                                          placeholder={field.placeholder}
                                        />
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Global Behavior Toggles */}
                              <div className="border-t border-[#3c3c3c] pt-6">
                                <h4 className="text-xs font-bold text-slate-500 uppercase mb-4 tracking-wider">Global Behavior</h4>
                                <div className="grid grid-cols-2 gap-4">
                                  {([
                                    { key: "showHighlight" as const, label: "Show Highlight", desc: "Show element highlighting" },
                                    { key: "draggable" as const, label: "Draggable Tooltips", desc: "Allow dragging tooltips" },
                                  ] as const).map((toggle) => (
                                    <div
                                      key={toggle.key}
                                      onClick={() => setMeta({ [toggle.key]: guide.meta[toggle.key] === false })}
                                      className="flex items-center gap-3 p-3 border border-[#3c3c3c] rounded-xl cursor-pointer hover:bg-[#3c3c3c]/30 transition-colors"
                                    >
                                      <button
                                        type="button"
                                        role="switch"
                                        aria-checked={guide.meta[toggle.key] !== false}
                                        className={`w-10 h-6 rounded-full relative p-1 transition-colors shrink-0 cursor-pointer ${
                                          guide.meta[toggle.key] !== false ? "bg-[#ec5b13]" : "bg-slate-700"
                                        }`}
                                      >
                                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${
                                          guide.meta[toggle.key] !== false ? "translate-x-4" : ""
                                        }`} />
                                      </button>
                                      <div>
                                        <p className="text-sm font-bold text-slate-200">{toggle.label}</p>
                                        <p className="text-[10px] text-slate-500">{toggle.desc}</p>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Export / Import Theme */}
                              <div className="border-t border-[#3c3c3c] pt-6">
                                <h4 className="text-xs font-bold text-[#ec5b13] uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <Icon name="swap_vert" className="text-sm" /> Export / Import Theme
                                </h4>
                                <p className="text-[10px] text-slate-500 mb-4">Save your current theme settings to a JSON file or import a previously exported theme.</p>
                                <div className="flex gap-3">
                                  <button
                                    type="button"
                                    onClick={handleExportTheme}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#2d2d2d] border border-[#3c3c3c] rounded-xl text-xs font-bold text-slate-300 hover:bg-[#3c3c3c] hover:text-white transition-all"
                                  >
                                    <Icon name="download" className="text-sm" /> Export Theme
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => themeImportRef.current?.click()}
                                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#ec5b13]/10 border border-[#ec5b13]/30 rounded-xl text-xs font-bold text-[#ec5b13] hover:bg-[#ec5b13]/20 transition-all"
                                  >
                                    <Icon name="upload" className="text-sm" /> Import Theme
                                  </button>
                                  <input
                                    ref={themeImportRef}
                                    type="file"
                                    className="hidden"
                                    accept=".json"
                                    onChange={handleImportTheme}
                                  />
                                </div>
                              </div>
                            </>
                          )}

                          {/* ── I18N TAB ── */}
                          {advancedTab === "i18n" && (
                            <>
                              {/* Navigation Labels */}
                              <div>
                                <h4 className="text-xs font-bold text-[#ec5b13] uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <Icon name="short_text" className="text-sm" /> Navigation Labels
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                  {([
                                    { key: "stepProgressLabel" as const, label: "Step Progress Label", placeholder: "Step {current} of {total}" },
                                    { key: "backButtonLabel" as const, label: "Back Button", placeholder: "Back" },
                                    { key: "nextButtonLabel" as const, label: "Next Button", placeholder: "Next" },
                                    { key: "closeButtonLabel" as const, label: "Close Button", placeholder: "Close" },
                                    { key: "skipButtonLabel" as const, label: "Skip Button", placeholder: "Skip" },
                                    { key: "finishButtonLabel" as const, label: "Finish Button", placeholder: "Finish" },
                                  ] as const).map((field) => (
                                    <div key={field.key} className="space-y-1">
                                      <label className="text-[10px] font-semibold text-slate-500 uppercase">{field.label}</label>
                                      <input
                                        className="w-full bg-[#252526] border border-[#3c3c3c] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#ec5b13] focus:border-transparent outline-none text-white"
                                        value={guide.meta.i18n?.[field.key] || ""}
                                        onChange={(e) => handleI18nChange(field.key, e.target.value)}
                                        placeholder={field.placeholder}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Feedback Messages */}
                              <div>
                                <h4 className="text-xs font-bold text-[#ec5b13] uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <Icon name="chat" className="text-sm" /> Feedback Messages
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                  {([
                                    { key: "targetMissingMessage" as const, label: "Target Missing", placeholder: "Target element not found" },
                                    { key: "requireClickMessage" as const, label: "Require Click", placeholder: "Please click the highlighted element" },
                                    { key: "requireInputMessage" as const, label: "Require Input", placeholder: "Please fill in the field" },
                                    { key: "autoAdvanceMessage" as const, label: "Auto Advance", placeholder: "Continuing in {seconds}s..." },
                                    { key: "completedTitleTemplate" as const, label: "Completed Title", placeholder: "Guide Complete!" },
                                    { key: "completedDescription" as const, label: "Completed Description", placeholder: "You've finished all the steps." },
                                  ] as const).map((field) => (
                                    <div key={field.key} className="space-y-1">
                                      <label className="text-[10px] font-semibold text-slate-500 uppercase">{field.label}</label>
                                      <input
                                        className="w-full bg-[#252526] border border-[#3c3c3c] rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-[#ec5b13] focus:border-transparent outline-none text-white"
                                        value={guide.meta.i18n?.[field.key] || ""}
                                        onChange={(e) => handleI18nChange(field.key, e.target.value)}
                                        placeholder={field.placeholder}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>

                              {/* Locale */}
                              <div>
                                <h4 className="text-xs font-bold text-[#ec5b13] uppercase tracking-widest mb-4 flex items-center gap-2">
                                  <Icon name="language" className="text-sm" /> Locale Configuration
                                </h4>
                                <div className="space-y-1">
                                  <label className="text-[10px] font-semibold text-slate-500 uppercase">Locale Code</label>
                                  <input
                                    className="w-full bg-[#252526] border border-[#3c3c3c] rounded-lg px-3 py-2 text-xs font-mono focus:ring-1 focus:ring-[#ec5b13] focus:border-transparent outline-none text-white"
                                    value={guide.meta.i18n?.locale || ""}
                                    onChange={(e) => handleI18nChange("locale", e.target.value)}
                                    placeholder="en"
                                  />
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center text-slate-500">
                  <div className="text-center">
                    <Icon
                      name="touch_app"
                      className="text-5xl text-slate-600 mb-3"
                    />
                    <p>Select a step from the sidebar to begin editing.</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* CODE VIEW TAB */}
          {editorTab === "code" && (
            <div className="flex-1 flex flex-col">
              {/* Code Toolbar */}
              <div className="flex items-center gap-3 px-4 py-2.5 border-b border-[#3c3c3c] bg-[#252526]/50 shrink-0">
                <div className="bg-[#252526] p-0.5 rounded-lg flex gap-0.5">
                  {CODE_FORMATS.map((f) => (
                    <button
                      key={f}
                      onClick={() => {
                        setCodeFormat(f);
                        setCodeValue(serializeGuideToFormat(guide, f));
                        setCodeIssues([]);
                      }}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${
                        codeFormat === f
                          ? "bg-[#ec5b13]/20 text-[#ec5b13]"
                          : "text-slate-500 hover:text-slate-300"
                      }`}
                    >
                      {CODE_FORMAT_LABELS[f]}
                    </button>
                  ))}
                </div>
                <div className="flex-1" />
                <button
                  onClick={handleFormatCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-[#3c3c3c] rounded-lg transition-colors"
                >
                  <Icon name="format_align_left" className="text-sm" /> Format
                </button>
                <button
                  onClick={handleCopyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-[#3c3c3c] rounded-lg transition-colors"
                >
                  <Icon name="content_copy" className="text-sm" /> Copy
                </button>
                <button
                  onClick={handleApplyCode}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-green-600/20 text-green-400 hover:bg-green-600/30 rounded-lg transition-colors"
                >
                  <Icon name="check" className="text-sm" /> Apply
                </button>
              </div>
              <div className="flex-1 relative">
                <Editor
                  height="100%"
                  language={editorLanguage}
                  value={codeValue}
                  onChange={(val) => setCodeValue(val ?? "")}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: "on",
                    wordWrap: "on",
                    scrollBeyondLastLine: false,
                    fontFamily: "'JetBrains Mono', monospace",
                    padding: { top: 16 },
                  }}
                />
              </div>
              {codeIssues.length > 0 && (
                <div className="border-t border-red-500/30 bg-red-500/5 p-3 max-h-32 overflow-y-auto">
                  {codeIssues.map((issue, i) => (
                    <p
                      key={i}
                      className="text-xs text-red-400 flex items-center gap-2 mb-1"
                    >
                      <Icon name="error" className="text-sm" /> {issue}
                    </p>
                  ))}
                </div>
              )}
            </div>
          )}


        </section>

        {/* ═══════════════ RIGHT SIDEBAR: Preview & Diagnostics ═══════════════ */}
        <aside
          className="flex flex-col border-l border-[#3c3c3c] bg-[#252526] shrink-0 overflow-hidden transition-all duration-300 ease-in-out"
          style={{ width: showRightSidebar ? 384 : 0, minWidth: showRightSidebar ? 384 : 0 }}
        >
          <div className="w-96 flex flex-col h-full">
            {/* Live Preview */}
            <LivePreview
              guide={guide}
              selectedStep={selectedStep}
              format={projectFormat}
              pickingTarget={pickingTarget}
              onTargetPicked={handleTargetPicked}
            />

            {/* Debug (collapsible) */}
            <div className="flex flex-col bg-[#252526] shrink-0 border-t border-[#3c3c3c]">
              <button
                type="button"
                onClick={() => setDebugOpen((v) => !v)}
                className="h-8 flex items-center justify-between px-4 bg-[#252526]/80 hover:bg-[#2d2d2d] transition-colors shrink-0 cursor-pointer select-none"
              >
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
                  <Icon name={debugOpen ? "expand_more" : "chevron_right"} className="text-sm text-slate-500" />
                  <span className="text-slate-500">Debug</span>
                  {schemaIssues.length > 0 ? (
                    <span className="flex items-center gap-1 ml-1 text-red-400">
                      <Icon name="error" className="text-xs" />
                      {schemaIssues.length}
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 ml-1 text-green-500">
                      <Icon name="check_circle" className="text-xs" />
                    </span>
                  )}
                </div>
              </button>

              {debugOpen && (
                <div className="max-h-60 overflow-y-auto custom-scrollbar p-3 space-y-2">
                  {schemaIssues.length === 0 ? (
                    <div className="p-2.5 bg-green-500/10 border border-green-500/20 rounded-lg flex gap-2.5">
                      <Icon name="check_circle" className="text-green-500 text-base" />
                      <div>
                        <p className="text-[11px] font-bold text-green-400">All Clear</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Guide configuration passes all validation checks.
                        </p>
                      </div>
                    </div>
                  ) : (
                    schemaIssues.map((issue, i) => (
                      <div
                        key={i}
                        className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-lg flex gap-2.5"
                      >
                        <Icon name="error" className="text-red-500 text-base shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[11px] font-bold text-red-400">Validation Error</p>
                          <p className="text-[10px] text-slate-400 mt-0.5 break-words">{issue}</p>
                        </div>
                      </div>
                    ))
                  )}

                  {/* Info row */}
                  <div className="p-2.5 bg-[#2d2d2d] border border-[#3c3c3c] rounded-lg flex gap-2.5">
                    <Icon name="info" className="text-slate-500 text-base" />
                    <p className="text-[10px] text-slate-500">
                      {guide.steps.length} step{guide.steps.length !== 1 ? "s" : ""} · {projectFormat.toUpperCase()} · {markdown.length} chars
                      {guide.meta.tooltipTemplate ? ` · ${guide.meta.tooltipTemplate}` : ""}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </aside>
      </main>

      <StatusBar
        message={statusMessage}
        stepCount={guide.steps.length}
        activeStep={selectedStep?.title || "none"}
        format={projectFormat}
      />

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmAction !== null}
        title={
          confirmAction?.type === "reset"
            ? "Reset Guide?"
            : "Delete Step?"
        }
        description={
          confirmAction?.type === "reset"
            ? "This will reset the entire guide to its default state. All your changes will be lost."
            : "This step will be permanently deleted. This action cannot be undone."
        }
        confirmLabel={confirmAction?.type === "reset" ? "Reset" : "Delete"}
        variant="danger"
        onConfirm={() => {
          if (confirmAction?.type === "reset") {
            resetGuide();
            setStatusMessage("Guide reset to defaults");
          } else if (confirmAction?.type === "deleteStep" && confirmAction.stepId) {
            removeStep(confirmAction.stepId);
            setStatusMessage("Step deleted");
          }
          setConfirmAction(null);
        }}
        onCancel={() => setConfirmAction(null)}
      />

      {/* Save Toast */}
      <div
        className={`fixed bottom-12 left-1/2 -translate-x-1/2 z-50 transition-all duration-300 ${
          saveToast
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-2.5 px-5 py-3 bg-green-600 text-white rounded-xl shadow-2xl shadow-green-600/30 text-sm font-bold">
          <Icon name="check_circle" className="text-lg" />
          Project saved successfully
        </div>
      </div>
    </div>
  );
}
