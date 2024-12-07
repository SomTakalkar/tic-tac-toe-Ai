import React from 'react';
import './Cell.css';

const Cell = ({ value, onClick, isWinning }) => {
    return (
        <button
            className={`cell ${isWinning ? 'winning' : ''}`}
            onClick={onClick}
            disabled={!!value} // Disable the cell if it already has a value
        >
            {value}
        </button>
    );
};

export default Cell;
