"use client";

import { useCallback, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, ChevronDown, Upload, CheckCircle2, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics";
import { setPendingHeroUpload } from "@/lib/pendingHeroUpload";

type Mode = "compare" | "match";

const MAX_BYTES = 100 * 1024 * 1024;
const SUPPORTED_EXTS = [".stl", ".step", ".stp"] as const;

interface AccordionItem {
  id: Mode;
  icon: typeof BarChart3;
  label: string;
  route: "/compare-prices" | "/stl-match";
}

const ITEMS: AccordionItem[] = [
  {
    id: "compare",
    icon: BarChart3,
    label: "Compare prices for different suppliers",
    route: "/compare-prices",
  },
  {
    id: "match",
    icon: Upload,
    label: "Upload STL or STEP file",
    route: "/stl-match",
  },
];

export function HeroUploadTabs() {
  const [openId, setOpenId] = useState<Mode | null>("compare");
  const [error, setError] = useState<string | null>(null);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const validateAndDispatch = useCallback(
    (f: File, route: string) => {
      const ext = f.name.toLowerCase().slice(f.name.lastIndexOf("."));
      if (!SUPPORTED_EXTS.includes(ext as typeof SUPPORTED_EXTS[number])) {
        setError(`Filformat ${ext || "ukendt"} understøttes ikke. Upload venligst en STL- eller STEP-fil.`);
        return;
      }
      if (f.size > MAX_BYTES) {
        setError(`Filen er for stor (${(f.size / 1024 / 1024).toFixed(1)} MB). Maks 100 MB.`);
        return;
      }
      setError(null);
      setPickedFile(f);

      const fileExtension = ext.replace(/^\./, "");
      trackEvent("file_uploaded", {
        file_size_bytes: f.size,
        file_extension: fileExtension,
        page: "home_hero",
      });
      supabase
        .from("upload_events")
        .insert({
          file_name: f.name,
          file_size_bytes: f.size,
          file_extension: fileExtension,
          source_page: "home_hero",
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        })
        .then(({ error: insertError }) => {
          if (insertError) console.warn("[upload_events] insert failed:", insertError.message);
        });

      setPendingHeroUpload(f);
      router.push(route);
    },
    [router],
  );

  const activeItem = ITEMS.find((it) => it.id === openId) ?? null;

  return (
    <div className="max-w-2xl mx-auto mb-6 md:mb-8 text-left">
      <div className="rounded-2xl border border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden divide-y divide-border/40">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          const isOpen = openId === item.id;
          return (
            <div key={item.id}>
              <button
                type="button"
                onClick={() => setOpenId(isOpen ? null : item.id)}
                aria-expanded={isOpen}
                className="w-full flex items-center justify-between gap-3 px-5 py-4 text-left hover:bg-card/60 transition-colors"
              >
                <span className="flex items-center gap-3 text-foreground font-medium">
                  <Icon className="h-5 w-5 text-primary" />
                  {item.label}
                </span>
                <ChevronDown
                  className={`h-5 w-5 text-muted-foreground transition-transform ${
                    isOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {isOpen && (
                <div className="px-5 pb-5">
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      e.preventDefault();
                      const f = e.dataTransfer.files[0];
                      if (f) validateAndDispatch(f, item.route);
                    }}
                    onClick={() => inputRef.current?.click()}
                    className="border-2 border-dashed border-border/40 rounded-xl p-8 text-center cursor-pointer hover:border-primary/40 transition-colors"
                  >
                    {pickedFile ? (
                      <div className="flex items-center justify-center gap-3">
                        <CheckCircle2 className="h-6 w-6 text-primary" />
                        <div className="text-left">
                          <p className="text-sm font-medium text-foreground">{pickedFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(pickedFile.size / 1024 / 1024).toFixed(1)} MB
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPickedFile(null);
                            setError(null);
                          }}
                          aria-label="Remove file"
                          className="text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">
                          Drop your <strong className="text-foreground">STL or STEP file</strong> here or click to browse
                        </p>
                        <p className="text-xs text-muted-foreground/60 mt-1">
                          Max 100MB. Analysis runs locally in your browser.
                        </p>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".stl,.step,.stp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f && activeItem) validateAndDispatch(f, activeItem.route);
        }}
      />

      {error && (
        <p className="text-sm text-destructive mt-2 text-center" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
