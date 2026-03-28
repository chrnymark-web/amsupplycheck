export interface STLResult {
  volumeCm3: number;
  boundingBox: { x: number; y: number; z: number }; // dimensions in mm
  triangleCount: number;
  surfaceAreaCm2: number;
}

function isBinarySTL(buffer: ArrayBuffer): boolean {
  // Binary STL: 80-byte header + 4-byte triangle count + N * 50 bytes
  if (buffer.byteLength < 84) return false;
  const view = new DataView(buffer);
  const triangleCount = view.getUint32(80, true);
  const expectedSize = 84 + triangleCount * 50;
  // Allow some tolerance for padding
  return Math.abs(buffer.byteLength - expectedSize) < 100;
}

function parseBinarySTL(buffer: ArrayBuffer): STLResult {
  const view = new DataView(buffer);
  const triangleCount = view.getUint32(80, true);

  let totalVolume = 0;
  let totalArea = 0;
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (let i = 0; i < triangleCount; i++) {
    const offset = 84 + i * 50;

    // Skip normal (12 bytes), read 3 vertices (each 12 bytes = 3 floats)
    const v1x = view.getFloat32(offset + 12, true);
    const v1y = view.getFloat32(offset + 16, true);
    const v1z = view.getFloat32(offset + 20, true);
    const v2x = view.getFloat32(offset + 24, true);
    const v2y = view.getFloat32(offset + 28, true);
    const v2z = view.getFloat32(offset + 32, true);
    const v3x = view.getFloat32(offset + 36, true);
    const v3y = view.getFloat32(offset + 40, true);
    const v3z = view.getFloat32(offset + 44, true);

    // Bounding box
    minX = Math.min(minX, v1x, v2x, v3x);
    minY = Math.min(minY, v1y, v2y, v3y);
    minZ = Math.min(minZ, v1z, v2z, v3z);
    maxX = Math.max(maxX, v1x, v2x, v3x);
    maxY = Math.max(maxY, v1y, v2y, v3y);
    maxZ = Math.max(maxZ, v1z, v2z, v3z);

    // Signed volume via tetrahedron method (origin to triangle)
    totalVolume += (
      v1x * (v2y * v3z - v3y * v2z) -
      v2x * (v1y * v3z - v3y * v1z) +
      v3x * (v1y * v2z - v2y * v1z)
    ) / 6.0;

    // Surface area via cross product
    const ax = v2x - v1x, ay = v2y - v1y, az = v2z - v1z;
    const bx = v3x - v1x, by = v3y - v1y, bz = v3z - v1z;
    const cx = ay * bz - az * by;
    const cy = az * bx - ax * bz;
    const cz = ax * by - ay * bx;
    totalArea += Math.sqrt(cx * cx + cy * cy + cz * cz) / 2.0;
  }

  // STL units are typically mm; convert to cm3 and cm2
  return {
    volumeCm3: Math.abs(totalVolume) / 1000, // mm3 -> cm3
    boundingBox: {
      x: Math.round((maxX - minX) * 100) / 100,
      y: Math.round((maxY - minY) * 100) / 100,
      z: Math.round((maxZ - minZ) * 100) / 100,
    },
    triangleCount,
    surfaceAreaCm2: totalArea / 100, // mm2 -> cm2
  };
}

function parseASCIISTL(text: string): STLResult {
  const vertexRegex = /vertex\s+([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)\s+([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)\s+([-+]?\d*\.?\d+(?:[eE][-+]?\d+)?)/g;
  const vertices: number[][] = [];
  let match;
  while ((match = vertexRegex.exec(text)) !== null) {
    vertices.push([parseFloat(match[1]), parseFloat(match[2]), parseFloat(match[3])]);
  }

  const triangleCount = Math.floor(vertices.length / 3);
  let totalVolume = 0;
  let totalArea = 0;
  let minX = Infinity, minY = Infinity, minZ = Infinity;
  let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;

  for (let i = 0; i < triangleCount; i++) {
    const [v1x, v1y, v1z] = vertices[i * 3];
    const [v2x, v2y, v2z] = vertices[i * 3 + 1];
    const [v3x, v3y, v3z] = vertices[i * 3 + 2];

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

export function parseSTL(buffer: ArrayBuffer): STLResult {
  if (isBinarySTL(buffer)) {
    return parseBinarySTL(buffer);
  }
  const decoder = new TextDecoder('ascii');
  const text = decoder.decode(buffer);
  if (text.trimStart().startsWith('solid')) {
    return parseASCIISTL(text);
  }
  // Fallback: try binary
  return parseBinarySTL(buffer);
}
