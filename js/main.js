
const welcome = document.getElementById("welcome");
const film = document.getElementById("film");
const playButton = document.getElementById("playButton");
const pauseButton = document.getElementById("pauseButton");
const musicButton = document.getElementById("musicButton");
const backButton = document.getElementById("backButton");
const nextButton = document.getElementById("nextButton");
const progress = document.getElementById("progress");
const scenes = [...document.querySelectorAll(".scene")];

let currentScene = 0;
let playing = false;
let musicEnabled = false;
let remaining = 0;
let sceneStartedAt = 0;
let sceneTimer = null;
let progressTimer = null;
let audioContext = null;
let masterGain = null;
let musicNodes = [];
let chordTimer = null;

const durations = scenes.map(scene =>
  Number(scene.dataset.duration) || 10000
);

function makePetals() {
  const container = document.querySelector(".petals");
  const symbols = ["✿", "❀", "✧", "·"];

  for (let i = 0; i < 18; i++) {
    const petal = document.createElement("span");
    petal.className = "petal";
    petal.textContent = symbols[i % symbols.length];
    petal.style.left = Math.random() * 100 + "%";
    petal.style.animationDuration = (16 + Math.random() * 18) + "s";
    petal.style.animationDelay = (-Math.random() * 25) + "s";
    petal.style.fontSize = (10 + Math.random() * 13) + "px";
    container.appendChild(petal);
  }
}

function showScene(index) {
  currentScene = Math.max(0, Math.min(index, scenes.length - 1));

  scenes.forEach((scene, i) => {
    scene.classList.toggle("active", i === currentScene);
  });

  film.className = "film theme-" + scenes[currentScene].dataset.theme;
  progress.style.width = ((currentScene / scenes.length) * 100) + "%";
  remaining = durations[currentScene];

  if (playing) startSceneClock();
}

function clearClock() {
  clearTimeout(sceneTimer);
  clearInterval(progressTimer);
  sceneTimer = null;
  progressTimer = null;
}

function startSceneClock() {
  clearClock();

  sceneStartedAt = Date.now();
  const startingTime = remaining;

  progressTimer = setInterval(() => {
    const elapsed = Date.now() - sceneStartedAt;
    const left = Math.max(0, startingTime - elapsed);
    const completed = (durations[currentScene] - left) / durations[currentScene];

    progress.style.width =
      ((currentScene + completed) / scenes.length * 100) + "%";
  }, 100);

  sceneTimer = setTimeout(() => {
    if (currentScene < scenes.length - 1) {
      showScene(currentScene + 1);
    } else {
      finishFilm();
    }
  }, remaining);
}

function pauseFilm() {
  if (!playing) return;

  remaining = Math.max(0, remaining - (Date.now() - sceneStartedAt));
  playing = false;
  clearClock();
  pauseButton.textContent = "▶ RESUME";
}

function resumeFilm() {
  if (playing) return;

  playing = true;
  pauseButton.textContent = "Ⅱ PAUSE";
  startSceneClock();
}

function finishFilm() {
  playing = false;
  clearClock();
  pauseButton.textContent = "↺ REPLAY";
  progress.style.width = "100%";
}

function startFilm() {
  welcome.classList.add("hidden");
  film.classList.remove("hidden");

  if (currentScene === scenes.length - 1 && !playing) {
    showScene(0);
  }

  if (!musicEnabled) {
    musicEnabled = true;
    startMusic();
    musicButton.textContent = "♫ MUSIC ON";
  }

  if (!playing) {
    playing = true;
    pauseButton.textContent = "Ⅱ PAUSE";
    startSceneClock();
  }
}

function goNext() {
  if (currentScene < scenes.length - 1) {
    showScene(currentScene + 1);
  } else {
    finishFilm();
  }
}

function goBack() {
  if (currentScene > 0) {
    showScene(currentScene - 1);
  }
}

// Soft ambient soundtrack: slow sustained chords, no percussion or beat.
const chords = [
  [261.63, 329.63, 392.00, 523.25],
  [220.00, 261.63, 329.63, 440.00],
  [174.61, 220.00, 261.63, 349.23],
  [196.00, 246.94, 293.66, 392.00]
];

function playChord(chord) {
  if (!audioContext || !masterGain || !musicEnabled) return;

  const now = audioContext.currentTime;

  musicNodes.forEach(node => {
    try { node.stop(now + 1.5); } catch (e) {}
  });
  musicNodes = [];

  chord.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const volume = audioContext.createGain();
    const filter = audioContext.createBiquadFilter();

    oscillator.type = index === 0 ? "sine" : "triangle";
    oscillator.frequency.value = frequency;

    filter.type = "lowpass";
    filter.frequency.value = 900;

    const level = index === 0 ? 0.075 : 0.025;
    volume.gain.setValueAtTime(0.0001, now);
    volume.gain.exponentialRampToValueAtTime(level, now + 2.5);
    volume.gain.setTargetAtTime(0.0001, now + 7, 1.5);

    oscillator.connect(filter);
    filter.connect(volume);
    volume.connect(masterGain);

    oscillator.start(now);
    oscillator.stop(now + 12);

    musicNodes.push(oscillator);
  });
}

async function startMusic() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return;

  if (!audioContext) {
    audioContext = new AudioContextClass();
    masterGain = audioContext.createGain();
    masterGain.gain.value = 0.35;
    masterGain.connect(audioContext.destination);
  }

  await audioContext.resume();

  let chordIndex = 0;
  playChord(chords[chordIndex]);

  clearInterval(chordTimer);
  chordTimer = setInterval(() => {
    chordIndex = (chordIndex + 1) % chords.length;
    playChord(chords[chordIndex]);
  }, 10000);
}

async function stopMusic() {
  musicEnabled = false;
  clearInterval(chordTimer);

  if (masterGain && audioContext) {
    masterGain.gain.setTargetAtTime(
      0.0001,
      audioContext.currentTime,
      0.4
    );
  }

  setTimeout(() => {
    if (!musicEnabled && audioContext) {
      audioContext.suspend();
    }
  }, 1800);

  musicButton.textContent = "♫ MUSIC OFF";
}

playButton.addEventListener("click", startFilm);

pauseButton.addEventListener("click", () => {
  if (playing) {
    pauseFilm();
  } else if (currentScene === scenes.length - 1) {
    showScene(0);
    resumeFilm();
  } else {
    resumeFilm();
  }
});

nextButton.addEventListener("click", goNext);
backButton.addEventListener("click", goBack);

musicButton.addEventListener("click", async () => {
  if (musicEnabled) {
    stopMusic();
  } else {
    musicEnabled = true;
    await startMusic();
    musicButton.textContent = "♫ MUSIC ON";
  }
});

makePetals();
showScene(0);
