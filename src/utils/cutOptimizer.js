/**
 * Cut Optimizer — First-Fit Decreasing bin packing.
 *
 * @param {{ needed: number[], stockLen?: number, kerf?: number }} opts
 * @returns {{ boards: Board[], totalBoards: number, totalUsedLen: number, totalWasteLen: number, wastePct: number }}
 */
export function generateCutList({ needed, stockLen = 96, kerf = 0.125 }) {
  if (!needed?.length) {
    return { boards: [], totalBoards: 0, totalUsedLen: 0, totalWasteLen: 0, wastePct: 0 };
  }

  const sorted = [...needed].sort((a, b) => b - a);
  const boards = [];

  for (const cut of sorted) {
    if (cut > stockLen) {
      throw new Error(`Cut ${cut}" exceeds stock length ${stockLen}"`);
    }

    const board = boards.find((b) => {
      const addKerf = b.cuts.length > 0 ? kerf : 0;
      return b.usedLen + addKerf + cut <= stockLen;
    });

    if (board) {
      const addKerf = board.cuts.length > 0 ? kerf : 0;
      board.cuts.push(cut);
      board.usedLen += addKerf + cut;
    } else {
      boards.push({ index: boards.length + 1, cuts: [cut], usedLen: cut });
    }
  }

  for (const b of boards) {
    b.wasteLen = +(stockLen - b.usedLen).toFixed(3);
    b.wastePct = +(100 * b.wasteLen / stockLen).toFixed(1);
  }

  const totalUsedLen = boards.reduce((s, b) => s + b.usedLen, 0);
  const totalWasteLen = boards.length * stockLen - totalUsedLen;

  return {
    boards,
    totalBoards: boards.length,
    totalUsedLen: +totalUsedLen.toFixed(2),
    totalWasteLen: +totalWasteLen.toFixed(2),
    wastePct: +(100 * totalWasteLen / (boards.length * stockLen)).toFixed(1),
  };
}
