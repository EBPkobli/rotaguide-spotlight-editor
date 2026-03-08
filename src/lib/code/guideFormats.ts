import { z } from "zod";
import YAML from "yaml";
import { parseBuilderGuideFromMarkdown } from "../md/adapter";
import { serializeGuideToMarkdown } from "../md/serializeGuide";
import { builderGuideSchema } from "../schema/guideSchema";
import type { BuilderGuide } from "../../types/builder";

export type CodeFormat = "markdown" | "json" | "yaml";

export const CODE_FORMAT_LABELS: Record<CodeFormat, string> = {
  markdown: "Markdown",
  json: "JSON",
  yaml: "YAML",
};

function formatZodIssues(error: z.ZodError): string[] {
  return error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "root";
    return `${path}: ${issue.message}`;
  });
}

function formatMarkdownIssues(issues: unknown[]): string[] {
  return issues.map((issue, index) => {
    if (!issue || typeof issue !== "object") {
      return `Markdown parse issue #${index + 1}`;
    }

    const withCode = issue as { code?: string; message?: string; line?: number; path?: string };
    const line = typeof withCode.line === "number" ? `line ${withCode.line}` : "line ?";
    const message = withCode.message ?? "Invalid guide markdown";
    const code = withCode.code ?? "PARSE_ISSUE";
    const path = withCode.path ? ` (${withCode.path})` : "";
    return `[${code}] ${line}: ${message}${path}`;
  });
}

function validateGuide(candidate: unknown): { guide: BuilderGuide | null; issues: string[] } {
  const validated = builderGuideSchema.safeParse(candidate);
  if (!validated.success) {
    return {
      guide: null,
      issues: formatZodIssues(validated.error),
    };
  }

  return {
    guide: validated.data,
    issues: [],
  };
}

/**
 * Transform comma-separated step.target into proper target + targets fields
 * for library-compatible output (JSON / YAML).
 */
function prepareGuideForExport(guide: BuilderGuide): Record<string, unknown> {
  return {
    ...guide,
    steps: guide.steps.map((step) => {
      const all = step.target
        ? step.target.split(",").map((t) => t.trim()).filter(Boolean)
        : [];
      const { target: _raw, ...rest } = step;
      return {
        ...rest,
        target: all[0] || _raw,
        ...(all.length > 1 ? { targets: all } : {}),
      };
    }),
  };
}

export function serializeGuideToFormat(guide: BuilderGuide, format: CodeFormat): string {
  if (format === "markdown") {
    return serializeGuideToMarkdown(guide);
  }
  const exported = prepareGuideForExport(guide);
  if (format === "json") {
    return `${JSON.stringify(exported, null, 2)}\n`;
  }
  return YAML.stringify(exported);
}

export function parseGuideFromFormat(
  raw: string,
  format: CodeFormat
): { guide: BuilderGuide | null; issues: string[] } {
  if (!raw.trim()) {
    return { guide: null, issues: ["Editor is empty."] };
  }

  if (format === "markdown") {
    const parsed = parseBuilderGuideFromMarkdown(raw);
    if (!parsed.guide) {
      return {
        guide: null,
        issues: formatMarkdownIssues(parsed.issues),
      };
    }
    return validateGuide(parsed.guide);
  }

  if (format === "json") {
    try {
      const candidate = JSON.parse(raw) as unknown;
      return validateGuide(candidate);
    } catch (error) {
      return {
        guide: null,
        issues: [error instanceof Error ? error.message : "Invalid JSON syntax."],
      };
    }
  }

  try {
    const candidate = YAML.parse(raw);
    return validateGuide(candidate);
  } catch (error) {
    return {
      guide: null,
      issues: [error instanceof Error ? error.message : "Invalid YAML syntax."],
    };
  }
}
