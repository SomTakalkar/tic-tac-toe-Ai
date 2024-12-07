import React from 'react';
import Cell from './Cell';
import './Board.css';

const Board = ({ board, onCellClick, winningLine }) => {
    return (
        <div className="board">
            {board.map((value, index) => (
                <Cell
                    key={index}
                    value={value}
                    onClick={() => onCellClick(index)}
                    isWinning={winningLine.includes(index)} // Check if this cell is part of the winning line
                />
            ))}
        </div>
    );
};

export default Board;
