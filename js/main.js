
document.addEventListener("DOMContentLoaded", () => {
  const scenes = [...document.querySelectorAll(".film-scene")];
  const player = document.querySelector("#filmPlayer");
  const playButton = document.querySelector("#playFilm");
  const pauseButton = document.querySelector("#pauseFilm");
  const replayButton = document.querySelector("#replayFilm");
  const progressFill = document.querySelector("#progressFill");
  const sceneCounter = document.querySelector("#sceneCounter");
  const audio = document.querySelector("#backgroundMusic");
  const audioButton = document.querySelector("#audioToggle");

  let currentScene = 0;
  let timer = null;
  let startedAt = 0;
  let remaining = 0;
  let playing = false;

  const totalDuration = scenes.reduce(
    (sum, scene) => sum + Number(scene.dataset.duration || 40000),
    0
  );

  function updateProgress() {
    const completed = scenes
      .slice(0, currentScene)
      .reduce((sum, scene) => sum + Number(scene.dataset.duration || 40000), 0);

    const currentDuration = Number(scenes[currentScene]?.dataset.duration || 40000);
    const elapsed = currentDuration - remaining;
    const percentage = ((completed + elapsed) / totalDuration) * 100;

    progressFill.style.width = `${Math.min(percentage, 100)}%`;
    sceneCounter.textContent =
      `CHAPTER ${String(currentScene + 1).padStart(2, "0")} OF ${String(scenes.length).padStart(2, "0")}`;
  }

  function showScene(index) {
    scenes.forEach((scene, i) => {
      scene.classList.toggle("active", i === index);
    });

    currentScene = index;
    remaining = Number(scenes[index].dataset.duration || 40000);
    startedAt = Date.now();
    updateProgress();
    timer = setTimeout(nextScene, remaining);
  }

  function nextScene() {
    if (currentScene < scenes.length - 1) {
      showScene(currentScene + 1);
    } else {
      finishFilm();
    }
  }

  function startFilm() {
    clearTimeout(timer);
    player.scrollIntoView({ behavior: "smooth", block: "start" });

    playing = true;
    pauseButton.textContent = "Ⅱ PAUSE";
    showScene(0);

    if (audio && audio.paused) {
      audio.play().then(() => {
        audioButton.textContent = "♫ Music On";
      }).catch(() => {});
    }
  }

  function pauseFilm() {
    if (!playing) return;

    clearTimeout(timer);
    remaining -= Date.now() - startedAt;
    playing = false;
    pauseButton.textContent = "▶ RESUME";

    if (audio) audio.pause();
    if (audioButton) audioButton.textContent = "♫ Music Off";
  }

  function resumeFilm() {
    if (playing) return;

    playing = true;
    pauseButton.textContent = "Ⅱ PAUSE";
    startedAt = Date.now();
    timer = setTimeout(nextScene, remaining);

    if (audio) {
      audio.play().then(() => {
        audioButton.textContent = "♫ Music On";
      }).catch(() => {});
    }
  }

  function finishFilm() {
    clearTimeout(timer);
    playing = false;
    scenes.forEach(scene => scene.classList.remove("active"));
    progressFill.style.width = "100%";
    sceneCounter.textContent = "THE END · WITH LOVE, ALWAYS";
    pauseButton.textContent = "Ⅱ PAUSE";
    document.querySelector(".film-ending").classList.add("active");
    remaining = 0;
  }

  playButton.addEventListener("click", startFilm);

  pauseButton.addEventListener("click", () => {
    if (playing) {
      pauseFilm();
    } else if (remaining > 0) {
      resumeFilm();
    }
  });

  replayButton.addEventListener("click", startFilm);

  audioButton.addEventListener("click", async () => {
    if (audio.paused) {
      try {
        await audio.play();
        audioButton.textContent = "♫ Music On";
      } catch (error) {
        audioButton.textContent = "♫ Music Off";
      }
    } else {
      audio.pause();
      audioButton.textContent = "♫ Music Off";
    }
  });

  document.querySelector("#currentYear").textContent = new Date().getFullYear();
});
