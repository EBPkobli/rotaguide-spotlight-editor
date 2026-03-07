import type {
  GuideAdvanceMode,
  GuideHighlightAnimation,
  GuideHighlightStyle,
  GuideKind,
} from "md-spotlight-guide-tool";

export interface BuilderMeta {
  id: string;
  title: string;
  buttonLabel?: string;
  tooltipTitle?: string;
  overlayColor?: string;
  highlightColor?: string;
  tooltipWidth?: number;
  showHighlight?: boolean;
  draggable?: boolean;
  highlightStyle?: GuideHighlightStyle;
  highlightAnimation?: GuideHighlightAnimation;
}

export interface BuilderStep {
  id: string;
  target: string;
  title: string;
  kind: GuideKind;
  description: string;
  skippable?: boolean;
  allowSkip?: boolean;
  advanceOn?: GuideAdvanceMode;
  inputIdleMs?: number;
  showHighlight?: boolean;
  highlightColor?: string;
  highlightStyle?: GuideHighlightStyle;
  highlightAnimation?: GuideHighlightAnimation;
  draggable?: boolean;
  autoAdvanceMs?: number;
  showAutoAdvanceProgress?: boolean;
  mustClickTarget?: boolean;
  mustEnterValue?: boolean;
}

export interface BuilderGuide {
  meta: BuilderMeta;
  steps: BuilderStep[];
}

export const STEP_KINDS: GuideKind[] = [
  "Filter",
  "Toggle",
  "Action",
  "Input",
  "Tab",
  "List",
  "Map Interaction",
];

export const ADVANCE_MODES: GuideAdvanceMode[] = ["auto", "click", "change", "input-idle", "none"];

export const HIGHLIGHT_STYLES: GuideHighlightStyle[] = ["line", "dash"];

export const HIGHLIGHT_ANIMATIONS: GuideHighlightAnimation[] = [
  "none",
  "color",
  "dash",
  "color-dash",
];
