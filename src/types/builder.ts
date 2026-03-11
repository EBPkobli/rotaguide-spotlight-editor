import type {
  GuideAdvanceMode,
  GuideActions,
  GuideHighlightAnimation,
  GuideHighlightStyle,
  GuideKind,
  GuideTooltipPlacement,
  GuideTooltipTemplate,
  GuideI18n,
  GuidePills,
  GuidePrimaryAction,
  GuideTheme,
  GuideTextTransform,
} from "rotaguide-spotlight";

export type {
  GuideActions,
  GuidePills,
  GuidePrimaryAction,
  GuideTooltipPlacement,
  GuideTooltipTemplate,
  GuideI18n,
  GuideTheme,
  GuideTextTransform,
};

export type ProjectFormat = "markdown" | "json" | "yaml";

export interface BuilderMeta {
  id: string;
  title: string;
  buttonLabel?: string;
  tooltipTitle?: string;
  tooltipPlacement?: GuideTooltipPlacement;
  overlayColor?: string;
  highlightColor?: string;
  tooltipWidth?: number;
  showHighlight?: boolean;
  draggable?: boolean;
  highlightStyle?: GuideHighlightStyle;
  highlightAnimation?: GuideHighlightAnimation;
  tooltipTemplate?: GuideTooltipTemplate;
  i18n?: GuideI18n;
  pills?: GuidePills;
  actions?: GuideActions;
  theme?: GuideTheme;
}

export interface BuilderStep {
  id: string;
  target: string;
  title: string;
  kind: GuideKind;
  description: string;
  tooltipPlacement?: GuideTooltipPlacement;
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
  tooltipTemplate?: GuideTooltipTemplate;
  i18n?: GuideI18n;
  pills?: GuidePills;
  actions?: GuideActions;
  theme?: GuideTheme;
}

export interface BuilderGuide {
  meta: BuilderMeta;
  steps: BuilderStep[];
}

export interface BuilderProject {
  id: string;
  name: string;
  format: ProjectFormat;
  updatedAt: string;
  guide: BuilderGuide;
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

export const TOOLTIP_PLACEMENTS: GuideTooltipPlacement[] = [
  "top",
  "bottom",
  "right",
  "left",
  "auto",
];

export const TOOLTIP_TEMPLATES: GuideTooltipTemplate[] = [
  "default",
  "glass",
  "minimal",
  "contrast",
  "dashboard-orange",
  "clean-white",
  "commerce-dark",
  "terminal-pop",
  "outline-light",
];

export const PRIMARY_ACTIONS: GuidePrimaryAction[] = ["back", "next", "skip"];

export const PILL_TEXT_TRANSFORMS: GuideTextTransform[] = [
  "none",
  "uppercase",
  "lowercase",
  "capitalize",
];
