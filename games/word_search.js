const WORDS = [
  "FAITH", "TEMPLE", "SCRIPTURE", "PRAYER", "SERVICE",
  "PROPHET", "BAPTISM", "FAMILY", "GOSPEL", "COVENANT",
  "CHARITY", "REVELATION", "MORMON", "ZION", "HOLYGHOST"
];

const SIZE = 15;
const DIRECTIONS = [
  [0, 1], [1, 0], [0, -1], [-1, 0],
  [1, 1], [1, -1], [-1, 1], [-1, -1]
];

function makeGrid() {
  const grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(""));
  const placements = [];
  const shuffledWords = [...WORDS].sort(() => Math.random() - 0.5);

  for (const word of shuffledWords) {
    let placed = false;
    for (let attempt = 0; attempt < 1000 && !placed; attempt++) {
      const [dr, dc] = DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];
      const row = Math.floor(Math.random() * SIZE);
      const col = Math.floor(Math.random() * SIZE);
      const endRow = row + dr * (word.length - 1);
      const endCol = col + dc * (word.length - 1);

      if (endRow < 0 || endRow >= SIZE || endCol < 0 || endCol >= SIZE) continue;

      let valid = true;
      for (let i = 0; i < word.length; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        if (grid[r][c] && grid[r][c] !== word[i]) valid = false;
      }
      if (!valid) continue;

      const cells = [];
      for (let i = 0; i < word.length; i++) {
        const r = row + dr * i;
        const c = col + dc * i;
        grid[r][c] = word[i];
        cells.push(`${r}-${c}`);
      }
      placements.push({ word, cells });
      placed = true;
    }
  }

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) {
      if (!grid[r][c]) grid[r][c] = letters[Math.floor(Math.random() * letters.length)];
    }
  }
  return { grid, placements };
}

function renderPuzzle() {
  const { grid, placements } = makeGrid();
  const board = document.querySelector("#grid");
  const answerKey = document.querySelector("#answer-key");
  board.innerHTML = "";
  answerKey.innerHTML = "";

  for (const row of grid) {
    for (const letter of row) {
      const cell = document.createElement("span");
      cell.className = "cell";
      cell.textContent = letter;
      board.appendChild(cell);
    }
  }

  for (const placement of placements) {
    const item = document.createElement("li");
    item.textContent = placement.word;
    answerKey.appendChild(item);
  }

  document.querySelector("#show-answers").onclick = () => {
    document.querySelectorAll(".cell").forEach((cell, index) => {
      const id = `${Math.floor(index / SIZE)}-${index % SIZE}`;
      if (placements.some((p) => p.cells.includes(id))) cell.classList.add("answer");
    });
  };
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelector("#new-puzzle").addEventListener("click", renderPuzzle);
  renderPuzzle();
});