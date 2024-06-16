import React, { useState, useEffect } from 'react';
import './App.css';

const App = () => {
    const [board, setBoard] = useState(Array(9).fill(null));
    const [isXNext, setIsXNext] = useState(true);
    const [player, setPlayer] = useState(null);
    const [selectedSigns, setSelectedSigns] = useState({ X: null, O: null });
    const [ws, setWs] = useState(null);

    useEffect(() => {
        const socket = new WebSocket('ws://localhost:5000');

        socket.onmessage = (message) => {
            const data = JSON.parse(message.data);

            if (data.type === 'gameState') {
                setBoard(data.gameState);
                setIsXNext(data.currentPlayer === 'X');
            }

            if (data.type === 'signSelection') {
                setSelectedSigns(data.selectedSigns);
            }
        };

        setWs(socket);

        return () => {
            socket.close();
        };
    }, []);

    const handleClick = (index) => {
        if (!ws || board[index] || calculateWinner(board) || (isXNext && player !== 'X') || (!isXNext && player !== 'O')) return;

        ws.send(JSON.stringify({ type: 'move', index, player }));
    };

    const handleSignSelection = (sign) => {
        if (!ws || selectedSigns[sign]) return;

        setPlayer(sign);
        ws.send(JSON.stringify({ type: 'selectSign', player: sign, sign }));
    };

    const renderSquare = (index) => {
        return (
            <button className="square" onClick={() => handleClick(index)}>
                {board[index]}
            </button>
        );
    };

    const winner = calculateWinner(board);
    const status = winner ? `Winner: ${winner}` : `Next player: ${isXNext ? 'X' : 'O'}`;

    return (
        <div className="game">
            <div className="player-selection">
                <button onClick={() => handleSignSelection('X')} disabled={selectedSigns.X !== null}>Play as X</button>
                <button onClick={() => handleSignSelection('O')} disabled={selectedSigns.O !== null}>Play as O</button>
            </div>
            <div className="game-board">
                <div className="status">{status}</div>
                <div className="board-row">
                    {renderSquare(0)}
                    {renderSquare(1)}
                    {renderSquare(2)}
                </div>
                <div className="board-row">
                    {renderSquare(3)}
                    {renderSquare(4)}
                    {renderSquare(5)}
                </div>
                <div className="board-row">
                    {renderSquare(6)}
                    {renderSquare(7)}
                    {renderSquare(8)}
                </div>
            </div>
        </div>
    );
};

const calculateWinner = (squares) => {
    const lines = [
        [0, 1, 2],
        [3, 4, 5],
        [6, 7, 8],
        [0, 3, 6],
        [1, 4, 7],
        [2, 5, 8],
        [0, 4, 8],
        [2, 4, 6],
    ];
    for (let i = 0; i < lines.length; i++) {
        const [a, b, c] = lines[i];
        if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
            return squares[a];
        }
    }
    return null;
};

export default App;
