import {
  parseGuideMarkdownSafe,
  type GuideDefinition,
  type GuideIssue,
} from "md-spotlight-guide-tool";
import type { BuilderGuide } from "../../types/builder";

function fromGuideDefinition(guide: GuideDefinition): BuilderGuide {
  return {
    meta: {
      id: guide.meta.id,
      title: guide.meta.title,
      buttonLabel: guide.meta.buttonLabel,
      tooltipTitle: guide.meta.tooltipTitle,
      overlayColor: guide.meta.overlayColor,
      highlightColor: guide.meta.highlightColor,
      tooltipWidth: guide.meta.tooltipWidth,
      showHighlight: guide.meta.showHighlight,
      draggable: guide.meta.draggable,
      highlightStyle: guide.meta.highlightStyle,
      highlightAnimation: guide.meta.highlightAnimation,
    },
    steps: guide.steps.map((step) => ({
      id: step.id,
      target: step.target,
      title: step.title,
      kind: step.kind,
      description: step.description,
      skippable: step.skippable,
      allowSkip: step.allowSkip,
      advanceOn: step.advanceOn,
      inputIdleMs: step.inputIdleMs,
      showHighlight: step.showHighlight,
      highlightColor: step.highlightColor,
      draggable: step.draggable,
      highlightStyle: step.highlightStyle,
      highlightAnimation: step.highlightAnimation,
      autoAdvanceMs: step.autoAdvanceMs,
      showAutoAdvanceProgress: step.showAutoAdvanceProgress,
      mustClickTarget: step.mustClickTarget,
      mustEnterValue: step.mustEnterValue,
    })),
  };
}

export function parseBuilderGuideFromMarkdown(markdown: string): {
  guide: BuilderGuide | null;
  issues: GuideIssue[];
} {
  const result = parseGuideMarkdownSafe(markdown);
  if (!result.guide) {
    return { guide: null, issues: result.issues };
  }

  return { guide: fromGuideDefinition(result.guide), issues: [] };
}
