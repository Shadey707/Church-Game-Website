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

let placements = [];
let selectedCell = null;
let foundWords = new Set();

function makeGrid() {
  const grid = Array.from(
    { length: SIZE },
    () => Array(SIZE).fill("")
  );

  placements = [];

  for (const word of [...WORDS].sort(() => Math.random() - 0.5)) {
    let placed = false;

    for (let attempt = 0; attempt < 1000 && !placed; attempt++) {
      const [dr, dc] =
        DIRECTIONS[Math.floor(Math.random() * DIRECTIONS.length)];

      const row = Math.floor(Math.random() * SIZE);
      const col = Math.floor(Math.random() * SIZE);

      const endRow = row + dr * (word.length - 1);
      const endCol = col + dc * (word.length - 1);

      if (
        endRow < 0 || endRow >= SIZE ||
        endCol < 0 || endCol >= SIZE
      ) {
        continue;
      }

      let valid = true;

      for (let i = 0; i < word.length; i++) {
        const r = row + dr * i;
        const c = col + dc * i;

        if (grid[r][c] && grid[r][c] !== word[i]) {
          valid = false;
        }
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

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      if (!grid[row][col]) {
        grid[row][col] =
          letters[Math.floor(Math.random() * letters.length)];
      }
    }
  }

  return grid;
}

function renderPuzzle() {
  const grid = makeGrid();
  const gridElement = document.querySelector("#grid");
  const wordsElement = document.querySelector("#words");
  const status = document.querySelector("#status");

  selectedCell = null;
  foundWords = new Set();

  gridElement.innerHTML = "";
  wordsElement.innerHTML = "";

  status.textContent =
    "Click the first and last letter of a word.";

  for (let row = 0; row < SIZE; row++) {
    for (let col = 0; col < SIZE; col++) {
      const cell = document.createElement("div");

      cell.className = "cell";
      cell.textContent = grid[row][col];
      cell.dataset.position = `${row}-${col}`;

      cell.addEventListener("click", () => {
        selectCell(row, col, cell);
      });

      gridElement.appendChild(cell);
    }
  }

  for (const word of WORDS) {
    const item = document.createElement("li");

    item.textContent = word;
    item.dataset.word = word;

    wordsElement.appendChild(item);
  }
}

function selectCell(row, col, cell) {
  const currentCell = `${row}-${col}`;

  if (!selectedCell) {
    selectedCell = currentCell;
    cell.classList.add("selected");

    document.querySelector("#status").textContent =
      "Now click the last letter.";

    return;
  }

  const match = placements.find(placement => {
    const first = placement.cells[0];
    const last = placement.cells[placement.cells.length - 1];

    return (
      (first === selectedCell && last === currentCell) ||
      (last === selectedCell && first === currentCell)
    );
  });

  document
    .querySelectorAll(".selected")
    .forEach(cell => cell.classList.remove("selected"));

  if (match && !foundWords.has(match.word)) {
    foundWords.add(match.word);

    match.cells.forEach(position => {
      document
        .querySelector(`[data-position="${position}"]`)
        .classList.add("found");
    });

    document
      .querySelector(`[data-word="${match.word}"]`)
      .classList.add("completed");

    if (foundWords.size === placements.length) {
      document.querySelector("#status").textContent =
        "Great job! You found every word!";
    } else {
      document.querySelector("#status").textContent =
        `${foundWords.size} of ${placements.length} words found!`;
    }
  } else {
    document.querySelector("#status").textContent =
      "That is not a hidden word. Try again.";
  }

  selectedCell = null;
}

function showAnswers() {
  placements.forEach(placement => {
    placement.cells.forEach(position => {
      document
        .querySelector(`[data-position="${position}"]`)
        .classList.add("found");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document
    .querySelector("#new-puzzle")
    .addEventListener("click", renderPuzzle);

  document
    .querySelector("#show-answers")
    .addEventListener("click", showAnswers);

  renderPuzzle();
});