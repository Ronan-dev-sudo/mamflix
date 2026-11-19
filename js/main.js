
document.addEventListener("DOMContentLoaded", () => {
  const scenes = [...document.querySelectorAll(".film-scene")];
  const player = document.getElementById("filmPlayer");
  const playButton = document.getElementById("playFilm");
  const pauseButton = document.getElementById("pauseFilm");
  const replayButton = document.getElementById("replayFilm");
  const backButton = document.getElementById("backFilm");
  const progressFill = document.getElementById("progressFill");
  const sceneCounter = document.getElementById("sceneCounter");

  if (!scenes.length || !player) return;

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

  const durations = scenes.map(scene =>
    Number(scene.dataset.duration) || 10000
  );

  const totalDuration = durations.reduce((a, b) => a + b, 0);

  const notes = [
    [261.63, 329.63, 392.00],
    [220.00, 261.63, 329.63],
    [174.61, 220.00, 261.63],
    [196.00, 246.94, 293.66]
  ];

  // MUSIC CONTROL

  const controls = player.querySelector(".film-controls");
  const musicButton = document.createElement("button");

  musicButton.textContent = "♫ MUSIC OFF";
  musicButton.className = "film-control";
  musicButton.type = "button";

  if (controls) {
    controls.appendChild(musicButton);
  }

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
        const AudioContext =
          window.AudioContext || window.webkitAudioContext;

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
    if (musicOn) {
      stopMusic();
    } else {
      startMusic();
    }
  });

  // ACCURATE FILM PROGRESS

  function getCurrentRemaining() {
    if (!playing) return remaining;

    const elapsed = Date.now() - startedAt;

    return Math.max(0, remaining - elapsed);
  }

  function updateProgress() {
    const completed = durations
      .slice(0, currentScene)
      .reduce((a, b) => a + b, 0);

    const timeLeft = getCurrentRemaining();
    const elapsed = durations[currentScene] - timeLeft;

    const percentage =
      ((completed + elapsed) / totalDuration) * 100;

    if (progressFill) {
      progressFill.style.width =
        `${Math.min(100, Math.max(0, percentage))}%`;
    }
  }

  function startProgress() {
    clearInterval(progressTimer);

    progressTimer = setInterval(() => {
      updateProgress();
    }, 100);
  }

  // SCENE TRANSITIONS

  function showScene(index) {
    clearTimeout(timer);
    clearInterval(progressTimer);

    currentScene = Math.max(
      0,
      Math.min(index, scenes.length - 1)
    );

    remaining = durations[currentScene];
    startedAt = Date.now();

    scenes.forEach((scene, i) => {
      scene.classList.toggle("active", i === currentScene);
    });

    if (sceneCounter) {
      sceneCounter.textContent = "A FILM MADE WITH LOVE";
    }

    updateProgress();

    if (playing) {
      timer = setTimeout(nextScene, remaining);
      startProgress();
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

  // PLAY

  function startFilm() {
    clearTimeout(timer);
    clearInterval(progressTimer);

    player.classList.add("film-open");

    playing = true;

    if (pauseButton) {
      pauseButton.textContent = "Ⅱ PAUSE";
    }

    if (!musicOn) {
      startMusic();
    }

    showScene(0);
  }

  // PAUSE

  function pauseFilm() {
    if (!playing) return;

    remaining = getCurrentRemaining();

    clearTimeout(timer);
    clearInterval(progressTimer);

    playing = false;

    if (pauseButton) {
      pauseButton.textContent = "▶ RESUME";
    }

    updateProgress();
  }

  // RESUME

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

    if (pauseButton) {
      pauseButton.textContent = "Ⅱ PAUSE";
    }

    timer = setTimeout(nextScene, remaining);

    startProgress();
    updateProgress();
  }

  // GO BACK

  function goBack() {
    if (currentScene <= 0) return;

    showScene(currentScene - 1);
  }

  // FILM FINALE

  function finishFilm() {
    clearTimeout(timer);
    clearInterval(progressTimer);

    playing = false;
    remaining = 0;

    scenes.forEach(scene => {
      scene.classList.remove("active");
    });

    scenes[scenes.length - 1].classList.add("active");

    if (progressFill) {
      progressFill.style.width = "100%";
    }

    if (sceneCounter) {
      sceneCounter.textContent = "WITH ALL OUR LOVE, ALWAYS";
    }

    if (pauseButton) {
      pauseButton.textContent = "▶ REPLAY";
    }
  }

  // BUTTON EVENTS

  if (playButton) {
    playButton.addEventListener("click", startFilm);
  }

  if (replayButton) {
    replayButton.addEventListener("click", startFilm);
  }

  if (backButton) {
    backButton.addEventListener("click", goBack);
  }

  if (pauseButton) {
    pauseButton.addEventListener("click", () => {
      if (playing) {
        pauseFilm();
      } else {
        resumeFilm();
      }
    });
  }

  // FOOTER YEAR

  const yearElement = document.getElementById("currentYear");

  if (yearElement) {
    yearElement.textContent = new Date().getFullYear();
  }
});
