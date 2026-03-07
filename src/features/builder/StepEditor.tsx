import { Card } from "../../components/ui/Card";
import { useBuilderStore, useSelectedStep } from "../../state/useBuilderStore";
import {
  ADVANCE_MODES,
  HIGHLIGHT_ANIMATIONS,
  HIGHLIGHT_STYLES,
  STEP_KINDS,
} from "../../types/builder";

export function StepEditor() {
  const step = useSelectedStep();
  const updateStep = useBuilderStore((state) => state.updateStep);

  if (!step) {
    return (
      <Card title="Step Editor" subtitle="Select a step from Step Flow">
        <p className="muted">No step selected.</p>
      </Card>
    );
  }

  const set = (patch: Partial<typeof step>) => updateStep(step.id, patch);

  return (
    <Card title="Step Editor" subtitle={`Editing: ${step.id}`}>
      <div className="form-grid">
        <label>
          <span>Step ID</span>
          <input value={step.id} onChange={(event) => set({ id: event.target.value })} />
        </label>

        <label>
          <span>Target</span>
          <input
            value={step.target}
            onChange={(event) => set({ target: event.target.value })}
            placeholder='open-create or #save-button'
          />
        </label>

        <label>
          <span>Title</span>
          <input value={step.title} onChange={(event) => set({ title: event.target.value })} />
        </label>

        <label>
          <span>Kind</span>
          <select
            value={step.kind}
            onChange={(event) => set({ kind: event.target.value as (typeof STEP_KINDS)[number] })}
          >
            {STEP_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {kind}
              </option>
            ))}
          </select>
        </label>

        <label className="field-full">
          <span>Description</span>
          <textarea
            rows={3}
            value={step.description}
            onChange={(event) => set({ description: event.target.value })}
          />
        </label>

        <label>
          <span>Advance Mode</span>
          <select
            value={step.advanceOn ?? "auto"}
            onChange={(event) =>
              set({ advanceOn: event.target.value as (typeof ADVANCE_MODES)[number] })
            }
          >
            {ADVANCE_MODES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Input Idle (ms)</span>
          <input
            type="number"
            min={0}
            value={step.inputIdleMs ?? ""}
            onChange={(event) =>
              set({ inputIdleMs: event.target.value ? Number(event.target.value) : undefined })
            }
          />
        </label>

        <label>
          <span>Auto Advance (ms)</span>
          <input
            type="number"
            min={0}
            value={step.autoAdvanceMs ?? ""}
            onChange={(event) =>
              set({ autoAdvanceMs: event.target.value ? Number(event.target.value) : undefined })
            }
          />
        </label>

        <label>
          <span>Highlight Color</span>
          <input
            value={step.highlightColor ?? ""}
            onChange={(event) => set({ highlightColor: event.target.value || undefined })}
            placeholder="rgb(255,199,0)"
          />
        </label>

        <label>
          <span>Highlight Style</span>
          <select
            value={step.highlightStyle ?? "line"}
            onChange={(event) =>
              set({ highlightStyle: event.target.value as (typeof HIGHLIGHT_STYLES)[number] })
            }
          >
            {HIGHLIGHT_STYLES.map((style) => (
              <option key={style} value={style}>
                {style}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Highlight Animation</span>
          <select
            value={step.highlightAnimation ?? "none"}
            onChange={(event) =>
              set({
                highlightAnimation: event.target.value as (typeof HIGHLIGHT_ANIMATIONS)[number],
              })
            }
          >
            {HIGHLIGHT_ANIMATIONS.map((anim) => (
              <option key={anim} value={anim}>
                {anim}
              </option>
            ))}
          </select>
        </label>

        <label className="check-field">
          <input
            type="checkbox"
            checked={step.skippable ?? true}
            onChange={(event) => set({ skippable: event.target.checked })}
          />
          <span>Skippable</span>
        </label>

        <label className="check-field">
          <input
            type="checkbox"
            checked={step.mustClickTarget ?? false}
            onChange={(event) => set({ mustClickTarget: event.target.checked })}
          />
          <span>Must Click Target</span>
        </label>

        <label className="check-field">
          <input
            type="checkbox"
            checked={step.mustEnterValue ?? false}
            onChange={(event) => set({ mustEnterValue: event.target.checked })}
          />
          <span>Must Enter Value</span>
        </label>

        <label className="check-field">
          <input
            type="checkbox"
            checked={step.showHighlight ?? true}
            onChange={(event) => set({ showHighlight: event.target.checked })}
          />
          <span>Show Highlight</span>
        </label>

        <label className="check-field">
          <input
            type="checkbox"
            checked={step.draggable ?? true}
            onChange={(event) => set({ draggable: event.target.checked })}
          />
          <span>Tooltip Draggable</span>
        </label>

        <label className="check-field">
          <input
            type="checkbox"
            checked={step.showAutoAdvanceProgress ?? true}
            onChange={(event) => set({ showAutoAdvanceProgress: event.target.checked })}
          />
          <span>Show Timer Progress</span>
        </label>
      </div>
    </Card>
  );
}
