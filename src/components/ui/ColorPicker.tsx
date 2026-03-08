import { useRef, useState, useEffect, useCallback } from "react";

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  placeholder?: string;
  /** Compact mode for dense grids */
  compact?: boolean;
}

export default function ColorPicker({ value, onChange, placeholder = "#000000", compact = false }: ColorPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(value || "");

  // Sync external value changes
  useEffect(() => {
    setText(value || "");
  }, [value]);

  const displayColor = value || placeholder;

  // Normalize to valid 6-digit hex for <input type="color">
  const toHex6 = useCallback((c: string): string => {
    const s = c.replace("#", "");
    if (/^[0-9a-fA-F]{6}$/.test(s)) return `#${s}`;
    if (/^[0-9a-fA-F]{3}$/.test(s)) return `#${s[0]}${s[0]}${s[1]}${s[1]}${s[2]}${s[2]}`;
    return "#000000";
  }, []);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setText(v);
    // Only propagate valid hex
    if (/^#[0-9a-fA-F]{3,8}$/.test(v)) {
      onChange(v);
    }
  };

  const handleTextBlur = () => {
    // If user cleared, propagate empty
    if (!text.trim()) {
      onChange("");
      return;
    }
    // Auto-prefix # if missing
    let v = text.trim();
    if (/^[0-9a-fA-F]{3,8}$/.test(v)) {
      v = `#${v}`;
      setText(v);
      onChange(v);
    }
  };

  const handlePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setText(v);
    onChange(v);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="relative shrink-0">
          <div
            className="size-6 rounded border border-white/10 cursor-pointer hover:border-white/30 transition-colors"
            style={{ background: displayColor }}
            onClick={() => inputRef.current?.click()}
          />
          <input
            ref={inputRef}
            type="color"
            value={toHex6(displayColor)}
            onChange={handlePickerChange}
            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            tabIndex={-1}
          />
        </div>
        <input
          value={text}
          onChange={handleTextChange}
          onBlur={handleTextBlur}
          className="w-full bg-[#252526] border border-[#3c3c3c] rounded-lg px-2 py-1.5 text-[10px] font-mono text-white outline-none focus:border-[#ec5b13] transition-colors"
          placeholder={placeholder}
        />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg bg-[#2d2d2d] border border-[#3c3c3c]">
      <div className="relative shrink-0">
        <div
          className="size-7 rounded border border-white/10 cursor-pointer hover:border-[#ec5b13]/50 hover:scale-105 transition-all"
          style={{ background: displayColor }}
          onClick={() => inputRef.current?.click()}
        />
        <input
          ref={inputRef}
          type="color"
          value={toHex6(displayColor)}
          onChange={handlePickerChange}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          tabIndex={-1}
        />
      </div>
      <input
        value={text}
        onChange={handleTextChange}
        onBlur={handleTextBlur}
        className="bg-transparent border-none text-xs font-mono flex-1 text-white outline-none"
        placeholder={placeholder}
      />
    </div>
  );
}
