"use client";

interface TabsProps {
  active: "lunch" | "cafe";
  onChange: (tab: "lunch" | "cafe") => void;
}

export default function Tabs({ active, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 bg-border/50 p-1 rounded-lg w-fit">
      <button
        onClick={() => onChange("lunch")}
        className={`px-5 py-2 text-xs font-medium tracking-widest uppercase rounded-md transition-colors ${
          active === "lunch"
            ? "bg-fg text-bg"
            : "text-muted hover:text-fg"
        }`}
      >
        Lunch
      </button>
      <button
        onClick={() => onChange("cafe")}
        className={`px-5 py-2 text-xs font-medium tracking-widest uppercase rounded-md transition-colors ${
          active === "cafe"
            ? "bg-fg text-bg"
            : "text-muted hover:text-fg"
        }`}
      >
        Cafes / Matcha
      </button>
    </div>
  );
}
