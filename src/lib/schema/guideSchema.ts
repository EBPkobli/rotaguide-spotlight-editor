import { z } from "zod";
import {
  ADVANCE_MODES,
  HIGHLIGHT_ANIMATIONS,
  HIGHLIGHT_STYLES,
  PILL_TEXT_TRANSFORMS,
  PRIMARY_ACTIONS,
  STEP_KINDS,
  TOOLTIP_PLACEMENTS,
  TOOLTIP_TEMPLATES,
} from "../../types/builder";

const pillsSchema = z.object({
  showStepProgress: z.boolean().optional(),
  showKind: z.boolean().optional(),
}).optional();

const actionsSchema = z.object({
  showClose: z.boolean().optional(),
  showBack: z.boolean().optional(),
  showNext: z.boolean().optional(),
  showSkip: z.boolean().optional(),
  primaryAction: z.enum(PRIMARY_ACTIONS).optional(),
}).optional();

const themeSchema = z.object({
  tooltipTemplate: z.enum(TOOLTIP_TEMPLATES).optional(),
  fontFamily: z.string().optional(),
  tooltipBackgroundColor: z.string().optional(),
  tooltipTextColor: z.string().optional(),
  tooltipBorderColor: z.string().optional(),
  tooltipBorderRadius: z.number().min(0).optional(),
  tooltipShadow: z.string().optional(),
  titleColor: z.string().optional(),
  descriptionColor: z.string().optional(),
  hintColor: z.string().optional(),
  warningColor: z.string().optional(),
  stepPillBackgroundColor: z.string().optional(),
  stepPillTextColor: z.string().optional(),
  kindPillBackgroundColor: z.string().optional(),
  kindPillTextColor: z.string().optional(),
  pillFontSize: z.number().min(0).optional(),
  pillFontWeight: z.number().positive().optional(),
  pillLetterSpacing: z.string().optional(),
  pillTextTransform: z.enum(PILL_TEXT_TRANSFORMS).optional(),
  primaryButtonBackgroundColor: z.string().optional(),
  primaryButtonTextColor: z.string().optional(),
  primaryButtonBorderColor: z.string().optional(),
  primaryButtonHoverBackgroundColor: z.string().optional(),
  primaryButtonHoverBorderColor: z.string().optional(),
  ghostButtonBackgroundColor: z.string().optional(),
  ghostButtonTextColor: z.string().optional(),
  ghostButtonBorderColor: z.string().optional(),
  timerTrackColor: z.string().optional(),
  timerFillColor: z.string().optional(),
}).partial().optional();

const metaSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1, "meta.title is required"),
  buttonLabel: z.string().optional(),
  tooltipTitle: z.string().optional(),
  tooltipPlacement: z.enum(TOOLTIP_PLACEMENTS).optional(),
  overlayColor: z.string().optional(),
  highlightColor: z.string().optional(),
  tooltipWidth: z.number().int().positive().optional(),
  showHighlight: z.boolean().optional(),
  draggable: z.boolean().optional(),
  highlightStyle: z.enum(HIGHLIGHT_STYLES).optional(),
  highlightAnimation: z.enum(HIGHLIGHT_ANIMATIONS).optional(),
  tooltipTemplate: z.enum(TOOLTIP_TEMPLATES).optional(),
  i18n: z.record(z.string(), z.string()).optional(),
  pills: pillsSchema,
  actions: actionsSchema,
  theme: themeSchema,
});

const stepSchema = z.object({
  id: z.string().min(1, "step.id is required"),
  target: z.string().min(1, "step.target is required"),
  title: z.string().min(1, "step.title is required"),
  kind: z.enum(STEP_KINDS),
  description: z.string().min(1, "step.description is required"),
  tooltipPlacement: z.enum(TOOLTIP_PLACEMENTS).optional(),
  skippable: z.boolean().optional(),
  allowSkip: z.boolean().optional(),
  advanceOn: z.enum(ADVANCE_MODES).optional(),
  inputIdleMs: z.number().min(0).optional(),
  showHighlight: z.boolean().optional(),
  highlightColor: z.string().optional(),
  highlightStyle: z.enum(HIGHLIGHT_STYLES).optional(),
  highlightAnimation: z.enum(HIGHLIGHT_ANIMATIONS).optional(),
  draggable: z.boolean().optional(),
  autoAdvanceMs: z.number().min(0).optional(),
  showAutoAdvanceProgress: z.boolean().optional(),
  mustClickTarget: z.boolean().optional(),
  mustEnterValue: z.boolean().optional(),
  tooltipTemplate: z.enum(TOOLTIP_TEMPLATES).optional(),
  i18n: z.record(z.string(), z.string()).optional(),
  pills: pillsSchema,
  actions: actionsSchema,
  theme: themeSchema,
});

export const builderGuideSchema = z.object({
  meta: metaSchema,
  steps: z.array(stepSchema).min(1, "At least one step is required"),
});
