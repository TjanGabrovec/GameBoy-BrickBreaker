document.addEventListener('DOMContentLoaded', function() {
    const titleScreen = document.getElementById('title-screen');
    
    // Naslov
    setTimeout(() => {
        titleScreen.classList.add('active');
    }, 100);
});

// Game variables
var canvas = document.getElementById("myCanvas");
var ctx = canvas.getContext("2d");
var ballRadius = 15;
var x = canvas.width / 2;
var y = canvas.height - 30;
var dx = 2;
var dy = -2;
var ballColor = "#ffffff";
var particles = [];
var showCredits = false;

var paddleHeight = 15;
var paddleWidth = 100;
var paddleX = (canvas.width - paddleWidth) / 2;

var rightPressed = false;
var leftPressed = false;

var brickRowCount = 12;
var brickColumnCount = 11;
var brickWidth = 40;
var brickHeight = 25;
var brickPadding = 10;
var brickOffsetTop = 20;
var brickOffsetLeft = 20;

var score = 0;
var highScore = localStorage.getItem('breakoutHighScore') || 0;
var startTime = Date.now();
var timerInterval;
var gameActive = true;
var gameOver = false;
var blinkAlpha = 1;
var blinkDirection = -0.02;

document.getElementById('hardButton').addEventListener('click', function() {
    window.location.href = 'hard.html';
});

document.getElementById('easyButton').addEventListener('click', function() {
    window.location.href = 'easy.html';
});

document.getElementById('normalButton').addEventListener('click', function() {
    window.location.href = 'index.html';
});

var bricks = [];
for (var c = 0; c < brickColumnCount; c++) {
    bricks[c] = [];
    for (var r = 0; r < brickRowCount; r++) {
        bricks[c][r] = { x: 0, y: 0, status: 1 };
    }
}

// Array to store "+1" text popups
var popups = [];

// Initialize game elements
initScorePanel();
createInfoButton();

// Event listeners
document.addEventListener("keydown", keyDownHandler, false);
document.addEventListener("keyup", keyUpHandler, false);
document.addEventListener("keydown", spaceRestartHandler, false);

// Add score text click handlers
document.getElementById('currentScore').addEventListener('click', function() {
    if (!gameOver && gameActive) {
        showCredits = true;
        gameActive = false;
    }
});
document.getElementById('highScore').addEventListener('click', function() {
    if (!gameOver && gameActive) {
        showCredits = true;
        gameActive = false;
    }
});
document.getElementById('gameTimer').addEventListener('click', function() {
    if (!gameOver && gameActive) {
        showCredits = true;
        gameActive = false;
    }
});

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.color = "#9d64b3";
        this.size = Math.random() * 20 + 2;
        this.speedX = Math.random() * 5 - 3;
        this.speedY = Math.random() * 5 - 3;
        this.life = 500;
        this.decay = 1;
    }
    
    update() {
        this.x += this.speedX;
        this.y += this.speedY;
        this.life -= this.decay;
        this.size *= 0.98;
        this.speedY += 0.1;
    }
    
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life / 100;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

function keyDownHandler(e) {
    if (e.keyCode == 39) {
        rightPressed = true;
    } else if (e.keyCode == 37) {
        leftPressed = true;
    }
}

function keyUpHandler(e) {
    if (e.keyCode == 39) {
        rightPressed = false;
    } else if (e.keyCode == 37) {
        leftPressed = false;
    }
}

function spaceRestartHandler(e) {
    if ((gameOver || showCredits) && e.code === "Space") {
        resetGame();
    }
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(x, y, ballRadius, 0, Math.PI * 2);
    ctx.fillStyle = ballColor;
    ctx.fill();
    ctx.closePath();
}

function drawPaddle() {
    ctx.beginPath();
    ctx.rect(paddleX, canvas.height - paddleHeight, paddleWidth, paddleHeight);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.closePath();
}

function drawBricks() {
    const cornerRadius = 10;
    
    for (var c = 0; c < brickColumnCount; c++) {
        for (var r = 0; r < brickRowCount; r++) {
            if (bricks[c][r].status == 1) {
                var brickX = c * (brickWidth + brickPadding) + brickOffsetLeft;
                var brickY = r * (brickHeight + brickPadding) + brickOffsetTop;
                bricks[c][r].x = brickX;
                bricks[c][r].y = brickY;
                
                ctx.beginPath();
                ctx.roundRect(brickX, brickY, brickWidth, brickHeight, cornerRadius);
                ctx.fillStyle = "#9d64b3";
                ctx.fill();
                ctx.closePath();
            }
        }
    }
}

function drawGameOver() {
    // Dark overlay
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    if (showCredits) {
        // Credits text
        ctx.font = "48px 'Courier New', monospace";
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.fillText("CREDITS", canvas.width/2, canvas.height/2 - 60);
        
        ctx.font = "24px 'Courier New', monospace";
        ctx.fillText("This game was created by Tjan Gabrovec.", canvas.width/2, canvas.height/2);
        ctx.fillText("See more at:", canvas.width/2, canvas.height/2 + 40);
        ctx.fillText("https://github.com/TjanGabrovec/GameBoy-BrickBreaker", canvas.width/2, canvas.height/2 + 80);
    } else {
        // Game Over text
        ctx.font = "48px 'Courier New', monospace";
        ctx.fillStyle = "#d46969";
        ctx.textAlign = "center";
        ctx.fillText("GAME OVER", canvas.width/2, canvas.height/2 - 60);
        
        // Score display
        ctx.font = "34px 'Courier New', monospace";
        ctx.fillStyle = "#ffffff";
        ctx.fillText(`Score: ${score}`, canvas.width/2, canvas.height/2);
        
        // Time display
        ctx.fillText(`Time: ${document.getElementById('gameTimer').textContent}`, canvas.width/2, canvas.height/2 + 40);
    }
    
    // Blinking text
    blinkAlpha += blinkDirection;
    if (blinkAlpha <= 0.3 || blinkAlpha >= 1) {
        blinkDirection *= -1;
    }
    
    ctx.font = "bold 34px 'Courier New', monospace";
    ctx.fillStyle = `rgba(255, 255, 255, ${blinkAlpha})`;
    ctx.fillText(
        showCredits ? "OKAY" : "Press SPACE to restart", 
        canvas.width/2, 
        showCredits ? canvas.height/2 + 140 : canvas.height/2 + 100
    );
}

function initScorePanel() {
    document.getElementById('highScore').textContent = highScore;
    startTimer();
}

function updateScore(points) {
    score += points;
    document.getElementById('currentScore').textContent = score;
    
    if (score > highScore) {
        highScore = score;
        document.getElementById('highScore').textContent = highScore;
        localStorage.setItem('breakoutHighScore', highScore);
    }
}

function startTimer() {
    startTime = Date.now();
    clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);
}

function updateTimer() {
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const minutes = Math.floor(elapsed / 60).toString().padStart(2, '0');
    const seconds = (elapsed % 60).toString().padStart(2, '0');
    document.getElementById('gameTimer').textContent = `${minutes}:${seconds}`;
}

function collisionDetection() {
    for (var c = 0; c < brickColumnCount; c++) {
        for (var r = 0; r < brickRowCount; r++) {
            var b = bricks[c][r];
            if (b.status == 1) {
                if (x + ballRadius > b.x && 
                    x - ballRadius < b.x + brickWidth && 
                    y + ballRadius > b.y && 
                    y - ballRadius < b.y + brickHeight) {
                    dy = -dy;
                    b.status = 0;
                    updateScore(10);
                    createParticles(b.x + brickWidth/2, b.y + brickHeight/2, "#ffffff");
                    
                    popups.push({
                        x: b.x + brickWidth / 2,
                        y: b.y + brickHeight / 2,
                        timestamp: Date.now()
                    });
                }
            }
        }
    }
}

function createParticles(x, y, color) {
    for (let i = 0; i < 25; i++) {
        particles.push(new Particle(x, y, color));
    }
}

function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].draw(ctx);
        
        if (particles[i].life <= 0) {
            particles.splice(i, 1);
        }
    }
}

function drawPopups() {
    var currentTime = Date.now();
    for (var i = popups.length - 1; i >= 0; i--) {
        var popup = popups[i];
        if (currentTime - popup.timestamp < 500) {
            ctx.font = "25px Arial";
            ctx.fillStyle = "#ffffff";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("+10", popup.x, popup.y);
        } else {
            popups.splice(i, 1);
        }
    }
}

function resetGame() {
    // Reset game state
    x = canvas.width / 2;
    y = canvas.height - 30;
    dx = 2;
    dy = -2;
    paddleX = (canvas.width - paddleWidth) / 2;
    score = 0;
    document.getElementById('currentScore').textContent = '0';
    gameActive = true;
    gameOver = false;
    showCredits = false;
    
    // Reset bricks
    for (var c = 0; c < brickColumnCount; c++) {
        for (var r = 0; r < brickRowCount; r++) {
            bricks[c][r].status = 1;
        }
    }
    
    // Clear particles and popups
    particles = [];
    popups = [];
    
    // Restart timer
    startTimer();
    
    // Restart game loop
    draw();
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (gameOver || showCredits) {
        drawGameOver();
        requestAnimationFrame(draw);
        return;
    }
    
    if (!gameActive) return;
    
    drawBricks();
    drawBall();
    drawPaddle();
    collisionDetection();
    drawPopups();
    updateParticles();

    if (x + dx > canvas.width - ballRadius || x + dx < ballRadius) {
        dx = -dx;
    }
    if (y + dy < ballRadius) {
        dy = -dy;
    } else if (y + dy > canvas.height - ballRadius) {
        if (x > paddleX && x < paddleX + paddleWidth) {
            dy = -dy;
        } else {
            gameActive = false;
            gameOver = true;
            clearInterval(timerInterval);
            return;
        }
    }

    if (rightPressed && paddleX < canvas.width - paddleWidth) {
        paddleX += 7;
    } else if (leftPressed && paddleX > 0) {
        paddleX -= 7;
    }

    x += dx;
    y += dy;
    requestAnimationFrame(draw);
}

function createInfoButton() {
    document.getElementById('studioCredits').addEventListener('click', function() {
        Swal.fire({
            title: 'Credits',
            html: 'This game was created by Tjan Gabrovec.<br>More at github.com/TjanGabrovec',
            icon: 'info',
            confirmButtonText: 'Okay',
            background: '#000',
            color: '#fff',
            confirmButtonColor: '#9d64b3',
        });
    });
}

// Start the game
draw();