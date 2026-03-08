import type { GuideTooltipTemplate } from "../../types/builder";

/* ── Tiny step dots ── */
function StepDots({ active, total, color }: { active: number; total: number; color: string }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="size-1 rounded-full"
          style={{ background: i < active ? color : "rgba(255,255,255,0.15)" }}
        />
      ))}
    </div>
  );
}

/* ── Text bar placeholder ── */
function TextBar({ w, color, h = 2 }: { w: string; color: string; h?: number }) {
  return <div className="rounded-sm" style={{ width: w, height: h, background: color }} />;
}

/* ── Each template mini-tooltip ── */
const THUMBNAILS: Record<GuideTooltipTemplate, () => React.JSX.Element> = {
  default: () => (
    <div className="w-full h-full rounded-md flex flex-col justify-between p-2"
      style={{ background: "#1e1e1e", border: "1px solid #3c3c3c" }}>
      <div className="space-y-1">
        <TextBar w="60%" color="#d4d4d4" h={3} />
        <TextBar w="90%" color="#6b6b6b" />
        <TextBar w="70%" color="#6b6b6b" />
      </div>
      <div className="flex items-center justify-between">
        <StepDots active={2} total={4} color="#ec5b13" />
        <div className="rounded px-1.5 py-0.5" style={{ background: "#ec5b13", fontSize: 5, color: "#fff" }}>
          Next
        </div>
      </div>
    </div>
  ),

  glass: () => (
    <div className="w-full h-full rounded-md flex flex-col justify-between p-2"
      style={{ background: "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(4px)" }}>
      <div className="space-y-1">
        <TextBar w="55%" color="rgba(255,255,255,0.7)" h={3} />
        <TextBar w="85%" color="rgba(255,255,255,0.25)" />
        <TextBar w="65%" color="rgba(255,255,255,0.25)" />
      </div>
      <div className="flex items-center justify-between">
        <StepDots active={1} total={3} color="rgba(255,255,255,0.6)" />
        <div className="rounded px-1.5 py-0.5" style={{ background: "rgba(255,255,255,0.15)", border: "1px solid rgba(255,255,255,0.2)", fontSize: 5, color: "rgba(255,255,255,0.7)" }}>
          Next
        </div>
      </div>
    </div>
  ),

  minimal: () => (
    <div className="w-full h-full rounded flex flex-col justify-between p-2"
      style={{ background: "#1a1a1a", border: "1px solid #333" }}>
      <div className="space-y-1">
        <TextBar w="50%" color="#a0a0a0" h={3} />
        <TextBar w="80%" color="#555" />
      </div>
      <div className="flex justify-end">
        <div style={{ fontSize: 5, color: "#888" }}>Next →</div>
      </div>
    </div>
  ),

  contrast: () => (
    <div className="w-full h-full rounded-md flex flex-col justify-between p-2"
      style={{ background: "#000", border: "2px solid #fff" }}>
      <div className="space-y-1">
        <TextBar w="55%" color="#fff" h={3} />
        <TextBar w="85%" color="#999" />
        <TextBar w="60%" color="#999" />
      </div>
      <div className="flex items-center justify-between">
        <StepDots active={3} total={5} color="#fff" />
        <div className="rounded px-1.5 py-0.5" style={{ background: "#fff", fontSize: 5, color: "#000", fontWeight: 700 }}>
          Next
        </div>
      </div>
    </div>
  ),

  "dashboard-orange": () => (
    <div className="w-full h-full rounded-md flex flex-col overflow-hidden"
      style={{ background: "#1e1e1e", border: "1px solid #ec5b13" }}>
      <div className="px-2 py-1" style={{ background: "#ec5b13" }}>
        <TextBar w="55%" color="rgba(255,255,255,0.9)" h={3} />
      </div>
      <div className="p-2 space-y-1 flex-1 flex flex-col justify-between">
        <div className="space-y-1">
          <TextBar w="90%" color="#7a7a7a" />
          <TextBar w="70%" color="#7a7a7a" />
        </div>
        <div className="flex items-center justify-between">
          <StepDots active={2} total={4} color="#ec5b13" />
          <div className="rounded px-1.5 py-0.5" style={{ background: "#ec5b13", fontSize: 5, color: "#fff" }}>
            Next
          </div>
        </div>
      </div>
    </div>
  ),

  "clean-white": () => (
    <div className="w-full h-full rounded-md flex flex-col justify-between p-2"
      style={{ background: "#fafafa", border: "1px solid #e0e0e0" }}>
      <div className="space-y-1">
        <TextBar w="55%" color="#222" h={3} />
        <TextBar w="85%" color="#aaa" />
        <TextBar w="65%" color="#aaa" />
      </div>
      <div className="flex items-center justify-between">
        <StepDots active={2} total={4} color="#333" />
        <div className="rounded px-1.5 py-0.5" style={{ background: "#222", fontSize: 5, color: "#fff" }}>
          Next
        </div>
      </div>
    </div>
  ),

  "commerce-dark": () => (
    <div className="w-full h-full rounded-md flex flex-col justify-between p-2"
      style={{ background: "linear-gradient(180deg, #1a1a2e, #16213e)", border: "1px solid #0f3460" }}>
      <div className="space-y-1">
        <TextBar w="60%" color="#e94560" h={3} />
        <TextBar w="85%" color="#536390" />
        <TextBar w="55%" color="#536390" />
      </div>
      <div className="flex items-center justify-between">
        <StepDots active={1} total={3} color="#e94560" />
        <div className="rounded px-1.5 py-0.5" style={{ background: "#e94560", fontSize: 5, color: "#fff" }}>
          Next
        </div>
      </div>
    </div>
  ),

  "terminal-pop": () => (
    <div className="w-full h-full rounded-md flex flex-col justify-between p-2"
      style={{ background: "#0d0d0d", border: "1px solid #00ff41" }}>
      <div className="space-y-1">
        <div style={{ fontSize: 5, color: "#00ff41", fontFamily: "monospace" }}>{">"} Welcome</div>
        <TextBar w="85%" color="#00ff41" h={1.5} />
        <TextBar w="60%" color="rgba(0,255,65,0.4)" h={1.5} />
      </div>
      <div className="flex items-center justify-between">
        <StepDots active={2} total={4} color="#00ff41" />
        <div className="rounded px-1.5 py-0.5" style={{ border: "1px solid #00ff41", fontSize: 5, color: "#00ff41", fontFamily: "monospace" }}>
          next
        </div>
      </div>
    </div>
  ),

  "outline-light": () => (
    <div className="w-full h-full rounded-md flex flex-col justify-between p-2"
      style={{ background: "transparent", border: "1.5px solid #d4d4d4" }}>
      <div className="space-y-1">
        <TextBar w="55%" color="#d4d4d4" h={3} />
        <TextBar w="80%" color="#666" />
        <TextBar w="50%" color="#666" />
      </div>
      <div className="flex items-center justify-between">
        <StepDots active={3} total={5} color="#d4d4d4" />
        <div className="rounded px-1.5 py-0.5" style={{ border: "1px solid #d4d4d4", fontSize: 5, color: "#d4d4d4" }}>
          Next
        </div>
      </div>
    </div>
  ),
};

export default function TemplateThumbnail({ template }: { template: GuideTooltipTemplate }) {
  const Thumb = THUMBNAILS[template];
  return Thumb ? <Thumb /> : null;
}
