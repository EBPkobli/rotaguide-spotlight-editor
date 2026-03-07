import { useEffect, useMemo, useState } from "react";
import Editor from "@monaco-editor/react";
import {
  MarkdownGuideButton,
  formatGuideIssues,
  guideTarget,
  parseGuideMarkdownSafe,
  type GuideIssue,
} from "md-spotlight-guide-tool";
import { Card } from "../../components/ui/Card";
import { copyTextToClipboard, downloadTextFile } from "../../services/export";

interface PreviewPanelProps {
  markdown: string;
  onImportMarkdown: (markdown: string) => void;
}

function looksLikeSelector(target: string): boolean {
  if (!target) return false;
  return /^[.#\[]/.test(target) || /[ >:+~]/.test(target);
}

export function PreviewPanel({ markdown, onImportMarkdown }: PreviewPanelProps) {
  const [editorValue, setEditorValue] = useState(markdown);
  const [copyState, setCopyState] = useState<"idle" | "done" | "fail">("idle");

  useEffect(() => {
    setEditorValue(markdown);
  }, [markdown]);

  const editorParse = useMemo(() => parseGuideMarkdownSafe(editorValue), [editorValue]);
  const parseIssues = editorParse.issues;
  const dynamicTargets = useMemo(() => {
    if (!editorParse.guide) return [];
    return editorParse.guide.steps
      .map((step) => step.target)
      .filter((target) => !looksLikeSelector(target));
  }, [editorParse.guide]);

  const handleCopy = async () => {
    const ok = await copyTextToClipboard(editorValue);
    setCopyState(ok ? "done" : "fail");
    window.setTimeout(() => setCopyState("idle"), 1200);
  };

  const issueText = parseIssues.length > 0 ? formatGuideIssues(parseIssues as GuideIssue[]) : null;

  return (
    <>
      <Card
        title="Live Preview"
        subtitle="Runs the guide using generated markdown"
        actions={
          <div className="inline-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={!editorParse.guide}
              onClick={() => onImportMarkdown(editorValue)}
            >
              Load From Editor
            </button>
            <button type="button" className="btn btn-ghost" onClick={handleCopy}>
              {copyState === "done" ? "Copied" : copyState === "fail" ? "Copy failed" : "Copy"}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => downloadTextFile("generated.guide.md", editorValue)}
            >
              Download
            </button>
          </div>
        }
      >
        <div className="preview-canvas">
          <header className="preview-canvas__top" {...guideTarget("guide-start-panel")}>
            <div>
              <strong>Preview Sandbox</strong>
              <p>Targets below are interactive so you can test the generated guide instantly.</p>
            </div>
            <MarkdownGuideButton markdown={editorValue} label="Run Guide" />
          </header>

          <div className="preview-controls">
            <button type="button" className="btn btn-primary" {...guideTarget("open-create")}>Open Booking</button>
            <input {...guideTarget("customer-name")} placeholder="Customer name" />
            <select {...guideTarget("plan-select")} defaultValue="">
              <option value="">Choose a plan</option>
              <option value="starter">Starter</option>
              <option value="pro">Pro</option>
            </select>
            <label className="check-field inline">
              <input type="checkbox" {...guideTarget("notify-toggle")} />
              <span>Notify by email</span>
            </label>
            <button id="save-booking-btn" type="button" className="btn" {...guideTarget("save-booking")}>
              Save Booking
            </button>
          </div>

          {dynamicTargets.length > 0 && (
            <div className="dynamic-targets">
              <span>Dynamic shorthand targets from your steps:</span>
              <div>
                {dynamicTargets.map((target) => (
                  <button key={target} type="button" className="chip" {...guideTarget(target)}>
                    {target}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      <Card title="Generated Markdown" subtitle="Edit raw markdown, then import back to form">
        <div className="editor-wrap">
          <Editor
            height="360px"
            defaultLanguage="markdown"
            value={editorValue}
            onChange={(value) => setEditorValue(value ?? "")}
            options={{
              minimap: { enabled: false },
              wordWrap: "on",
              fontSize: 13,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
            }}
          />
        </div>

        {issueText ? (
          <pre className="issues-box">{issueText}</pre>
        ) : (
          <p className="success-note">No parser issues. Markdown is ready to export.</p>
        )}
      </Card>
    </>
  );
}
