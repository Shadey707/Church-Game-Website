
// ==========================================
// TIC-TAC-TOE
// X = Player | O = Computer
// ==========================================

document.addEventListener("DOMContentLoaded", () => {
    // Game state
    let board = Array(9).fill("");
    let gameOver = false;
    let computerThinking = false;
    let difficulty = "easy";
    let computerTimer = null;

    const winningCombinations = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6]
    ];

    // Add the game's styles
    const style = document.createElement("style");
    style.textContent = `
        :root {
            --navy: #0B2D57;
            --blue: #386DA8;
            --light-blue: #D8E7F7;
            --gold: #FEAD21;
            --white: #FFFFFF;
        }

        * {
            box-sizing: border-box;
        }

        body {
            min-height: 100vh;
            margin: 0;
            padding: 32px 16px;
            display: grid;
            place-items: center;
            font-family: Arial, Helvetica, sans-serif;
            background: var(--light-blue);
            color: var(--navy);
        }

        button, select {
            font: inherit;
        }

        .game-container {
            width: min(100%, 460px);
            padding: 30px;
            background: var(--white);
            border: 1px solid #c4d8ee;
            border-radius: 22px;
            box-shadow: 0 12px 35px rgba(11, 45, 87, 0.12);
            text-align: center;
        }

        .game-header {
            margin-bottom: 22px;
        }

        h1 {
            margin: 0 0 8px;
            color: var(--navy);
            font-size: clamp(2rem, 7vw, 2.6rem);
        }

        .subtitle {
            margin: 0;
            color: var(--blue);
            line-height: 1.5;
        }

        .controls {
            display: flex;
            justify-content: center;
            align-items: center;
            flex-wrap: wrap;
            gap: 10px;
            margin: 22px 0;
        }

        .controls label {
            font-weight: 700;
            color: var(--navy);
        }

        .difficulty-select {
            min-width: 130px;
            padding: 10px 36px 10px 12px;
            border: 2px solid var(--light-blue);
            border-radius: 10px;
            background: var(--white);
            color: var(--navy);
            cursor: pointer;
        }

        .difficulty-select:focus-visible,
        button:focus-visible {
            outline: 3px solid var(--gold);
            outline-offset: 3px;
        }

        .board {
            display: grid;
            grid-template-columns: repeat(3, minmax(0, 1fr));
            gap: 10px;
            width: min(100%, 340px);
            margin: 22px auto;
        }

        .cell {
            display: grid;
            place-items: center;
            aspect-ratio: 1;
            padding: 0;
            border: 2px solid transparent;
            border-radius: 14px;
            background: var(--light-blue);
            color: var(--navy);
            font-size: clamp(2.5rem, 14vw, 4rem);
            font-weight: 800;
            line-height: 1;
            cursor: pointer;
            transition: background 160ms ease, transform 160ms ease,
                        border-color 160ms ease;
        }

        .cell:hover:enabled {
            border-color: var(--blue);
            background: #c5dcf3;
            transform: translateY(-2px);
        }

        .cell:active:enabled {
            transform: scale(0.97);
        }

        .cell.mark-x {
            color: var(--navy);
        }

        .cell.mark-o {
            color: var(--blue);
        }

        .cell:disabled {
            cursor: default;
        }

        .cell.winning {
            border-color: var(--gold);
            background: #fff1d6;
            color: var(--navy);
            animation: winningPulse 700ms ease-in-out infinite alternate;
        }

        .status {
            display: grid;
            place-items: center;
            min-height: 54px;
            margin: 18px 0;
            padding: 12px 14px;
            border-radius: 12px;
            background: var(--light-blue);
            color: var(--navy);
            font-size: 1.05rem;
            font-weight: 700;
            line-height: 1.4;
        }

        .status.victory {
            background: #fff1d6;
            color: var(--navy);
            border: 2px solid var(--gold);
        }

        .status.defeat {
            background: var(--light-blue);
            color: var(--navy);
            border: 2px solid var(--blue);
        }

        .status.draw {
            background: #fff1d6;
            color: var(--navy);
            border: 2px solid var(--gold);
        }

        .restart {
            width: 100%;
            max-width: 240px;
            margin-top: 4px;
            padding: 13px 20px;
            border: 0;
            border-radius: 11px;
            background: var(--blue);
            color: var(--white);
            font-weight: 700;
            cursor: pointer;
            transition: background 160ms ease, transform 160ms ease;
        }

        .restart:hover {
            background: var(--navy);
            transform: translateY(-1px);
        }

        .game-note {
            margin: 18px 0 0;
            color: var(--blue);
            font-size: 0.85rem;
        }

        @keyframes winningPulse {
            from {
                box-shadow: 0 0 0 rgba(254, 173, 33, 0);
                transform: scale(1);
            }
            to {
                box-shadow: 0 0 18px rgba(254, 173, 33, 0.55);
                transform: scale(1.04);
            }
        }

        @media (max-width: 420px) {
            body {
                padding: 18px 12px;
            }

            .game-container {
                padding: 22px 16px;
            }

            .board {
                gap: 7px;
            }
        }

        @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
                scroll-behavior: auto !important;
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        }
    `;

    document.head.appendChild(style);

    // Create the game interface
    const container = document.createElement("main");
    container.className = "game-container";

    container.innerHTML = `
        <header class="game-header">
            <h1>Tic-Tac-Toe</h1>
            <p class="subtitle">You are X. The computer is O.</p>
        </header>

        <div class="controls">
            <label for="difficulty">Difficulty:</label>
            <select class="difficulty-select" id="difficulty">
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
            </select>
        </div>

        <div class="board" id="board"
             role="group" aria-label="Tic-Tac-Toe board"></div>

        <p class="status" id="status" role="status" aria-live="polite">
            Your turn! Choose a square.
        </p>

        <button class="restart" id="restart" type="button">New Game</button>
        <p class="game-note">Get three in a row to win!</p>
    `;

    document.body.appendChild(container);

    const boardElement = document.getElementById("board");
    const statusElement = document.getElementById("status");
    const difficultySelect = document.getElementById("difficulty");
    const restartButton = document.getElementById("restart");

    const cells = [];

    // Create the nine clickable squares
    for (let i = 0; i < 9; i++) {
        const cell = document.createElement("button");
        cell.className = "cell";
        cell.type = "button";
        cell.setAttribute("aria-label", `Square ${i + 1}, empty`);

        cell.addEventListener("click", () => playerMove(i));

        boardElement.appendChild(cell);
        cells.push(cell);
    }

    // Check whether someone has won
    function getWinner(currentBoard) {
        for (const [a, b, c] of winningCombinations) {
            if (
                currentBoard[a] !== "" &&
                currentBoard[a] === currentBoard[b] &&
                currentBoard[a] === currentBoard[c]
            ) {
                return currentBoard[a];
            }
        }

        return null;
    }

    // Find the winning squares
    function getWinningCombination(currentBoard) {
        return winningCombinations.find(([a, b, c]) =>
            currentBoard[a] !== "" &&
            currentBoard[a] === currentBoard[b] &&
            currentBoard[a] === currentBoard[c]
        ) || null;
    }

    // Update the visible board
    function renderBoard() {
        cells.forEach((cell, index) => {
            const mark = board[index];

            cell.textContent = mark;
            cell.disabled = gameOver || computerThinking || mark !== "";

            cell.classList.toggle("mark-x", mark === "X");
            cell.classList.toggle("mark-o", mark === "O");

            cell.setAttribute(
                "aria-label",
                `Square ${index + 1}, ${mark || "empty"}`
            );
        });
    }

    // Check if the game has ended
    function checkGameOver() {
        const winner = getWinner(board);
        const winningSquares = getWinningCombination(board);

        statusElement.className = "status";

        if (winner === "X") {
            statusElement.textContent = "You win! Great job!";
            statusElement.classList.add("victory");
            gameOver = true;
        } else if (winner === "O") {
            statusElement.textContent = "The computer wins! Try again!";
            statusElement.classList.add("defeat");
            gameOver = true;
        } else if (board.every(square => square !== "")) {
            statusElement.textContent = "It's a tie!";
            statusElement.classList.add("draw");
            gameOver = true;
        }

        if (winningSquares) {
            winningSquares.forEach(index => {
                cells[index].classList.add("winning");
            });
        }

        renderBoard();
        return gameOver;
    }

    // Handle the player's turn
    function playerMove(index) {
        if (gameOver || computerThinking || board[index] !== "") {
            return;
        }

        board[index] = "X";
        renderBoard();

        if (checkGameOver()) {
            return;
        }

        computerThinking = true;
        statusElement.className = "status";
        statusElement.textContent = "Computer is thinking...";
        renderBoard();

        // Brief pause before the computer moves
        computerTimer = window.setTimeout(() => {
            computerTimer = null;

            if (gameOver) {
                computerThinking = false;
                renderBoard();
                return;
            }

            computerMove();
            computerThinking = false;

            if (!checkGameOver()) {
                statusElement.textContent = "Your turn! Choose a square.";
                renderBoard();
            }
        }, 350);
    }

    // Find a winning move or a move that blocks the player
    function findTacticalMove(player) {
        for (let i = 0; i < 9; i++) {
            if (board[i] !== "") continue;

            board[i] = player;
            const wins = getWinner(board) === player;
            board[i] = "";

            if (wins) return i;
        }

        return null;
    }

    // Choose the computer's move based on difficulty
    function computerMove() {
        const availableMoves = board
            .map((value, index) => value === "" ? index : null)
            .filter(index => index !== null);

        if (availableMoves.length === 0) return;

        let move;

        if (difficulty === "easy") {
            move = randomMove(availableMoves);
        } else if (difficulty === "medium") {
            move = findTacticalMove("O");

            if (move === null) {
                move = findTacticalMove("X");
            }

            if (move === null) {
                move = randomMove(availableMoves);
            }
        } else {
            move = findBestMove();
        }

        if (move !== null) {
            board[move] = "O";
            renderBoard();
        }
    }

    function randomMove(moves) {
        return moves[Math.floor(Math.random() * moves.length)];
    }

    // Find the strongest move using minimax
    function findBestMove() {
        let bestScore = -Infinity;
        let bestMove = null;

        for (let i = 0; i < 9; i++) {
            if (board[i] !== "") continue;

            board[i] = "O";
            const score = minimax(board, 0, false);
            board[i] = "";

            if (score > bestScore) {
                bestScore = score;
                bestMove = i;
            }
        }

        return bestMove;
    }

    function minimax(currentBoard, depth, isMaximizing) {
        const winner = getWinner(currentBoard);

        if (winner === "O") return 10 - depth;
        if (winner === "X") return depth - 10;
        if (currentBoard.every(square => square !== "")) return 0;

        if (isMaximizing) {
            let bestScore = -Infinity;

            for (let i = 0; i < 9; i++) {
                if (currentBoard[i] !== "") continue;

                currentBoard[i] = "O";
                const score = minimax(currentBoard, depth + 1, false);
                currentBoard[i] = "";

                bestScore = Math.max(bestScore, score);
            }

            return bestScore;
        }

        let bestScore = Infinity;

        for (let i = 0; i < 9; i++) {
            if (currentBoard[i] !== "") continue;

            currentBoard[i] = "X";
            const score = minimax(currentBoard, depth + 1, true);
            currentBoard[i] = "";

            bestScore = Math.min(bestScore, score);
        }

        return bestScore;
    }

    // Start a fresh game and cancel any pending computer move
    function restartGame() {
        if (computerTimer !== null) {
            window.clearTimeout(computerTimer);
            computerTimer = null;
        }

        board = Array(9).fill("");
        gameOver = false;
        computerThinking = false;

        

        cells.forEach(cell => {
            cell.classList.remove("winning");
        });


        statusElement.className = "status";
        statusElement.textContent = "Your turn! Choose a square.";

        renderBoard();
    }

    restartButton.addEventListener("click", restartGame);

    difficultySelect.addEventListener("change", () => {
        difficulty = difficultySelect.value;
        restartGame();
    });

    // Display the empty board
    renderBoard();
});
