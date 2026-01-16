import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Canvas, useFrame, useThree, ThreeElements } from '@react-three/fiber';
import { PerspectiveCamera, Text, useTexture, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { MazeData, PlayerState, Cell, Direction } from '../types';
import { CELL_SIZE, WALL_HEIGHT } from '../constants';

// Fix for JSX Intrinsic Elements not being recognized
declare global {
  namespace JSX {
    interface IntrinsicElements {
      [elemName: string]: any;
    }
  }
}

// --- Procedural Texture Generation ---
const useProceduralTexture = () => {
  return useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Background
      ctx.fillStyle = '#111';
      ctx.fillRect(0, 0, 512, 512);

      // Grid
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 4;

      // Vertical lines
      for (let i = 0; i <= 512; i += 64) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 512);
        ctx.stroke();
      }

      // Horizontal lines
      for (let i = 0; i <= 512; i += 64) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(512, i);
        ctx.stroke();
      }

      // Random noise/circuits
      ctx.fillStyle = '#444';
      for (let i = 0; i < 20; i++) {
        const x = Math.random() * 512;
        const y = Math.random() * 512;
        const w = Math.random() * 50 + 10;
        const h = Math.random() * 50 + 10;
        ctx.fillRect(x, y, w, h);
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }, []);
};

// --- Psychedelic Material ---
const PsychedelicWallMaterial = () => {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const map = useProceduralTexture();

  useFrame(({ clock }) => {
    if (materialRef.current) {
      const t = clock.getElapsedTime();
      // Generate shifting colors
      const r = Math.sin(t * 0.2) * 0.4 + 0.4; // Darker base
      const g = Math.sin(t * 0.3 + 2) * 0.4 + 0.4;
      const b = Math.sin(t * 0.4 + 4) * 0.4 + 0.4;

      materialRef.current.color.setRGB(r, g, b);
      materialRef.current.emissive.setRGB(r * 0.5, g * 0.5, b * 0.5);
    }
  });

  return (
    <meshStandardMaterial
      ref={materialRef}
      map={map}
      roughness={0.2}
      metalness={0.8}
      side={THREE.DoubleSide}
    />
  );
};

// --- Wall Geometry ---
interface WallBlockProps {
  position: [number, number, number];
  rotation: [number, number, number];
}

const WallBlock: React.FC<WallBlockProps> = ({ position, rotation }) => {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={[CELL_SIZE, WALL_HEIGHT, 0.1]} />
      <PsychedelicWallMaterial />
    </mesh>
  );
};

// --- Rotating Marker ---
const RotatingMarker = ({ text, color, position }: { text: string, color: string, position: [number, number, number] }) => {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.getElapsedTime();
      groupRef.current.position.y = position[1] + Math.sin(state.clock.getElapsedTime() * 2) * 0.1;
    }
  });

  return (
    <group ref={groupRef} position={position}>
      <Text
        fontSize={1.2}
        color={color}
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.05}
        outlineColor="#ffffff"
      >
        {text}
      </Text>
    </group>
  );
};

// --- Floor ---
const Floor = () => {
  return (
    <group position={[0, -1.01, 0]}>
      {/* Base dark plane - Moved down slightly to avoid Z-fighting with Grid */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#050505" roughness={0.1} metalness={0.5} />
      </mesh>
      {/* Thick Grid */}
      <Grid
        args={[200, 200]}
        cellSize={CELL_SIZE}
        cellThickness={1.5}
        cellColor="#330033"
        sectionSize={CELL_SIZE * 4}
        sectionThickness={1.5}
        sectionColor="#330033"
        fadeDistance={40}
        infiniteGrid
      />
    </group>
  );
}

// --- Maze Renderer ---
interface MazeRendererProps {
  maze: MazeData;
}

const MazeRenderer: React.FC<MazeRendererProps> = ({ maze }) => {
  const walls = useMemo(() => {
    const generatedWalls: React.ReactElement[] = [];
    const offset = (maze.width * CELL_SIZE) / 2 - CELL_SIZE / 2;

    maze.grid.forEach((row, y) => {
      row.forEach((cell, x) => {
        const cx = x * CELL_SIZE - offset;
        const cz = y * CELL_SIZE - offset;

        // North Wall
        if (cell.walls.N) {
          generatedWalls.push(
            <WallBlock key={`n-${x}-${y}`} position={[cx, 0, cz - CELL_SIZE / 2]} rotation={[0, 0, 0]} />
          );
        }
        // South Wall (only needed for last row usually, but maze logic double checks)
        if (cell.walls.S && y === maze.height - 1) {
          generatedWalls.push(
            <WallBlock key={`s-${x}-${y}`} position={[cx, 0, cz + CELL_SIZE / 2]} rotation={[0, 0, 0]} />
          );
        }

        // West Wall
        if (cell.walls.W) {
          generatedWalls.push(
            <WallBlock key={`w-${x}-${y}`} position={[cx - CELL_SIZE / 2, 0, cz]} rotation={[0, Math.PI / 2, 0]} />
          );
        }
        // East Wall (Last col)
        if (cell.walls.E && x === maze.width - 1) {
          generatedWalls.push(
            <WallBlock key={`e-${x}-${y}`} position={[cx + CELL_SIZE / 2, 0, cz]} rotation={[0, Math.PI / 2, 0]} />
          );
        }

        // Render Exit Markers
        if (cell.type === 'exitA') {
          generatedWalls.push(
            <group key={`exitA-${x}-${y}`} position={[cx, 0, cz]}>
              <RotatingMarker text="A" color="#00ff00" position={[0, 0.5, 0]} />
              {/* Glowing base */}
              <mesh position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.8, 32]} />
                <meshBasicMaterial color="#00aa00" opacity={0.5} transparent />
              </mesh>
            </group>
          )
        }
        if (cell.type === 'exitB') {
          generatedWalls.push(
            <group key={`exitB-${x}-${y}`} position={[cx, 0, cz]}>
              <RotatingMarker text="B" color="#0088ff" position={[0, 0.5, 0]} />
              <mesh position={[0, -0.9, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.8, 32]} />
                <meshBasicMaterial color="#0044aa" opacity={0.5} transparent />
              </mesh>
            </group>
          )
        }
        // Render Start Marker
        if (cell.type === 'start') {
          generatedWalls.push(
            <group key={`start-${x}-${y}`} position={[cx, -0.95, cz]}>
              <mesh rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[1.5, 1.5]} />
                <meshBasicMaterial color="#ffffff" opacity={0.2} transparent />
              </mesh>
            </group>
          )
        }

      });
    });
    return generatedWalls;
  }, [maze]);

  return <group>{walls}</group>;
};

// --- First Person Controller ---
interface ControllerProps {
  maze: MazeData;
  onExit: (type: 'A' | 'B') => void;
  onInput: () => void;
  onPlayerUpdate: (x: number, y: number, dir: Direction) => void;
  active: boolean;
}

const PlayerController: React.FC<ControllerProps> = ({ maze, onExit, onInput, onPlayerUpdate, active }) => {
  const { camera } = useThree();
  const [pos, setPos] = useState({ x: maze.start.x, y: maze.start.y });
  const [dirIdx, setDirIdx] = useState(0);
  const isMoving = useRef(false);

  // Smooth transitions
  const targetPos = useRef(new THREE.Vector3());
  const targetRot = useRef(new THREE.Quaternion());
  const dummy = useMemo(() => new THREE.Object3D(), []);

  // Initial setup
  useEffect(() => {
    const offset = (maze.width * CELL_SIZE) / 2 - CELL_SIZE / 2;
    // Start position
    const sx = maze.start.x * CELL_SIZE - offset;
    const sz = maze.start.y * CELL_SIZE - offset;

    dummy.position.set(sx, 0, sz);
    dummy.rotation.set(0, 0, 0); // Facing North
    dummy.updateMatrix();

    camera.position.copy(dummy.position);
    camera.quaternion.copy(dummy.quaternion);

    targetPos.current.copy(dummy.position);
    targetRot.current.copy(dummy.quaternion);

    setPos({ x: maze.start.x, y: maze.start.y });
    setDirIdx(0);
  }, [maze, camera, dummy]);

  // Sync player state to parent
  useEffect(() => {
    const directions: Direction[] = ['N', 'E', 'S', 'W'];
    onPlayerUpdate(pos.x, pos.y, directions[dirIdx]);
  }, [pos, dirIdx, onPlayerUpdate]);

  useEffect(() => {
    if (!active) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (isMoving.current) return;

      // Only count relevant keys for stats
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter'].includes(e.key)) {
        onInput();
      }

      const offset = (maze.width * CELL_SIZE) / 2 - CELL_SIZE / 2;
      const currentCell = maze.grid[pos.y][pos.x];

      const directions = [
        { dx: 0, dy: -1, label: 'N' }, // 0
        { dx: 1, dy: 0, label: 'E' },  // 1
        { dx: 0, dy: 1, label: 'S' },  // 2
        { dx: -1, dy: 0, label: 'W' }  // 3
      ];

      const facing = directions[dirIdx];

      if (e.key === 'Enter') {
        if (currentCell.type === 'exitA') onExit('A');
        else if (currentCell.type === 'exitB') onExit('B');
      }
      else if (e.key === 'ArrowUp') {
        const hasWall = (currentCell.walls as any)[facing.label];
        if (!hasWall) {
          const nx = pos.x + facing.dx;
          const ny = pos.y + facing.dy;
          if (nx >= 0 && nx < maze.width && ny >= 0 && ny < maze.height) {
            setPos({ x: nx, y: ny });
            const tx = nx * CELL_SIZE - offset;
            const tz = ny * CELL_SIZE - offset;
            targetPos.current.set(tx, 0, tz);
          }
        }
      } else if (e.key === 'ArrowDown') {
        const backIdx = (dirIdx + 2) % 4;
        const backFacing = directions[backIdx];
        const hasWall = (currentCell.walls as any)[backFacing.label];

        if (!hasWall) {
          const nx = pos.x + backFacing.dx;
          const ny = pos.y + backFacing.dy;
          if (nx >= 0 && nx < maze.width && ny >= 0 && ny < maze.height) {
            setPos({ x: nx, y: ny });
            const tx = nx * CELL_SIZE - offset;
            const tz = ny * CELL_SIZE - offset;
            targetPos.current.set(tx, 0, tz);
          }
        }

      } else if (e.key === 'ArrowLeft') {
        const newIdx = (dirIdx + 3) % 4;
        setDirIdx(newIdx);
        dummy.rotation.y += Math.PI / 2;
        targetRot.current.copy(dummy.quaternion);

      } else if (e.key === 'ArrowRight') {
        const newIdx = (dirIdx + 1) % 4;
        setDirIdx(newIdx);
        dummy.rotation.y -= Math.PI / 2;
        targetRot.current.copy(dummy.quaternion);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [active, dirIdx, pos, maze, onExit, onInput, dummy]);

  useFrame((state, delta) => {
    camera.position.lerp(targetPos.current, 10 * delta);
    camera.quaternion.slerp(targetRot.current, 10 * delta);
  });

  return null;
}

// --- Main 3D Component ---
interface Maze3DProps {
  maze: MazeData;
  onExit: (type: 'A' | 'B') => void;
  onInput: () => void;
  onPlayerUpdate: (x: number, y: number, dir: Direction) => void;
  active: boolean;
}

export const Maze3D: React.FC<Maze3DProps> = ({ maze, onExit, onInput, onPlayerUpdate, active }) => {
  return (
    <Canvas>
      <PerspectiveCamera makeDefault position={[0, 0, 0]} fov={75} near={0.1} far={50} />
      <ambientLight intensity={0.2} />
      <pointLight position={[0, 5, 0]} intensity={0.8} distance={20} decay={2} />
      <fog attach="fog" args={['#050505', 1, 15]} />
      <MazeRenderer maze={maze} />
      <Floor />
      <PlayerController maze={maze} onExit={onExit} onInput={onInput} onPlayerUpdate={onPlayerUpdate} active={active} />
    </Canvas>
  );
};