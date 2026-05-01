/**
 * Pattern Engine — generates arrays of Piece objects for each wall pattern.
 * All coordinates in inches, origin top-left of wall, angles degrees clockwise.
 *
 * @typedef {{ id: string, layer: string, x_in: number, y_in: number, w_in: number, h_in: number, angle_deg: number }} Piece
 * @typedef {{ width_in: number, height_in: number }} WallDims
 * @typedef {{ type: string, x_in: number, y_in: number, w_in: number, h_in: number }} Obstacle
 */

let _idCounter = 0;
function uid(prefix) {
  return `${prefix}-${++_idCounter}`;
}

/**
 * Returns null if piece center is fully outside wall, otherwise clips to wall bounds.
 */
export function clipToWall(piece, wallDims) {
  const x2 = piece.x_in + piece.w_in;
  const y2 = piece.y_in + piece.h_in;
  if (x2 <= 0 || piece.x_in >= wallDims.width_in) return null;
  if (y2 <= 0 || piece.y_in >= wallDims.height_in) return null;
  const clipped = {
    ...piece,
    x_in: Math.max(0, piece.x_in),
    y_in: Math.max(0, piece.y_in),
    w_in: Math.min(x2, wallDims.width_in) - Math.max(0, piece.x_in),
    h_in: Math.min(y2, wallDims.height_in) - Math.max(0, piece.y_in),
  };
  if (clipped.w_in <= 0 || clipped.h_in <= 0) return null;
  return clipped;
}

/**
 * Removes pieces whose bounding box is fully contained inside any obstacle.
 */
export function removePiecesInsideObstacles(pieces, obstacles) {
  if (!obstacles?.length) return pieces;
  return pieces.filter((p) => {
    return !obstacles.some(
      (o) =>
        p.x_in >= o.x_in &&
        p.y_in >= o.y_in &&
        p.x_in + p.w_in <= o.x_in + o.w_in &&
        p.y_in + p.h_in <= o.y_in + o.h_in
    );
  });
}

function clip(pieces, wallDims) {
  return pieces.map((p) => clipToWall(p, wallDims)).filter(Boolean);
}

// ─── 1. CHEVRON ─────────────────────────────────────────────────────────────

export function generateChevron(wallDims, params = {}) {
  const {
    spacing_in = 12,
    angle_deg = 45,
    thickness_in = 0.75,
    direction = 'up',
    mirror = false,
  } = params;

  const rad = (angle_deg * Math.PI) / 180;
  const projWidth = spacing_in / Math.sin(rad);
  const rows = Math.ceil(wallDims.height_in / spacing_in) + 1;
  const cols = Math.ceil(wallDims.width_in / projWidth) + 1;
  const pieces = [];
  const sign = direction === 'down' ? -1 : 1;

  for (let row = -1; row < rows; row++) {
    for (let col = -1; col < cols; col++) {
      const baseX = col * projWidth;
      const baseY = row * spacing_in;
      const leftAngle = mirror ? angle_deg * sign : -angle_deg * sign;
      const rightAngle = mirror ? -angle_deg * sign : angle_deg * sign;

      pieces.push({
        id: uid('chev-l'),
        layer: 'boards',
        x_in: baseX,
        y_in: baseY,
        w_in: projWidth / 2,
        h_in: thickness_in,
        angle_deg: leftAngle,
      });
      pieces.push({
        id: uid('chev-r'),
        layer: 'boards',
        x_in: baseX + projWidth / 2,
        y_in: baseY,
        w_in: projWidth / 2,
        h_in: thickness_in,
        angle_deg: rightAngle,
      });
    }
  }

  return clip(pieces, wallDims);
}

// ─── 2. HERRINGBONE ─────────────────────────────────────────────────────────

export function generateHerringbone(wallDims, params = {}) {
  const { tile_w_in = 6, tile_h_in = 24, angle_deg = 45 } = params;
  const pieces = [];
  const step = tile_h_in * 0.7;
  const cols = Math.ceil(wallDims.width_in / step) + 2;
  const rows = Math.ceil(wallDims.height_in / step) + 2;

  for (let row = -1; row < rows; row++) {
    for (let col = -1; col < cols; col++) {
      const cx = col * step;
      const cy = row * step;
      pieces.push({
        id: uid('hb-a'),
        layer: 'boards',
        x_in: cx,
        y_in: cy,
        w_in: tile_h_in,
        h_in: tile_w_in,
        angle_deg: angle_deg,
      });
      pieces.push({
        id: uid('hb-b'),
        layer: 'boards',
        x_in: cx + tile_w_in * 0.5,
        y_in: cy + tile_w_in * 0.5,
        w_in: tile_h_in,
        h_in: tile_w_in,
        angle_deg: -angle_deg,
      });
    }
  }

  return clip(pieces, wallDims);
}

// ─── 3. BOARD & BATTEN ──────────────────────────────────────────────────────

export function generateBoardBatten(wallDims, params = {}) {
  const {
    vertical_spacing_in = 16,
    batten_w_in = 3.5,
    thickness_in = 0.75,
    include_chair_rail = true,
    rail_height_in = 36,
  } = params;

  const pieces = [];
  const cols = Math.ceil(wallDims.width_in / vertical_spacing_in) + 1;

  for (let col = 0; col <= cols; col++) {
    const x = col * vertical_spacing_in - batten_w_in / 2;
    pieces.push({
      id: uid('batten'),
      layer: 'battens',
      x_in: x,
      y_in: 0,
      w_in: batten_w_in,
      h_in: wallDims.height_in,
      angle_deg: 0,
    });
  }

  if (include_chair_rail) {
    pieces.push({
      id: uid('rail'),
      layer: 'rail',
      x_in: 0,
      y_in: wallDims.height_in - rail_height_in - thickness_in,
      w_in: wallDims.width_in,
      h_in: thickness_in * 2,
      angle_deg: 0,
    });
  }

  // Baseboard
  pieces.push({
    id: uid('base'),
    layer: 'baseboard',
    x_in: 0,
    y_in: wallDims.height_in - 4,
    w_in: wallDims.width_in,
    h_in: 4,
    angle_deg: 0,
  });

  return clip(pieces, wallDims);
}

// ─── 4. SHIPLAP ─────────────────────────────────────────────────────────────

export function generateShiplap(wallDims, params = {}) {
  const { board_w_in = 7.25, overlap_in = 1, orientation = 'horizontal' } = params;
  const pieces = [];
  const effective = board_w_in - overlap_in;

  if (orientation === 'horizontal') {
    let y = 0;
    let i = 0;
    while (y < wallDims.height_in) {
      const isRip = y + board_w_in > wallDims.height_in;
      pieces.push({
        id: uid('shiplap'),
        layer: isRip ? 'rip' : 'boards',
        x_in: 0,
        y_in: y,
        w_in: wallDims.width_in,
        h_in: board_w_in,
        angle_deg: 0,
      });
      y += effective;
      i++;
    }
  } else {
    let x = 0;
    while (x < wallDims.width_in) {
      const isRip = x + board_w_in > wallDims.width_in;
      pieces.push({
        id: uid('shiplap-v'),
        layer: isRip ? 'rip' : 'boards',
        x_in: x,
        y_in: 0,
        w_in: board_w_in,
        h_in: wallDims.height_in,
        angle_deg: 0,
      });
      x += effective;
    }
  }

  return clip(pieces, wallDims);
}

// ─── 5. VERTICAL SLAT ───────────────────────────────────────────────────────

export function generateVerticalSlat(wallDims, params = {}) {
  const { slat_w_in = 1.5, gap_in = 1.5 } = params;
  const pieces = [];
  const unit = slat_w_in + gap_in;
  const count = Math.floor(wallDims.width_in / unit);
  const remainder = wallDims.width_in - count * unit;
  const startOffset = remainder / 2;

  for (let i = 0; i < count; i++) {
    pieces.push({
      id: uid('slat'),
      layer: 'boards',
      x_in: startOffset + i * unit,
      y_in: 0,
      w_in: slat_w_in,
      h_in: wallDims.height_in,
      angle_deg: 0,
    });
  }

  return clip(pieces, wallDims);
}

// ─── 6. DIAGONAL ─────────────────────────────────────────────────────────────

export function generateDiagonal(wallDims, params = {}) {
  const { board_w_in = 3.5, gap_in = 0.25, angle_deg = 45 } = params;
  const pieces = [];
  const pitch = board_w_in + gap_in;
  const rad = (angle_deg * Math.PI) / 180;
  const diagLen = Math.sqrt(wallDims.width_in ** 2 + wallDims.height_in ** 2) + 24;
  const count = Math.ceil((wallDims.width_in + wallDims.height_in) / pitch) + 4;

  for (let i = -2; i < count; i++) {
    const offset = i * pitch - wallDims.height_in / 2;
    pieces.push({
      id: uid('diag'),
      layer: 'boards',
      x_in: wallDims.width_in / 2 + offset * Math.cos(rad + Math.PI / 2) - diagLen / 2,
      y_in: wallDims.height_in / 2 + offset * Math.sin(rad + Math.PI / 2) - board_w_in / 2,
      w_in: diagLen,
      h_in: board_w_in,
      angle_deg: angle_deg,
    });
  }

  return clip(pieces, wallDims);
}

// ─── 7. HEXAGON ─────────────────────────────────────────────────────────────

export function generateHexagon(wallDims, params = {}) {
  const { size_in = 8 } = params;
  const pieces = [];
  const w = size_in * 2;
  const h = size_in * Math.sqrt(3);
  const cols = Math.ceil(wallDims.width_in / (w * 0.75)) + 2;
  const rows = Math.ceil(wallDims.height_in / h) + 2;

  for (let row = -1; row < rows; row++) {
    for (let col = -1; col < cols; col++) {
      const x = col * w * 0.75;
      const y = row * h + (col % 2 === 0 ? 0 : h / 2);
      for (let side = 0; side < 6; side++) {
        const sideAngle = (side * 60 * Math.PI) / 180;
        const nextAngle = ((side + 1) * 60 * Math.PI) / 180;
        const cx = x + size_in;
        const cy = y + h / 2;
        const x1 = cx + size_in * Math.cos(sideAngle);
        const y1 = cy + size_in * Math.sin(sideAngle);
        const x2 = cx + size_in * Math.cos(nextAngle);
        const y2 = cy + size_in * Math.sin(nextAngle);
        const minX = Math.min(x1, x2);
        const minY = Math.min(y1, y2);
        const segW = Math.abs(x2 - x1) || 0.75;
        const segH = Math.abs(y2 - y1) || 0.75;
        pieces.push({
          id: uid('hex'),
          layer: 'boards',
          x_in: minX,
          y_in: minY,
          w_in: Math.max(segW, 0.5),
          h_in: Math.max(segH, 0.5),
          angle_deg: (side * 60),
        });
      }
    }
  }

  return clip(pieces, wallDims);
}

// ─── 8. FAUX BEAM ─────────────────────────────────────────────────────────

export function generateFauxBeam(wallDims, params = {}) {
  const { beam_w_in = 5.5, spacing_in = 24, orientation = 'vertical' } = params;
  const pieces = [];

  if (orientation === 'vertical') {
    let x = 0;
    while (x < wallDims.width_in) {
      pieces.push({
        id: uid('beam'),
        layer: 'boards',
        x_in: x,
        y_in: 0,
        w_in: beam_w_in,
        h_in: wallDims.height_in,
        angle_deg: 0,
      });
      x += beam_w_in + spacing_in;
    }
  } else {
    let y = 0;
    while (y < wallDims.height_in) {
      pieces.push({
        id: uid('beam-h'),
        layer: 'boards',
        x_in: 0,
        y_in: y,
        w_in: wallDims.width_in,
        h_in: beam_w_in,
        angle_deg: 0,
      });
      y += beam_w_in + spacing_in;
    }
  }

  return clip(pieces, wallDims);
}

// ─── 9. WAVE ─────────────────────────────────────────────────────────────────

export function generateWave(wallDims, params = {}) {
  const { amplitude_in = 4, period_in = 24, board_w_in = 0.75 } = params;
  const pieces = [];
  const numWaves = Math.ceil(wallDims.height_in / (amplitude_in * 2)) + 2;
  const segments = Math.ceil(wallDims.width_in / 3) + 1;

  for (let w = -1; w < numWaves; w++) {
    const waveY = w * amplitude_in * 2.5;
    for (let s = 0; s < segments; s++) {
      const x = (s / segments) * wallDims.width_in;
      const nextX = ((s + 1) / segments) * wallDims.width_in;
      const y = waveY + amplitude_in * Math.sin((2 * Math.PI * x) / period_in);
      const nextY = waveY + amplitude_in * Math.sin((2 * Math.PI * nextX) / period_in);
      const dx = nextX - x;
      const dy = nextY - y;
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      const segLen = Math.sqrt(dx * dx + dy * dy);
      pieces.push({
        id: uid('wave'),
        layer: 'boards',
        x_in: x,
        y_in: y - board_w_in / 2,
        w_in: segLen,
        h_in: board_w_in,
        angle_deg: angle,
      });
    }
  }

  return clip(pieces, wallDims);
}

// ─── 10. ARCHED NICHE ────────────────────────────────────────────────────────

export function generateArchedNiche(wallDims, params = {}) {
  const { niche_radius_in = 18, grid_spacing_in = 12 } = params;
  const pieces = [];
  const cols = Math.ceil(wallDims.width_in / grid_spacing_in);
  const rows = Math.ceil(wallDims.height_in / grid_spacing_in);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      pieces.push({
        id: uid('niche-h'),
        layer: 'boards',
        x_in: col * grid_spacing_in,
        y_in: row * grid_spacing_in,
        w_in: wallDims.width_in,
        h_in: 0.75,
        angle_deg: 0,
      });
    }
  }
  for (let col = 0; col <= cols; col++) {
    pieces.push({
      id: uid('niche-v'),
      layer: 'boards',
      x_in: col * grid_spacing_in,
      y_in: 0,
      w_in: 0.75,
      h_in: wallDims.height_in,
      angle_deg: 0,
    });
  }

  // Arch frame in center
  const archCX = wallDims.width_in / 2;
  const archBottom = wallDims.height_in * 0.7;
  const archTop = archBottom - niche_radius_in;
  pieces.push({
    id: uid('arch-rect'),
    layer: 'trim',
    x_in: archCX - niche_radius_in,
    y_in: archTop,
    w_in: niche_radius_in * 2,
    h_in: wallDims.height_in - archTop,
    angle_deg: 0,
  });

  const archSegs = 20;
  for (let i = 0; i <= archSegs; i++) {
    const ang = (i / archSegs) * Math.PI;
    const x = archCX + niche_radius_in * Math.cos(Math.PI - ang);
    const y = archTop + niche_radius_in * (1 - Math.sin(ang));
    pieces.push({
      id: uid('arch-seg'),
      layer: 'trim',
      x_in: x - 0.5,
      y_in: y - 0.5,
      w_in: 1.5,
      h_in: 1.5,
      angle_deg: 0,
    });
  }

  return clip(pieces, wallDims);
}

// ─── 11. INDUSTRIAL PIPE ──────────────────────────────────────────────────────

export function generateIndustrial(wallDims, params = {}) {
  const { plank_w_in = 8, pipe_reveal_in = 1 } = params;
  return generateShiplap(wallDims, {
    board_w_in: plank_w_in,
    overlap_in: -pipe_reveal_in,
    orientation: 'horizontal',
  });
}

// ─── 12. FLUTED ───────────────────────────────────────────────────────────────

export function generateFluted(wallDims, params = {}) {
  const { flute_w_in = 1.5, spacing_in = 4 } = params;
  return generateVerticalSlat(wallDims, {
    slat_w_in: flute_w_in,
    gap_in: spacing_in - flute_w_in,
  });
}

// ─── 13. DIAMOND PARQUET ─────────────────────────────────────────────────────

export function generateDiamond(wallDims, params = {}) {
  const { size_in = 6, angle_deg = 45 } = params;
  const pieces = [];
  const step = size_in * Math.sqrt(2);
  const cols = Math.ceil(wallDims.width_in / step) + 2;
  const rows = Math.ceil(wallDims.height_in / step) + 2;

  for (let row = -1; row < rows; row++) {
    for (let col = -1; col < cols; col++) {
      pieces.push({
        id: uid('diamond'),
        layer: 'boards',
        x_in: col * step + (row % 2 === 0 ? 0 : step / 2),
        y_in: row * step * 0.5,
        w_in: size_in,
        h_in: size_in,
        angle_deg: angle_deg,
      });
    }
  }

  return clip(pieces, wallDims);
}

// ─── 14. LEDGE SHELF ─────────────────────────────────────────────────────────

export function generateLedgeShelf(wallDims, params = {}) {
  const { shelf_depth_in = 12, spacing_in = 24 } = params;
  const pieces = [];
  let y = spacing_in;

  while (y < wallDims.height_in) {
    pieces.push({
      id: uid('shelf'),
      layer: 'boards',
      x_in: 0,
      y_in: wallDims.height_in - y,
      w_in: wallDims.width_in,
      h_in: shelf_depth_in / 4,
      angle_deg: 0,
    });
    y += spacing_in;
  }

  return clip(pieces, wallDims);
}

// ─── 15. BRICK ────────────────────────────────────────────────────────────────

export function generateBrick(wallDims, params = {}) {
  const { brick_w_in = 8, brick_h_in = 4, offset_in = 4 } = params;
  const pieces = [];
  const mortar = 0.5;
  const rowPitch = brick_h_in + mortar;
  const rows = Math.ceil(wallDims.height_in / rowPitch) + 1;

  for (let row = 0; row < rows; row++) {
    const y = row * rowPitch;
    const startX = row % 2 === 0 ? 0 : -offset_in;
    let x = startX;
    while (x < wallDims.width_in + brick_w_in) {
      pieces.push({
        id: uid('brick'),
        layer: 'boards',
        x_in: x,
        y_in: y,
        w_in: brick_w_in,
        h_in: brick_h_in,
        angle_deg: 0,
      });
      x += brick_w_in + mortar;
    }
  }

  return clip(pieces, wallDims);
}

// ─── 16. ASYMMETRIC ZIG ────────────────────────────────────────────────────

function seededRand(seed) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateAsymZig(wallDims, params = {}) {
  const { base_spacing_in = 12, variance_in = 3, seed = 42 } = params;
  const pieces = [];
  const rand = seededRand(seed);
  const rad = (45 * Math.PI) / 180;
  const projWidth = base_spacing_in / Math.sin(rad);
  let y = 0;
  let row = 0;

  while (y < wallDims.height_in + base_spacing_in) {
    const spacing = base_spacing_in + (rand() * 2 - 1) * variance_in;
    const pw = spacing / Math.sin(rad);
    const cols = Math.ceil(wallDims.width_in / pw) + 1;

    for (let col = -1; col < cols; col++) {
      const baseX = col * pw;
      pieces.push({
        id: uid('zig-l'),
        layer: 'boards',
        x_in: baseX,
        y_in: y,
        w_in: pw / 2,
        h_in: 0.75,
        angle_deg: -45,
      });
      pieces.push({
        id: uid('zig-r'),
        layer: 'boards',
        x_in: baseX + pw / 2,
        y_in: y,
        w_in: pw / 2,
        h_in: 0.75,
        angle_deg: 45,
      });
    }

    y += spacing;
    row++;
  }

  return clip(pieces, wallDims);
}

// ─── 17. WAINSCOT ────────────────────────────────────────────────────────────

export function generateWainscot(wallDims, params = {}) {
  const { wainscot_height_in = 48, rail_w_in = 5.5, panel_count = 4 } = params;
  const pieces = [];
  const panelW = (wallDims.width_in - rail_w_in) / Math.max(panel_count, 1);
  const frameThick = 3.5;
  const fromBottom = wallDims.height_in - wainscot_height_in;

  // Chair rail
  pieces.push({
    id: uid('w-rail'),
    layer: 'rail',
    x_in: 0,
    y_in: fromBottom - rail_w_in,
    w_in: wallDims.width_in,
    h_in: rail_w_in,
    angle_deg: 0,
  });

  // Baseboard
  pieces.push({
    id: uid('w-base'),
    layer: 'baseboard',
    x_in: 0,
    y_in: wallDims.height_in - frameThick,
    w_in: wallDims.width_in,
    h_in: frameThick,
    angle_deg: 0,
  });

  // Panel frames
  for (let p = 0; p < panel_count; p++) {
    const px = p * panelW;
    const py = fromBottom;
    const pw = panelW - frameThick;
    const ph = wainscot_height_in - rail_w_in - frameThick * 2;
    pieces.push({
      id: uid('w-panel-top'),
      layer: 'boards',
      x_in: px,
      y_in: py,
      w_in: pw,
      h_in: frameThick,
      angle_deg: 0,
    });
    pieces.push({
      id: uid('w-panel-bot'),
      layer: 'boards',
      x_in: px,
      y_in: py + ph + frameThick,
      w_in: pw,
      h_in: frameThick,
      angle_deg: 0,
    });
    pieces.push({
      id: uid('w-panel-l'),
      layer: 'boards',
      x_in: px,
      y_in: py,
      w_in: frameThick,
      h_in: ph + frameThick * 2,
      angle_deg: 0,
    });
    pieces.push({
      id: uid('w-panel-r'),
      layer: 'boards',
      x_in: px + pw - frameThick,
      y_in: py,
      w_in: frameThick,
      h_in: ph + frameThick * 2,
      angle_deg: 0,
    });
  }

  return clip(pieces, wallDims);
}

// ─── ZIGZAG (alias for asym-zig with no variance) ─────────────────────────

export function generateZigzag(wallDims, params = {}) {
  return generateChevron(wallDims, {
    spacing_in: params.spacing_in ?? 10,
    angle_deg: params.angle_deg ?? 60,
    thickness_in: params.thickness_in ?? 0.75,
    direction: 'up',
    mirror: false,
  });
}

// ─── DISPATCH ─────────────────────────────────────────────────────────────

const GENERATORS = {
  chevron: generateChevron,
  zigzag: generateZigzag,
  'board-batten': generateBoardBatten,
  shiplap: generateShiplap,
  'vertical-slat': generateVerticalSlat,
  diagonal: generateDiagonal,
  hexagon: generateHexagon,
  'faux-beam': generateFauxBeam,
  wave: generateWave,
  'arched-niche': generateArchedNiche,
  industrial: generateIndustrial,
  fluted: generateFluted,
  diamond: generateDiamond,
  'ledge-shelf': generateLedgeShelf,
  brick: generateBrick,
  'asym-zig': generateAsymZig,
  wainscot: generateWainscot,
};

/**
 * Main entry point. Call with the pattern type, wall dims, params, and obstacles.
 * Returns a filtered array of Piece objects ready for the renderer.
 */
export function generatePattern(patternType, wallDims, params = {}, obstacles = []) {
  const gen = GENERATORS[patternType];
  if (!gen) {
    console.warn(`Unknown pattern type: ${patternType}`);
    return [];
  }
  const pieces = gen(wallDims, params);
  return removePiecesInsideObstacles(pieces, obstacles);
}
