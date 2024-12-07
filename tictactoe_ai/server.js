const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { execFile } = require('child_process');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const PORT = 4000;

let board = Array(9).fill(null); // Shared board state
let currentPlayer = 'X';         // Current player

// Handle client connections
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
            const pythonScript = 'python_engine/ai_engine.py';
            execFile('python', [pythonScript, JSON.stringify(board)], (error, stdout) => {
                if (error) {
                    console.error('Error executing AI engine:', error);
                    return;
                }

                // Parse the AI's move from Python output
                const aiMove = parseInt(stdout.trim());
                if (board[aiMove] === null) {
                    board[aiMove] = 'O';
                    currentPlayer = 'X'; // Switch back to human player

                    // Send updated game state to all clients
                    const winner = checkWinner(board);
                    const gameStatus = winner ? `Player ${winner} wins!` : isDraw(board) ? "It's a draw!" : '';
                    io.emit('updateGame', { board, currentPlayer, gameStatus });
                }
            });
        } else {
            // For "Play with Friend" mode, just broadcast the move
            io.emit('updateGame', data);
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

// Start the server
server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
