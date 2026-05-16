"use client";

let pending: File | null = null;

export function setPendingHeroUpload(file: File): void {
  pending = file;
}

export function consumePendingHeroUpload(): File | null {
  const f = pending;
  pending = null;
  return f;
}
