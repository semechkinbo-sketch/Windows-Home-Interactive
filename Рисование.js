// Procedural white noise for rain and wind sounds
function createNoiseBuffer(ctx, seconds = 2) {
	const bufferSize = ctx.sampleRate * seconds;
	const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
	const data = buffer.getChannelData(0);
	for (let i = 0; i < bufferSize; i++) {
		data[i] = Math.random() * 2 - 1;
	}
	return buffer;
}

// Generative ambient audio via Web Audio API
class SceneAudio {
	constructor() {
		this.ctx = null;
		this.rainGain = null;
		this.windGain = null;
		this.cricketGain = null;
		this.birdGain = null;
		this.masterGain = null;

		this.rainSource = null;
		this.windSource = null;
		this.cricketInterval = null;
		this.birdTimeout = null;

		this.active = false;
		this.time = 'day';
		this.weather = 'clear';
	}

	init() {
		try {
			this.ctx = new (window.AudioContext || window.webkitAudioContext)();

			// Общая громкость
			this.masterGain = this.ctx.createGain();
			this.masterGain.gain.setValueAtTime(0.5, this.ctx.currentTime);
			this.masterGain.connect(this.ctx.destination);

			// Индивидуальные gain-ноды для каждого источника звука
			this.rainGain = this.ctx.createGain();
			this.rainGain.gain.setValueAtTime(0, this.ctx.currentTime);
			this.rainGain.connect(this.masterGain);

			this.windGain = this.ctx.createGain();
			this.windGain.gain.setValueAtTime(0, this.ctx.currentTime);
			this.windGain.connect(this.masterGain);

			this.cricketGain = this.ctx.createGain();
			this.cricketGain.gain.setValueAtTime(0, this.ctx.currentTime);
			this.cricketGain.connect(this.masterGain);

			this.birdGain = this.ctx.createGain();
			this.birdGain.gain.setValueAtTime(0, this.ctx.currentTime);
			this.birdGain.connect(this.masterGain);

			// Создаем один буфер шума для дождя и ветра
			const noiseBuffer = createNoiseBuffer(this.ctx, 2.5);

			// 1. СИНТЕЗ ДОЖДЯ (Розовый/Лоупасс Шум)
			this.rainSource = this.ctx.createBufferSource();
			this.rainSource.buffer = noiseBuffer;
			this.rainSource.loop = true;
			const rainFilter = this.ctx.createBiquadFilter();
			rainFilter.type = 'lowpass';
			rainFilter.frequency.setValueAtTime(850, this.ctx.currentTime);
			this.rainSource.connect(rainFilter);
			rainFilter.connect(this.rainGain);
			this.rainSource.start();

			// 2. СИНТЕЗ ВЕТРА (Бэндпасс Шум с модуляцией частоты)
			this.windSource = this.ctx.createBufferSource();
			this.windSource.buffer = noiseBuffer;
			this.windSource.loop = true;
			const windFilter = this.ctx.createBiquadFilter();
			windFilter.type = 'bandpass';
			windFilter.Q.setValueAtTime(4.5, this.ctx.currentTime);
			this.windSource.connect(windFilter);
			windFilter.connect(this.windGain);
			this.windSource.start();

			// LFO (генератор низкой частоты) для создания порывов ветра
			this.modulateWind(windFilter);

			// Запускаем фоновые циклы для птиц и сверчков
			this.startCricketLoop();
			this.startBirdLoop();

			this.updateVolumes();
		} catch (e) {
			console.error("Failed to initialize Web Audio API:", e);
		}
	}

	modulateWind(filter) {
		const osc = this.ctx.createOscillator();
		const gain = this.ctx.createGain();
		
		// Частота качания ветра (0.07 Гц - примерно раз в 14 секунд порыв)
		osc.frequency.setValueAtTime(0.07, this.ctx.currentTime);
		// Глубина модуляции (отклонение центральной частоты на +-220 Гц)
		gain.gain.setValueAtTime(220, this.ctx.currentTime);

		osc.connect(gain);
		gain.connect(filter.frequency);
		// Базовая частота фильтра (средний свист ветра на 450 Гц)
		filter.frequency.setValueAtTime(450, this.ctx.currentTime);

		osc.start();
	}

	startCricketLoop() {
		const loop = () => {
			if (this.active && (this.time === 'night' || this.time === 'aurora') && this.weather !== 'rain') {
				const now = this.ctx.currentTime;
				// Серия из 3-4 ультракоротких импульсов создает характерный стрекот (chirp)
				const pulseCount = 3 + Math.floor(Math.random() * 2);
				for (let i = 0; i < pulseCount; i++) {
					const timeOffset = now + i * 0.05;
					const osc = this.ctx.createOscillator();
					const oscGain = this.ctx.createGain();
					
					osc.type = 'sine';
					// Высокая частота сверчка (~4400 Гц)
					osc.frequency.setValueAtTime(4300 + Math.random() * 150, timeOffset);

					oscGain.gain.setValueAtTime(0, timeOffset);
					oscGain.gain.linearRampToValueAtTime(0.025, timeOffset + 0.005);
					oscGain.gain.exponentialRampToValueAtTime(0.0001, timeOffset + 0.04);

					osc.connect(oscGain);
					oscGain.connect(this.cricketGain);
					osc.start(timeOffset);
					osc.stop(timeOffset + 0.045);
				}
			}
			// Повторяем стрекот через случайные интервалы времени
			this.cricketInterval = setTimeout(loop, 750 + Math.random() * 450);
		};
		loop();
	}

	startBirdLoop() {
		const loop = () => {
			if (this.active && (this.time === 'day' || this.time === 'sunset') && this.weather !== 'rain') {
				const now = this.ctx.currentTime;
				// Чириканье состоит из нескольких свистящих частотных проходов
				const chirpCount = 1 + Math.floor(Math.random() * 3);
				for (let i = 0; i < chirpCount; i++) {
					const timeOffset = now + i * 0.16;
					const osc = this.ctx.createOscillator();
					const oscGain = this.ctx.createGain();

					osc.type = 'sine';
					// Свип частоты вверх (от ~2000 Гц до ~5500 Гц)
					osc.frequency.setValueAtTime(1900 + Math.random() * 400, timeOffset);
					osc.frequency.exponentialRampToValueAtTime(4500 + Math.random() * 1800, timeOffset + 0.11);

					oscGain.gain.setValueAtTime(0, timeOffset);
					oscGain.gain.linearRampToValueAtTime(0.02, timeOffset + 0.015);
					oscGain.gain.exponentialRampToValueAtTime(0.0001, timeOffset + 0.13);

					osc.connect(oscGain);
					oscGain.connect(this.birdGain);
					osc.start(timeOffset);
					osc.stop(timeOffset + 0.14);
				}
			}
			// Птицы поют не постоянно, делаем паузу
			this.birdTimeout = setTimeout(loop, 3000 + Math.random() * 5000);
		};
		loop();
	}

	updateVolumes() {
		if (!this.ctx || !this.active) return;

		const t = this.ctx.currentTime;
		const fadeTime = 1.2; // Плавное затухание

		// 1. Дождь
		const targetRain = (this.weather === 'rain') ? 0.22 : 0;
		this.rainGain.gain.linearRampToValueAtTime(targetRain, t + fadeTime);

		// 2. Ветер
		let targetWind = 0.02; // Легкий фоновый ветерок есть всегда
		if (this.weather === 'wind') targetWind = 0.26;
		else if (this.weather === 'rain') targetWind = 0.12;
		else if (this.weather === 'snow') targetWind = 0.06;
		this.windGain.gain.linearRampToValueAtTime(targetWind, t + fadeTime);

		// 3. Сверчки
		const targetCricket = ((this.time === 'night' || this.time === 'aurora') && this.weather !== 'rain') ? 0.4 : 0;
		this.cricketGain.gain.linearRampToValueAtTime(targetCricket, t + fadeTime);

		// 4. Птицы
		const targetBird = ((this.time === 'day' || this.time === 'sunset') && this.weather !== 'rain') ? 0.35 : 0;
		this.birdGain.gain.linearRampToValueAtTime(targetBird, t + fadeTime);
	}

	setTheme(time, weather) {
		this.time = time;
		this.weather = weather;
		if (this.active) {
			this.updateVolumes();
		}
	}

	start() {
		this.active = true;
		if (!this.ctx) {
			this.init();
		} else {
			if (this.ctx.state === 'suspended') {
				this.ctx.resume();
			}
			// Плавно возвращаем громкость
			const t = this.ctx.currentTime;
			this.masterGain.gain.linearRampToValueAtTime(0.5, t + 0.3);
			this.updateVolumes();
		}
	}

	stop() {
		this.active = false;
		if (this.ctx) {
			// Быстро уводим громкость в ноль перед паузой
			const t = this.ctx.currentTime;
			this.masterGain.gain.linearRampToValueAtTime(0, t + 0.15);
			setTimeout(() => {
				if (!this.active && this.ctx && this.ctx.state === 'running') {
					this.ctx.suspend();
				}
			}, 180);
		}
	}
}

const UI_LABELS = {
	lightOn: "Lights: On 💡",
	lightOff: "Lights: Off 🔌",
	soundOn: "Sound: On 🔊",
	soundOff: "Sound: Off 🔇",
	gateTitle: "Open / close gate",
};

/* Pixel cat in the window (23×14 cells, 2px each → 46×28) */
const PIXEL_CAT_PALETTE = {
	B: "#4a2c14",
	O: "#d97706",
	o: "#f59e0b",
	S: "#92400e",
	W: "#fff7ed",
	Y: "#fde047",
	P: "#1c1917",
	N: "#fb7185",
	M: "#78350f",
};

const PIXEL_CAT_ART = [
	".......................",
	"......BB.........BB......",
	".....BOOB.......BOOB.....",
	"....BOOOOOOBOOOOOOb...",
	"...BOOOOOOOOOOOOOOOOOb.",
	"..BOOOSOOOOOOOOOSOOOOb.",
	"..BOOOWOOOOOOOOOWOOOOb.",
	"..BOOOYPPNPPYOOOOOOb...",
	"...BOOOOOOOOOOOOOOOOb..",
	"....BOOOOOOOOOOOOOOb...",
	".....BOOOOOOOOOOOb.....",
	"......BOOOOOOOOb.......",
	".......BOOOOOb.........",
	"........BOOOb..........",
];

function buildPixelCat(container) {
	if (!container) return;
	const cell = 2;
	container.textContent = "";
	const rows = PIXEL_CAT_ART.length;

	for (let y = 0; y < rows; y++) {
		const line = PIXEL_CAT_ART[y];
		for (let x = 0; x < line.length; x++) {
			const key = line[x];
			const color = PIXEL_CAT_PALETTE[key];
			if (!color) continue;

			const dot = document.createElement("span");
			dot.className = "pixel-cat__dot";
			dot.style.left = `${x * cell}px`;
			dot.style.bottom = `${(rows - 1 - y) * cell}px`;
			dot.style.backgroundColor = color;
			container.appendChild(dot);
		}
	}
}

// Interactive scene setup
document.addEventListener("DOMContentLoaded", () => {
	const field = document.getElementById("scene-field");
	const sceneViewport = document.getElementById("scene-viewport");
	const sceneFullscreenExit = document.getElementById("scene-fullscreen-exit");
	const starsContainer = document.querySelector(".stars-container");
	const weatherContainer = document.querySelector(".weather-container");

	// Состояние сцены
	let timeState = "day";
	let weatherState = "clear";
	let lightState = true;
	let soundState = false;

	// Инициализация класса звука
	const sceneAudio = new SceneAudio();

	// Применяем стартовое состояние тем
	field.classList.add(`time-${timeState}`);
	field.classList.add(`weather-${weatherState}`);
	if (lightState) field.classList.add("light-on");

	// ==========================================
	// RESPONSIVE SCENE SCALE (fallback)
	// ==========================================
	function updateSceneScale() {
		if (!sceneViewport || !field) return;
		const w = sceneViewport.clientWidth;
		if (!w) return;

		const supportsCqw =
			typeof CSS !== "undefined" &&
			CSS.supports?.("transform", "scale(calc(100cqw / 1000))");

		if (supportsCqw) {
			sceneViewport.classList.remove("scene-viewport--js-scale");
			field.style.removeProperty("--scene-scale");
			field.style.removeProperty("transform");
			return;
		}

		const scale = w / 1000;
		sceneViewport.classList.add("scene-viewport--js-scale");
		field.style.setProperty("--scene-scale", String(scale));
	}

	updateSceneScale();
	window.addEventListener("resize", updateSceneScale, { passive: true });
	window.addEventListener("orientationchange", updateSceneScale);

	// ==========================================
	// FULL SCREEN — scene only (controls hidden)
	// ==========================================
	function isSceneFullscreen() {
		return (
			document.fullscreenElement === sceneViewport ||
			sceneViewport?.classList.contains("is-pseudo-fullscreen")
		);
	}

	function openSceneFullscreen() {
		if (!sceneViewport || isSceneFullscreen()) return;

		const request = sceneViewport.requestFullscreen?.();
		if (request && typeof request.then === "function") {
			request.then(() => onFullscreenChange()).catch(() => {
				sceneViewport.classList.add("is-pseudo-fullscreen");
				onFullscreenChange();
			});
		} else {
			sceneViewport.classList.add("is-pseudo-fullscreen");
			onFullscreenChange();
		}
	}

	function closeSceneFullscreen() {
		if (document.fullscreenElement === sceneViewport) {
			document.exitFullscreen?.();
		}
		sceneViewport?.classList.remove("is-pseudo-fullscreen");
		onFullscreenChange();
	}

	function onFullscreenChange() {
		if (!document.fullscreenElement) {
			sceneViewport?.classList.remove("is-pseudo-fullscreen");
		}
		const active = isSceneFullscreen();
		document.body.classList.toggle("scene-fullscreen-active", active);
		if (sceneFullscreenExit) sceneFullscreenExit.hidden = !active;
		updateSceneScale();
	}

	document.addEventListener("fullscreenchange", onFullscreenChange);

	if (sceneViewport) {
		sceneViewport.addEventListener("click", (e) => {
			if (e.target.closest(".scene-fullscreen-exit, .window, .fence-gate")) return;
			if (!isSceneFullscreen()) openSceneFullscreen();
		});
	}

	if (sceneFullscreenExit) {
		sceneFullscreenExit.addEventListener("click", (e) => {
			e.stopPropagation();
			closeSceneFullscreen();
		});
	}

	document.addEventListener("keydown", (e) => {
		if (e.key === "Escape" && isSceneFullscreen()) closeSceneFullscreen();
	});

	// ==========================================
	// STARS
	// ==========================================
	function updateStars() {
		starsContainer.innerHTML = '';
		if (timeState === 'night' || timeState === 'aurora') {
			const starCount = timeState === 'night' ? 65 : 35; // Меньше звезд при сиянии
			for (let i = 0; i < starCount; i++) {
				const star = document.createElement("div");
				star.className = "star";

				const size = Math.random() * 2 + 1; // 1px - 3px
				const left = Math.random() * 100;
				const top = Math.random() * 56; // Не опускаем ниже горизонта елки/дома (56% высоты)

				star.style.width = `${size}px`;
				star.style.height = `${size}px`;
				star.style.left = `${left}%`;
				star.style.top = `${top}%`;

				// Случайная скорость мерцания
				const twinkleDur = 2 + Math.random() * 4;
				const delay = Math.random() * 5;
				star.style.setProperty('--twinkle-dur', `${twinkleDur}s`);
				star.style.animationDelay = `${delay}s`;

				starsContainer.appendChild(star);
			}
		}
	}

	// ==========================================
	// ГЕНЕРАЦИЯ ПОГОДНЫХ ЧАСТИЦ
	// ==========================================
	let weatherTimer = null;

	function updateWeatherParticles() {
		weatherContainer.innerHTML = '';
		if (weatherTimer) {
			clearInterval(weatherTimer);
			weatherTimer = null;
		}

		if (weatherState === 'clear') return;

		if (weatherState === 'rain') {
			// Создаем стартовую порцию капель для мгновенного эффекта
			for (let i = 0; i < 45; i++) {
				createParticle('rain', true);
			}
			// Добавляем новые капли по ходу времени
			weatherTimer = setInterval(() => createParticle('rain', false), 45);
		} else if (weatherState === 'snow') {
			// Стартовая порция снежинок
			for (let i = 0; i < 35; i++) {
				createParticle('snow', true);
			}
			weatherTimer = setInterval(() => createParticle('snow', false), 110);
		} else if (weatherState === 'wind') {
			// Быстрые порывы ветра в виде воздушных линий
			for (let i = 0; i < 3; i++) {
				createParticle('wind', true);
			}
			weatherTimer = setInterval(() => createParticle('wind', false), 550);
		}
	}

	function createParticle(type, isInitial = false) {
		const particle = document.createElement("div");
		
		if (type === 'rain') {
			particle.className = "rain-drop";
			const left = Math.random() * 115; // С небольшим запасом справа из-за наклона полета капли
			const top = isInitial ? (Math.random() * 500 - 20) : -20;
			particle.style.left = `${left}%`;
			particle.style.top = `${top}px`;

			const dur = 0.7 + Math.random() * 0.35;
			particle.style.setProperty('--fall-dur', `${dur}s`);

			if (isInitial) {
				const delay = Math.random() * -2;
				particle.style.animationDelay = `${delay}s`;
			}

			weatherContainer.appendChild(particle);
			setTimeout(() => particle.remove(), dur * 1000);

		} else if (type === 'snow') {
			particle.className = "snowflake";
			const left = Math.random() * 100;
			const top = isInitial ? (Math.random() * 500 - 10) : -10;
			const size = Math.random() * 3 + 1.5; // Снежинки от 1.5px до 4.5px

			particle.style.left = `${left}%`;
			particle.style.top = `${top}px`;
			particle.style.width = `${size}px`;
			particle.style.height = `${size}px`;
			particle.style.opacity = 0.35 + Math.random() * 0.55;

			const dur = 4 + Math.random() * 3.5;
			particle.style.setProperty('--fall-dur', `${dur}s`);

			if (isInitial) {
				const delay = Math.random() * -6;
				particle.style.animationDelay = `${delay}s`;
			}

			weatherContainer.appendChild(particle);
			setTimeout(() => particle.remove(), dur * 1000);

		} else if (type === 'wind') {
			// Линии ветра создаются скриптом с использованием плавного CSS transform
			particle.style.position = 'absolute';
			particle.style.height = '1px';
			particle.style.width = `${40 + Math.random() * 60}px`;
			particle.style.background = 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.22), transparent)';
			
			const top = 30 + Math.random() * 260; // Только в воздушном пространстве
			const startLeft = isInitial ? (Math.random() * 1000 - 100) : -110;
			particle.style.left = `${startLeft}px`;
			particle.style.top = `${top}px`;

			const dur = 1.1 + Math.random() * 0.7;
			particle.style.transition = `transform ${dur}s linear, opacity ${dur}s`;

			weatherContainer.appendChild(particle);

			// Запускаем смещение вправо
			setTimeout(() => {
				particle.style.transform = `translateX(1160px)`;
			}, 20);

			// Удаляем по завершению транзишена
			setTimeout(() => particle.remove(), dur * 1000);
		}
	}

	// ==========================================
	// ЗАБОР: продление, калитка, покачивание на ветру
	// ==========================================
	const FENCE_CFG = {
		postStart: 482,
		postEnd: 957,
		postStep: 25,
		gateX: 707,
	};

	function initFenceSwayTargets() {
		const staticFence = document.querySelectorAll(
			".fence1, .fence2, .fence3, .fence4, .fence5, .fence6, .fence7, " +
			".triangle-up1, .triangle-up2, .triangle-up3, .triangle-up4, .triangle-up5, .triangle-up6, .triangle-up7, " +
			".fences1, .fences2"
		);
		staticFence.forEach((el, index) => {
			el.classList.add("fence-sway-target");
			el.style.animationDelay = `${index * 0.06}s`;
		});
	}

	function buildExtendedFence() {
		const container = document.getElementById("extended-fence");
		if (!container) return;

		container.innerHTML = "";
		let swayIndex = 14;

		for (let x = FENCE_CFG.postStart; x <= FENCE_CFG.postEnd; x += FENCE_CFG.postStep) {
			if (x === FENCE_CFG.gateX) continue;

			const delay = `${swayIndex * 0.06}s`;
			swayIndex += 1;

			const post = document.createElement("div");
			post.className = "fence-post-dyn fence-sway-target";
			post.style.left = `${x}px`;
			post.style.animationDelay = delay;
			container.appendChild(post);

			const tip = document.createElement("div");
			tip.className = "fence-tip-dyn fence-sway-target";
			tip.style.left = `${x}px`;
			tip.style.animationDelay = delay;
			container.appendChild(tip);

			[
				[3, 35],
				[11, 35],
				[3, 11],
				[11, 11],
			].forEach(([offsetX, offsetBottom]) => {
				const nail = document.createElement("div");
				nail.className = "fence-nail-dyn";
				nail.style.left = `${x + offsetX}px`;
				nail.style.bottom = `${offsetBottom}px`;
				container.appendChild(nail);
			});
		}

		const gate = document.createElement("div");
		gate.className = "fence-gate";
		gate.style.left = `${FENCE_CFG.gateX}px`;
		gate.title = UI_LABELS.gateTitle;
		gate.innerHTML = `
			<div class="fence-gate-frame"></div>
			<div class="fence-gate-door fence-sway-target">
				<div class="fence-gate-door-post"></div>
				<div class="fence-gate-door-tip"></div>
			</div>
		`;
		gate.addEventListener("click", (e) => {
			e.stopPropagation();
			gate.classList.toggle("is-open");
		});
		container.appendChild(gate);
	}

	initFenceSwayTargets();
	buildExtendedFence();

	// ==========================================
	// ЗАДНИЙ ПЛАН: ЛЕТАЮЩИЕ ПТИЦЫ
	// ==========================================
	function initSkyBirds() {
		const spawnSkyBird = () => {
			// Спавним птицу только если погода не дождливая и не слишком ветреная
			if (weatherState !== 'rain') {
				const bird = document.createElement("div");
				bird.className = "sky-bird";
				
				const top = 30 + Math.random() * 150; // Высота полета
				const dur = 12 + Math.random() * 8; // Скорость полета (12-20 сек)

				bird.style.setProperty('--bird-top', `${top}px`);
				bird.style.setProperty('--fly-dur', `${dur}s`);

				starsContainer.appendChild(bird); // Помещаем в слой звезд, так как он находится за облаками

				setTimeout(() => bird.remove(), dur * 1000);
			}

			// Планируем следующее появление через 9-22 секунд
			setTimeout(spawnSkyBird, 9000 + Math.random() * 13000);
		};

		// Первый запуск спавнера через 4 секунды
		setTimeout(spawnSkyBird, 4000);
	}

	// ==========================================
	// ОБРАБОТЧИКИ СОБЫТИЙ ИНТЕРФЕЙСА
	// ==========================================

	// Клик по времени суток
	const timeButtons = document.querySelectorAll(".control-btn[data-time]");
	timeButtons.forEach(btn => {
		btn.addEventListener("click", () => {
			timeButtons.forEach(b => b.classList.remove("active"));
			btn.classList.add("active");

			const newTime = btn.getAttribute("data-time");
			field.classList.remove(`time-${timeState}`);
			timeState = newTime;
			field.classList.add(`time-${timeState}`);

			updateStars();
			sceneAudio.setTheme(timeState, weatherState);
		});
	});

	// Клик по погоде
	const weatherButtons = document.querySelectorAll(".control-btn[data-weather]");
	weatherButtons.forEach(btn => {
		btn.addEventListener("click", () => {
			weatherButtons.forEach(b => b.classList.remove("active"));
			btn.classList.add("active");

			const newWeather = btn.getAttribute("data-weather");
			field.classList.remove(`weather-${weatherState}`);
			weatherState = newWeather;
			field.classList.add(`weather-${weatherState}`);

			updateWeatherParticles();
			sceneAudio.setTheme(timeState, weatherState);
		});
	});

	// Переключатель света
	const lightBtn = document.getElementById("light-btn");
	function toggleLight(state) {
		if (state !== undefined) {
			lightState = state;
		} else {
			lightState = !lightState;
		}

		if (lightState) {
			field.classList.add("light-on");
			lightBtn.classList.add("active");
			lightBtn.classList.remove("muted");
			lightBtn.innerHTML = UI_LABELS.lightOn;
		} else {
			field.classList.remove("light-on");
			lightBtn.classList.remove("active");
			lightBtn.classList.add("muted");
			lightBtn.innerHTML = UI_LABELS.lightOff;
		}
	}
	lightBtn.addEventListener("click", () => toggleLight());

	// Клик на само окно дома также переключает свет
	const windowElem = document.querySelector(".window");
	if (windowElem) {
		windowElem.addEventListener("click", (e) => {
			e.stopPropagation();
			toggleLight();
		});
	}

	// Переключатель звука
	const soundBtn = document.getElementById("sound-btn");
	soundBtn.addEventListener("click", () => {
		soundState = !soundState;
		if (soundState) {
			soundBtn.classList.add("active");
			soundBtn.classList.remove("muted");
			soundBtn.innerHTML = UI_LABELS.soundOn;
			sceneAudio.start();
		} else {
			soundBtn.classList.remove("active");
			soundBtn.classList.add("muted");
			soundBtn.innerHTML = UI_LABELS.soundOff;
			sceneAudio.stop();
		}
	});

	buildPixelCat(document.getElementById("pixel-cat"));

	// Запуск фоновых процессов
	updateStars();
	updateWeatherParticles();
	initSkyBirds();
});
