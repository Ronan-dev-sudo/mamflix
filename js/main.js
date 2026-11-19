
document.addEventListener("DOMContentLoaded", () => {

  // Smooth navigation
  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", event => {
      const target = document.querySelector(link.getAttribute("href"));

      if (target) {
        event.preventDefault();
        target.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    });
  });

  // Play Film button
  const playButton = document.querySelector("#playFilm");

  if (playButton) {
    playButton.addEventListener("click", () => {
      const firstChapter = document.querySelector("#chapters");

      if (firstChapter) {
        firstChapter.scrollIntoView({
          behavior: "smooth"
        });
      }
    });
  }

  // Audio controls
  const audio = document.querySelector("#backgroundMusic");
  const audioButton = document.querySelector("#audioToggle");

  if (audio && audioButton) {
    audioButton.addEventListener("click", async () => {
      try {
        if (audio.paused) {
          await audio.play();
          audioButton.textContent = "♫ Music On";
        } else {
          audio.pause();
          audioButton.textContent = "♫ Music Off";
        }
      } catch (error) {
        console.error("Audio could not be played:", error);
      }
    });
  }

  // Footer year
  const year = document.querySelector("#currentYear");

  if (year) {
    year.textContent = new Date().getFullYear();
  }

});
