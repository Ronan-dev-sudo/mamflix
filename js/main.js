
document.addEventListener("DOMContentLoaded", () => {
  const scenes = [...document.querySelectorAll(".film-scene")];
  const player = document.getElementById("filmPlayer");
  const playButton = document.getElementById("playFilm");
  const pauseButton = document.getElementById("pauseFilm");
  const replayButton = document.getElementById("replayFilm");
  const backButton = document.getElementById("backFilm");
  const progressFill = document.getElementById("progressFill");
  const sceneCounter = document.getElementById("sceneCounter");

  let currentScene = 0;
  let timer = null;
  let progressTimer = null;
  let playing = false;
  let remaining = 0;
  let startedAt = 0;
  let audioContext = null;
  let musicOn = false;
  let musicTimer = null;
  let noteIndex = 0;

  const durations = scenes.map(scene => Number(scene.dataset.duration));
  const totalDuration = durations.reduce((a, b) => a + b, 0);

  const notes = [
    [261.63, 329.63, 392.00],
    [220.00, 261.63, 329.63],
    [174.61, 220.00, 261.63],
    [196.00, 246.94, 293.66]
  ];

  // MUSIC CONTROL
  const musicButton = document.createElement("button");
  musicButton.textContent = "♫ MUSIC OFF";
  musicButton.className = "film-control";
  musicButton.type = "button";
  player.querySelector(".film-controls").appendChild(musicButton);

  function playNote(frequency, time) {
    if (!audioContext || !musicOn) return;

    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.value = frequency;

    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(0.018, time + 0.15);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + 2.8);

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.start(time);
    oscillator.stop(time + 3);
  }

  function musicStep() {
    if (!musicOn || !audioContext) return;

    const chord = notes[noteIndex % notes.length];
    const now = audioContext.currentTime;

    chord.forEach((frequency, index) => {
      playNote(frequency, now + index * 0.25);
    });

    noteIndex++;
    musicTimer = setTimeout(musicStep, 3000);
  }

  async function startMusic() {
    try {
      if (!audioContext) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        audioContext = new AudioContext();
      }

      await audioContext.resume();

      musicOn = true;
      musicButton.textContent = "♫ MUSIC ON";

      clearTimeout(musicTimer);
      musicStep();
    } catch (error) {
      musicOn = false;
      musicButton.textContent = "♫ MUSIC OFF";
    }
  }

  function stopMusic() {
    musicOn = false;
    clearTimeout(musicTimer);
    musicButton.textContent = "♫ MUSIC OFF";
  }

  musicButton.addEventListener("click", () => {
    if (musicOn) stopMusic();
    else startMusic();
  });

  // FILM PROGRESS
  function updateProgress() {
    const completed = durations
      .slice(0, currentScene)
      .reduce((a, b) => a + b, 0);

    const elapsed = durations[currentScene] - remaining;
    const percentage = ((completed + elapsed) / totalDuration) * 100;

    progressFill.style.width = `${Math.min(100, percentage)}%`;
  }

  function startProgress() {
    clearInterval(progressTimer);

    progressTimer = setInterval(() => {
      if (!playing) return;

      remaining = Math.max(0, remaining - 100);
      updateProgress();
    }, 100);
  }

  // SCENE TRANSITIONS
  function showScene(index) {
    clearTimeout(timer);

    currentScene = Math.max(0, Math.min(index, scenes.length - 1));
    remaining = durations[currentScene];
    startedAt = Date.now();

    scenes.forEach((scene, i) => {
      scene.classList.toggle("active", i === currentScene);
    });

    sceneCounter.textContent = "A FILM MADE WITH LOVE";

    updateProgress();
    startProgress();

    if (playing) {
      timer = setTimeout(nextScene, remaining);
    }
  }

  function nextScene() {
    if (!playing) return;

    if (currentScene < scenes.length - 1) {
      showScene(currentScene + 1);
    } else {
      finishFilm();
    }
  }

  // PLAY, PAUSE AND REPLAY
  function startFilm() {
    clearTimeout(timer);
    clearInterval(progressTimer);

    player.classList.add("film-open");

    playing = true;
    pauseButton.textContent = "Ⅱ PAUSE";

    if (!musicOn) startMusic();

    showScene(0);
  }

  function pauseFilm() {
    if (!playing) return;

    remaining = Math.max(
      0,
      remaining - (Date.now() - startedAt)
    );

    clearTimeout(timer);
    clearInterval(progressTimer);

    playing = false;
    pauseButton.textContent = "▶ RESUME";

    updateProgress();
  }

  function resumeFilm() {
    if (playing) return;

    if (remaining <= 0) {
      if (currentScene < scenes.length - 1) {
        playing = true;
        showScene(currentScene + 1);
      } else {
        startFilm();
      }
      return;
    }

    playing = true;
    startedAt = Date.now();

    pauseButton.textContent = "Ⅱ PAUSE";

    timer = setTimeout(nextScene, remaining);
    startProgress();
  }

  function goBack() {
    if (currentScene <= 0) return;

    showScene(currentScene - 1);
  }

  function finishFilm() {
    clearTimeout(timer);
    clearInterval(progressTimer);

    playing = false;
    remaining = 0;

    scenes.forEach(scene => scene.classList.remove("active"));
    scenes[scenes.length - 1].classList.add("active");

    progressFill.style.width = "100%";
    sceneCounter.textContent = "WITH ALL OUR LOVE, ALWAYS";

    pauseButton.textContent = "▶ REPLAY";
  }

  playButton.addEventListener("click", startFilm);
  replayButton.addEventListener("click", startFilm);
  backButton.addEventListener("click", goBack);

  pauseButton.addEventListener("click", () => {
    if (playing) pauseFilm();
    else resumeFilm();
  });

  document.getElementById("currentYear").textContent =
    new Date().getFullYear();
});

