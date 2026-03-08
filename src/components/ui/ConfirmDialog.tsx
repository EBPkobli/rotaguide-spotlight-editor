import { useEffect, useRef } from "react";
import { Icon } from "./Icon";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  variant = "danger",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (open) confirmRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  const isDanger = variant === "danger";

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onCancel}
      />

      {/* Dialog */}
      <div className="relative bg-[#252526] border border-[#3c3c3c] rounded-2xl shadow-2xl w-full max-w-sm mx-4 overflow-hidden animate-in">
        <div className="p-6 space-y-4">
          {/* Icon + Title */}
          <div className="flex items-start gap-3">
            <div
              className={`size-10 rounded-xl flex items-center justify-center shrink-0 ${
                isDanger
                  ? "bg-red-500/15 text-red-400"
                  : "bg-amber-500/15 text-amber-400"
              }`}
            >
              <Icon
                name={isDanger ? "delete_forever" : "warning"}
                className="text-xl"
              />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">{title}</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                {description}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 px-6 pb-5">
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-xl border border-[#3c3c3c] text-xs font-medium text-slate-400 hover:bg-white/5 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            onClick={onConfirm}
            className={`flex-1 py-2 rounded-xl text-xs font-bold text-white transition-all ${
              isDanger
                ? "bg-red-600 hover:bg-red-500 shadow-md shadow-red-600/25"
                : "bg-amber-600 hover:bg-amber-500 shadow-md shadow-amber-600/25"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
