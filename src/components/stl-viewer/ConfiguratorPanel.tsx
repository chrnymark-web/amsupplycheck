import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export const TECH_MATERIALS: Record<string, string[]> = {
  'FDM/FFF': ['PLA', 'ABS', 'PETG', 'Nylon', 'TPU', 'ASA', 'Polycarbonate', 'PEEK'],
  SLS: ['PA-12', 'PA-11', 'PA-12 Glass Filled', 'PA-12 Carbon Filled', 'TPU', 'Polypropylene'],
  SLA: ['Standard Resin', 'Tough Resin', 'Flexible Resin', 'Clear Resin', 'High Temp Resin'],
  MJF: ['PA-12', 'PA-12 Glass Filled', 'PA-11', 'TPU', 'Polypropylene'],
  DMLS: ['Titanium', 'Aluminum AlSi10Mg', 'Stainless Steel 316L', 'Inconel 718'],
  SLM: ['Titanium', 'Aluminum AlSi10Mg', 'Stainless Steel 316L', 'Inconel 718'],
  DLP: ['Standard Resin', 'Tough Resin', 'Flexible Resin', 'Castable Resin'],
  'Material Jetting': ['Standard Resin', 'Flexible Resin', 'Clear Resin'],
  'Binder Jetting': ['Stainless Steel', 'Aluminum', 'Ceramic'],
};

// Color swatches per typical material category
export const COLOR_OPTIONS: Array<{ value: string; label: string; hex: string }> = [
  { value: 'natural', label: 'Natural', hex: '#e8e4d9' },
  { value: 'white', label: 'White', hex: '#f5f5f5' },
  { value: 'black', label: 'Black', hex: '#1a1a1a' },
  { value: 'gray', label: 'Gray', hex: '#808080' },
  { value: 'red', label: 'Red', hex: '#c94a4a' },
  { value: 'blue', label: 'Blue', hex: '#4a6fa5' },
  { value: 'yellow', label: 'Yellow', hex: '#e8c547' },
  { value: 'green', label: 'Green', hex: '#6b8e4e' },
];

export const FINISH_OPTIONS = [
  { value: 'standard', label: 'Standard (as printed)' },
  { value: 'sanded', label: 'Sanded' },
  { value: 'polished', label: 'Polished' },
  { value: 'painted', label: 'Painted' },
  { value: 'dyed', label: 'Dyed' },
];

interface ConfiguratorPanelProps {
  technology: string;
  material: string;
  color: string;
  finish: string;
  quantity: number;
  onTechnologyChange: (v: string) => void;
  onMaterialChange: (v: string) => void;
  onColorChange: (v: string) => void;
  onFinishChange: (v: string) => void;
  onQuantityChange: (v: number) => void;
  className?: string;
}

export function ConfiguratorPanel({
  technology,
  material,
  color,
  finish,
  quantity,
  onTechnologyChange,
  onMaterialChange,
  onColorChange,
  onFinishChange,
  onQuantityChange,
  className,
}: ConfiguratorPanelProps) {
  const materials = TECH_MATERIALS[technology] || [];
  const selectedColor = COLOR_OPTIONS.find((c) => c.value === color);

  return (
    <div
      className={cn(
        'rounded-xl border border-border/60 bg-card/60 backdrop-blur-sm',
        'shadow-[0_8px_30px_hsl(87,20%,45%,0.06),0_1px_2px_hsl(0,0%,0%,0.4)]',
        'p-4 space-y-4',
        className
      )}
    >
      <div>
        <h3 className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground mb-0.5">
          Configure
        </h3>
        <p className="text-xs text-muted-foreground/70">Prices update as you change options</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <ConfigField label="Material">
          <Select value={material} onValueChange={onMaterialChange}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {materials.map((m) => (
                <SelectItem key={m} value={m} className="text-sm">
                  {m}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ConfigField>

        <ConfigField label="Technology">
          <Select
            value={technology}
            onValueChange={(v) => {
              onTechnologyChange(v);
              const next = TECH_MATERIALS[v]?.[0];
              if (next && !TECH_MATERIALS[v].includes(material)) onMaterialChange(next);
            }}
          >
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(TECH_MATERIALS).map((t) => (
                <SelectItem key={t} value={t} className="text-sm">
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ConfigField>

        <ConfigField label="Color">
          <Select value={color} onValueChange={onColorChange}>
            <SelectTrigger className="h-9 text-sm">
              <div className="flex items-center gap-2">
                {selectedColor && (
                  <span
                    className="inline-block h-3.5 w-3.5 rounded-full border border-border/50"
                    style={{ backgroundColor: selectedColor.hex }}
                  />
                )}
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {COLOR_OPTIONS.map((c) => (
                <SelectItem key={c.value} value={c.value} className="text-sm">
                  <span className="flex items-center gap-2">
                    <span
                      className="inline-block h-3.5 w-3.5 rounded-full border border-border/50"
                      style={{ backgroundColor: c.hex }}
                    />
                    {c.label}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ConfigField>

        <ConfigField label="Finish">
          <Select value={finish} onValueChange={onFinishChange}>
            <SelectTrigger className="h-9 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FINISH_OPTIONS.map((f) => (
                <SelectItem key={f.value} value={f.value} className="text-sm">
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </ConfigField>
      </div>

      <ConfigField label="Quantity">
        <div className="flex items-center gap-2">
          <QuantityStepper value={quantity} onChange={onQuantityChange} />
          <div className="flex gap-1 ml-auto">
            {[1, 10, 50, 100].map((q) => (
              <button
                key={q}
                onClick={() => onQuantityChange(q)}
                className={cn(
                  'px-2 py-1 text-[11px] rounded-md border transition-colors',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                  quantity === q
                    ? 'border-primary/50 bg-primary/10 text-primary'
                    : 'border-border/60 text-muted-foreground hover:border-border hover:text-foreground'
                )}
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </ConfigField>
    </div>
  );
}

function ConfigField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">
        {label}
      </Label>
      {children}
    </div>
  );
}

function QuantityStepper({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const dec = () => onChange(Math.max(1, value - 1));
  const inc = () => onChange(Math.min(10000, value + 1));
  return (
    <div className="flex items-center rounded-md border border-border/60 bg-background/60">
      <button
        onClick={dec}
        aria-label="Decrease quantity"
        className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-l-md"
      >
        −
      </button>
      <Input
        type="number"
        min={1}
        max={10000}
        value={value}
        onChange={(e) => {
          const n = parseInt(e.target.value);
          if (!isNaN(n)) onChange(Math.max(1, Math.min(10000, n)));
        }}
        className="h-9 w-14 text-center text-sm border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        onClick={inc}
        aria-label="Increase quantity"
        className="h-9 w-9 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-r-md"
      >
        +
      </button>
    </div>
  );
}
