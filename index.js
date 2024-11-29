import express from "express"
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

    return Object.entries(possibleMoves)
        .filter(([direction, position]) => isPositionSafe(position, board, snakes))
        .map(([direction]) => direction);
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

const isBiggestSnake = (you, snakes) => {
    return snakes.every(snake => snake.body.length <= you.body.length);
};

const getClosestSnake = (head, snakes) => {
    const otherSnakes = snakes.filter(snake => snake.body[0] && snake.body[0].id !== head.id);
    return otherSnakes
        .map(snake => ({ snake, distance: distance(head, snake.body[0]) }))
        .sort((a, b) => a.distance - b.distance);
};

// Battlesnake endpoints
app.get('/ping', (req, res) => {
    res.status(200).send('pong');
});

app.post('/start', (req, res) => {
    res.json({ color: '#8B0000', headType: 'fang', tailType: 'round-bum' });
});

app.post('/move', (req, res) => {
    const { board, you } = req.body;

    const head = you.body[0];
    const safeMoves = getSafeMoves(head, board, board.snakes);
    const closestFood = getClosestFood(head, board.food, board.snakes);
    const closestSnake = getClosestSnake(head, board.snakes);

    let move = 'up'; // Default move

    if (safeMoves.length === 0) {
        res.json({ move });
        return; // No safe moves, default to 'up'
    }

    if (closestSnake.length > 0 && closestSnake[0].distance <= 2) {
        const targetSnake = closestSnake[0].snake;
        if (targetSnake.body.length < you.body.length) {
            // Aggressive behavior: target smaller snake heads
            const directions = safeMoves.map(direction => {
                const nextPosition = {
                    up: { x: head.x, y: head.y - 1 },
                    down: { x: head.x, y: head.y + 1 },
                    left: { x: head.x - 1, y: head.y },
                    right: { x: head.x + 1, y: head.y },
                }[direction];
                return {
                    direction,
                    distance: distance(nextPosition, targetSnake.body[0]),
                };
            });

            directions.sort((a, b) => a.distance - b.distance);

            move = directions[0].direction;
        }
    } else if (closestFood.length > 0) {
        // Hungry behavior: target closest food
        const target = closestFood[0];

        const directions = safeMoves.map(direction => {
            const nextPosition = {
                up: { x: head.x, y: head.y - 1 },
                down: { x: head.x, y: head.y + 1 },
                left: { x: head.x - 1, y: head.y },
                right: { x: head.x + 1, y: head.y },
            }[direction];
            return {
                direction,
                distance: distance(nextPosition, target),
            };
        });

        directions.sort((a, b) => a.distance - b.distance);

        move = directions[0].direction;
    } else {
        // No clear target, pick a random safe move
        move = safeMoves[Math.floor(Math.random() * safeMoves.length)];
    }

    res.json({ move });
});

app.post('/end', (req, res) => {
    res.status(200).send('ok');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Battlesnake server running on port ${PORT}`));
