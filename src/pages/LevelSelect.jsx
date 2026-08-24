import "../styles/LevelSelect.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import soundOn from "../assets/images/sound_on.png";
import soundOff from "../assets/images/sound_off.png";
import home from "../assets/images/home.png";

import { useMusic } from "../context/MusicContext";

function LevelSelect() {
  const navigate = useNavigate();

  const {
    isMuted,
    toggleMute,
    playMusic,
    mainMusic,
  } = useMusic();

  // =====================================
  // PLAY MAIN MUSIC
  // =====================================

  useEffect(() => {
    playMusic(mainMusic);
  }, [playMusic, mainMusic]);

  // =====================================
  // UNLOCKED LEVEL
  // =====================================

  // Level 1 is unlocked by default
  const [unlockedLevel, setUnlockedLevel] = useState(1);

  // =====================================
  // LOAD SAVED PROGRESS
  // =====================================

  useEffect(() => {
    const savedLevel =
      localStorage.getItem("unlockedLevel");

    if (savedLevel !== null) {
      const level = Number(savedLevel);

      // Safety check
      if (
        !isNaN(level) &&
        level >= 1 &&
        level <= 10
      ) {
        setUnlockedLevel(level);
      }
    }
  }, []);

  // =====================================
  // LEVELS
  // =====================================

  const levels = Array.from(
    { length: 10 },
    (_, i) => i + 1
  );

  // =====================================
  // LEVEL CLICK
  // =====================================

  const handleLevelClick = (level) => {
    // Locked level
    if (level > unlockedLevel) {
      return;
    }

    // Open selected level
    navigate(`/level${level}`);
  };

  // =====================================
  // CONTINUE
  // =====================================

  const handleContinue = () => {
    navigate(`/level${unlockedLevel}`);
  };

  return (
    <div className="level-select">

      {/* =================================
          TOP BAR
      ================================= */}

      <div className="top-bar">

        {/* Sound */}
        <img
          src={isMuted ? soundOff : soundOn}
          alt={isMuted ? "sound off" : "sound on"}
          className="top-icon"
          onClick={toggleMute}
        />

        {/* Home */}
        <img
          src={home}
          alt="home"
          className="top-icon"
          onClick={() =>
            navigate("/menu")
          }
        />

      </div>

      {/* =================================
          HEADING
      ================================= */}

      <h1>SELECT LEVEL</h1>

      {/* =================================
          LEVEL GRID
      ================================= */}

      <div className="levels-grid">

        {levels.map((level) => {

          const isUnlocked =
            level <= unlockedLevel;

          return (
            <button
              key={level}
              onClick={() =>
                handleLevelClick(level)
              }
              className={
                isUnlocked
                  ? "unlocked"
                  : "locked"
              }
              disabled={!isUnlocked}
            >
              {isUnlocked
                ? `Level ${level}`
                : "🔒"}
            </button>
          );

        })}

      </div>

    </div>
  );
}

export default LevelSelect;