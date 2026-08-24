import { createContext, useContext, useEffect, useRef, useState } from "react";

import mainMusic from "../assets/music/main.mp3";
import levelMusic from "../assets/music/background.mp3";

const MusicContext = createContext();

export function MusicProvider({ children }) {
  const [isMuted, setIsMuted] = useState(false);

  const audioRef = useRef(null);
  const currentMusicRef = useRef(null);

  const playMusic = (musicFile) => {
    // Same music is already playing
    if (
      audioRef.current &&
      currentMusicRef.current === musicFile
    ) {
      if (!isMuted) {
        audioRef.current.play().catch(() => {});
      }

      return;
    }

    // Stop previous music
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    // Create new audio
    const audio = new Audio(musicFile);

    audio.loop = true;
    audio.volume = 0.3;

    audioRef.current = audio;
    currentMusicRef.current = musicFile;

    // Play only when sound is ON
    if (!isMuted) {
      audio.play().catch(() => {
        console.log("Waiting for user interaction to start music.");
      });
    }
  };

  const stopMusic = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }

    audioRef.current = null;
    currentMusicRef.current = null;
  };

  const toggleMute = () => {
    setIsMuted((previous) => {
      const newMutedState = !previous;

      if (audioRef.current) {
        if (newMutedState) {
          audioRef.current.pause();
        } else {
          audioRef.current.play().catch(() => {});
        }
      }

      return newMutedState;
    });
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <MusicContext.Provider
      value={{
        isMuted,
        toggleMute,
        playMusic,
        stopMusic,
        mainMusic,
        levelMusic,
      }}
    >
      {children}
    </MusicContext.Provider>
  );
}

export function useMusic() {
  return useContext(MusicContext);
}