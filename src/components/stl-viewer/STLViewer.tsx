import { Component, useEffect, useMemo, useRef, useState, Suspense, type ReactNode } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { OrbitControls, Bounds, Grid, ContactShadows } from '@react-three/drei';
import { STLLoader } from 'three-stdlib';
import { Box } from 'lucide-react';
import { cn } from '@/lib/utils';

class ViewerErrorBoundary extends Component<{ children: ReactNode; fallback: ReactNode }, { hasError: boolean }> {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(err: Error) {
    console.warn('STLViewer failed:', err.message);
  }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

interface STLViewerProps {
  file: File | null;
  wireframe?: boolean;
  resetTrigger?: number;
  className?: string;
}

function STLMesh({ buffer, wireframe }: { buffer: ArrayBuffer; wireframe: boolean }) {
  const geometry = useMemo(() => {
    const loader = new STLLoader();
    const geom = loader.parse(buffer);
    geom.computeVertexNormals();
    geom.center();
    return geom;
  }, [buffer]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial
        color="#d4d4d8"
        metalness={0.15}
        roughness={0.45}
        wireframe={wireframe}
        envMapIntensity={0.6}
      />
    </mesh>
  );
}

function CameraController({ resetKey }: { resetKey: number }) {
  const controlsRef = useRef<any>(null);
  const { camera } = useThree();

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.reset?.();
      camera.position.set(120, 90, 120);
      camera.lookAt(0, 0, 0);
      controlsRef.current.update?.();
    }
  }, [resetKey, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan
      enableZoom
      enableRotate
      dampingFactor={0.1}
      rotateSpeed={0.8}
      zoomSpeed={0.9}
      minDistance={10}
      maxDistance={1500}
      makeDefault
    />
  );
}

export function STLViewer({ file, wireframe = false, resetTrigger = 0, className }: STLViewerProps) {
  const [buffer, setBuffer] = useState<ArrayBuffer | null>(null);
  const [internalResetKey, setInternalResetKey] = useState(0);

  useEffect(() => {
    if (!file) {
      setBuffer(null);
      return;
    }
    let cancelled = false;
    file.arrayBuffer().then((buf) => {
      if (!cancelled) {
        setBuffer(buf);
        setInternalResetKey((k) => k + 1);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [file]);

  const resetKey = internalResetKey + resetTrigger;

  if (!buffer) {
    return (
      <div
        className={cn(
          'flex items-center justify-center h-full w-full rounded-xl',
          'bg-[radial-gradient(circle_at_50%_50%,hsl(87,20%,45%,0.08),transparent_70%)]',
          className
        )}
      >
        <div className="text-xs text-muted-foreground">No model loaded</div>
      </div>
    );
  }

  const fallback = (
    <div
      className={cn(
        'flex flex-col items-center justify-center h-full w-full rounded-xl gap-2',
        'bg-[radial-gradient(ellipse_at_center,hsl(87,20%,45%,0.08),hsl(0,0%,6%)_70%)]'
      )}
    >
      <Box className="h-8 w-8 text-muted-foreground/60" />
      <p className="text-xs text-muted-foreground">3D preview unavailable</p>
      <p className="text-[10px] text-muted-foreground/60">WebGL not supported in this browser</p>
    </div>
  );

  return (
    <div
      className={cn(
        'relative h-full w-full overflow-hidden rounded-xl',
        'bg-[radial-gradient(ellipse_at_center,hsl(87,20%,45%,0.1),hsl(0,0%,6%)_70%)]',
        className
      )}
    >
     <ViewerErrorBoundary fallback={fallback}>
      <Canvas
        shadows
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: false }}
        camera={{ position: [120, 90, 120], fov: 35, near: 0.1, far: 5000 }}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.35} />
        <directionalLight
          position={[100, 200, 100]}
          intensity={1.1}
          castShadow
          shadow-mapSize-width={1024}
          shadow-mapSize-height={1024}
          shadow-camera-near={0.5}
          shadow-camera-far={1000}
          shadow-camera-left={-200}
          shadow-camera-right={200}
          shadow-camera-top={200}
          shadow-camera-bottom={-200}
        />
        <directionalLight position={[-80, 50, -80]} intensity={0.4} color="#8ba88a" />
        <hemisphereLight args={['#ffffff', '#1a1a1a', 0.3]} />

        <Suspense fallback={null}>
          <Bounds fit clip observe margin={1.2}>
            <STLMesh buffer={buffer} wireframe={wireframe} />
          </Bounds>

          <ContactShadows
            position={[0, -50, 0]}
            opacity={0.5}
            scale={500}
            blur={2.4}
            far={100}
            resolution={512}
            color="#000000"
          />

          <Grid
            position={[0, -50, 0]}
            args={[400, 400]}
            cellSize={10}
            cellThickness={0.5}
            cellColor="#2a2a2a"
            sectionSize={50}
            sectionThickness={1}
            sectionColor="#3a3a3a"
            fadeDistance={400}
            fadeStrength={1.5}
            infiniteGrid
          />
        </Suspense>

        <CameraController resetKey={resetKey} />
      </Canvas>
     </ViewerErrorBoundary>
    </div>
  );
}

export default STLViewer;
