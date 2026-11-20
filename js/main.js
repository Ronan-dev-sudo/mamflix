
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

  const durations = scenes.map(scene => {
    return Number(scene.dataset.duration) || 12000;
  });

  const totalDuration = durations.reduce((sum, duration) => sum + duration, 0);

  // Expected video filenames in assets/videos/
  const videoSources = {
    singing: "assets/videos/singing.mp4",
    ministration: "assets/videos/ministration.mp4",
    teaching: "assets/videos/teaching.mp4",
    joy: "assets/videos/joy.mp4"
  };

  const videos = Array.from(document.querySelectorAll(".scene-video"));

  // Connect the video clips. Missing clips will simply remain hidden.
  videos.forEach(video => {
    const videoName = video.dataset.video;
    const source = videoSources[videoName];
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

  // Ambient music
  let audioContext = null;
  let musicOn = false;
  let musicButton = null;
  let musicNodes = [];

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

    musicNodes = [];

    chords.forEach((chord, chordIndex) => {
      chord.forEach((frequency, noteIndex) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();

        oscillator.type = "sine";
        oscillator.frequency.value = frequency;

        gain.gain.value = 0.0001;

        oscillator.connect(gain);
        gain.connect(audioContext.destination);

        oscillator.start();

        const now = audioContext.currentTime;
        const volume = noteIndex === 0 ? 0.018 : 0.010;

        gain.gain.setTargetAtTime(
          volume,
          now + chordIndex * 0.15,
          1.8
        );

        musicNodes.push({ oscillator, gain });
      });
    });

    let chordPosition = 0;

    window.mamflixMusicInterval = setInterval(() => {
      if (!musicOn || !audioContext) return;

      chordPosition = (chordPosition + 1) % chords.length;

      const now = audioContext.currentTime;

      musicNodes.forEach((node, index) => {
        const note = chords[chordPosition][index % 3];

        node.oscillator.frequency.setTargetAtTime(
          note,
          now,
          2
        );
      });
    }, 5000);
  }

  function stopMusic() {
    if (window.mamflixMusicInterval) {
      clearInterval(window.mamflixMusicInterval);
      window.mamflixMusicInterval = null;
    }

    musicNodes.forEach(node => {
      try {
        node.gain.gain.setTargetAtTime(
          0.0001,
          audioContext.currentTime,
          0.5
        );

        node.oscillator.stop(audioContext.currentTime + 2);
      } catch (error) {
        // An already stopped oscillator needs no further action.
      }
    });

    musicNodes = [];
  }

  function toggleMusic() {
    if (musicOn) {
      musicOn = false;
      stopMusic();
      musicButton.textContent = "♫ MUSIC OFF";
    } else {
      musicOn = true;
      createMusic();
      musicButton.textContent = "♫ MUSIC ON";
    }
  }

  // Add the music control
  const controls = document.querySelector(".film-controls");

  if (controls) {
    musicButton = document.createElement("button");
    musicButton.type = "button";
    musicButton.className = "film-control";
    musicButton.textContent = "♫ MUSIC OFF";
    musicButton.addEventListener("click", toggleMusic);
    controls.appendChild(musicButton);
  }

  function pauseAllVideos() {
    videos.forEach(video => {
      video.pause();
    });
  }

  function playCurrentVideo() {
    const activeScene = scenes[currentScene];
    if (!activeScene) return;

    const video = activeScene.querySelector(".scene-video");

    if (video && video.hasAttribute("src") && video.readyState > 0) {
      video.play().catch(() => {
        // The film continues even if the browser blocks video autoplay.
      });
    }
  }

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
      remainingTime = Math.max(
        0,
        remainingTime - 100
      );

      updateProgress();
    }, 100);
  }

  function showScene(index) {
    if (index < 0 || index >= scenes.length) return;

    clearTimers();
    pauseAllVideos();

    currentScene = index;
    remainingTime = durations[currentScene];

    scenes.forEach((scene, sceneIndex) => {
      scene.classList.toggle("active", sceneIndex === currentScene);
    });

    updateTheme(scenes[currentScene]);
    updateCounter();
    updateProgress();

    if (playing) {
      startSceneClock();
      playCurrentVideo();
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
      pauseButton.textContent = "PAUSE";
    }
  }

  function pauseFilm() {
    if (playing) {
      const elapsed = Date.now() - startedAt;
      remainingTime = Math.max(0, remainingTime - elapsed);

      playing = false;
      clearTimers();
      pauseAllVideos();

      if (audioContext && audioContext.state === "running") {
        audioContext.suspend();
      }

      if (pauseButton) {
        pauseButton.textContent = "RESUME";
      }
    } else {
      playing = true;

      if (audioContext && audioContext.state === "suspended" && musicOn) {
        audioContext.resume();
      }

      startSceneClock();
      playCurrentVideo();

      if (pauseButton) {
        pauseButton.textContent = "PAUSE";
      }
    }

    updateProgress();
  }

  function goBack() {
    if (currentScene === 0) return;

    showScene(currentScene - 1);

    if (pauseButton) {
      pauseButton.textContent = playing ? "PAUSE" : "RESUME";
    }
  }

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

    if (pauseButton) {
      pauseButton.textContent = "PAUSE";
    }
  }

  function finishFilm() {
    playing = false;
    clearTimers();
    pauseAllVideos();

    remainingTime = 0;

    scenes.forEach((scene, index) => {
      scene.classList.toggle("active", index === scenes.length - 1);
    });

    updateTheme(scenes[scenes.length - 1]);

    if (progressFill) {
      progressFill.style.width = "100%";
    }

    updateCounter();

    if (pauseButton) {
      pauseButton.textContent = "REPLAY";
    }
  }

  // Main controls
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

  // Initial screen
  scenes.forEach(scene => scene.classList.remove("active"));

  if (sceneCounter) {
    sceneCounter.textContent = "A FILM MADE WITH LOVE";
  }

  if (progressFill) {
    progressFill.style.width = "0%";
  }

  // Update the footer year if one is present
  const year = document.getElementById("currentYear");

  if (year) {
    year.textContent = new Date().getFullYear();
  }
});
