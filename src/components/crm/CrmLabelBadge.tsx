import type { CrmLabel } from "@/types/crm";

export function CrmLabelBadge({ label }: { label: CrmLabel }) {
  return (
    <span
      className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium text-white truncate max-w-[80px]"
      style={{ backgroundColor: label.color }}
      title={label.name}
    >
      {label.name}
    </span>
  );
}
