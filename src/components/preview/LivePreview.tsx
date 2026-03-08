import { useCallback, useMemo, useRef, useState } from "react";
import {
  MarkdownGuideButton,
  guideTarget,
} from "rotaguide-spotlight";
import { Icon } from "../ui/Icon";
import type { BuilderGuide, BuilderStep } from "../../types/builder";
import { serializeGuideToFormat } from "../../lib/code/guideFormats";
import type { CodeFormat } from "../../lib/code/guideFormats";

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

  const primaryBg =
    (guide.meta.theme?.primaryButtonBackgroundColor as string) || "#ec5b13";
  const highlightColor =
    selectedStep?.highlightColor || guide.meta.highlightColor || "#ffc700";
  const highlightStyle =
    selectedStep?.highlightStyle || guide.meta.highlightStyle || "line";
  const highlightAnimation =
    selectedStep?.highlightAnimation || guide.meta.highlightAnimation || "none";
  const placement =
    selectedStep?.tooltipPlacement || guide.meta.tooltipPlacement || "bottom";

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
                      borderRadius: `${(guide.meta.theme?.tooltipBorderRadius as number) || 12}px`,
                      borderWidth: 2,
                      borderStyle: "solid",
                      borderColor: (guide.meta.theme?.tooltipBorderColor as string) || primaryBg,
                      background: (guide.meta.theme?.tooltipBackgroundColor as string) || "#ffffff",
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
                        borderColor: (guide.meta.theme?.tooltipBorderColor as string) || primaryBg,
                        background: (guide.meta.theme?.tooltipBackgroundColor as string) || "#ffffff",
                      }}
                    />

                    {/* Pills */}
                    <div className="flex items-center gap-1.5 mb-2">
                      <span
                        className="text-[8px] px-1.5 py-0.5 rounded-full font-bold"
                        style={{ background: `${primaryBg}15`, color: primaryBg }}
                      >
                        {stepIndex + 1}/{guide.steps.length || 1}
                      </span>
                      <span className="text-[8px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full font-bold uppercase">
                        {kind}
                      </span>
                    </div>

                    {/* Title */}
                    <h4
                      className="font-bold text-xs leading-tight mb-1"
                      style={{ color: (guide.meta.theme?.titleColor as string) || "#1a1a1a" }}
                    >
                      {selectedStep?.title || "Step Title"}
                    </h4>

                    {/* Description */}
                    <p
                      className="text-[10px] leading-relaxed mb-3"
                      style={{ color: (guide.meta.theme?.descriptionColor as string) || "#6b7280" }}
                    >
                      {selectedStep?.description || "Step description will appear here..."}
                    </p>

                    {/* Progress bar */}
                    <div className="mb-3">
                      <div
                        className="h-1 rounded-full overflow-hidden"
                        style={{ background: (guide.meta.theme?.timerTrackColor as string) || "#e5e5e5" }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${((stepIndex + 1) / Math.max(guide.steps.length, 1)) * 100}%`,
                            background: (guide.meta.theme?.timerFillColor as string) || primaryBg,
                          }}
                        />
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex items-center justify-between">
                      <button
                        className="px-2.5 py-1 text-[9px] font-bold rounded-md border"
                        style={{
                          borderColor: (guide.meta.theme?.ghostButtonBorderColor as string) || "#e5e5e5",
                          color: (guide.meta.theme?.ghostButtonTextColor as string) || "#6b7280",
                          background: (guide.meta.theme?.ghostButtonBackgroundColor as string) || "transparent",
                        }}
                      >
                        {guide.meta.i18n?.backButtonLabel || "Back"}
                      </button>
                      <button
                        className="px-2.5 py-1 text-[9px] font-bold rounded-md text-white"
                        style={{ background: primaryBg }}
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