(function () {
  const video = document.querySelector("[data-reel-video]");
  const button = document.querySelector("[data-audio-btn]");
  const label = document.querySelector("[data-audio-label]");

  if (!video || !button || !label) return;

  const setAudioState = (isMuted) => {
    video.muted = isMuted;
    button.setAttribute("aria-pressed", String(isMuted));
    button.setAttribute(
      "aria-label",
      isMuted ? "Unmute reel audio" : "Mute reel audio",
    );
    label.textContent = isMuted ? "OFF" : "ON";
  };

  const syncAudioState = () => {
    setAudioState(video.muted || video.volume === 0);
  };

  const tryAutoplayWithSound = async () => {
    setAudioState(false);

    try {
      video.volume = 1;
      await video.play();
    } catch {
      setAudioState(true);
      try {
        await video.play();
      } catch {
        syncAudioState();
      }
    }
  };

  button.addEventListener("click", async () => {
    const nextMutedState = !video.muted;
    setAudioState(nextMutedState);

    if (video.paused) {
      try {
        await video.play();
      } catch {
        syncAudioState();
      }
    }
  });

  video.addEventListener("volumechange", syncAudioState);
  syncAudioState();
  void tryAutoplayWithSound();
})();
