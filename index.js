const express = require('express');
const app = express();
app.use(express.json());

// Helper functions
const distance = (a, b) => Math.abs(a.x - b.x) + Math.abs(a.y - b.y);

const isPositionSafe = (position, board, snakes) => {
    if (position.x < 0 || position.x >= board.width || position.y < 0 || position.y >= board.height) {
        return false; // Out of bounds
    }
    for (const snake of snakes) {
        for (const segment of snake.body) {
            if (segment.x === position.x && segment.y === position.y) {
                return false; // Collision with snake body
            }
        }
    }
    return true;
};

const getSafeMoves = (head, board, snakes) => {
    const possibleMoves = {
        up: { x: head.x, y: head.y - 1 },
        down: { x: head.x, y: head.y + 1 },
        left: { x: head.x - 1, y: head.y },
        right: { x: head.x + 1, y: head.y },
    };

    return Object.entries(possibleMoves).filter(([direction, position]) =>
        isPositionSafe(position, board, snakes)
    );
};

const getClosestFood = (head, food, snakes) => {
    return food
        .map(f => ({ food: f, distance: distance(head, f) }))
        .filter(({ food: targetFood }) => {
            // Check if there is a snake closer to the food
            return !snakes.some(snake => distance(snake.body[0], targetFood) < distance(head, targetFood));
        })
        .sort((a, b) => a.distance - b.distance)
        .map(f => f.food);
};

// Battlesnake endpoints
app.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

app.post('/start', (req, res) => {
    const { game, turn, board, you } = req.body;

    res.json({ color: '#00FF00', headType: 'fang', tailType: 'round-bum' });
});

app.post('/move', (req, res) => {
    const { game, turn, board, you } = req.body;

    const head = you.body[0];
    const safeMoves = getSafeMoves(head, board, board.snakes);
    const closestFood = getClosestFood(head, board.food, board.snakes);

    let move = 'up'; // Default move

    if (closestFood.length > 0) {
        const target = closestFood[0];

        const directions = safeMoves.map(([direction, position]) => ({
            direction,
            distance: distance(position, target),
        }));

        directions.sort((a, b) => a.distance - b.distance);

        if (directions.length > 0) {
            move = directions[0].direction;
        }
    } else if (safeMoves.length > 0) {
        // No food available, pick a random safe move
        move = safeMoves[Math.floor(Math.random() * safeMoves.length)][0];
    }

    res.json({ move });
});

app.post('/end', (req, res) => {
    res.status(200).send('ok');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Battlesnake server running on port ${PORT}`));
