const express = require('express');
const path = require('path');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const PORT = 5000;

app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let currentPlayer = 'X';
let gameState = Array(9).fill(null);
let selectedSigns = { X: null, O: null };

wss.on('connection', (ws) => {
    ws.on('message', (message) => {
        const data = JSON.parse(message);

        if (data.type === 'move') {
            const { index, player } = data;

            if (player !== currentPlayer || gameState[index] || calculateWinner(gameState)) {
                return;
            }

            gameState[index] = player;
            currentPlayer = player === 'X' ? 'O' : 'X';

            broadcast({ type: 'gameState', gameState, currentPlayer });
        }

        if (data.type === 'selectSign') {
            const { player, sign } = data;

            if (selectedSigns[sign] || (player !== 'X' && player !== 'O')) {
                return;
            }

            selectedSigns[sign] = player;
            broadcast({ type: 'signSelection', selectedSigns });
        }
    });

    ws.send(JSON.stringify({ type: 'gameState', gameState, currentPlayer }));
    ws.send(JSON.stringify({ type: 'signSelection', selectedSigns }));
});

const broadcast = (data) => {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
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

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
