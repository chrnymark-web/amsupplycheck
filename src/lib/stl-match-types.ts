export type StlSearchStatus =
  | "idle"
  | "uploading"
  | "pending"
  | "analyzing"
  | "matching"
  | "ranking"
  | "completed"
  | "failed";

export interface StlMatchInput {
  file: File;
  technology?: string;
  material?: string;
  quantity?: number;
  preferredRegion?: string;
  area?: string;
}
