import "../styles/MainMenu.css";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

import soundOn from "../assets/images/sound_on.png";
import soundOff from "../assets/images/sound_off.png";

import { useMusic } from "../context/MusicContext";

function MainMenu() {
  const navigate = useNavigate();
  const [showInstructions, setShowInstructions] = useState(false);

  const {
    isMuted,
    toggleMute,
    playMusic,
    mainMusic,
  } = useMusic();

  useEffect(() => {
    playMusic(mainMusic);
  }, [playMusic, mainMusic]);

  // Exit Game
  const handleExit = () => {
    const confirmExit = window.confirm(
      "Are you sure you want to exit the game?"
    );

    if (confirmExit) {
      window.location.href = "about:blank";
    }
  };

  return (
    <div className="main-menu">

      {/* Top Bar */}
      <div className="top-bar">
        <img
          src={isMuted ? soundOff : soundOn}
          alt={isMuted ? "sound off" : "sound on"}
          className="top-icon"
          onClick={toggleMute}
        />
      </div>

      {/* Game Title */}
      <h1>POLICE VS THIEF</h1>

      {/* Menu Buttons */}
      <div className="menu-buttons">

        <button onClick={() => navigate("/levels")}>
          Continue
        </button>

        <button onClick={() => navigate("/levels")}>
          Levels
        </button>

        <button onClick={() => setShowInstructions(true)}>
          How to Play
        </button>

        <button onClick={handleExit}>
          Exit
        </button>

      </div>

      {/* How to Play Popup */}
      {showInstructions && (
        <div className="instructions-overlay">

          <div className="instructions-box">

            <h2>HOW TO PLAY</h2>

            <h4>Catch the Thief Before It Reaches the Exit</h4>

            {/* Instructions */}
            <ul className="instructions-list">

              <li>
                Select a <strong>Police</strong> officer.
              </li>

              <li>
                Move the Police to a connected position.
              </li>

              <li>
                The <strong>Thief moves automatically</strong> after your
                turn.
              </li>

              <li>
                Block the Thief's escape routes and trap it before it reaches
                the <strong>Exit</strong>.
              </li>

            </ul>

            {/* Win / Lose */}
            <div className="win-lose">

              <p>
                <strong>Police Win:</strong> The Thief is trapped.
              </p>

              <p>
                <strong>Thief Wins:</strong> The Thief reaches the Exit.
              </p>

            </div>

            {/* Strategy Tip */}
            <p className="game-tip">
              <strong>Think ahead. Block the path. Catch the Thief!</strong>
            </p>

            {/* Back Button */}
            <button
              className="close-instructions"
              onClick={() => setShowInstructions(false)}
            >
              Back
            </button>

          </div>

        </div>
      )}

    </div>
  );
}

export default MainMenu;