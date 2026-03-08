import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createDefaultGuide, createDefaultStep } from "../lib/md/defaults";
import type {
  BuilderGuide,
  BuilderMeta,
  BuilderProject,
  BuilderStep,
  ProjectFormat,
} from "../types/builder";

const DEFAULT_PROJECT_NAME = "New Guide Project";

function createProjectId(): string {
  return `project-${Math.random().toString(36).slice(2, 10)}`;
}

function cloneGuide(guide: BuilderGuide): BuilderGuide {
  return structuredClone(guide);
}

interface BuilderStoreState {
  guide: BuilderGuide;
  selectedStepId: string | null;
  projectName: string;
  projectFormat: ProjectFormat;
  activeProjectId: string | null;
  projects: BuilderProject[];
  setProjectName: (value: string) => void;
  setProjectFormat: (format: ProjectFormat) => void;
  createNewProject: (name: string, format: ProjectFormat) => void;
  saveProject: () => void;
  loadProject: (projectId: string) => void;
  deleteProject: (projectId: string) => void;
  importProject: (payload: { name: string; guide: BuilderGuide; format?: ProjectFormat }) => void;
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
    (set, get) => ({
      guide: cloneGuide(defaultGuide),
      selectedStepId: defaultGuide.steps[0]?.id ?? null,
      projectName: DEFAULT_PROJECT_NAME,
      projectFormat: "json" as ProjectFormat,
      activeProjectId: null,
      projects: [],

      setProjectName: (value) => set({ projectName: value }),
      setProjectFormat: (format) => set({ projectFormat: format }),

      createNewProject: (name, format) => {
        const guide = createDefaultGuide();
        const projectId = createProjectId();
        const normalizedName = name.trim() || DEFAULT_PROJECT_NAME;
        const snapshot: BuilderProject = {
          id: projectId,
          name: normalizedName,
          format,
          updatedAt: new Date().toISOString(),
          guide: cloneGuide(guide),
        };
        set((state) => ({
          projects: [snapshot, ...state.projects],
          activeProjectId: projectId,
          projectName: normalizedName,
          projectFormat: format,
          guide: cloneGuide(guide),
          selectedStepId: guide.steps[0]?.id ?? null,
        }));
      },

      saveProject: () => {
        const state = get();
        const normalizedName = state.projectName.trim() || DEFAULT_PROJECT_NAME;
        const projectId = state.activeProjectId ?? createProjectId();
        const snapshot: BuilderProject = {
          id: projectId,
          name: normalizedName,
          format: state.projectFormat,
          updatedAt: new Date().toISOString(),
          guide: cloneGuide(state.guide),
        };

        set((current) => ({
          projects: [snapshot, ...current.projects.filter((project) => project.id !== projectId)],
          activeProjectId: projectId,
          projectName: normalizedName,
        }));
      },

      loadProject: (projectId) =>
        set((state) => {
          const selected = state.projects.find((project) => project.id === projectId);
          if (!selected) return state;
          return {
            guide: cloneGuide(selected.guide),
            selectedStepId: selected.guide.steps[0]?.id ?? null,
            activeProjectId: selected.id,
            projectName: selected.name,
            projectFormat: selected.format ?? "json",
          };
        }),

      deleteProject: (projectId) =>
        set((state) => {
          const projects = state.projects.filter((project) => project.id !== projectId);
          if (state.activeProjectId !== projectId) {
            return { projects };
          }
          return {
            projects,
            activeProjectId: null,
            projectName: `${state.projectName} (Draft)`,
          };
        }),

      importProject: (payload) => {
        const normalizedName = payload.name.trim() || DEFAULT_PROJECT_NAME;
        const projectId = createProjectId();
        const importedGuide = cloneGuide(payload.guide);
        const format = payload.format ?? "json";
        const snapshot: BuilderProject = {
          id: projectId,
          name: normalizedName,
          format,
          updatedAt: new Date().toISOString(),
          guide: importedGuide,
        };

        set((state) => ({
          projects: [snapshot, ...state.projects.filter((project) => project.id !== projectId)],
          activeProjectId: projectId,
          projectName: normalizedName,
          projectFormat: format,
          guide: importedGuide,
          selectedStepId: importedGuide.steps[0]?.id ?? null,
        }));
      },

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
        set((state) => {
          let selectedStepId = state.selectedStepId;
          const steps = state.guide.steps.map((step) => {
            if (step.id !== stepId) return step;
            const next = { ...step, ...patch };
            if (selectedStepId === stepId && patch.id && patch.id !== stepId) {
              selectedStepId = patch.id;
            }
            return next;
          });
          return {
            guide: { ...state.guide, steps },
            selectedStepId,
          };
        }),

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
          guide: cloneGuide(guide),
          selectedStepId: guide.steps[0]?.id ?? null,
        }),

      resetGuide: () => {
        const guide = createDefaultGuide();
        set({
          guide,
          selectedStepId: guide.steps[0]?.id ?? null,
          activeProjectId: null,
          projectName: DEFAULT_PROJECT_NAME,
          projectFormat: "json",
        });
      },
    }),
    {
      name: "rotaguide-spotlight-editor-draft-v2",
    }
  )
);

export function useSelectedStep(): BuilderStep | null {
  return useBuilderStore((state) => {
    if (!state.selectedStepId) return null;
    return state.guide.steps.find((step) => step.id === state.selectedStepId) ?? null;
  });
}
