import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ConfirmDialog } from "../components/ui/ConfirmDialog";
import { Icon } from "../components/ui/Icon";
import { serializeGuideToFormat, type CodeFormat } from "../lib/code/guideFormats";
import { downloadTextFile } from "../services/export";
import { useBuilderStore } from "../state/useBuilderStore";
import type { BuilderProject, ProjectFormat } from "../types/builder";

const FORMAT_OPTIONS: { value: ProjectFormat; label: string; icon: string; description: string }[] = [
  {
    value: "json",
    label: "JSON",
    icon: "data_object",
    description: "Standard JSON format. Best for programmatic use and API integration.",
  },
  {
    value: "markdown",
    label: "Markdown",
    icon: "description",
    description: "Human-readable .guide.md format. Great for documentation workflows.",
  },
  {
    value: "yaml",
    label: "YAML",
    icon: "code",
    description: "Clean YAML syntax. Ideal for config files and CI/CD pipelines.",
  },
];

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Unknown";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function ProjectsPage() {
  const navigate = useNavigate();
  const projects = useBuilderStore((s) => s.projects);
  const loadProject = useBuilderStore((s) => s.loadProject);
  const deleteProject = useBuilderStore((s) => s.deleteProject);
  const createNewProject = useBuilderStore((s) => s.createNewProject);
  const importProject = useBuilderStore((s) => s.importProject);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  const [showNewModal, setShowNewModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newFormat, setNewFormat] = useState<ProjectFormat>("json");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [exportMenuId, setExportMenuId] = useState<string | null>(null);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const filteredProjects = projects;

  const handleExportProject = (project: BuilderProject, format: CodeFormat) => {
    const content = serializeGuideToFormat(project.guide, format);
    const ext = format === "markdown" ? "guide.md" : format === "yaml" ? "yaml" : "json";
    const filename = `${project.name || "guide"}.${ext}`;
    const mime = format === "json" ? "application/json" : format === "yaml" ? "text/yaml" : "text/markdown";
    downloadTextFile(filename, content, mime);
    setExportMenuId(null);
  };

  // Close export menu on outside click
  useEffect(() => {
    if (!exportMenuId) return;
    const handler = (e: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(e.target as Node)) {
        setExportMenuId(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [exportMenuId]);

  const handleCreate = () => {
    const name = newName.trim() || "New Guide Project";
    createNewProject(name, newFormat);
    setShowNewModal(false);
    setNewName("");
    setNewFormat("json");
    navigate("/editor");
  };

  const handleOpenProject = (projectId: string) => {
    loadProject(projectId);
    navigate("/editor");
  };

  const handleImportFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const text = await file.text();
    try {
      const parsed = JSON.parse(text);
      if (parsed.guide) {
        importProject({
          name: parsed.name || file.name.replace(/\.[^.]+$/, ""),
          guide: parsed.guide,
          format: "json",
        });
      } else {
        importProject({
          name: file.name.replace(/\.[^.]+$/, ""),
          guide: parsed,
          format: "json",
        });
      }
      navigate("/editor");
    } catch {
      importProject({
        name: file.name.replace(/\.[^.]+$/, ""),
        guide: { meta: { id: "imported", title: "Imported Guide" }, steps: [] },
        format: "markdown",
      });
      navigate("/editor");
    }
  };

  return (
    <div className="flex-1 overflow-y-auto custom-scrollbar">
      <div className="max-w-5xl mx-auto px-8 py-12">
        {/* Page Header */}
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="size-12 bg-[#ec5b13]/20 rounded-xl flex items-center justify-center">
              <Icon name="deployed_code" className="text-2xl text-[#ec5b13]" />
            </div>
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-white">
                Project Explorer
              </h1>
              <p className="text-slate-400 text-sm mt-0.5">
                Create, manage, and open your spotlight guide projects.
              </p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={() => setShowNewModal(true)}
            className="flex items-center gap-2 bg-[#ec5b13] text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-[#ec5b13]/20"
          >
            <Icon name="add_circle" className="text-lg" />
            New Project
          </button>
          <button
            onClick={() => importInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border border-[#3c3c3c] text-slate-300 hover:bg-white/5 transition-colors"
          >
            <Icon name="upload_file" className="text-lg" />
            Import File
          </button>
          <input
            ref={importInputRef}
            type="file"
            className="hidden"
            accept=".json,.md,.yaml,.yml,.txt"
            onChange={handleImportFile}
          />

          <div className="flex-1" />
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="size-20 bg-[#ec5b13]/10 rounded-2xl flex items-center justify-center">
              <Icon name="folder_off" className="text-4xl text-[#ec5b13]/50" />
            </div>
            <p className="text-slate-400 text-sm">
              No projects yet. Create your first one!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project) => (
              <article
                key={project.id}
                className="group relative bg-[#2d2d2d]/60 border border-[#3c3c3c] rounded-2xl p-5 hover:border-[#ec5b13]/40 hover:bg-[#2d2d2d] transition-all cursor-pointer"
                onClick={() => handleOpenProject(project.id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="size-8 bg-[#ec5b13]/15 rounded-lg flex items-center justify-center">
                      <Icon
                        name={project.format === "json" ? "data_object" : project.format === "yaml" ? "code" : "description"}
                        className="text-sm text-[#ec5b13]"
                      />
                    </div>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#ec5b13]/15 text-[#ec5b13] font-bold uppercase">
                      {project.format || "json"}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    <div className="relative">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setExportMenuId(exportMenuId === project.id ? null : project.id);
                        }}
                        className="p-1 hover:bg-[#ec5b13]/20 rounded-lg text-slate-500 hover:text-[#ec5b13] transition-all"
                        title="Export project"
                      >
                        <Icon name="download" className="text-lg" />
                      </button>
                      {exportMenuId === project.id && (
                        <div
                          ref={exportMenuRef}
                          className="absolute right-0 top-full mt-1 z-50 w-44 bg-[#252526] border border-[#3c3c3c] rounded-lg shadow-2xl py-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportProject(project, project.format as CodeFormat);
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2 text-[11px] font-bold text-white hover:bg-[#ec5b13]/20 transition-colors text-left"
                          >
                            <Icon name="download" className="text-sm text-[#ec5b13]" />
                            Export as {(project.format || "json").toUpperCase()}
                            <span className="ml-auto text-[9px] text-[#ec5b13] font-mono bg-[#ec5b13]/10 px-1.5 py-0.5 rounded">default</span>
                          </button>
                          <div className="h-px bg-[#3c3c3c] mx-2 my-1" />
                          {(["json", "markdown", "yaml"] as CodeFormat[]).filter((f) => f !== project.format).map((f) => (
                            <button
                              key={f}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleExportProject(project, f);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-1.5 text-[11px] font-medium text-slate-400 hover:text-white hover:bg-[#3c3c3c] transition-colors text-left"
                            >
                              <Icon
                                name={f === "json" ? "data_object" : f === "yaml" ? "code" : "description"}
                                className="text-sm text-slate-500"
                              />
                              Export as {f.toUpperCase()}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConfirmDeleteId(project.id);
                      }}
                      className="p-1 hover:bg-red-500/20 rounded-lg text-slate-500 hover:text-red-400 transition-all"
                    >
                      <Icon name="delete" className="text-lg" />
                    </button>
                  </div>
                </div>

                <h3 className="text-sm font-bold text-white mb-1 truncate">{project.name}</h3>
                <p className="text-[11px] text-slate-500 mb-3">
                  {project.guide.steps.length} step{project.guide.steps.length !== 1 ? "s" : ""} ·{" "}
                  {formatDateTime(project.updatedAt)}
                </p>

                <div className="flex gap-1.5">
                  {project.guide.steps.slice(0, 3).map((step, i) => (
                    <span
                      key={step.id}
                      className="text-[9px] px-2 py-0.5 rounded bg-[#3c3c3c]/60 text-slate-400 truncate max-w-[80px]"
                    >
                      {i + 1}. {step.title}
                    </span>
                  ))}
                  {project.guide.steps.length > 3 && (
                    <span className="text-[9px] px-2 py-0.5 rounded bg-[#3c3c3c]/60 text-slate-500">
                      +{project.guide.steps.length - 3}
                    </span>
                  )}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        open={confirmDeleteId !== null}
        title="Delete Project?"
        description="This project and all its data will be permanently deleted. This action cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {
          if (confirmDeleteId) deleteProject(confirmDeleteId);
          setConfirmDeleteId(null);
        }}
        onCancel={() => setConfirmDeleteId(null)}
      />

      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#252526] border border-[#3c3c3c] rounded-2xl shadow-2xl w-full max-w-lg p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="size-10 bg-[#ec5b13]/20 rounded-xl flex items-center justify-center">
                  <Icon name="add_circle" className="text-xl text-[#ec5b13]" />
                </div>
                <h2 className="text-xl font-bold text-white">New Project</h2>
              </div>
              <button
                onClick={() => setShowNewModal(false)}
                className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors"
              >
                <Icon name="close" className="text-xl" />
              </button>
            </div>

            <div className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Project Name
                </label>
                <input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="My Guide Project"
                  className="w-full bg-[#2d2d2d] border border-[#3c3c3c] rounded-xl px-4 py-3 text-sm text-white focus:ring-2 focus:ring-[#ec5b13]/50 focus:border-[#ec5b13] outline-none placeholder:text-slate-600 transition-all"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Output Format
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {FORMAT_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setNewFormat(opt.value)}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        newFormat === opt.value
                          ? "border-[#ec5b13] bg-[#ec5b13]/10 text-[#ec5b13]"
                          : "border-[#3c3c3c] bg-[#2d2d2d]/50 text-slate-400 hover:border-[#ec5b13]/30"
                      }`}
                    >
                      <Icon
                        name={opt.icon}
                        className={`text-2xl ${newFormat === opt.value ? "text-[#ec5b13]" : "text-slate-500"}`}
                      />
                      <span className="text-sm font-bold">{opt.label}</span>
                      <span className="text-[10px] text-center leading-tight opacity-70">
                        {opt.description.split(".")[0]}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowNewModal(false)}
                  className="flex-1 py-2.5 rounded-xl border border-[#3c3c3c] text-sm font-medium text-slate-400 hover:bg-white/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  className="flex-1 py-2.5 rounded-xl bg-[#ec5b13] text-white text-sm font-bold hover:brightness-110 transition-all shadow-lg shadow-[#ec5b13]/20"
                >
                  Create Project
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
