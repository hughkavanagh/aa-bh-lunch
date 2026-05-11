"use client";

interface TabsProps {
  active: "lunch" | "cafe" | "sweets";
  onChange: (tab: "lunch" | "cafe" | "sweets") => void;
}

const TABS: { value: "lunch" | "cafe" | "sweets"; label: string }[] = [
  { value: "lunch", label: "Lunch" },
  { value: "cafe", label: "Cafés" },
  { value: "sweets", label: "Sweets" },
];

export default function Tabs({ active, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 bg-border/50 p-1 rounded-lg w-fit">
      {TABS.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={`px-5 py-2 text-xs font-medium tracking-widest uppercase rounded-md transition-colors ${
            active === tab.value
              ? "bg-fg text-bg"
              : "text-muted hover:text-fg"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
