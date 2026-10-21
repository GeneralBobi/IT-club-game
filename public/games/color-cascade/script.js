document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const scoreDisplay = document.getElementById('score');
    const comboDisplay = document.getElementById('combo');
    const livesContainer = document.getElementById('lives-container');
    const sequenceDisplay = document.getElementById('sequence-display');
    const gameBoard = document.getElementById('game-board');
    const gameOverScreen = document.getElementById('game-over-screen');
    const finalScoreDisplay = document.getElementById('final-score');
    const restartButton = document.getElementById('restart-button');
    const gameContainer = document.getElementById('game-container');

    // Game Constants
    const colors = ['#ff5252', '#448aff', '#4caf50', '#ffeb3b'];
    const tileHeight = 120;
    const fallSpeedStart = 3;

    // Game State
    let score, combo, lives, colorSequence, currentSequenceIndex, fallSpeed, activeTiles, tileSpawnInterval, laneCount, sequencesCompleted;
    window.isPlaying = true; // Expose for testing

    function setupBoard(lanes) {
        laneCount = lanes;
        gameBoard.innerHTML = '';
        gameContainer.style.width = `${lanes * 100 + 2}px`;

        for (let i = 0; i < lanes; i++) {
            const column = document.createElement('div');
            column.classList.add('column');
            column.id = `column-${i}`;
            gameBoard.appendChild(column);
        }
    }

    function init() {
        score = 0;
        combo = 1;
        lives = 3;
        window.isPlaying = true;
        currentSequenceIndex = 0;
        sequencesCompleted = 0;
        fallSpeed = fallSpeedStart;
        activeTiles = [];

        setupBoard(3); // Start with 3 lanes

        if (tileSpawnInterval) clearInterval(tileSpawnInterval);

        scoreDisplay.textContent = '0';
        comboDisplay.textContent = '1x';
        updateLivesDisplay();
        gameOverScreen.classList.add('hidden');

        generateSequence(3);
        updateSequenceDisplay();
        tileSpawnInterval = setInterval(spawnRandomTile, 800);
        spawnRequiredTile();
        window.gameLoop();
    }

    function generateSequence(length) {
        colorSequence = [];
        for (let i = 0; i < length; i++) {
            colorSequence.push(Math.floor(Math.random() * colors.length));
        }
    }

    function updateSequenceDisplay() {
        sequenceDisplay.innerHTML = '';
        colorSequence.forEach((colorIndex, index) => {
            const colorDiv = document.createElement('div');
            colorDiv.classList.add('sequence-color');
            colorDiv.style.backgroundColor = colors[colorIndex];
            if (index < currentSequenceIndex) {
                colorDiv.style.opacity = '0.3';
            }
            sequenceDisplay.appendChild(colorDiv);
        });
    }

    function spawnTile(colorIndex, isRequired) {
        const tile = document.createElement('div');
        tile.classList.add('tile', `color-${colorIndex}`);
        tile.dataset.colorIndex = colorIndex;
        tile.dataset.required = isRequired;

        let targetColumn = null;
        const columnIndices = Array.from({ length: laneCount }, (_, i) => i).sort(() => Math.random() - 0.5);
        for (const index of columnIndices) {
            const column = document.getElementById(`column-${index}`);
            if(!column) continue;
            let isSafe = true;
            for (const existingTile of column.querySelectorAll('.tile')) {
                if (parseFloat(existingTile.style.top) < tileHeight) {
                    isSafe = false;
                    break;
                }
            }
            if (isSafe) {
                targetColumn = column;
                break;
            }
        }
        if (!targetColumn) {
            targetColumn = document.getElementById(`column-${Math.floor(Math.random() * laneCount)}`);
        }

        if (targetColumn) {
            tile.style.top = `-${tileHeight}px`;
            tile.addEventListener('click', handleTileClick);
            tile.addEventListener('touchstart', handleTileClick);
            targetColumn.appendChild(tile);
            activeTiles.push({ element: tile, required: isRequired });
        }
    }

    function spawnRequiredTile() {
        if (!window.isPlaying) return;
        const requiredColorIndex = colorSequence[currentSequenceIndex];
        spawnTile(requiredColorIndex, true);
    }

    function spawnRandomTile() {
        if (!window.isPlaying) return;
        const requiredColorIndex = colorSequence[currentSequenceIndex];
        let randomColorIndex;
        do {
            randomColorIndex = Math.floor(Math.random() * colors.length);
        } while (randomColorIndex === requiredColorIndex);
        spawnTile(randomColorIndex, false);
    }

    function markOtherRequiredAsDistractors(clickedColorIndex) {
        activeTiles.forEach(tileData => {
            const tileColor = parseInt(tileData.element.dataset.colorIndex, 10);
            if (tileColor === clickedColorIndex && tileData.required) {
                tileData.required = false;
                tileData.element.dataset.required = 'false';
            }
        });
    }

    function levelUp(newLanes) {
        laneCount = newLanes;
        fallSpeed = fallSpeedStart + (0.5 * (laneCount - 3));

        activeTiles.forEach(t => t.element.remove());
        activeTiles = [];
        if (tileSpawnInterval) clearInterval(tileSpawnInterval);

        setupBoard(laneCount);
        generateSequence(3);
        updateSequenceDisplay();

        tileSpawnInterval = setInterval(spawnRandomTile, Math.max(200, 800 - (sequencesCompleted * 20)));
        spawnRequiredTile();
    }

    function handleTileClick(event) {
        if (!window.isPlaying) return;
        const clickedTile = event.target;
        if (!clickedTile.classList.contains('tile')) return;

        const clickedColorIndex = parseInt(clickedTile.dataset.colorIndex, 10);
        const requiredColorIndex = colorSequence[currentSequenceIndex];

        if (clickedColorIndex === requiredColorIndex) {
            score += 10 * combo;
            combo++;

            if (lives < 3 && combo > 1 && combo % 5 === 0) {
                lives++;
                updateLivesDisplay();
            }

            scoreDisplay.textContent = score;
            comboDisplay.textContent = `${combo}x`;

            currentSequenceIndex++;
            createParticles(event.clientX, event.clientY, colors[clickedColorIndex]);

            markOtherRequiredAsDistractors(clickedColorIndex);

            const tileIndex = activeTiles.findIndex(t => t.element === clickedTile);
            if(tileIndex > -1) activeTiles.splice(tileIndex, 1);
            clickedTile.remove();

            if (currentSequenceIndex >= colorSequence.length) {
                sequencesCompleted++;
                currentSequenceIndex = 0;

                if (laneCount === 3 && sequencesCompleted >= 3) {
                    levelUp(4);
                    return;
                } else if (laneCount === 4 && sequencesCompleted >= 7) {
                    levelUp(5);
                    return;
                }

                generateSequence(colorSequence.length + 1);
                fallSpeed += 0.3;
                clearInterval(tileSpawnInterval);
                tileSpawnInterval = setInterval(spawnRandomTile, Math.max(200, 800 - (sequencesCompleted * 20)));
            }

            updateSequenceDisplay();
            spawnRequiredTile();
        } else {
            loseLife();
            combo = 1;
            comboDisplay.textContent = `${combo}x`;
        }
    }

    function loseLife() {
        if (!window.isPlaying) return;
        lives--;
        updateLivesDisplay();
        if (lives <= 0) gameOver();
    }

    function updateLivesDisplay() {
        const hearts = livesContainer.querySelectorAll('.heart');
        hearts.forEach((heart, index) => {
            heart.classList.toggle('lost', index >= lives);
        });
    }

    function createParticles(x, y, color) {
        for (let i = 0; i < 15; i++) {
            const p = document.createElement('div');
            document.body.appendChild(p);
            p.style.position = 'absolute';
            p.style.left = `${x}px`;
            p.style.top = `${y}px`;
            p.style.width = `${Math.random() * 5 + 2}px`;
            p.style.height = p.style.width;
            p.style.backgroundColor = color;
            p.style.borderRadius = '50%';
            const angle = Math.random() * 2 * Math.PI;
            const vel = Math.random() * 8 + 4;
            const vx = Math.cos(angle) * vel;
            const vy = Math.sin(angle) * vel;
            p.animate([
                { transform: `translate(${vx}px, ${vy}px)`, opacity: 1 },
                { transform: `translate(${vx * 2}px, ${vy * 2}px) scale(0.5)`, opacity: 0 }
            ], { duration: Math.random() * 500 + 500, easing: 'ease-out' });
            setTimeout(() => p.remove(), 1000);
        }
    }

    window.gameLoop = function() { // Exposed for testing
        if (!window.isPlaying) return;
        for (let i = activeTiles.length - 1; i >= 0; i--) {
            const tileData = activeTiles[i];
            const tile = tileData.element;
            const currentTop = parseFloat(tile.style.top);
            tile.style.top = `${currentTop + fallSpeed}px`;
            if (currentTop > gameBoard.clientHeight) {
                if (tileData.required) {
                    loseLife();
                    combo = 1;
                    comboDisplay.textContent = `${combo}x`;
                    currentSequenceIndex++;
                    if (currentSequenceIndex >= colorSequence.length) {
                        currentSequenceIndex = 0;
                        generateSequence(colorSequence.length + 1);
                    }
                    updateSequenceDisplay();
                    spawnRequiredTile();
                }
                tile.remove();
                activeTiles.splice(i, 1);
            }
        }
        requestAnimationFrame(window.gameLoop);
    }

    function gameOver() {
        window.isPlaying = false;
        clearInterval(tileSpawnInterval);
        finalScoreDisplay.textContent = score;
        gameOverScreen.classList.remove('hidden');
        document.getElementById('game-container').classList.add('game-over-shake');
        setTimeout(() => document.getElementById('game-container').classList.remove('game-over-shake'), 500);
    }

    restartButton.addEventListener('click', init);
    init();
});
