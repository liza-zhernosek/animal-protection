class Component {
	constructor(width, height, src, x, y, strength) {
		this.width = width;
		this.height = height;
		this.src = src;
		this.x = x;
		this.y = y;
		this.strength = strength;
		this.update();
		this.addComponentToCollection();
	}

	update() {
		let ctx = gameInstance.getContext();
		let img = document.createElement('img');

		img.src = `./img/${this.src}`;
		ctx.drawImage(img, this.x, this.y, this.width, this.height);
	}

	clearComponent() {
		this.width = 0;
		this.height = 0;
		gameInstance.components.splice(gameInstance.components.indexOf(this), 1);
	}

	addComponentToCollection() {
		gameInstance.components.push(this);
	}
};

class Game {
	constructor() {
		this.components = [];
		this.x = 0;
		this.score = 0;
	}

	getCanvas() {
		if (!this.gameCanvas) {
			this.gameCanvas = document.querySelector('canvas');
		}

		return this.gameCanvas;
	}

	getContext() {
		if (!this.gameContext) {
			this.gameContext = this.getCanvas().getContext('2d');
		}

		return this.gameContext;
	}

	clearCanvas() {
		this.getContext().clearRect(0, 0, this.getCanvas().width, this.getCanvas().height);
	}

	drawBackground() {
		let img = document.createElement('img');
		img.src = './img/bg.png';

		this.getContext().drawImage(img, this.x, 0, this.getCanvas().width, this.getCanvas().height, 0, 0, this.getCanvas().width, this.getCanvas().height);
	}

	updateBackgroundPosition() {
		this.x += 0.2;

		if (this.x >= this.getCanvas().width) {
			this.x = 0;
		}
	}

	updateCanvas() {
		this.clearCanvas();
		this.checkLocation();
		this.drawBackground();
		this.components.forEach(component => component.update());
	}

	checkLocation() {
		for (let i = 1; i < this.components.length; i++) {
			let currentComponent = this.components[i];

			if (this.player.x + this.player.width >= currentComponent.x
			&& this.player.x <= currentComponent.x + currentComponent.width
			&& this.player.y + this.player.height >= currentComponent.y
			&& this.player.y <= currentComponent.y + currentComponent.height) {
				currentComponent.clearComponent();
				this.updateScore(currentComponent.strength);
				this.randomComponent();
			}
		}
	}

	randomComponent() {
		let num = Math.floor(Math.random() * 10);

		new Component(imgs[num].width, imgs[num].height, imgs[num].src, 600, Math.random() * (300 - imgs[num].height), imgs[num].strength);
	}

	updateScore(strength) {
		if (this.player.hardcore && strength < 0) {
			this.gameOver();
		} else if (this.player.health === 100 && strength < 0 || this.player.health < 100) {
			this.player.health += strength;
			this.updateHealth();
		} else {
			this.addScore()
		}

		if (strength === -20) {
			this.playSound('negative.mp3');
		} else {
			this.playSound('positive.mp3');
		}
	}

	addScore() {
		let scoreText

		scoreText = document.querySelector('.score');
		scoreText.innerText = `YOUR SCORE: ${++this.score}`;

		if (!(this.score % 5)) {
			this.player.level++;
			this.updateLevel();
			intervalInstance.updateAllIntervals();
		}
	}

	updateHealth() {
		let currentHealth = document.querySelector('.current-health').classList,
			healthValue = currentHealth[1];

		currentHealth.remove(healthValue);

		if (this.player.health !== 0) {
			currentHealth.add(`current-health-${this.player.health}`);
		} else {
			this.gameOver();
		}
	}

	gameOver() {
		clearInterval(intervalInstance.gameInterval);

		if (gameInstance.gameTimer) {
			clearInterval(gameInstance.gameTimer);
		}

		if (intervalInstance.hardcoreInterval) {
			clearInterval(intervalInstance.hardcoreInterval);
		}

		this.clearCanvas();
		this.components = [];
		this.showScore();
		this.removeEventListener();
		this.audio.pause();
		document.querySelector('.game-over').style.display = 'block';
		document.querySelector('.wrapper').style.display = 'none';
	}

	startGame(checker) {
		this.setEventListener();

		this.playSound('game_bg.mp3');

		if (checker === 60) {
			setTimeout(() => {
				this.gameOver();
				intervalInstance.hideTimer();
			}, 60000);

			intervalInstance.resetTimer();
			let timer = document.querySelector('.timer');

			this.gameTimer = setInterval(() => {
				timer.innerText = --timer.innerText;
			}, 1000)
		}

		this.components = [];
		this.player = new Component(125, 46, 'girl-right.png', 0, 50, 0);

		Object.assign(this.player, {
			health: 100,
			level: 1,
			speed: 20
		});

		this.randomComponent();
		this.resetScore();
		this.updateHealth();
		this.updateLevel();

		if (checker && checker !== 60) {
			this.player.hardcore = true;
			intervalInstance.setHardcoreInterval();
		}

		intervalInstance.setGameInterval();

		document.querySelector('.game-over').style.display = 'none';
		document.querySelector('.landing').style.display = 'none';
		document.querySelector('.wrapper').style.display = 'block';
	}

	showScore() {
		let totalScore = document.querySelector('.total-score');

		totalScore.style.display = 'block';
		totalScore.innerText = `YOUR TOTAL SCORE: ${this.score}`;
	}

	resetScore() {
		document.querySelector('.score').innerText = `YOUR SCORE: 0`;
		document.querySelector('.total-score').innerText = 'YOUR TOTAL SCORE:';
		this.score = 0;
	}

	updateLevel() {
		let level = document.querySelector('.level');
		level.innerText = `YOUR LEVEL: ${this.player.level}`;
	}

	setEventListener() {
		const smoothMotion = (coordinate, value) => {
			let counter = 1;
			let smoothInterval = setInterval(() => {
				this.player[coordinate] += value / 10;
				this.updateCanvas();

				if (counter === 10) {
					clearInterval(smoothInterval);
				}

				counter++;
			}, this.player.speed);
		}

		this.listener = e => {
			switch	(e.key) {
				case 'ArrowUp': {
					if (this.player.y >= 10) {
						smoothMotion('y', -10);
					}
					break;
				}

				case 'ArrowDown': {
					if (this.player.y <= this.getCanvas().height - this.player.height - 10) {
						smoothMotion('y', 10);
					}
					break;
				}

				case 'ArrowRight': {
					if (this.player.x <= this.getCanvas().width - this.player.width - 10) {
						smoothMotion('x', 10);
					}

					if (this.player.src !== 'girl-right.png') {
						this.player.src = 'girl-right.png';
					}
					break;
				}

				case 'ArrowLeft': {
					if (this.player.x >= 10) {
						smoothMotion('x', -10);
					}

					if (this.player.src !== 'girl-left.png') {
						this.player.src = 'girl-left.png';
					}
					break;
				}
			}

			this.updateCanvas();
		};

		document.addEventListener('keydown', this.listener);
	}

	removeEventListener() {
		document.removeEventListener('keydown', this.listener);
	}

	playSound(src) {
		if (!this.audio) {
			this.audio = new Audio(`./sounds/${src}`);
			this.audio.loop = true;
			this.audio.play();
		} else {
			const audio = new Audio(`./sounds/${src}`);
			audio.loop = false;
			audio.play();
		}
	}
};

class GameIntervals {
	clearGameInterval() {
		clearInterval(this.gameInterval);
	}

	clearHardcoreInterval () {
		clearInterval(this.hardcoreInterval);
	}

	setGameInterval() {
		this.gameInterval = setInterval(() => {
			for (let i = 1; i < gameInstance.components.length; i++) {
				let currentComponent = gameInstance.components[i];

				currentComponent.x -= 1;
				if (currentComponent.x <= -currentComponent.width) {
					currentComponent.clearComponent();
					gameInstance.randomComponent();
				}
			}

			gameInstance.updateBackgroundPosition();
			gameInstance.updateCanvas();
		}, 20 - gameInstance.player.level);
	}

	setHardcoreInterval() {
		this.hardcoreInterval = setInterval(() => {
			gameInstance.randomComponent();
			gameInstance.updateCanvas();
		}, 3000);
	}

	updateAllIntervals() {
		this.clearGameInterval();
		this.clearHardcoreInterval();
		this.setGameInterval();
		
		if (gameInstance.player.hardcore) {
			this.setHardcoreInterval();
		}
	}

	resetTimer() {
		let timer = document.querySelector('.timer');
		timer.innerText = '60';
		timer.style.display = 'block';
	}

	hideTimer() {
		let timer = document.querySelector('.timer');
		timer.style.display = 'none';
	}
}

let gameInstance = new Game(),
	intervalInstance = new GameIntervals();

const setBtnHandlers = () => {
	const stopBtn = document.querySelector('.stop-btn');
	const gameOnTimeBtn = document.querySelector('.game-on-time');
	const defaultGame = document.querySelector('.default-game');
	const hardcoreGame = document.querySelector('.hardcore-game');

	stopBtn.onclick = () => gameInstance.gameOver();
	gameOnTimeBtn.onclick = () => gameInstance.startGame(60);
	defaultGame.onclick = () => gameInstance.startGame();
	hardcoreGame.onclick = () => gameInstance.startGame(true);
};

setBtnHandlers();

const imgs = [{
	width: 70,
	height: 79,
	src: 'bag.png',
	strength: -20
}, {
	width: 25,
	height: 65,
	src: 'bottle.png',
	strength: -20
}, {
	width: 96,
	height: 62,
	src: 'stone.png',
	strength: -20
}, {
	width: 45,
	height: 62,
	src: 'dog.png',
	strength: 20
}, {
	width: 45,
	height: 70,
	src: 'girafe.png',
	strength: 20
}, {
	width: 45,
	height: 48,
	src: 'kenguru.png',
	strength: 20
}, {
	width: 45,
	height: 42,
	src: 'horse.png',
	strength: 20
}, {
	width: 45,
	height: 48,
	src: 'lion.png',
	strength: 20
}, {
	width: 45,
	height: 44,
	src: 'panthera.png',
	strength: 20
}, {
	width: 45,
	height: 46,
	src: 'sheep.png',
	strength: 20
}];
