
document.addEventListener("DOMContentLoaded", () => {
  const scenes = Array.from(document.querySelectorAll(".film-scene"));
  const player = document.getElementById("filmPlayer");

  const playButton = document.getElementById("playFilm");
  const pauseButton = document.getElementById("pauseFilm");
  const replayButton = document.getElementById("replayFilm");
  const backButton = document.getElementById("backFilm");

  const progressFill = document.getElementById("progressFill");
  const sceneCounter = document.getElementById("sceneCounter");

  if (!player || scenes.length === 0) {
    console.error("MAMFLIX could not find its film scenes.");
    return;
  }

  let currentScene = 0;
  let playing = false;
  let remainingTime = 0;
  let startedAt = 0;
  let sceneTimer = null;
  let progressTimer = null;

  const durations = scenes.map(scene =>
    Number(scene.dataset.duration) || 12000
  );

  const totalDuration = durations.reduce(
    (sum, duration) => sum + duration,
    0
  );

  // VIDEO FILES
  const videoSources = {
    singing: "assets/videos/singing.mp4",
    ministration: "assets/videos/ministration.mp4",
    teaching: "assets/videos/teaching.mp4",
    joy: "assets/videos/joy.mp4"
  };

  const videos = Array.from(
    document.querySelectorAll(".scene-video")
  );

  videos.forEach(video => {
    const source = videoSources[video.dataset.video];
    const frame = video.closest(".video-frame");

    if (!source) {
      if (frame) frame.hidden = true;
      return;
    }

    video.addEventListener("error", () => {
      if (frame) frame.hidden = true;
    });

    video.addEventListener("loadeddata", () => {
      if (frame) frame.hidden = false;
    });

    video.src = source;
    video.load();
  });

  // AMBIENT MUSIC
  let audioContext = null;
  let musicOn = false;
  let musicButton = null;
  let musicNodes = [];
  let musicInterval = null;

  const chords = [
    [261.63, 329.63, 392.00],
    [220.00, 261.63, 329.63],
    [174.61, 220.00, 261.63],
    [196.00, 246.94, 293.66]
  ];

  function createMusic() {
    const AudioContextClass =
      window.AudioContext || window.webkitAudioContext;

    if (!AudioContextClass) return;

    if (!audioContext) {
      audioContext = new AudioContextClass();
    }

    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    if (musicNodes.length > 0) return;

    chords[0].forEach((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.value = 0.0001;

      oscillator.connect(gain);
      gain.connect(audioContext.destination);

      oscillator.start();

      gain.gain.setTargetAtTime(
        index === 0 ? 0.018 : 0.010,
        audioContext.currentTime,
        2
      );

      musicNodes.push({ oscillator, gain });
    });

    let chordPosition = 0;

    musicInterval = setInterval(() => {
      if (!musicOn || !audioContext || musicNodes.length === 0) {
        return;
      }

      chordPosition = (chordPosition + 1) % chords.length;

      musicNodes.forEach((node, index) => {
        node.oscillator.frequency.setTargetAtTime(
          chords[chordPosition][index],
          audioContext.currentTime,
          2
        );
      });
    }, 6500);
  }

  function stopMusic() {
    if (musicInterval) {
      clearInterval(musicInterval);
      musicInterval = null;
    }

    if (!audioContext) return;

    musicNodes.forEach(node => {
      try {
        node.gain.gain.setTargetAtTime(
          0.0001,
          audioContext.currentTime,
          0.6
        );

        node.oscillator.stop(audioContext.currentTime + 2);
      } catch (error) {
        // Already stopped.
      }
    });

    musicNodes = [];
  }

  function toggleMusic() {
    musicOn = !musicOn;

    if (musicOn) {
      createMusic();

      if (audioContext && audioContext.state === "suspended") {
        audioContext.resume();
      }

      musicButton.textContent = "♫ MUSIC ON";
    } else {
      stopMusic();

      if (audioContext && audioContext.state === "running") {
        audioContext.suspend();
      }

      musicButton.textContent = "♫ MUSIC OFF";
    }
  }

  // ADD MUSIC BUTTON
  const controls = document.querySelector(".film-controls");

  if (controls) {
    musicButton = document.createElement("button");
    musicButton.type = "button";
    musicButton.className = "film-control";
    musicButton.textContent = "♫ MUSIC OFF";
    musicButton.addEventListener("click", toggleMusic);
    controls.appendChild(musicButton);
  }

  // VIDEO CONTROL
  function pauseAllVideos() {
    videos.forEach(video => video.pause());
  }

  function playCurrentVideo() {
    const activeScene = scenes[currentScene];

    if (!activeScene) return;

    const video = activeScene.querySelector(".scene-video");

    if (video && video.hasAttribute("src") && video.readyState > 0) {
      video.play().catch(() => {
        // The film continues if autoplay is blocked.
      });
    }
  }

  // SCENE BACKGROUNDS
  function updateTheme(scene) {
    const theme = scene.dataset.theme || "ivory";

    player.classList.remove(
      "theme-ivory",
      "theme-blush",
      "theme-champagne",
      "theme-rose",
      "theme-finale"
    );

    player.classList.add(`theme-${theme}`);
  }

  // PROGRESS BAR
  function updateProgress() {
    if (!progressFill) return;

    const completedBefore = durations
      .slice(0, currentScene)
      .reduce((sum, duration) => sum + duration, 0);

    const elapsedInScene = durations[currentScene] - remainingTime;

    const totalElapsed = completedBefore + elapsedInScene;

    const percentage = Math.min(
      100,
      Math.max(0, (totalElapsed / totalDuration) * 100)
    );

    progressFill.style.width = `${percentage}%`;
  }

  function updateCounter() {
    if (sceneCounter) {
      sceneCounter.textContent = "A FILM MADE WITH LOVE";
    }
  }

  // TIMERS
  function clearTimers() {
    clearTimeout(sceneTimer);
    clearInterval(progressTimer);

    sceneTimer = null;
    progressTimer = null;
  }

  function startSceneClock() {
    clearTimers();

    startedAt = Date.now();

    sceneTimer = setTimeout(() => {
      nextScene();
    }, remainingTime);

    progressTimer = setInterval(() => {
      const elapsed = Date.now() - startedAt;

      remainingTime = Math.max(
        0,
        remainingTime - elapsed
      );

      startedAt = Date.now();

      updateProgress();
    }, 100);
  }

  // DISPLAY SCENE
  function showScene(index) {
    if (index < 0 || index >= scenes.length) return;

    clearTimers();
    pauseAllVideos();

    currentScene = index;
    remainingTime = durations[currentScene];

    scenes.forEach((scene, sceneIndex) => {
      scene.classList.toggle(
        "active",
        sceneIndex === currentScene
      );
    });

    updateTheme(scenes[currentScene]);
    updateCounter();
    updateProgress();

    if (playing) {
      startSceneClock();
      playCurrentVideo();
    }
  }

  // NEXT SCENE
  function nextScene() {
    if (!playing) return;

    if (currentScene < scenes.length - 1) {
      showScene(currentScene + 1);
    } else {
      finishFilm();
    }
  }

  // START FILM
  function startFilm() {
    player.classList.add("film-open");

    playing = true;

    if (currentScene === scenes.length - 1) {
      showScene(0);
    } else {
      showScene(currentScene);
    }

    if (!musicOn) {
      musicOn = true;
      createMusic();

      if (musicButton) {
        musicButton.textContent = "♫ MUSIC ON";
      }
    }

    if (pauseButton) {
      pauseButton.textContent = "Ⅱ PAUSE";
    }
  }

  // PAUSE AND RESUME
  function pauseFilm() {
    if (playing) {
      const elapsed = Date.now() - startedAt;

      remainingTime = Math.max(
        0,
        remainingTime - elapsed
      );

      playing = false;

      clearTimers();
      pauseAllVideos();

      if (audioContext && audioContext.state === "running" && musicOn) {
        audioContext.suspend();
      }

      if (pauseButton) {
        pauseButton.textContent = "▶ RESUME";
      }
    } else {
      playing = true;

      if (audioContext && audioContext.state === "suspended" && musicOn) {
        audioContext.resume();
      }

      startSceneClock();
      playCurrentVideo();

      if (pauseButton) {
        pauseButton.textContent = "Ⅱ PAUSE";
      }
    }

    updateProgress();
  }

  // GO BACK
  function goBack() {
    if (currentScene === 0) return;

    showScene(currentScene - 1);

    if (pauseButton) {
      pauseButton.textContent = playing ? "Ⅱ PAUSE" : "▶ RESUME";
    }
  }

  // REPLAY
  function replayFilm() {
    playing = true;

    player.classList.add("film-open");

    showScene(0);

    if (!musicOn) {
      musicOn = true;
      createMusic();

      if (musicButton) {
        musicButton.textContent = "♫ MUSIC ON";
      }
    }

    if (audioContext && audioContext.state === "suspended") {
      audioContext.resume();
    }

    if (pauseButton) {
      pauseButton.textContent = "Ⅱ PAUSE";
    }
  }

  // END OF FILM
  function finishFilm() {
    playing = false;

    clearTimers();
    pauseAllVideos();

    remainingTime = 0;
    currentScene = scenes.length - 1;

    scenes.forEach((scene, index) => {
      scene.classList.toggle(
        "active",
        index === currentScene
      );
    });

    updateTheme(scenes[currentScene]);

    if (progressFill) {
      progressFill.style.width = "100%";
    }

    updateCounter();

    if (pauseButton) {
      pauseButton.textContent = "↺ REPLAY";
    }
  }

  // BUTTON EVENTS
  if (playButton) {
    playButton.addEventListener("click", startFilm);
  }

  if (pauseButton) {
    pauseButton.addEventListener("click", () => {
      if (!playing && currentScene === scenes.length - 1) {
        replayFilm();
      } else {
        pauseFilm();
      }
    });
  }

  if (backButton) {
    backButton.addEventListener("click", goBack);
  }

  if (replayButton) {
    replayButton.addEventListener("click", replayFilm);
  }

  // INITIAL SCREEN
  scenes.forEach(scene => scene.classList.remove("active"));

  if (sceneCounter) {
    sceneCounter.textContent = "A FILM MADE WITH LOVE";
  }

  if (progressFill) {
    progressFill.style.width = "0%";
  }

  // FOOTER YEAR
  const year = document.getElementById("currentYear");

  if (year) {
    year.textContent = new Date().getFullYear();
  }
});
