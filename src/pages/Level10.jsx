import "../styles/Level10.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../config/api";
import soundOn from "../assets/images/sound_on.png";
import soundOff from "../assets/images/sound_off.png";
import home from "../assets/images/home.png";

import { useMusic } from "../context/MusicContext";

function Level10() {
  const navigate = useNavigate();

  const {
    isMuted,
    toggleMute,
    playMusic,
    levelMusic,
  } = useMusic();

  // =====================================
  // PLAY LEVEL MUSIC
  // =====================================

  useEffect(() => {
    playMusic(levelMusic);
  }, [playMusic, levelMusic]);

  // =====================================
  // NODES
  // =====================================

  const nodes = {
    A: { x: 120, y: 80 },
    B: { x: 280, y: 80 },
    C: { x: 410, y: 80 },
    D: { x: 520, y: 80 },

    E: { x: 120, y: 220 },
    F: { x: 280, y: 340 },
    G: { x: 280, y: 220 },
    H: { x: 410, y: 340 },

    I: { x: 410, y: 220 },
    J: { x: 520, y: 220 },
    K: { x: 520, y: 340 },
    L: { x: 410, y: 480 },

    M: { x: 520, y: 480 },
    N: { x: 520, y: 610 },
    O: { x: 410, y: 610 },
    P: { x: 280, y: 480 },

    Q: { x: 280, y: 610 },
    R: { x: 120, y: 340 },
    S: { x: 120, y: 480 },
    T: { x: 120, y: 610 },
  };

  // =====================================
  // GRAPH
  // =====================================

  const graph = {
    A: ["B", "E"],
    B: ["A", "E", "C", "G"],
    C: ["B", "G", "I", "D"],
    D: ["C", "I", "J"],

    E: ["A", "B", "F", "R"],
    F: ["E", "G", "P", "S"],
    G: ["B", "C", "H", "F"],
    H: ["G", "L", "I", "P"],

    I: ["C", "D", "H", "K"],
    J: ["D", "K"],
    K: ["J", "I", "L", "M"],
    L: ["K", "N", "O", "H"],

    M: ["K", "N"],
    N: ["L", "M", "O"],
    O: ["L", "N", "P", "Q"],
    P: ["F", "Q", "H", "O"],

    Q: ["P", "O", "T", "S"],
    R: ["E", "S"],
    S: ["T", "Q", "R", "F"],
    T: ["S", "Q"],
  };

  // =====================================
  // CONNECTIONS
  // =====================================

  const connections = [
    ["A", "B"],
    ["A", "E"],

    ["B", "C"],
    ["B", "E"],
    ["B", "G"],

    ["C", "D"],
    ["C", "I"],
    ["C", "G"],

    ["D", "I"],
    ["D", "J"],

    ["E", "F"],
    ["E", "R"],

    ["F", "S"],
    ["F", "G"],
    ["F", "P"],

    ["G", "H"],

    ["H", "I"],
    ["H", "P"],
    ["H", "L"],

    ["I", "K"],

    ["J", "K"],

    ["K", "L"],
    ["K", "M"],

    ["L", "N"],
    ["L", "O"],

    ["M", "N"],

    ["N", "O"],

    ["O", "P"],
    ["O", "Q"],

    ["P", "Q"],

    ["Q", "T"],
    ["Q", "S"],

    ["R", "S"],

    ["S", "T"],
  ];

  // =====================================
  // EXIT NODES
  // =====================================

  const EXIT_NODES = ["T", "Q", "O", "N"];

  // =====================================
  // INITIAL POSITIONS
  // =====================================

  const INITIAL_POLICE_POSITIONS = {
    police1: "T",
    police2: "Q",
    police3: "O",
    police4: "N",
  };

  const INITIAL_THIEF_POSITION = "A";

  // =====================================
  // GAME STATE
  // =====================================

  const [policePositions, setPolicePositions] = useState(
    INITIAL_POLICE_POSITIONS
  );

  const [thiefPosition, setThiefPosition] = useState(
    INITIAL_THIEF_POSITION
  );

  const [selectedPolice, setSelectedPolice] = useState(null);

  const [gameStatus, setGameStatus] = useState("playing");

  // =====================================
  // VALID POLICE MOVES
  // =====================================

  const getValidMoves = (
    policeKey,
    currentPolicePositions = policePositions
  ) => {
    const currentNode = currentPolicePositions[policeKey];

    if (!currentNode || !graph[currentNode]) {
      return [];
    }

    return graph[currentNode].filter(
      (node) =>
        // Police cannot move onto thief
        node !== thiefPosition &&

        // Police cannot move onto another police
        !Object.entries(currentPolicePositions).some(
          ([key, position]) =>
            key !== policeKey && position === node
        )
    );
  };

  // =====================================
  // THIEF AVAILABLE MOVES
  // =====================================

  const getThiefAvailableMoves = (
    currentThief,
    currentPolicePositions
  ) => {
    if (!graph[currentThief]) {
      return [];
    }

    return graph[currentThief].filter(
      (node) =>
        !Object.values(currentPolicePositions).includes(node)
    );
  };

  // =====================================
  // CHECK IF THIEF IS TRAPPED
  // =====================================

  const isThiefTrapped = (
    currentThief,
    currentPolicePositions
  ) => {
    const availableMoves = getThiefAvailableMoves(
      currentThief,
      currentPolicePositions
    );

    return availableMoves.length === 0;
  };

  // =====================================
  // SELECT POLICE
  // =====================================

  const handlePoliceClick = (policeKey) => {
    if (gameStatus !== "playing") {
      return;
    }

    setSelectedPolice(policeKey);
  };

  // =====================================
  // PPO THIEF MOVE
  // =====================================

  const moveThief = async (updatedPolicePositions) => {
    try {
      const response = await fetch(
        `${API_URL}/predict`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            level: 10,
            thief: thiefPosition,
            police: Object.values(updatedPolicePositions),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Prediction request failed");
      }

      const data = await response.json();

      console.log("Level 10 AI:", data);

      // =====================================
      // API ERROR
      // =====================================

      if (data.error) {
        console.log(
          "Level 10 PPO error:",
          data.error
        );

        return;
      }

      const nextMove = data.next_move;

      // =====================================
      // VALID THIEF MOVES
      // =====================================

      const validThiefMoves = getThiefAvailableMoves(
        thiefPosition,
        updatedPolicePositions
      );

      // =====================================
      // NO AVAILABLE MOVES
      // =====================================

      if (validThiefMoves.length === 0) {
        setGameStatus("cleared");
        setSelectedPolice(null);

        localStorage.setItem(
          "unlockedLevel",
          "10"
        );

        return;
      }

      // =====================================
      // VALIDATE PPO MOVE
      // =====================================

      if (
        !nextMove ||
        !validThiefMoves.includes(nextMove)
      ) {
        console.log(
          "Invalid Level 10 PPO move:",
          nextMove,
          "Valid moves:",
          validThiefMoves
        );

        return;
      }

      // =====================================
      // MOVE THIEF
      // =====================================

      setThiefPosition(nextMove);

      // =====================================
      // THIEF REACHED EXIT
      // =====================================

      if (EXIT_NODES.includes(nextMove)) {
        setGameStatus("failed");
        setSelectedPolice(null);

        return;
      }

      // =====================================
      // CHECK IF THIEF IS TRAPPED
      // =====================================

      if (
        isThiefTrapped(
          nextMove,
          updatedPolicePositions
        )
      ) {
        setGameStatus("cleared");
        setSelectedPolice(null);

        localStorage.setItem(
          "unlockedLevel",
          "10"
        );

        return;
      }
    } catch (error) {
      console.log(
        "Level 10 thief move error:",
        error
      );
    }
  };

  // =====================================
  // POLICE MOVE
  // =====================================

  const handleNodeClick = async (nodeKey) => {
    if (!selectedPolice) {
      return;
    }

    if (gameStatus !== "playing") {
      return;
    }

    const validMoves = getValidMoves(
      selectedPolice
    );

    // =====================================
    // INVALID MOVE
    // =====================================

    if (!validMoves.includes(nodeKey)) {
      return;
    }

    // =====================================
    // UPDATED POLICE POSITIONS
    // =====================================

    const updatedPositions = {
      ...policePositions,
      [selectedPolice]: nodeKey,
    };

    // =====================================
    // UPDATE POLICE
    // =====================================

    setPolicePositions(updatedPositions);
    setSelectedPolice(null);

    // =====================================
    // CHECK IF THIEF IS TRAPPED
    // =====================================

    if (
      isThiefTrapped(
        thiefPosition,
        updatedPositions
      )
    ) {
      setGameStatus("cleared");

      localStorage.setItem(
        "unlockedLevel",
        "10"
      );

      return;
    }

    // =====================================
    // THIEF GETS TURN
    // =====================================

    await moveThief(updatedPositions);
  };

  // =====================================
  // RETRY
  // =====================================

  const handleRetry = () => {
    setPolicePositions({
      ...INITIAL_POLICE_POSITIONS,
    });

    setThiefPosition(
      INITIAL_THIEF_POSITION
    );

    setSelectedPolice(null);

    setGameStatus("playing");
  };

  // =====================================
  // HOME
  // =====================================

  const handleHome = () => {
    console.log("Going to main menu");

    setSelectedPolice(null);

    navigate("/menu");
  };

  // =====================================
  // TOP HOME BUTTON
  // =====================================

  const handleTopHome = (event) => {
    event.stopPropagation();

    console.log("Top home clicked");

    navigate("/menu");
  };

  // =====================================
  // UI
  // =====================================

  return (
    <div className="level-board">

      {/* =================================
          TOP BAR
      ================================= */}

      <div className="top-bar">

        {/* SOUND */}

        <img
          src={isMuted ? soundOff : soundOn}
          alt={isMuted ? "sound off" : "sound on"}
          className="top-icon"
          onClick={toggleMute}
        />

        {/* HOME */}

        <img
          src={home}
          alt="home"
          className="top-icon home-icon"
          onClick={handleTopHome}
        />

      </div>

      {/* =================================
          HEADER
      ================================= */}

      <div className="level-header">

        <div className="level-title">
          LEVEL 10
        </div>

        <div className="mission-box">

          {gameStatus === "playing" &&
            "Catch the thief (0/1)"}

          {gameStatus === "cleared" &&
            "ALL LEVELS COMPLETED"}

          {gameStatus === "failed" &&
            "LEVEL FAILED"}

        </div>

      </div>

      {/* =================================
          BOARD
      ================================= */}

      <div className="board-area">

        {/* =================================
            CONNECTIONS
        ================================= */}

        <svg
          className="lines"
          width="100%"
          height="100%"
        >
          {connections.map(
            ([from, to], index) => (
              <line
                key={index}
                x1={nodes[from].x}
                y1={nodes[from].y}
                x2={nodes[to].x}
                y2={nodes[to].y}
              />
            )
          )}
        </svg>

        {/* =================================
            NODES
        ================================= */}

        {Object.entries(nodes).map(
          ([key, pos]) => {

            const validMoves =
              selectedPolice
                ? getValidMoves(
                    selectedPolice
                  )
                : [];

            return (
              <div
                key={key}
                onClick={() =>
                  handleNodeClick(key)
                }
                className={`
                  node

                  ${
                    EXIT_NODES.includes(key)
                      ? "exit-node"
                      : ""
                  }

                  ${
                    validMoves.includes(key)
                      ? "highlight-node"
                      : ""
                  }
                `}
                style={{
                  left: `${pos.x}px`,
                  top: `${pos.y}px`,
                }}
              />
            );
          }
        )}

        {/* =================================
            THIEF
        ================================= */}

        <div
          className="thief-token"
          style={{
            left:
              `${nodes[thiefPosition].x}px`,
            top:
              `${nodes[thiefPosition].y}px`,
          }}
        >
          T
        </div>

        {/* =================================
            POLICE
        ================================= */}

        {Object.entries(
          policePositions
        ).map(
          ([key, node]) => (

            <div
              key={key}

              className={`
                police-token

                ${
                  selectedPolice === key
                    ? "selected-police"
                    : ""
                }
              `}

              onClick={() =>
                handlePoliceClick(key)
              }

              style={{
                left:
                  `${nodes[node].x}px`,
                top:
                  `${nodes[node].y}px`,
              }}
            >
              P
            </div>

          )
        )}

      </div>

      {/* =====================================
          RESULT POPUP
          IMPORTANT:
          This is OUTSIDE board-area
      ===================================== */}

      {gameStatus !== "playing" && (

        <div
          className="game-result-overlay"
          onClick={(event) =>
            event.stopPropagation()
          }
        >

          {/* =================================
              CONFETTI
          ================================= */}

          {gameStatus === "cleared" && (
            <div className="confetti-container">

              {Array.from({
                length: 40,
              }).map(
                (_, index) => (
                  <span
                    key={index}
                    className="confetti"
                    style={{
                      "--x":
                        `${Math.random() * 100}vw`,

                      "--delay":
                        `${Math.random() * 2}s`,

                      "--duration":
                        `${2.5 + Math.random() * 2}s`,
                    }}
                  />
                )
              )}

            </div>
          )}

          {/* =================================
              CELEBRATION BURST
          ================================= */}

          {gameStatus === "cleared" && (
            <div className="celebration-burst">

              {Array.from({
                length: 16,
              }).map(
                (_, index) => (
                  <span
                    key={index}
                    className="burst-particle"
                    style={{
                      "--angle":
                        `${index * 22.5}deg`,
                    }}
                  />
                )
              )}

            </div>
          )}

          {/* =================================
              RESULT BOX
          ================================= */}

          <div
            className="game-result"
            onClick={(event) =>
              event.stopPropagation()
            }
          >

            {/* =================================
                SUCCESS
            ================================= */}

            {gameStatus === "cleared" ? (

              <>
                <div className="celebration-icon">
                  ★
                </div>

                <h2>
                  CONGRATULATIONS!
                </h2>

                <p>
                  You completed all 10 levels!
                </p>

                <p className="completion-message">
                  The police caught the thief!
                </p>

                <div className="result-buttons">

                  <button
                    type="button"
                    className="continue-btn"
                    onClick={handleHome}
                  >
                    HOME
                  </button>

                </div>
              </>

            ) : (

              /* =================================
                 FAILED
              ================================= */

              <>
                <h2>
                  LEVEL FAILED
                </h2>

                <p>
                  The thief escaped!
                </p>

                <div className="result-buttons">

                  <button
                    type="button"
                    className="retry-btn"
                    onClick={handleRetry}
                  >
                    RETRY
                  </button>

                </div>
              </>

            )}

          </div>

        </div>
      )}

    </div>
  );
}

export default Level10;