import type { BuilderGuide, BuilderMeta, BuilderStep } from "../../types/builder";

function uid(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createDefaultMeta(): BuilderMeta {
  return {
    id: "new-guide",
    title: "New Guide",
    buttonLabel: "Start Guide",
    overlayColor: "rgba(0, 43, 69, 0.22)",
    highlightColor: "rgb(255, 199, 0)",
    highlightStyle: "line",
    highlightAnimation: "none",
    tooltipWidth: 400,
    showHighlight: true,
    draggable: true,
  };
}

export function createDefaultStep(seed = 1): BuilderStep {
  return {
    id: `step-${seed}-${uid("id")}`,
    target: "",
    title: `Step ${seed}`,
    kind: "Action",
    description: "Describe what the user should do in this step.",
    skippable: true,
    advanceOn: "auto",
    showHighlight: true,
    highlightStyle: "line",
    highlightAnimation: "none",
    draggable: true,
    showAutoAdvanceProgress: true,
  };
}

export function createDefaultGuide(): BuilderGuide {
  return {
    meta: createDefaultMeta(),
    steps: [
      {
        ...createDefaultStep(1),
        id: "open-create",
        target: "open-create",
        title: "Open booking",
        description: "Click the New Booking button.",
      },
    ],
  };
}
