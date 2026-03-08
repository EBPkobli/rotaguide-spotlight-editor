import { Icon } from "../ui/Icon";

interface StatusBarProps {
  message: string;
  stepCount: number;
  activeStep: string;
  format: string;
}

export function StatusBar({ message, stepCount, activeStep, format }: StatusBarProps) {
  return (
    <footer className="h-8 bg-[#ec5b13] flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-4 text-[10px] font-bold text-white/80">
        <div className="flex items-center gap-1.5">
          <Icon name="sync" className="text-sm" /> {message}
        </div>
        <span className="opacity-50">|</span>
        <span>Format: <span className="font-bold uppercase">{format}</span></span>
      </div>
      <div className="flex items-center gap-4 text-[10px] font-bold text-white/80">
        <span>Steps: {stepCount}</span>
        <span className="opacity-50">|</span>
        <span>Active: {activeStep}</span>
        <span className="bg-white/20 px-1.5 rounded">v1.0.0</span>
      </div>
    </footer>
  );
}
