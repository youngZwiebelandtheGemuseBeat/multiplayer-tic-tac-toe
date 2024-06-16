const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const PORT = process.env.PORT || 5000;


app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let connections = [];
let currentPlayer = 'X';
let gameState = Array(9).fill(null);

wss.on('connection', (ws) => {
    connections.push(ws);

    ws.on('message', (message) => {
        const { index, player } = JSON.parse(message);

        if (player !== currentPlayer || gameState[index] || calculateWinner(gameState)) {
            return;
        }

        gameState[index] = player;
        currentPlayer = player === 'X' ? 'O' : 'X';

        connections.forEach((conn) => {
            conn.send(JSON.stringify({ gameState, currentPlayer }));
        });
    });

    ws.on('close', () => {
        connections = connections.filter((conn) => conn !== ws);
    });

    ws.send(JSON.stringify({ gameState, currentPlayer }));
});

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

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
