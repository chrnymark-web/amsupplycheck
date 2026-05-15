"use client";

import { useState } from "react";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface Props {
  technologies: string[];
  materials: string[];
  technologyToMaterials: Record<string, string[]>;
}

export default function CompatibilityMatrixTable({
  technologies,
  materials,
  technologyToMaterials,
}: Props) {
  const [selectedTech, setSelectedTech] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState<string | null>(null);

  const isCompatible = (tech: string, material: string): boolean =>
    (technologyToMaterials[tech] ?? []).includes(material);

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead className="bg-muted/50 sticky top-0 z-10">
          <tr>
            <th className="p-3 text-left font-semibold text-sm border-b border-r border-border bg-muted/50 sticky left-0 z-20 min-w-[200px]">
              Material / Technology
            </th>
            {technologies.map((tech) => (
              <th
                key={tech}
                className="p-3 text-center font-semibold text-xs border-b border-border min-w-[120px] cursor-pointer hover:bg-muted/80 transition-colors"
                onClick={() => setSelectedTech(selectedTech === tech ? null : tech)}
              >
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className={selectedTech === tech ? "text-primary" : ""}>{tech}</div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Click to highlight {tech} compatibility</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {materials.map((material, idx) => (
            <tr
              key={material}
              className={`hover:bg-muted/30 transition-colors ${
                idx % 2 === 0 ? "bg-background" : "bg-muted/20"
              } ${selectedMaterial === material ? "ring-2 ring-primary/50" : ""}`}
              onClick={() => setSelectedMaterial(selectedMaterial === material ? null : material)}
            >
              <td className="p-3 font-medium text-sm border-r border-border sticky left-0 bg-background z-10 cursor-pointer">
                <Badge
                  variant="outline"
                  className={selectedMaterial === material ? "bg-primary/10 border-primary" : ""}
                >
                  {material}
                </Badge>
              </td>
              {technologies.map((tech) => {
                const compatible = isCompatible(tech, material);
                const isHighlighted = selectedTech === tech || selectedMaterial === material;
                return (
                  <td
                    key={`${material}-${tech}`}
                    className={`p-3 text-center border-b border-border transition-all ${
                      isHighlighted ? "bg-muted/50" : ""
                    }`}
                  >
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div
                            className={`inline-flex items-center justify-center w-8 h-8 rounded-md transition-all cursor-pointer ${
                              compatible
                                ? "bg-emerald-500/20 hover:bg-emerald-500/30"
                                : "bg-destructive/10 hover:bg-destructive/20"
                            }`}
                          >
                            {compatible ? (
                              <Check className="h-5 w-5 text-emerald-600" />
                            ) : (
                              <X className="h-4 w-4 text-destructive/50" />
                            )}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            {compatible
                              ? `${material} is compatible with ${tech}`
                              : `${material} is not compatible with ${tech}`}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
