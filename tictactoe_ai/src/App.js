import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import Board from './Board';
import './App.css';

const socket = io(' http://10.223.56.90:10000'); // Connect to the backend

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
  }, []);

  const checkWinner = (board) => {
    for (const condition of winConditions) {
      const [a, b, c] = condition;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        setWinningLine(condition);
        return board[a];
      }
    }
    return null;
  };

  const isDraw = (board) => {
    return board.every((cell) => cell !== null);
  };

  const handleCellClick = (index) => {
    if (board[index] || gameStatus) return;

    const newBoard = [...board];
    newBoard[index] = currentPlayer;

    const winner = checkWinner(newBoard);
    const updatedGameStatus = winner
        ? `Player ${winner} wins!`
        : isDraw(newBoard)
            ? "It's a draw!"
            : '';
    const nextPlayer = currentPlayer === 'X' ? 'O' : 'X';

    const gameUpdate = {
      board: newBoard,
      currentPlayer: nextPlayer,
      gameStatus: updatedGameStatus,
      mode, // Send the game mode (AI or Friend) to the server
    };

    setBoard(newBoard);
    setCurrentPlayer(nextPlayer);
    setGameStatus(updatedGameStatus);
    socket.emit('playerMove', gameUpdate);

    if (winner || isDraw(newBoard)) {
      const gameResult = {
        winner,
        board: newBoard,
        status: updatedGameStatus,
      };
      socket.emit('gameResult', gameResult); // Send game result to server
    }
  };

  const resetGame = () => {
    setBoard(initialBoardState);
    setCurrentPlayer('X');
    setGameStatus('');
    setWinningLine([]);
    socket.emit('playerMove', { board: initialBoardState, currentPlayer: 'X', gameStatus: '' });
  };

  const selectMode = (selectedMode) => {
    setMode(selectedMode);
    resetGame();
  };

  return (
      <div>
        <h1>Tic Tac Toe</h1>
        {!mode ? (
            <div>
              <button onClick={() => selectMode('Friend')}>Play with Friend</button>
              <button onClick={() => selectMode('AI')}>Play with AI</button>
            </div>
        ) : (
            <div>
              <Board board={board} onCellClick={handleCellClick} winningLine={winningLine} />
              <div>
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
