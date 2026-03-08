import { useCallback, useMemo, useRef, useState } from "react";
import {
  MarkdownGuideButton,
  guideTarget,
} from "rotaguide-spotlight";
import { Icon } from "../ui/Icon";
import type { BuilderGuide, BuilderStep } from "../../types/builder";
import { serializeGuideToFormat } from "../../lib/code/guideFormats";
import type { CodeFormat } from "../../lib/code/guideFormats";
import type { GuideTooltipTemplate } from "../../types/builder";

/* ── Template style defaults (mirrors rotaguide-spotlight CSS vars) ── */
interface TemplateStyle {
  bg: string; border: string; radius: number;
  title: string; desc: string;
  pillStepBg: string; pillStepText: string;
  pillKindBg: string; pillKindText: string;
  ghostBg: string; ghostText: string; ghostBorder: string;
  primaryBtnBg: string; primaryBtnText: string;
  trackBg: string; fillBg: string;
}

const TEMPLATE_DEFAULTS: Record<GuideTooltipTemplate, TemplateStyle> = {
  default: {
    bg: "#ffffff", border: "#e3eaed", radius: 12,
    title: "#002b45", desc: "#4d5e6b",
    pillStepBg: "#fff5cc", pillStepText: "#002b45",
    pillKindBg: "#e5f4ff", pillKindText: "#1a63f5",
    ghostBg: "#ffffff", ghostText: "#002b45", ghostBorder: "#b6c7d1",
    primaryBtnBg: "#1a63f5", primaryBtnText: "#ffffff",
    trackBg: "#e7eef2", fillBg: "#1a63f5",
  },
  glass: {
    bg: "rgba(255,255,255,0.72)", border: "rgba(179,199,214,0.9)", radius: 12,
    title: "#002b45", desc: "#4d5e6b",
    pillStepBg: "rgba(255,255,255,0.7)", pillStepText: "#002b45",
    pillKindBg: "rgba(229,244,255,0.78)", pillKindText: "#1a63f5",
    ghostBg: "#ffffff", ghostText: "#002b45", ghostBorder: "#b6c7d1",
    primaryBtnBg: "#1a63f5", primaryBtnText: "#ffffff",
    trackBg: "#e7eef2", fillBg: "#1a63f5",
  },
  minimal: {
    bg: "#ffffff", border: "#dce5eb", radius: 8,
    title: "#002b45", desc: "#4d5e6b",
    pillStepBg: "transparent", pillStepText: "#4d5e6b",
    pillKindBg: "transparent", pillKindText: "#4d5e6b",
    ghostBg: "#ffffff", ghostText: "#002b45", ghostBorder: "#b6c7d1",
    primaryBtnBg: "#1a63f5", primaryBtnText: "#ffffff",
    trackBg: "#e7eef2", fillBg: "#1a63f5",
  },
  contrast: {
    bg: "#0f1724", border: "#2b3b4f", radius: 12,
    title: "#f6fcff", desc: "#b5c9d9",
    pillStepBg: "rgba(255,255,255,0.12)", pillStepText: "#f6fcff",
    pillKindBg: "rgba(56,138,255,0.22)", pillKindText: "#a7d3ff",
    ghostBg: "#162131", ghostText: "#eaf6ff", ghostBorder: "#3a5069",
    primaryBtnBg: "#1d6af5", primaryBtnText: "#ffffff",
    trackBg: "#293b51", fillBg: "#56a6ff",
  },
  "dashboard-orange": {
    bg: "#0a1b3a", border: "#f56d16", radius: 14,
    title: "#ff8534", desc: "#e0ecfa",
    pillStepBg: "#f56d16", pillStepText: "#ffffff",
    pillKindBg: "rgba(255,255,255,0.12)", pillKindText: "#ebf4ff",
    ghostBg: "rgba(255,255,255,0.04)", ghostText: "#ecf6ff", ghostBorder: "#f56d16",
    primaryBtnBg: "#f56d16", primaryBtnText: "#ffffff",
    trackBg: "#1e345a", fillBg: "#f56d16",
  },
  "clean-white": {
    bg: "#ffffff", border: "#f7670e", radius: 30,
    title: "#14213e", desc: "#4e5f79",
    pillStepBg: "#ffefe8", pillStepText: "#f5670e",
    pillKindBg: "#eff4fc", pillKindText: "#687b97",
    ghostBg: "#f0f4f9", ghostText: "#18243b", ghostBorder: "#f0f4f9",
    primaryBtnBg: "#f5670e", primaryBtnText: "#ffffff",
    trackBg: "#e7eef2", fillBg: "#f5670e",
  },
  "commerce-dark": {
    bg: "#26140b", border: "rgba(245,109,22,0.5)", radius: 24,
    title: "#f8fbff", desc: "#afbcd1",
    pillStepBg: "rgba(245,109,22,0.16)", pillStepText: "#ff863e",
    pillKindBg: "rgba(255,255,255,0.08)", pillKindText: "#eef4ff",
    ghostBg: "transparent", ghostText: "#f6fbff", ghostBorder: "rgba(245,109,22,0.4)",
    primaryBtnBg: "#f5670e", primaryBtnText: "#ffffff",
    trackBg: "rgba(255,255,255,0.1)", fillBg: "#f5670e",
  },
  "terminal-pop": {
    bg: "#f5670e", border: "rgba(255,255,255,0.15)", radius: 28,
    title: "#ffffff", desc: "rgba(255,255,255,0.95)",
    pillStepBg: "rgba(255,255,255,0.28)", pillStepText: "#ffffff",
    pillKindBg: "rgba(0,0,0,0.14)", pillKindText: "#ffffff",
    ghostBg: "#ffffff", ghostText: "#e05f0c", ghostBorder: "#ffffff",
    primaryBtnBg: "rgba(255,255,255,0.24)", primaryBtnText: "#ffffff",
    trackBg: "rgba(255,255,255,0.24)", fillBg: "#ffffff",
  },
  "outline-light": {
    bg: "#f9fbff", border: "#f5670e", radius: 24,
    title: "#121d39", desc: "#4f6078",
    pillStepBg: "#ffede4", pillStepText: "#f5670e",
    pillKindBg: "#eff4fc", pillKindText: "#687b97",
    ghostBg: "transparent", ghostText: "#6e7e94", ghostBorder: "transparent",
    primaryBtnBg: "#f5670e", primaryBtnText: "#ffffff",
    trackBg: "#e7eef2", fillBg: "#f5670e",
  },
};

interface LivePreviewProps {
  guide: BuilderGuide;
  selectedStep: BuilderStep | null;
  format: CodeFormat;
  pickingTarget?: boolean;
  onTargetPicked?: (target: string) => void;
}

export function LivePreview({ guide, selectedStep, format, pickingTarget, onTargetPicked }: LivePreviewProps) {
  const [guideRunning, setGuideRunning] = useState(false);

  const serialized = useMemo(
    () => serializeGuideToFormat(guide, format),
    [guide, format],
  );

  const stepIndex = useMemo(() => {
    if (!selectedStep) return 0;
    const idx = guide.steps.findIndex((s) => s.id === selectedStep.id);
    return idx >= 0 ? idx : 0;
  }, [guide.steps, selectedStep]);

  /* Collect unique shorthand targets for dynamic buttons */
  const dynamicTargets = useMemo(() => {
    const selectorLike = (t: string) =>
      !t || /^[.#[]/.test(t) || /[ >:+~]/.test(t);
    const set = new Set<string>();
    for (const step of guide.steps) {
      /* Split comma-separated targets so each is checked individually */
      const targets = step.target
        ? step.target.split(",").map((t) => t.trim()).filter(Boolean)
        : [];
      for (const t of targets) {
        if (!selectorLike(t)) set.add(t);
      }
    }
    const wellKnown = new Set([
      "guide-start-panel", "open-create", "customer-name",
      "plan-select", "notify-toggle", "save-booking",
    ]);
    return [...set].filter((t) => !wellKnown.has(t));
  }, [guide.steps]);

  const kind = selectedStep?.kind || "tooltip";

  /* ── Hover: always show target names & allow click-to-add ── */
  const miniAppRef = useRef<HTMLDivElement>(null);
  const [hoveredTarget, setHoveredTarget] = useState<string | null>(null);
  const [hoveredPos, setHoveredPos] = useState<{ x: number; y: number } | null>(null);

  const handleTargetClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!pickingTarget || !onTargetPicked) return;
      const el = (e.target as HTMLElement).closest("[data-click-guide]");
      if (el) {
        e.preventDefault();
        e.stopPropagation();
        const target = el.getAttribute("data-click-guide");
        if (target) onTargetPicked(target);
      }
    },
    [pickingTarget, onTargetPicked],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const el = (e.target as HTMLElement).closest("[data-click-guide]");
      if (el) {
        const rect = miniAppRef.current?.getBoundingClientRect();
        if (rect) {
          setHoveredPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
        }
        setHoveredTarget(el.getAttribute("data-click-guide"));
      } else {
        setHoveredTarget(null);
        setHoveredPos(null);
      }
    },
    [],
  );

  const handleMouseLeave = useCallback(() => {
    setHoveredTarget(null);
    setHoveredPos(null);
  }, []);

  const highlightColor =
    selectedStep?.highlightColor || guide.meta.highlightColor || "#ffc700";
  const highlightStyle =
    selectedStep?.highlightStyle || guide.meta.highlightStyle || "line";
  const highlightAnimation =
    selectedStep?.highlightAnimation || guide.meta.highlightAnimation || "none";
  const placement =
    selectedStep?.tooltipPlacement || guide.meta.tooltipPlacement || "bottom";

  /* ── Template-based tooltip defaults (matches rotaguide-spotlight CSS) ── */
  const activeTemplate =
    selectedStep?.tooltipTemplate || guide.meta.tooltipTemplate || "default";
  const tpl = TEMPLATE_DEFAULTS[activeTemplate] || TEMPLATE_DEFAULTS.default;
  const theme = guide.meta.theme ?? {};
  const tt = {
    bg: (theme.tooltipBackgroundColor as string) || tpl.bg,
    border: (theme.tooltipBorderColor as string) || tpl.border,
    radius: (theme.tooltipBorderRadius as number) ?? tpl.radius,
    title: (theme.titleColor as string) || tpl.title,
    desc: (theme.descriptionColor as string) || tpl.desc,
    pillStepBg: tpl.pillStepBg,
    pillStepText: tpl.pillStepText,
    pillKindBg: tpl.pillKindBg,
    pillKindText: tpl.pillKindText,
    ghostBg: (theme.ghostButtonBackgroundColor as string) || tpl.ghostBg,
    ghostText: (theme.ghostButtonTextColor as string) || tpl.ghostText,
    ghostBorder: (theme.ghostButtonBorderColor as string) || tpl.ghostBorder,
    primaryBtnBg: (theme.primaryButtonBackgroundColor as string) || tpl.primaryBtnBg,
    primaryBtnText: tpl.primaryBtnText,
    trackBg: (theme.timerTrackColor as string) || tpl.trackBg,
    fillBg: (theme.timerFillColor as string) || tpl.fillBg,
  };

  return (
    <div className="flex flex-col flex-1 min-h-0 border-b border-[#3c3c3c]">
      {/* ── Header ── */}
      <div className="h-10 flex items-center justify-between px-4 border-b border-[#3c3c3c] bg-[#252526]/50 shrink-0">
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Icon name="visibility" className="text-sm" /> Live Preview
        </span>
        <div className="flex items-center gap-2">
          {guideRunning && (
            <span className="text-[9px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full font-bold animate-pulse">
              RUNNING
            </span>
          )}
          <MarkdownGuideButton
            content={serialized}
            format={format === "markdown" ? "markdown" : format === "yaml" ? "yaml" : "json"}
            onGuideStart={() => setGuideRunning(true)}
            onGuideClose={() => setGuideRunning(false)}
            renderButton={({ onClick, disabled }) => (
              <button
                type="button"
                onClick={onClick}
                disabled={disabled}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-green-600 hover:bg-green-500 disabled:opacity-40 text-white text-[10px] font-bold rounded-lg transition-all shadow-md shadow-green-600/25"
              >
                <Icon name="play_arrow" className="text-sm" />
                Run
              </button>
            )}
          />
        </div>
      </div>

      {/* ── Scrolling Canvas ── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#1e1e1e]">
        <div className="p-3 space-y-3">

          {/* ★ 1. Mini App ★ */}
          <div className="relative">
            {/* Hover / Pick styles for guide targets (inset to survive overflow-hidden) */}
            <style>{`
              .mini-app-zone [data-click-guide] {
                position: relative;
                z-index: 1;
                transition: background 0.15s, box-shadow 0.15s;
                cursor: pointer !important;
                border-radius: 3px;
              }
              .mini-app-zone [data-click-guide]:hover {
                background: rgba(236, 91, 19, 0.08) !important;
                box-shadow: inset 0 0 0 1.5px rgba(236, 91, 19, 0.55) !important;
              }
              .mini-app-zone.picking [data-click-guide] {
                box-shadow: inset 0 0 0 2px ${highlightColor} !important;
                background: ${highlightColor}10 !important;
                cursor: crosshair !important;
              }
              .mini-app-zone.picking [data-click-guide]:hover {
                box-shadow: inset 0 0 0 2.5px ${highlightColor}, 0 0 8px ${highlightColor}50 !important;
                background: ${highlightColor}20 !important;
              }
            `}</style>

            {/* Pick mode banner */}
            {pickingTarget && (
              <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 z-30 px-3 py-0.5 bg-[#ec5b13] text-white text-[8px] font-bold rounded-b-md shadow-lg shadow-[#ec5b13]/30 animate-pulse flex items-center gap-1">
                <Icon name="ads_click" className="text-[10px]" /> Pick a target
              </div>
            )}

            <div
              ref={miniAppRef}
              onClick={handleTargetClick}
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className={`mini-app-zone border rounded-xl bg-[#f8f9fb] shadow-2xl relative overflow-hidden flex flex-col ${pickingTarget ? "picking border-[#ec5b13]/50 ring-1 ring-[#ec5b13]/20" : "border-[#3c3c3c]"}`}
            >
              {/* Browser chrome */}
              <div className="h-6 bg-[#1e1e1e] border-b border-[#3c3c3c] flex items-center px-2.5 gap-1 shrink-0">
                <div className="size-1.5 rounded-full bg-[#ef5e5e]/70" />
                <div className="size-1.5 rounded-full bg-[#f5c542]/70" />
                <div className="size-1.5 rounded-full bg-[#43c476]/70" />
                <div className="flex-1 flex justify-center">
                  <div className="px-4 py-0.5 bg-[#3c3c3c]/40 rounded text-[7px] text-slate-500 font-mono">
                    app.example.com/dashboard
                  </div>
                </div>
              </div>

              {/* ── Realistic mini web app ── */}
              <div className="flex flex-col overflow-hidden" style={{ fontSize: "9px" }}>
                {/* App Header */}
                <div className="h-7 bg-white border-b border-gray-200 flex items-center justify-between px-2.5 shrink-0" title="guide-start-panel" {...guideTarget("guide-start-panel")}>
                  <div className="flex items-center gap-1.5">
                    <div className="size-3.5 rounded bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                      <span className="text-white text-[5px] font-black">A</span>
                    </div>
                    <span className="text-[8px] font-bold text-gray-800">Acme App</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[7px] text-gray-400">Dashboard</span>
                    <span className="text-[7px] text-gray-400">Settings</span>
                    <div className="size-3.5 rounded-full bg-blue-500 flex items-center justify-center">
                      <span className="text-white text-[5px] font-bold">J</span>
                    </div>
                  </div>
                </div>

                {/* Main content area */}
                <div className="flex min-h-0">
                  {/* Sidebar */}
                  <div className="w-[60px] bg-white border-r border-gray-100 py-1.5 px-1 shrink-0 flex flex-col gap-px">
                    {[
                      { icon: "📊", label: "Overview", active: true },
                      { icon: "👤", label: "Customers" },
                      { icon: "📦", label: "Orders" },
                      { icon: "💳", label: "Billing" },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className={`flex items-center gap-1 px-1 py-0.5 rounded cursor-default ${
                          item.active ? "bg-blue-50 text-blue-600" : "text-gray-500"
                        }`}
                      >
                        <span className="text-[7px]">{item.icon}</span>
                        <span className="text-[6px] font-medium truncate">{item.label}</span>
                      </div>
                    ))}
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-2 space-y-2">
                    {/* Page title + action */}
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-[9px] font-bold text-gray-800">Overview</h3>
                        <p className="text-[6px] text-gray-400">Welcome back, John</p>
                      </div>
                      <button
                        className="px-1.5 py-0.5 bg-blue-500 text-white rounded text-[6px] font-semibold shadow-sm cursor-default"
                        title="open-create"
                        {...guideTarget("open-create")}
                      >
                        + New Order
                      </button>
                    </div>

                    {/* Stat cards row */}
                    <div className="grid grid-cols-3 gap-1">
                      {[
                        { label: "Revenue", value: "$12,450", change: "+12%" },
                        { label: "Orders", value: "384", change: "+8%" },
                        { label: "Customers", value: "1,204", change: "+24%" },
                      ].map((stat) => (
                        <div key={stat.label} className="bg-white rounded border border-gray-100 p-1.5 shadow-sm">
                          <p className="text-[6px] text-gray-400 font-medium">{stat.label}</p>
                          <p className="text-[9px] font-bold text-gray-800">{stat.value}</p>
                          <p className="text-[6px] font-semibold text-green-600">{stat.change}</p>
                        </div>
                      ))}
                    </div>

                    {/* Form section */}
                    <div className="bg-white rounded border border-gray-100 p-2 shadow-sm space-y-1.5">
                      <p className="text-[7px] font-bold text-gray-700">Quick Booking</p>
                      <div className="space-y-1">
                        <div title="customer-name" {...guideTarget("customer-name")}>
                          <label className="text-[6px] font-medium text-gray-500 block">Customer Name</label>
                          <div className="h-4 bg-gray-50 border border-gray-200 rounded px-1 flex items-center">
                            <span className="text-[6px] text-gray-400">Enter name...</span>
                          </div>
                        </div>
                        <div title="plan-select" {...guideTarget("plan-select")}>
                          <label className="text-[6px] font-medium text-gray-500 block">Plan</label>
                          <div className="h-4 bg-gray-50 border border-gray-200 rounded px-1 flex items-center justify-between">
                            <span className="text-[6px] text-gray-400">Select plan...</span>
                            <span className="text-[6px] text-gray-300">▾</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between" title="notify-toggle" {...guideTarget("notify-toggle")}>
                          <span className="text-[6px] font-medium text-gray-500">Send notification</span>
                          <div className="w-5 h-3 bg-blue-500 rounded-full relative cursor-default">
                            <div className="absolute right-0.5 top-0.5 size-2 bg-white rounded-full shadow-sm" />
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-1 pt-0.5">
                        <button className="flex-1 h-4 bg-blue-500 text-white rounded text-[6px] font-semibold cursor-default" title="save-booking" {...guideTarget("save-booking")}>
                          Save Booking
                        </button>
                        <button className="h-4 px-1.5 bg-gray-100 text-gray-500 rounded text-[6px] font-medium border border-gray-200 cursor-default">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Dynamic custom targets */}
              {dynamicTargets.length > 0 && (
                <div className="opacity-0 absolute bottom-0 left-0 flex gap-1 pointer-events-none">
                  {dynamicTargets.map((t) => (
                    <span key={t} {...guideTarget(t)} className="size-1" />
                  ))}
                </div>
              )}
            </div>

            {/* Floating target name tooltip */}
            {hoveredTarget && hoveredPos && (
              <div
                className="absolute z-30 px-2.5 py-1 bg-[#1e1e1e] border border-[#ec5b13] text-[#ec5b13] text-[9px] font-mono font-bold rounded-md shadow-lg pointer-events-none whitespace-nowrap"
                style={{ left: hoveredPos.x, top: hoveredPos.y - 28 }}
              >
                {hoveredTarget}
              </div>
            )}
          </div>

          {/* ★ 2. Tooltip Preview ★ */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 px-1">
                <Icon name="chat_bubble" className="text-xs text-slate-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tooltip</span>
                <span className="text-[9px] text-slate-600 font-mono bg-[#252526] px-1.5 py-0.5 rounded">
                  {selectedStep?.tooltipTemplate || guide.meta.tooltipTemplate || "default"}
                </span>
                <span className="text-[9px] text-slate-600 font-mono bg-[#252526] px-1.5 py-0.5 rounded">
                  {placement}
                </span>
              </div>
              <div className="flex justify-center">
                <div className="relative" style={{ maxWidth: Math.min(guide.meta.tooltipWidth || 320, 340), width: "100%" }}>
                  {/* Tooltip card */}
                  <div
                    className="relative shadow-2xl p-4"
                    style={{
                      borderRadius: `${tt.radius}px`,
                      borderWidth: 2,
                      borderStyle: "solid",
                      borderColor: tt.border,
                      background: tt.bg,
                    }}
                  >
                    {/* Arrow indicator */}
                    <div
                      className={`absolute size-3 rotate-45 ${
                        placement === "top"
                          ? "left-1/2 -translate-x-1/2 -top-[7px] border-t-2 border-l-2"
                          : placement === "bottom"
                            ? "left-1/2 -translate-x-1/2 -bottom-[7px] border-b-2 border-r-2"
                            : placement === "left"
                              ? "top-1/2 -translate-y-1/2 -left-[7px] border-b-2 border-l-2"
                              : placement === "right"
                                ? "top-1/2 -translate-y-1/2 -right-[7px] border-t-2 border-r-2"
                                : "left-1/2 -translate-x-1/2 -bottom-[7px] border-b-2 border-r-2"
                      }`}
                      style={{
                        borderColor: tt.border,
                        background: tt.bg,
                      }}
                    />

                    {/* Pills */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <span
                        className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{ background: tt.pillStepBg, color: tt.pillStepText }}
                      >
                        {stepIndex + 1}/{guide.steps.length || 1}
                      </span>
                      <span
                        className="text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase"
                        style={{ background: tt.pillKindBg, color: tt.pillKindText }}
                      >
                        {kind}
                      </span>
                    </div>

                    {/* Title */}
                    <h4
                      className="font-bold text-xs leading-tight mb-1"
                      style={{ color: tt.title }}
                    >
                      {selectedStep?.title || "Step Title"}
                    </h4>

                    {/* Description */}
                    <p
                      className="text-[10px] leading-relaxed mb-3"
                      style={{ color: tt.desc }}
                    >
                      {selectedStep?.description || "Step description will appear here..."}
                    </p>

                    {/* Progress bar */}
                    <div className="mb-3">
                      <div
                        className="h-1 rounded-full overflow-hidden"
                        style={{ background: tt.trackBg }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${((stepIndex + 1) / Math.max(guide.steps.length, 1)) * 100}%`,
                            background: tt.fillBg,
                          }}
                        />
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center justify-between">
                      <button
                        className="px-2.5 py-1 text-[9px] font-bold rounded-md border"
                        style={{
                          borderColor: tt.ghostBorder,
                          color: tt.ghostText,
                          background: tt.ghostBg,
                        }}
                      >
                        {guide.meta.i18n?.backButtonLabel || "Back"}
                      </button>
                      <button
                        className="px-2.5 py-1 text-[9px] font-bold rounded-md"
                        style={{ background: tt.primaryBtnBg, color: tt.primaryBtnText }}
                      >
                        {stepIndex + 1 >= guide.steps.length
                          ? guide.meta.i18n?.finishButtonLabel || "Finish"
                          : guide.meta.i18n?.nextButtonLabel || "Next"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

          {/* ★ 3. Spotlight Preview ★ */}
            <div className="space-y-1.5">
              {/* Keyframes for highlight animations */}
              <style>{`
                @keyframes hl-color-shift {
                  0%, 100% { opacity: 1; }
                  50% { opacity: 0.4; }
                }
                @keyframes hl-dash-march {
                  0% { stroke-dashoffset: 0; }
                  100% { stroke-dashoffset: -20; }
                }
                @keyframes hl-color-dash {
                  0% { opacity: 1; stroke-dashoffset: 0; }
                  50% { opacity: 0.4; }
                  100% { opacity: 1; stroke-dashoffset: -20; }
                }
              `}</style>
              <div className="flex items-center gap-2 px-1">
                <Icon name="highlight" className="text-xs text-slate-500" />
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Spotlight</span>
                <span className="text-[9px] text-slate-600 font-mono bg-[#252526] px-1.5 py-0.5 rounded">
                  {highlightStyle}
                </span>
                {highlightAnimation !== "none" && (
                  <span className="text-[9px] text-slate-600 font-mono bg-[#252526] px-1.5 py-0.5 rounded">
                    {highlightAnimation}
                  </span>
                )}
              </div>
              <div
                className="relative rounded-xl overflow-hidden flex items-center justify-center py-6"
                style={{
                  background: guide.meta.overlayColor
                    ? `${guide.meta.overlayColor}`
                    : "rgba(0, 15, 30, 0.75)",
                }}
              >
                {/* Spotlight using SVG for proper dash + animation */}
                <div className="relative" style={{ padding: 12 }}>
                  <svg
                    className="absolute inset-0 w-full h-full"
                    style={{ overflow: "visible" }}
                  >
                    <rect
                      x="4" y="4"
                      width="calc(100% - 8px)" height="calc(100% - 8px)"
                      rx="8" ry="8"
                      fill="none"
                      stroke={highlightColor}
                      strokeWidth={2.5}
                      strokeDasharray={highlightStyle === "dash" ? "8 4" : "none"}
                      style={{
                        ...(highlightAnimation === "color"
                          ? { animation: "hl-color-shift 2s ease-in-out infinite" }
                          : highlightAnimation === "dash"
                            ? { strokeDasharray: "8 4", animation: "hl-dash-march 0.8s linear infinite" }
                            : highlightAnimation === "color-dash"
                              ? { strokeDasharray: "8 4", animation: "hl-color-dash 2s ease-in-out infinite" }
                              : {}),
                      }}
                    />
                  </svg>
                  {/* Target element mockup */}
                  <div className="relative bg-white rounded-lg px-5 py-2.5 shadow-lg">
                    <div className="flex items-center gap-2">
                      <Icon name="ads_click" className="text-sm text-blue-500" />
                      <div>
                        <p className="text-[10px] font-bold text-gray-800">
                          {selectedStep?.target || "target-element"}
                        </p>
                        <p className="text-[8px] text-gray-400">
                          Highlighted element
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

        </div>
      </div>
    </div>
  );
}