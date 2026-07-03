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

  const ensurePlaying = async () => {
    if (!video.paused) return;

    try {
      await video.play();
    } catch {
      syncAudioState();
    }
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

  let hasHandledFirstInteraction = false;

  const onFirstInteractionEnableAudio = async () => {
    if (hasHandledFirstInteraction) return;
    hasHandledFirstInteraction = true;

    window.removeEventListener("pointerdown", onFirstInteractionEnableAudio);
    window.removeEventListener("touchstart", onFirstInteractionEnableAudio);
    window.removeEventListener("keydown", onFirstInteractionEnableAudio);

    if (video.volume === 0) {
      video.volume = 1;
    }

    setAudioState(false);
    await ensurePlaying();
  };

  button.addEventListener("click", async () => {
    const nextMutedState = !video.muted;
    setAudioState(nextMutedState);

    await ensurePlaying();
  });

  video.addEventListener("volumechange", syncAudioState);
  window.addEventListener("pointerdown", onFirstInteractionEnableAudio, {
    passive: true,
  });
  window.addEventListener("touchstart", onFirstInteractionEnableAudio, {
    passive: true,
  });
  window.addEventListener("keydown", onFirstInteractionEnableAudio);
  syncAudioState();
  void tryAutoplayWithSound();
})();
