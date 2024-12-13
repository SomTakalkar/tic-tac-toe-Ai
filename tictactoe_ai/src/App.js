import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Board from './Board';
import './App.css';

// Connect to the backend using the environment variable or hardcoded URL
const socket = io(process.env.REACT_APP_BACKEND_URL || "https://tic-tac-toe-ai-4xbc.onrender.com");

const App = () => {
  const initialBoardState = Array(9).fill(null);

  const [board, setBoard] = useState(initialBoardState);
  const [currentPlayer, setCurrentPlayer] = useState('X');
  const [gameStatus, setGameStatus] = useState('');
  const [winningLine, setWinningLine] = useState([]);
  const [mode, setMode] = useState(null); // Track the game mode

  const winConditions = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  useEffect(() => {
    // Listen for updates from the server
    socket.on('updateGame', (data) => {
      setBoard(data.board);
      setCurrentPlayer(data.currentPlayer);
      setGameStatus(data.gameStatus);
    });

    // Clean up listeners on unmount
    return () => {
      socket.off('updateGame');
    };
  }, []);

  const handleCellClick = (index) => {
    if (board[index] || gameStatus) return; // Ignore if cell is filled or game is over

    const newBoard = [...board];
    newBoard[index] = currentPlayer;

    const nextPlayer = currentPlayer === 'X' ? 'O' : 'X';

    // Emit move to server
    const gameUpdate = {
      board: newBoard,
      currentPlayer: nextPlayer,
      gameStatus: '',
      mode, // Include the selected game mode
    };

    setBoard(newBoard);
    setCurrentPlayer(nextPlayer);

    socket.emit('playerMove', gameUpdate);
  };

  const resetGame = () => {
    setBoard(initialBoardState);
    setCurrentPlayer('X');
    setGameStatus('');
    setWinningLine([]);
    socket.emit('resetGame'); // Notify server to reset the game
  };

  const selectMode = (selectedMode) => {
    setMode(selectedMode);
    resetGame(); // Reset game when mode is selected
  };

  return (
      <div className="App">
        <h1>Tic Tac Toe</h1>
        {!mode ? (
            <div className="mode-selection">
              <button onClick={() => selectMode('Friend')}>Play with Friend</button>
              <button onClick={() => selectMode('AI')}>Play with AI</button>
            </div>
        ) : (
            <div className="game-container">
              <Board board={board} onCellClick={handleCellClick} winningLine={winningLine} />
              <div className="game-info">
                <h2>{gameStatus || `Current Player: ${currentPlayer}`}</h2>
                {gameStatus && <button onClick={resetGame}>Restart</button>}
                <button onClick={() => setMode(null)}>Back to Menu</button>
              </div>
            </div>
        )}
      </div>
  );
};

export default App;
