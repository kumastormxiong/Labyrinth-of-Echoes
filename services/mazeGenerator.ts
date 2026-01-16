import { MazeData, Cell, Direction } from '../types';

const DIRECTIONS: { [key in Direction]: { dx: number; dy: number; opposite: Direction } } = {
  N: { dx: 0, dy: -1, opposite: 'S' },
  S: { dx: 0, dy: 1, opposite: 'N' },
  E: { dx: 1, dy: 0, opposite: 'W' },
  W: { dx: -1, dy: 0, opposite: 'E' },
};

export const generateMaze = (size: number, entryX: number = 0, entryY: number = 0): MazeData => {
  // Initialize Grid
  const grid: Cell[][] = [];
  for (let y = 0; y < size; y++) {
    const row: Cell[] = [];
    for (let x = 0; x < size; x++) {
      row.push({
        x,
        y,
        walls: { N: true, S: true, E: true, W: true },
        visited: false,
        type: 'path',
      });
    }
    grid.push(row);
  }

  // Set Start
  // Ensure entry is within bounds (fallback to 0,0 if needed)
  if (entryX < 0 || entryX >= size) entryX = 0;
  if (entryY < 0 || entryY >= size) entryY = 0;

  grid[entryY][entryX].type = 'start';
  
  // DFS Algorithm
  const stack: Cell[] = [];
  let current = grid[entryY][entryX];
  current.visited = true;
  stack.push(current);

  while (stack.length > 0) {
    const neighbors: { dir: Direction; cell: Cell }[] = [];
    
    (Object.keys(DIRECTIONS) as Direction[]).forEach((dir) => {
      const { dx, dy } = DIRECTIONS[dir];
      const nx = current.x + dx;
      const ny = current.y + dy;

      if (nx >= 0 && nx < size && ny >= 0 && ny < size && !grid[ny][nx].visited) {
        neighbors.push({ dir, cell: grid[ny][nx] });
      }
    });

    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      
      // Remove walls
      current.walls[next.dir] = false;
      next.cell.walls[DIRECTIONS[next.dir].opposite] = false;

      next.cell.visited = true;
      stack.push(current);
      current = next.cell;
    } else {
      current = stack.pop()!;
    }
  }

  // Place Exits (Far from start)
  const potentialExits: Cell[] = [];
  
  // Collect all edge cells that are NOT the start
  for(let y=0; y<size; y++) {
    for(let x=0; x<size; x++) {
       if (x === entryX && y === entryY) continue;
       // Only consider edges or corners
       if (x === 0 || x === size - 1 || y === 0 || y === size - 1) {
         // Calculate distance to ensure it's not too close (Manhattan distance > size/2)
         if (Math.abs(x - entryX) + Math.abs(y - entryY) > size / 2) {
           potentialExits.push(grid[y][x]);
         }
       }
    }
  }

  // Shuffle exits
  potentialExits.sort(() => Math.random() - 0.5);

  const exitA = potentialExits[0];
  const exitB = potentialExits[1] || potentialExits[0]; 

  grid[exitA.y][exitA.x].type = 'exitA';

  if (exitB !== exitA) {
      grid[exitB.y][exitB.x].type = 'exitB';
  }

  return {
    grid,
    width: size,
    height: size,
    start: { x: entryX, y: entryY },
    exitA: { x: exitA.x, y: exitA.y },
    exitB: { x: exitB.x, y: exitB.y },
  };
};