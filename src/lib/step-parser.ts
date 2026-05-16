import type { StlResult } from "./stl-types";

interface OcctMeshAttributes {
  position: { array: number[] };
}

interface OcctMesh {
  attributes: OcctMeshAttributes;
  index?: { array: number[] };
}

interface OcctReadResult {
  success: boolean;
  meshes: OcctMesh[];
}

interface OcctApi {
  ReadStepFile(content: Uint8Array, params: unknown | null): OcctReadResult;
}

let occtPromise: Promise<OcctApi> | null = null;

function loadOcct(): Promise<OcctApi> {
  if (occtPromise) return occtPromise;

  occtPromise = (async () => {
    // @ts-expect-error — occt-import-js ships no TypeScript declarations
    const mod = await import("occt-import-js");
    const factory = (mod.default ?? mod) as (opts?: {
      locateFile?: (path: string) => string;
    }) => Promise<OcctApi>;
    return factory({
      locateFile: (path: string) => `/wasm/${path}`,
    });
  })();

  return occtPromise;
}

export async function parseStep(buffer: ArrayBuffer): Promise<StlResult> {
  const occt = await loadOcct();
  const result = occt.ReadStepFile(new Uint8Array(buffer), null);

  if (!result.success || result.meshes.length === 0) {
    throw new Error("Could not parse STEP file — no geometry found.");
  }

  let totalVolume = 0;
  let totalArea = 0;
  let triangleCount = 0;
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (const mesh of result.meshes) {
    const positions = mesh.attributes.position.array;
    const indices = mesh.index?.array;

    const triCount = indices ? indices.length / 3 : positions.length / 9;

    for (let i = 0; i < triCount; i++) {
      let i1: number, i2: number, i3: number;
      if (indices) {
        i1 = indices[i * 3] * 3;
        i2 = indices[i * 3 + 1] * 3;
        i3 = indices[i * 3 + 2] * 3;
      } else {
        i1 = i * 9;
        i2 = i * 9 + 3;
        i3 = i * 9 + 6;
      }

      const v1x = positions[i1], v1y = positions[i1 + 1], v1z = positions[i1 + 2];
      const v2x = positions[i2], v2y = positions[i2 + 1], v2z = positions[i2 + 2];
      const v3x = positions[i3], v3y = positions[i3 + 1], v3z = positions[i3 + 2];

      minX = Math.min(minX, v1x, v2x, v3x);
      minY = Math.min(minY, v1y, v2y, v3y);
      minZ = Math.min(minZ, v1z, v2z, v3z);
      maxX = Math.max(maxX, v1x, v2x, v3x);
      maxY = Math.max(maxY, v1y, v2y, v3y);
      maxZ = Math.max(maxZ, v1z, v2z, v3z);

      totalVolume += (
        v1x * (v2y * v3z - v3y * v2z) -
        v2x * (v1y * v3z - v3y * v1z) +
        v3x * (v1y * v2z - v2y * v1z)
      ) / 6.0;

      const ax = v2x - v1x, ay = v2y - v1y, az = v2z - v1z;
      const bx = v3x - v1x, by = v3y - v1y, bz = v3z - v1z;
      const cx = ay * bz - az * by;
      const cy = az * bx - ax * bz;
      const cz = ax * by - ay * bx;
      totalArea += Math.sqrt(cx * cx + cy * cy + cz * cz) / 2.0;
    }

    triangleCount += triCount;
  }

  return {
    volumeCm3: Math.abs(totalVolume) / 1000,
    boundingBox: {
      x: Math.round((maxX - minX) * 100) / 100,
      y: Math.round((maxY - minY) * 100) / 100,
      z: Math.round((maxZ - minZ) * 100) / 100,
    },
    triangleCount,
    surfaceAreaCm2: totalArea / 100,
  };
}
