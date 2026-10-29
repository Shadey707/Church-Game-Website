const DEFAULT_WORDS = [
  "FAITH", "TEMPLE", "SCRIPTURE", "PRAYER", "SERVICE",
  "PROPHET", "BAPTISM", "FAMILY", "GOSPEL", "COVENANT",
  "CHARITY", "REVELATION", "MORMON", "ZION", "HOLYGHOST"
];

const DIRECTIONS = [
  [0, 1], [1, 0], [0, -1], [-1, 0],
  [1, 1], [1, -1], [-1, 1], [-1, -1]
];

let puzzle = null;
let selectedStart = null;
let isDragging = false;
let currentPath = [];
let foundWords = new Set();
let pointerId = null;

const $ = selector => document.querySelector(selector);

function shuffle(items) {
  const result = [...items];

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
}

function normalizeWord(raw) {
  return raw.toUpperCase().replace(/[^A-Z]/g, "");
}

function parseCustomWords(text) {
  const lines = text.split(/\r?\n/);
  const words = [];
  const seen = new Set();

  for (const line of lines) {
    const word = normalizeWord(line.trim());

    if (word.length < 2 || seen.has(word)) {
      continue;
    }

    seen.add(word);
    words.push(word);
  }

  return words;
}

function canPlaceWord(grid, word, row, col, dr, dc) {
  const size = grid.length;

  const endRow = row + dr * (word.length - 1);
  const endCol = col + dc * (word.length - 1);

  if (
    endRow < 0 || endRow >= size ||
    endCol < 0 || endCol >= size
  ) {
    return false;
  }

  for (let i = 0; i < word.length; i++) {
    const r = row + dr * i;
    const c = col + dc * i;

    if (grid[r][c] !== "" && grid[r][c] !== word[i]) {
      return false;
    }
  }

  return true;
}

function placeWord(grid, word) {
  const size = grid.length;
  const options = [];

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      for (const [dr, dc] of DIRECTIONS) {
        if (canPlaceWord(grid, word, row, col, dr, dc)) {
          let overlaps = 0;

          for (let i = 0; i < word.length; i++) {
            if (grid[row + dr * i][col + dc * i] === word[i]) {
              overlaps++;
            }
          }

          options.push({ row, col, dr, dc, overlaps });
        }
      }
    }
  }

  if (options.length === 0) {
    return null;
  }

  // Prefer placements that share matching letters.
  options.sort((a, b) => b.overlaps - a.overlaps);

  const pool = options.slice(0, Math.min(30, options.length));
  const chosen = pool[Math.floor(Math.random() * pool.length)];
  const cells = [];

  for (let i = 0; i < word.length; i++) {
    const r = chosen.row + chosen.dr * i;
    const c = chosen.col + chosen.dc * i;

    grid[r][c] = word[i];
    cells.push(`${r}-${c}`);
  }

  return { word, cells };
}

function attemptPuzzle(words, size) {
  const grid = Array.from(
    { length: size },
    () => Array(size).fill("")
  );

  const placements = [];
  const orderedWords = [...words].sort(
    (a, b) => b.length - a.length
  );

  for (const word of orderedWords) {
    const placement = placeWord(grid, word);

    if (!placement) {
      return null;
    }

    placements.push(placement);
  }

  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (!grid[row][col]) {
        grid[row][col] =
          letters[Math.floor(Math.random() * letters.length)];
      }
    }
  }

  return {
    grid,
    placements,
    size,
    words: placements.map(placement => placement.word)
  };
}

function buildPuzzle(words, requestedSize, customMode) {
  if (customMode) {
    const longest = Math.max(...words.map(word => word.length));

    let size = Math.max(6, longest);
    size = Math.min(size, 30);

    while (size <= 30) {
      for (let attempt = 0; attempt < 12; attempt++) {
        const result = attemptPuzzle(shuffle(words), size);

        if (result) {
          return result;
        }
      }

      size++;
    }

    throw new Error(
      "These words are too difficult to fit together. Try using fewer words."
    );
  }

  const size = requestedSize;

  const suitableWords = shuffle(
    words.filter(word => word.length <= size)
  );

  const targetCount = Math.min(
    suitableWords.length,
    Math.max(3, Math.floor((size * size) / 18))
  );

  // Reduce the number of words if a combination won't fit.
  for (let count = targetCount; count >= 1; count--) {
    for (let attempt = 0; attempt < 18; attempt++) {
      const chosen = shuffle(suitableWords).slice(0, count);
      const result = attemptPuzzle(chosen, size);

      if (result) {
        return result;
      }
    }
  }

  throw new Error(
    "The puzzle could not be generated. Please try a different grid size."
  );
}

function cellKey(row, col) {
  return `${row}-${col}`;
}

function cellElement(key) {
  return $(`#grid [data-position="${key}"]`);
}

function renderPuzzle() {
  const gridElement = $("#grid");
  const wordsElement = $("#words");

  gridElement.innerHTML = "";
  wordsElement.innerHTML = "";

  gridElement.style.gridTemplateColumns =
    `repeat(${puzzle.size}, minmax(0, 1fr))`;

  gridElement.dataset.size = String(puzzle.size);

  for (let row = 0; row < puzzle.size; row++) {
    for (let col = 0; col < puzzle.size; col++) {
      const cell = document.createElement("div");

      cell.className = "cell";
      cell.textContent = puzzle.grid[row][col];
      cell.dataset.position = cellKey(row, col);
      cell.dataset.row = String(row);
      cell.dataset.col = String(col);

      cell.setAttribute(
        "aria-label",
        `${puzzle.grid[row][col]}, row ${row + 1}, column ${col + 1}`
      );

      gridElement.appendChild(cell);
    }
  }

  for (const word of puzzle.words) {
    const item = document.createElement("li");

    item.textContent = word;
    item.dataset.word = word;

    wordsElement.appendChild(item);
  }

  $("#game-size-label").textContent =
    `${puzzle.size} × ${puzzle.size} grid`;

  $("#setup").classList.add("hidden");
  $("#game").style.display = "block";

  resetSelection();
  updateProgress();

  setStatus(
    "Touch or click and drag from the first letter to the last, then release."
  );
}

function setStatus(message, type = "") {
  const status = $("#status");

  status.textContent = message;
  status.className = type;
}

function updateProgress() {
  $("#progress").textContent =
    `${foundWords.size} of ${puzzle.placements.length} words found`;
}

function resetSelection() {
  selectedStart = null;
  isDragging = false;
  currentPath = [];
  pointerId = null;

  document
    .querySelectorAll("#grid .selected, #grid .preview-invalid")
    .forEach(cell => {
      cell.classList.remove("selected", "preview-invalid");
    });
}

function getCellFromPoint(x, y) {
  const element = document.elementFromPoint(x, y);
  const cell = element && element.closest("#grid .cell");

  return cell || null;
}

function getStraightPath(startKey, endKey) {
  const [startRow, startCol] = startKey.split("-").map(Number);
  const [endRow, endCol] = endKey.split("-").map(Number);

  const rowDifference = endRow - startRow;
  const colDifference = endCol - startCol;

  if (
    rowDifference !== 0 &&
    colDifference !== 0 &&
    Math.abs(rowDifference) !== Math.abs(colDifference)
  ) {
    return null;
  }

  const steps = Math.max(
    Math.abs(rowDifference),
    Math.abs(colDifference)
  );

  if (steps === 0) {
    return [startKey];
  }

  const dr = Math.sign(rowDifference);
  const dc = Math.sign(colDifference);
  const path = [];

  for (let i = 0; i <= steps; i++) {
    path.push(
      cellKey(
        startRow + dr * i,
        startCol + dc * i
      )
    );
  }

  return path;
}

function clearPreview() {
  document
    .querySelectorAll("#grid .selected, #grid .preview-invalid")
    .forEach(cell => {
      cell.classList.remove("selected", "preview-invalid");
    });
}

function previewPath(endKey) {
  clearPreview();

  const path = getStraightPath(selectedStart, endKey);

  currentPath = path || [selectedStart, endKey];

  for (const key of currentPath) {
    const cell = cellElement(key);

    if (cell) {
      cell.classList.add(
        path ? "selected" : "preview-invalid"
      );
    }
  }
}

function pathWord(path) {
  return path.map(key => {
    const [row, col] = key.split("-").map(Number);
    return puzzle.grid[row][col];
  }).join("");
}

function handlePointerDown(event) {
  const cell = event.target.closest("#grid .cell");

  if (!cell || event.button > 0) {
    return;
  }

  event.preventDefault();
  resetSelection();

  isDragging = true;
  pointerId = event.pointerId;
  selectedStart = cell.dataset.position;
  currentPath = [selectedStart];

  cell.classList.add("selected");

  try {
    $("#grid").setPointerCapture(event.pointerId);
  } catch (_) {
    // Pointer capture may not be supported in every environment.
  }
}

function handlePointerMove(event) {
  if (!isDragging || event.pointerId !== pointerId) {
    return;
  }

  event.preventDefault();

  const cell = getCellFromPoint(
    event.clientX,
    event.clientY
  );

  if (cell) {
    previewPath(cell.dataset.position);
  }
}

function handlePointerUp(event) {
  if (!isDragging || event.pointerId !== pointerId) {
    return;
  }

  event.preventDefault();

  const endCell = getCellFromPoint(
    event.clientX,
    event.clientY
  );

  const endKey = endCell ? endCell.dataset.position : null;
  const startKey = selectedStart;

  isDragging = false;
  pointerId = null;

  if (!endKey || !startKey) {
    resetSelection();
    setStatus("Selection cancelled. Try dragging across a word.");
    return;
  }

  const path = getStraightPath(startKey, endKey);

  if (!path || path.length < 2) {
    resetSelection();
    setStatus(
      "Drag in a straight line across at least two letters.",
      "error"
    );
    return;
  }

  const selectedWord = pathWord(path);
  const reverseWord = [...selectedWord].reverse().join("");

  const placement = puzzle.placements.find(item =>
    item.word === selectedWord ||
    item.word === reverseWord
  );

  clearPreview();

  if (!placement) {
    resetSelection();
    setStatus("Not a hidden word. Try again!", "error");
    return;
  }

  if (foundWords.has(placement.word)) {
    resetSelection();
    setStatus(`${placement.word} has already been found.`);
    return;
  }

  foundWords.add(placement.word);

  placement.cells.forEach(key => {
    const cell = cellElement(key);

    if (cell) {
      cell.classList.add("found");
    }
  });

  const listItem = $(
    `#words [data-word="${placement.word}"]`
  );

  if (listItem) {
    listItem.classList.add("completed");
  }

  resetSelection();
  updateProgress();

  if (foundWords.size === puzzle.placements.length) {
    setStatus("Great job! You found every word!", "success");
  } else {
    setStatus(`Yes! You found ${placement.word}.`, "success");
  }
}

function showAnswers() {
  for (const placement of puzzle.placements) {
    foundWords.add(placement.word);

    placement.cells.forEach(key => {
      const cell = cellElement(key);

      if (cell) {
        cell.classList.add("found");
      }
    });

    const listItem = $(
      `#words [data-word="${placement.word}"]`
    );

    if (listItem) {
      listItem.classList.add("completed");
    }
  }

  resetSelection();
  updateProgress();
  setStatus("All answers are shown.", "success");
}

function startGame() {
  const mode = $('input[name="word-mode"]:checked').value;
  const customMode = mode === "custom";

  let words;
  const requestedSize = Number($("#grid-size").value);

  if (customMode) {
    words = parseCustomWords($("#custom-words").value);

    if (words.length === 0) {
      $("#setup-message").textContent =
        "Enter at least one word with two or more letters.";
      return;
    }

    const tooLong = words.filter(word => word.length > 30);

    if (tooLong.length > 0) {
      $("#setup-message").textContent =
        `These words exceed the 30-letter limit: ${tooLong.join(", ")}. Please shorten them.`;
      return;
    }
  } else {
    words = DEFAULT_WORDS;
  }

  $("#setup-message").textContent = "";

  try {
    puzzle = buildPuzzle(words, requestedSize, customMode);
    foundWords = new Set();
    renderPuzzle();
  } catch (error) {
    $("#setup-message").textContent = error.message;
  }
}

function showCorrectOptions() {
  const customMode =
    $('input[name="word-mode"]:checked').value === "custom";

  $("#default-options").classList.toggle(
    "hidden",
    customMode
  );

  $("#custom-options").classList.toggle(
    "hidden",
    !customMode
  );

  $("#setup-message").textContent = "";
}

document.addEventListener("DOMContentLoaded", () => {
  document
    .querySelectorAll('input[name="word-mode"]')
    .forEach(input => {
      input.addEventListener("change", showCorrectOptions);
    });

  $("#start-game").addEventListener("click", startGame);
  $("#new-puzzle").addEventListener("click", startGame);
  $("#show-answers").addEventListener("click", showAnswers);

  $("#back-to-setup").addEventListener("click", () => {
    resetSelection();
    $("#game").style.display = "none";
    $("#setup").classList.remove("hidden");
  });

  const grid = $("#grid");

  grid.addEventListener("pointerdown", handlePointerDown);
  grid.addEventListener("pointermove", handlePointerMove);
  grid.addEventListener("pointerup", handlePointerUp);

  grid.addEventListener("pointercancel", () => {
    resetSelection();
    setStatus("Selection cancelled. Try again.");
  });

  showCorrectOptions();
});
