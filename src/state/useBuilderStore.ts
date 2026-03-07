import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createDefaultGuide, createDefaultStep } from "../lib/md/defaults";
import type { BuilderGuide, BuilderMeta, BuilderStep } from "../types/builder";

interface BuilderStoreState {
  guide: BuilderGuide;
  selectedStepId: string | null;
  setMeta: (patch: Partial<BuilderMeta>) => void;
  addStep: () => void;
  duplicateStep: (stepId: string) => void;
  updateStep: (stepId: string, patch: Partial<BuilderStep>) => void;
  removeStep: (stepId: string) => void;
  moveStep: (stepId: string, direction: -1 | 1) => void;
  selectStep: (stepId: string) => void;
  importGuide: (guide: BuilderGuide) => void;
  resetGuide: () => void;
}

const defaultGuide = createDefaultGuide();

export const useBuilderStore = create<BuilderStoreState>()(
  persist(
    (set) => ({
      guide: defaultGuide,
      selectedStepId: defaultGuide.steps[0]?.id ?? null,

      setMeta: (patch) =>
        set((state) => ({
          guide: { ...state.guide, meta: { ...state.guide.meta, ...patch } },
        })),

      addStep: () =>
        set((state) => {
          const next = createDefaultStep(state.guide.steps.length + 1);
          return {
            guide: { ...state.guide, steps: [...state.guide.steps, next] },
            selectedStepId: next.id,
          };
        }),

      duplicateStep: (stepId) =>
        set((state) => {
          const index = state.guide.steps.findIndex((step) => step.id === stepId);
          if (index < 0) return state;
          const source = state.guide.steps[index];
          const copy: BuilderStep = {
            ...source,
            id: `${source.id}-copy-${Math.random().toString(36).slice(2, 5)}`,
            title: `${source.title} (Copy)`,
          };
          const steps = [...state.guide.steps];
          steps.splice(index + 1, 0, copy);
          return {
            guide: { ...state.guide, steps },
            selectedStepId: copy.id,
          };
        }),

      updateStep: (stepId, patch) =>
        set((state) => ({
          guide: {
            ...state.guide,
            steps: state.guide.steps.map((step) =>
              step.id === stepId ? { ...step, ...patch } : step
            ),
          },
        })),

      removeStep: (stepId) =>
        set((state) => {
          const steps = state.guide.steps.filter((step) => step.id !== stepId);
          if (steps.length === 0) {
            const next = createDefaultStep(1);
            return {
              guide: { ...state.guide, steps: [next] },
              selectedStepId: next.id,
            };
          }

          const selectedStepId =
            state.selectedStepId === stepId ? steps[Math.max(0, steps.length - 1)].id : state.selectedStepId;

          return {
            guide: { ...state.guide, steps },
            selectedStepId,
          };
        }),

      moveStep: (stepId, direction) =>
        set((state) => {
          const index = state.guide.steps.findIndex((step) => step.id === stepId);
          if (index < 0) return state;

          const nextIndex = index + direction;
          if (nextIndex < 0 || nextIndex >= state.guide.steps.length) return state;

          const steps = [...state.guide.steps];
          const [moved] = steps.splice(index, 1);
          steps.splice(nextIndex, 0, moved);

          return { guide: { ...state.guide, steps } };
        }),

      selectStep: (stepId) => set({ selectedStepId: stepId }),

      importGuide: (guide) =>
        set({
          guide,
          selectedStepId: guide.steps[0]?.id ?? null,
        }),

      resetGuide: () => {
        const guide = createDefaultGuide();
        set({
          guide,
          selectedStepId: guide.steps[0]?.id ?? null,
        });
      },
    }),
    {
      name: "rotaguide-spotlight-editor-draft-v1",
    }
  )
);

export function useSelectedStep(): BuilderStep | null {
  return useBuilderStore((state) => {
    if (!state.selectedStepId) return null;
    return state.guide.steps.find((step) => step.id === state.selectedStepId) ?? null;
  });
}
