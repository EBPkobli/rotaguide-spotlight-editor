import { useState } from "react";
import { Card } from "../../components/ui/Card";

function normalizeTarget(input: string): string {
  const value = input.trim();
  if (!value) return "";
  if (/^[.#[]/.test(value) || /[ >:+~]/.test(value)) {
    return value;
  }
  return `[data-click-guide="${value.replace(/"/g, '\\"')}"]`;
}

export function SelectorPanel() {
  const [value, setValue] = useState("");

  return (
    <Card title="Target Helper" subtitle="Quickly generate selectors">
      <div className="selector-helper">
        <label>
          <span>Raw target value</span>
          <input
            value={value}
            onChange={(event) => setValue(event.target.value)}
            placeholder='open-create or #save-button'
          />
        </label>

        <label>
          <span>Resolved selector</span>
          <input value={normalizeTarget(value)} readOnly />
        </label>

        <p className="muted">
          Next step: add a real "Record Mode" to click elements on page and auto-fill target.
        </p>
      </div>
    </Card>
  );
}
