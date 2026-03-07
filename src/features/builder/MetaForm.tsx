import { Card } from "../../components/ui/Card";
import { HIGHLIGHT_ANIMATIONS, HIGHLIGHT_STYLES } from "../../types/builder";
import { useBuilderStore } from "../../state/useBuilderStore";

export function MetaForm() {
  const meta = useBuilderStore((state) => state.guide.meta);
  const setMeta = useBuilderStore((state) => state.setMeta);

  return (
    <Card title="Guide Meta" subtitle="Global defaults for all steps">
      <div className="form-grid">
        <label>
          <span>Guide ID</span>
          <input value={meta.id} onChange={(event) => setMeta({ id: event.target.value })} />
        </label>

        <label>
          <span>Title</span>
          <input
            value={meta.title}
            onChange={(event) => setMeta({ title: event.target.value })}
            placeholder="Create Booking Walkthrough"
          />
        </label>

        <label>
          <span>Button Label</span>
          <input
            value={meta.buttonLabel ?? ""}
            onChange={(event) => setMeta({ buttonLabel: event.target.value || undefined })}
          />
        </label>

        <label>
          <span>Tooltip Finish Title</span>
          <input
            value={meta.tooltipTitle ?? ""}
            onChange={(event) => setMeta({ tooltipTitle: event.target.value || undefined })}
          />
        </label>

        <label>
          <span>Overlay Color</span>
          <input
            value={meta.overlayColor ?? ""}
            onChange={(event) => setMeta({ overlayColor: event.target.value || undefined })}
            placeholder="rgba(0,43,69,0.22)"
          />
        </label>

        <label>
          <span>Highlight Color</span>
          <input
            value={meta.highlightColor ?? ""}
            onChange={(event) => setMeta({ highlightColor: event.target.value || undefined })}
            placeholder="rgb(255,199,0)"
          />
        </label>

        <label>
          <span>Highlight Style</span>
          <select
            value={meta.highlightStyle ?? "line"}
            onChange={(event) =>
              setMeta({ highlightStyle: event.target.value as (typeof HIGHLIGHT_STYLES)[number] })
            }
          >
            {HIGHLIGHT_STYLES.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Highlight Animation</span>
          <select
            value={meta.highlightAnimation ?? "none"}
            onChange={(event) =>
              setMeta({
                highlightAnimation: event.target.value as (typeof HIGHLIGHT_ANIMATIONS)[number],
              })
            }
          >
            {HIGHLIGHT_ANIMATIONS.map((mode) => (
              <option key={mode} value={mode}>
                {mode}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Tooltip Width</span>
          <input
            type="number"
            min={220}
            value={meta.tooltipWidth ?? 400}
            onChange={(event) =>
              setMeta({
                tooltipWidth: Number.isFinite(Number(event.target.value))
                  ? Number(event.target.value)
                  : undefined,
              })
            }
          />
        </label>

        <label className="check-field">
          <input
            type="checkbox"
            checked={meta.showHighlight ?? true}
            onChange={(event) => setMeta({ showHighlight: event.target.checked })}
          />
          <span>Show Highlight (default)</span>
        </label>

        <label className="check-field">
          <input
            type="checkbox"
            checked={meta.draggable ?? true}
            onChange={(event) => setMeta({ draggable: event.target.checked })}
          />
          <span>Tooltip Draggable (default)</span>
        </label>
      </div>
    </Card>
  );
}
