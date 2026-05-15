export interface StlResult {
  volumeCm3: number;
  boundingBox: { x: number; y: number; z: number };
  triangleCount: number;
  surfaceAreaCm2: number;
}
