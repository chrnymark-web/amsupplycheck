"use client";

import { useCallback, useRef } from "react";
import { CheckCircle2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/lib/supabase/client";
import { trackEvent } from "@/lib/analytics";
import type { StlResult } from "@/lib/stl-types";

const MAX_BYTES = 100 * 1024 * 1024;

interface UploadLandingProps {
  file: File | null;
  onFileSelected: (file: File) => void;
  onClear: () => void;
  stlMetrics?: StlResult | null;
  title?: string;
  description?: string;
}

export function UploadLanding({
  file,
  onFileSelected,
  onClear,
  stlMetrics,
  title = "Upload STL file",
  description = "Drag and drop or click to upload your 3D model (max 100 MB)",
}: UploadLandingProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (f: File) => {
      if (!f.name.toLowerCase().endsWith(".stl")) return;
      if (f.size > MAX_BYTES) return;

      trackEvent("file_uploaded", {
        file_size_bytes: f.size,
        file_extension: "stl",
        page: "stl_match",
      });

      supabase
        .from("upload_events")
        .insert({
          file_name: f.name,
          file_size_bytes: f.size,
          file_extension: "stl",
          source_page: "stl_match",
          user_agent: typeof navigator !== "undefined" ? navigator.userAgent : null,
        })
        .then(({ error }) => {
          if (error) console.warn("[upload_events] insert failed:", error.message);
        });

      onFileSelected(f);
    },
    [onFileSelected],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const f = e.dataTransfer.files[0];
      if (f) handleFile(f);
    },
    [handleFile],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            file
              ? "border-primary bg-primary/5"
              : "border-muted-foreground/25 hover:border-primary/50"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".stl"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
          {file ? (
            <div className="flex items-center justify-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-primary" />
              <div className="text-left">
                <p className="font-medium">{file.name}</p>
                <p className="text-sm text-muted-foreground">
                  {(file.size / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={(e) => {
                  e.stopPropagation();
                  onClear();
                }}
                aria-label="Remove file"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <Upload className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                Drop your STL file here or click to browse
              </p>
            </>
          )}
        </div>

        {stlMetrics && (
          <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-muted-foreground">Volume</p>
              <p className="font-medium">{stlMetrics.volumeCm3.toFixed(2)} cm³</p>
            </div>
            <div className="bg-muted/50 rounded-lg p-3">
              <p className="text-muted-foreground">Bounding box</p>
              <p className="font-medium">
                {stlMetrics.boundingBox.x} × {stlMetrics.boundingBox.y} ×{" "}
                {stlMetrics.boundingBox.z} mm
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
