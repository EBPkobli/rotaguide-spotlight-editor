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

function serializeMeta(meta: BuilderMeta): string[] {
  const lines: string[] = ["---"];
  pushField(lines, "id", meta.id);
  pushField(lines, "title", meta.title);
  pushField(lines, "buttonLabel", meta.buttonLabel);
  pushField(lines, "tooltipTitle", meta.tooltipTitle);
  pushField(lines, "overlayColor", meta.overlayColor);
  pushField(lines, "highlightColor", meta.highlightColor);
  pushField(lines, "highlightStyle", meta.highlightStyle);
  pushField(lines, "highlightAnimation", meta.highlightAnimation);
  pushField(lines, "tooltipWidth", meta.tooltipWidth);
  pushField(lines, "showHighlight", meta.showHighlight);
  pushField(lines, "draggable", meta.draggable);
  lines.push("---");
  return lines;
}

function serializeStep(step: BuilderStep): string[] {
  const lines: string[] = [];
  lines.push(`## Step: ${step.title || step.id}`);
  lines.push("```yaml");
  pushField(lines, "id", step.id);
  pushField(lines, "target", step.target);
  pushField(lines, "kind", step.kind);
  pushField(lines, "title", step.title);
  pushField(lines, "description", step.description);
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
