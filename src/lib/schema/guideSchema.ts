import { z } from "zod";
import { ADVANCE_MODES, HIGHLIGHT_ANIMATIONS, HIGHLIGHT_STYLES, STEP_KINDS, TOOLTIP_PLACEMENTS, TOOLTIP_TEMPLATES } from "../../types/builder";

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
  theme: z.record(z.string(), z.unknown()).optional(),
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
  theme: z.record(z.string(), z.unknown()).optional(),
});

export const builderGuideSchema = z.object({
  meta: metaSchema,
  steps: z.array(stepSchema).min(1, "At least one step is required"),
});
