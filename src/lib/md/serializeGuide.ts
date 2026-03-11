import type { BuilderGuide, BuilderMeta, BuilderStep } from "../../types/builder";

function toYamlValue(value: string | number | boolean): string {
  if (typeof value === "string") {
    return JSON.stringify(value);
  }
  return String(value);
}

function pushField(lines: string[], key: string, value: unknown): void {
  if (value === undefined || value === null) return;
  if (typeof value === "string" && value.trim() === "") return;
  if (typeof value !== "string" && typeof value !== "number" && typeof value !== "boolean") {
    return;
  }
  lines.push(`${key}: ${toYamlValue(value)}`);
}

function pushObjectBlock(lines: string[], key: string, value: unknown): void {
  if (!value || typeof value !== "object") return;
  const entries = Object.entries(value).filter(([, entry]) => {
    if (entry === undefined || entry === null) return false;
    if (typeof entry === "string") return entry.trim() !== "";
    return typeof entry === "number" || typeof entry === "boolean";
  });
  if (entries.length === 0) return;

  lines.push(`${key}:`);
  for (const [entryKey, entryValue] of entries) {
    lines.push(`  ${entryKey}: ${toYamlValue(entryValue as string | number | boolean)}`);
  }
}

function serializeMeta(meta: BuilderMeta): string[] {
  const lines: string[] = ["---"];
  pushField(lines, "id", meta.id);
  pushField(lines, "title", meta.title);
  pushField(lines, "buttonLabel", meta.buttonLabel);
  pushField(lines, "tooltipTitle", meta.tooltipTitle);
  pushField(lines, "tooltipPlacement", meta.tooltipPlacement);
  pushField(lines, "tooltipTemplate", meta.tooltipTemplate);
  pushField(lines, "overlayColor", meta.overlayColor);
  pushField(lines, "highlightColor", meta.highlightColor);
  pushField(lines, "highlightStyle", meta.highlightStyle);
  pushField(lines, "highlightAnimation", meta.highlightAnimation);
  pushField(lines, "tooltipWidth", meta.tooltipWidth);
  pushField(lines, "showHighlight", meta.showHighlight);
  pushField(lines, "draggable", meta.draggable);
  pushObjectBlock(lines, "pills", meta.pills);
  pushObjectBlock(lines, "actions", meta.actions);
  pushObjectBlock(lines, "i18n", meta.i18n);
  pushObjectBlock(lines, "theme", meta.theme);

  lines.push("---");
  return lines;
}

function serializeStep(step: BuilderStep): string[] {
  const lines: string[] = [];
  lines.push(`## Step: ${step.title || step.id}`);
  lines.push("```yaml");
  pushField(lines, "id", step.id);

  /* Multi-target: split comma-separated → target + targets */
  const allTargets = step.target
    ? step.target.split(",").map((t) => t.trim()).filter(Boolean)
    : [];
  pushField(lines, "target", allTargets[0] || step.target);
  if (allTargets.length > 1) {
    lines.push("targets:");
    for (const t of allTargets) {
      lines.push(`  - ${toYamlValue(t)}`);
    }
  }

  pushField(lines, "kind", step.kind);
  pushField(lines, "title", step.title);
  pushField(lines, "description", step.description);
  pushField(lines, "tooltipPlacement", step.tooltipPlacement);
  pushField(lines, "tooltipTemplate", step.tooltipTemplate);
  pushField(lines, "skippable", step.skippable);
  pushField(lines, "allowSkip", step.allowSkip);
  pushField(lines, "advanceOn", step.advanceOn);
  pushField(lines, "inputIdleMs", step.inputIdleMs);
  pushField(lines, "showHighlight", step.showHighlight);
  pushField(lines, "highlightColor", step.highlightColor);
  pushField(lines, "highlightStyle", step.highlightStyle);
  pushField(lines, "highlightAnimation", step.highlightAnimation);
  pushField(lines, "draggable", step.draggable);
  pushField(lines, "autoAdvanceMs", step.autoAdvanceMs);
  pushField(lines, "showAutoAdvanceProgress", step.showAutoAdvanceProgress);
  pushField(lines, "mustClickTarget", step.mustClickTarget);
  pushField(lines, "mustEnterValue", step.mustEnterValue);
  pushObjectBlock(lines, "pills", step.pills);
  pushObjectBlock(lines, "actions", step.actions);
  pushObjectBlock(lines, "i18n", step.i18n);
  pushObjectBlock(lines, "theme", step.theme);

  lines.push("```");
  return lines;
}

export function serializeGuideToMarkdown(guide: BuilderGuide): string {
  const blocks: string[] = [];
  blocks.push(...serializeMeta(guide.meta));
  blocks.push("");

  guide.steps.forEach((step, index) => {
    blocks.push(...serializeStep(step));
    if (index < guide.steps.length - 1) {
      blocks.push("");
    }
  });

  return `${blocks.join("\n")}\n`;
}
