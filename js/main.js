document.addEventListener("DOMContentLoaded", () => {
  const scenes = [...document.querySelectorAll(".film-scene")];
  const player = document.getElementById("filmPlayer");
  const playButton = document.getElementById("playFilm");
  const pauseButton = document.getElementById("pauseFilm");
  const replayButton = document.getElementById("replayFilm");
  const progressFill = document.getElementById("progressFill");
  const sceneCounter = document.getElementById("sceneCounter");

  let currentScene = 0;
  let timer = null;
  let playing = false;
  let remaining = 0;
  let startedAt = 0;

  // Gentle original piano-like ambience
  let audioContext = null;
  let musicOn = false;
  let musicTimer = null;
  let noteIndex = 0;

  const notes = [
    [261.63, 329.63, 392.00],
    [220.00, 261.63, 329.63],
    [174.61, 220.00, 261.63],
    [196.00, 246.94, 293.66]
  ];

  function playSoftNote(frequency, startTime) {
    if (!audioContext || !musicOn) return;

    const volume = audioContext.createGain();
    volume.gain.setValueAtTime(0.0001, startTime);
    volume.gain.exponentialRampToValueAtTime(0.035, startTime + 0.04);
    volume.gain.exponentialRampToValueAtTime(0.0001, startTime + 2.2);
    volume.connect(audioContext.destination);

    [1, 2, 3].forEach((harmonic, index) => {
      const oscillator = audioContext.createOscillator();
      const partialGain = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = frequency * harmonic;
      partialGain.gain.value = [1, 0.22, 0.07][index];

      oscillator.connect(partialGain);
      partialGain.connect(volume);

      oscillator.start(startTime);
      oscillator.stop(startTime + 2.3);
    });
  }

  function musicStep() {
    if (!musicOn || !audioContext) return;

    const chord = notes[noteIndex % notes.length];
    const now = audioContext.currentTime;

    chord.forEach((frequency, index) => {
      playSoftNote(frequency, now + index * 0.18);
    });

    noteIndex++;
    musicTimer = setTimeout(musicStep, 2400);
  }

  function startMusic() {
    if (!audioContext) {
      audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }

    audioContext.resume();
    musicOn = true;
    musicButton.textContent = "♫ MUSIC ON";
    musicStep();
  }

  function stopMusic() {
    musicOn = false;
    clearTimeout(musicTimer);
    musicButton.textContent = "♫ MUSIC OFF";
  }

  const musicButton = document.createElement("button");
  musicButton.textContent = "♫ MUSIC OFF";
  musicButton.type = "button";
  musicButton.style.cssText = `
    background: transparent;
    color: #e8c9d7;
    border: 1px solid rgba(232,201,215,.45);
    padding: 11px 18px;
    border-radius: 30px;
    font: inherit;
    letter-spacing: 2px;
    font-size: 10px;
    cursor: pointer;
    margin: 12px;
  `;

  musicButton.addEventListener("click", () => {
    if (musicOn) stopMusic();
    else startMusic();
  });

  player.appendChild(musicButton);

  const totalDuration = scenes.reduce(
    (sum, scene) => sum + Number(scene.dataset.duration),
    0
  );

  function updateProgress() {
    const completed = scenes
      .slice(0, currentScene)
      .reduce((sum, scene) => sum + Number(scene.dataset.duration), 0);

    const elapsed = Number(scenes[currentScene].dataset.duration) - remaining;
    progressFill.style.width =
      `${((completed + elapsed) / totalDuration) * 100}%`;
  }

  function showScene(index) {
    clearTimeout(timer);
    scenes.forEach((scene, i) =>
      scene.classList.toggle("active", i === index)
    );

    currentScene = index;
    remaining = Number(scenes[index].dataset.duration);
    startedAt = Date.now();

    sceneCounter.textContent = `CHAPTER ${index + 1} OF ${scenes.length}`;
    updateProgress();
    timer = setTimeout(nextScene, remaining);
  }

  function nextScene() {
    if (!playing) return;

    if (currentScene < scenes.length - 1) {
      showScene(currentScene + 1);
    } else {
      finishFilm();
    }
  }

  function startFilm() {
    clearTimeout(timer);
    playing = true;
    progressFill.style.width = "0%";
    pauseButton.textContent = "Ⅱ PAUSE";

    if (!musicOn) startMusic();

    player.scrollIntoView({ behavior: "smooth", block: "start" });

    setTimeout(() => {
      if (playing) showScene(0);
    }, 500);
  }

  function pauseFilm() {
    if (!playing) return;

    remaining -= Date.now() - startedAt;
    remaining = Math.max(0, remaining);
    clearTimeout(timer);
    playing = false;
    pauseButton.textContent = "▶ RESUME";
    updateProgress();
  }

  function resumeFilm() {
    if (playing) return;

    if (remaining <= 0) {
      playing = true;
      nextScene();
      return;
    }

    playing = true;
    pauseButton.textContent = "Ⅱ PAUSE";
    startedAt = Date.now();
    timer = setTimeout(nextScene, remaining);
  }

  function finishFilm() {
    clearTimeout(timer);
    playing = false;
    scenes.forEach(scene => scene.classList.remove("active"));
    scenes[scenes.length - 1].classList.add("active");
    progressFill.style.width = "100%";
    sceneCounter.textContent = "THE END · WITH LOVE, ALWAYS";
    pauseButton.textContent = "▶ REPLAY";
    remaining = 0;
  }

  playButton.addEventListener("click", startFilm);

  pauseButton.addEventListener("click", () => {
    if (playing) pauseFilm();
    else if (remaining === 0 && currentScene === scenes.length - 1) {
      startFilm();
    } else {
      resumeFilm();
    }
  });

  replayButton.addEventListener("click", startFilm);

  document.getElementById("currentYear").textContent =
    new Date().getFullYear();
});
