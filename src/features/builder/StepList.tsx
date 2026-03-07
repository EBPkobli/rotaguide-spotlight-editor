import { Card } from "../../components/ui/Card";
import { useBuilderStore } from "../../state/useBuilderStore";

export function StepList() {
  const steps = useBuilderStore((state) => state.guide.steps);
  const selectedStepId = useBuilderStore((state) => state.selectedStepId);
  const selectStep = useBuilderStore((state) => state.selectStep);
  const addStep = useBuilderStore((state) => state.addStep);
  const duplicateStep = useBuilderStore((state) => state.duplicateStep);
  const moveStep = useBuilderStore((state) => state.moveStep);
  const removeStep = useBuilderStore((state) => state.removeStep);

  return (
    <Card
      title="Step Flow"
      subtitle="Add, reorder and manage steps"
      actions={
        <button type="button" className="btn btn-primary" onClick={addStep}>
          + Step
        </button>
      }
    >
      <div className="step-list">
        {steps.map((step, index) => {
          const active = selectedStepId === step.id;
          return (
            <article key={step.id} className={`step-item ${active ? "is-active" : ""}`.trim()}>
              <button
                type="button"
                className="step-item__main"
                onClick={() => selectStep(step.id)}
                title={`Open ${step.title}`}
              >
                <span className="step-item__index">{index + 1}</span>
                <span className="step-item__content">
                  <strong>{step.title || `Step ${index + 1}`}</strong>
                  <small>{step.target || "No target yet"}</small>
                </span>
              </button>
              <div className="step-item__actions">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => moveStep(step.id, -1)}
                  disabled={index === 0}
                >
                  ↑
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => moveStep(step.id, 1)}
                  disabled={index === steps.length - 1}
                >
                  ↓
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => duplicateStep(step.id)}
                >
                  Copy
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => removeStep(step.id)}
                >
                  Del
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </Card>
  );
}
