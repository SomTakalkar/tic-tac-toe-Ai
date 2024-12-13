require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { execFile } = require('child_process');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 4000;
const FRONTEND_URL = process.env.FRONTEND_URL;

// Enable CORS for your frontend
app.use(cors({
    origin: FRONTEND_URL, // Use environment variable for frontend URL
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type']
}));

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: FRONTEND_URL, // Use environment variable for frontend URL
        methods: ['GET', 'POST'],
        transports: ['websocket', 'polling'] // Explicitly define transports
    }
});

let board = Array(9).fill(null); // Shared board state
let currentPlayer = 'X';         // Current player

io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Send initial board state to the client
    socket.emit('updateGame', { board, currentPlayer, gameStatus: '' });

    // Handle player moves
    socket.on('playerMove', (data) => {
        board = data.board;
        currentPlayer = data.currentPlayer;

        // Check if the mode is AI and it's AI's turn
        if (data.mode === 'AI' && currentPlayer === 'O') {
            // Call the Python AI engine
            const pythonScript = './python_engine/ai_engine.py';
            execFile('python3', [pythonScript, JSON.stringify(board)], (error, stdout, stderr) => {
                if (error) {
                    console.error(`AI Engine Error: ${error.message}`);
                    console.error(`Stderr: ${stderr}`);
                    return;
                }
                console.log(`AI Engine Output: ${stdout}`);

                // Parse the AI's move from Python output
                const aiMove = parseInt(stdout.trim());
                if (!isNaN(aiMove) && board[aiMove] === null) {
                    board[aiMove] = 'O'; // Make the AI move
                    currentPlayer = 'X'; // Switch turn to player X
                } else {
                    io.emit('error', { message: 'Invalid move from AI' });
                    console.error('AI returned an invalid move.');
                }

                // Emit updated game state to all clients
                io.emit('updateGame', { board, currentPlayer, gameStatus: checkGameStatus(board) });
            });
        } else {
            // Emit updated game state to all clients if it was a player move
            io.emit('updateGame', { board, currentPlayer, gameStatus: checkGameStatus(board) });
        }
    });

    // Reset game
    socket.on('resetGame', () => {
        board = Array(9).fill(null);
        currentPlayer = 'X';
        io.emit('updateGame', { board, currentPlayer, gameStatus: '' });
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected:', socket.id);
    });
});

// Utility functions for checking winner and draw
function checkWinner(board) {
    const winConditions = [
        [0, 1, 2], [3, 4, 5], [6, 7, 8],
        [0, 3, 6], [1, 4, 7], [2, 5, 8],
        [0, 4, 8], [2, 4, 6]
    ];
    for (const condition of winConditions) {
        const [a, b, c] = condition;
        if (board[a] && board[a] === board[b] && board[a] === board[c]) {
            return board[a];
        }
    }
    return null;
}

function isDraw(board) {
    return board.every((cell) => cell !== null);
}

function checkGameStatus(board) {
    const winner = checkWinner(board);
    if (winner) {
        return `Player ${winner} wins!`;
    } else if (isDraw(board)) {
        return "It's a draw!";
    } else {
        return `Player ${currentPlayer}'s turn`;
    }
}

// Start the server
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
