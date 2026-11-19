
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

  const totalDuration = scenes.reduce(
    (sum, scene) => sum + Number(scene.dataset.duration),
    0
  );

  function updateProgress() {
    const completed = scenes
      .slice(0, currentScene)
      .reduce((sum, scene) => sum + Number(scene.dataset.duration), 0);

    const elapsed = Number(scenes[currentScene].dataset.duration) - remaining;
    const percentage = ((completed + elapsed) / totalDuration) * 100;

    progressFill.style.width = `${percentage}%`;
  }

  function showScene(index) {
    clearTimeout(timer);
    scenes.forEach((scene, i) => scene.classList.toggle("active", i === index));

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
    else if (remaining === 0 && currentScene === scenes.length - 1) startFilm();
    else resumeFilm();
  });

  replayButton.addEventListener("click", startFilm);

  document.getElementById("currentYear").textContent =
    new Date().getFullYear();
});
