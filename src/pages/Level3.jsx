import "../styles/Level3.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../config/api";

import soundOn from "../assets/images/sound_on.png";
import soundOff from "../assets/images/sound_off.png";
import home from "../assets/images/home.png";

import { useMusic } from "../context/MusicContext";

function Level3() {
  const navigate = useNavigate();

  // =====================================
  // MUSIC
  // =====================================

  const {
    isMuted,
    toggleMute,
    playMusic,
    levelMusic,
  } = useMusic();

  useEffect(() => {
    playMusic(levelMusic);
  }, [playMusic, levelMusic]);

  // =====================================
  // NODES
  // =====================================

  const nodes = {
    A: { x: 160, y: 70 },
    B: { x: 160, y: 350 },
    D: { x: 350, y: 350 },
    E: { x: 420, y: 180 },
    F: { x: 700, y: 140 },

    C: { x: 160, y: 600 },
    H: { x: 420, y: 590 },
    I: { x: 650, y: 470 },

    G: { x: 650, y: 300 },
  };

  // =====================================
  // GRAPH
  // =====================================

  const graph = {
    A: ["B", "D", "E"],
    B: ["A", "D", "C"],
    C: ["B", "D", "H"],
    D: ["A", "B", "C", "E", "G", "H", "I"],
    E: ["A", "D", "F", "G"],
    F: ["E", "G"],
    G: ["D", "E", "F", "I"],
    H: ["C", "D", "I"],
    I: ["D", "G", "H"],
  };

  // =====================================
  // CONNECTIONS
  // =====================================

  const connections = [
    ["A", "B"],
    ["A", "D"],
    ["A", "E"],

    ["B", "D"],
    ["B", "C"],

    ["C", "D"],
    ["C", "H"],

    ["D", "E"],
    ["D", "G"],
    ["D", "H"],
    ["D", "I"],

    ["E", "F"],
    ["E", "G"],

    ["F", "G"],

    ["G", "I"],

    ["H", "I"],
  ];

  // =====================================
  // EXIT NODES
  // =====================================

  const EXIT_NODES = ["A", "B", "C"];

  // =====================================
  // INITIAL POSITIONS
  // =====================================

  const INITIAL_POLICE_POSITIONS = {
    police1: "A",
    police2: "B",
    police3: "C",
  };

  const INITIAL_THIEF_POSITION = "G";

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

  // Prevent multiple police moves while PPO is thinking
  const [turnInProgress, setTurnInProgress] = useState(false);

  // =====================================
  // UNLOCK NEXT LEVEL
  // =====================================

  const unlockNextLevel = () => {
    const savedLevel = Number(
      localStorage.getItem("unlockedLevel") || 1
    );

    if (4 > savedLevel) {
      localStorage.setItem("unlockedLevel", "4");

      console.log("Unlocked Level 4");
    }
  };

  // =====================================
  // GET VALID POLICE MOVES
  // =====================================

  const getValidMoves = (
    policeKey,
    currentPolicePositions = policePositions
  ) => {
    const currentNode =
      currentPolicePositions[policeKey];

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
            key !== policeKey &&
            position === node
        )
    );
  };

  // =====================================
  // GET THIEF AVAILABLE MOVES
  // =====================================

  const getThiefAvailableMoves = (
    currentThiefPosition,
    currentPolicePositions
  ) => {
    if (!graph[currentThiefPosition]) {
      return [];
    }

    return graph[currentThiefPosition].filter(
      (node) =>
        !Object.values(currentPolicePositions).includes(node)
    );
  };

  // =====================================
  // CHECK IF THIEF IS TRAPPED
  // =====================================

  const isThiefTrapped = (
    currentThiefPosition,
    currentPolicePositions
  ) => {
    const availableMoves = getThiefAvailableMoves(
      currentThiefPosition,
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

    if (turnInProgress) {
      return;
    }

    setSelectedPolice(policeKey);
  };

  // =====================================
  // PPO THIEF MOVE
  // =====================================

  const moveThief = async (updatedPolicePositions) => {
    setTurnInProgress(true);

    try {
      const requestBody = {
        level: 3,
        thief: thiefPosition,
        police: Object.values(updatedPolicePositions),
      };

      console.log("Sending Level 3 PPO request:", requestBody);

      const response = await fetch(
        `${API_URL}/predict`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify(requestBody),
        }
      );

      console.log(
        "Level 3 PPO response status:",
        response.status
      );

      if (!response.ok) {
        throw new Error(
          `Prediction request failed: ${response.status}`
        );
      }

      const data = await response.json();

      console.log("Level 3 PPO response:", data);

      // =================================
      // API ERROR
      // =================================

      if (data.error) {
        console.error(
          "Level 3 PPO API error:",
          data.error
        );

        return;
      }

      const nextMove = data.next_move;

      console.log(
        "Level 3 PPO selected move:",
        nextMove
      );

      // =================================
      // GET VALID THIEF MOVES
      // =================================

      const validThiefMoves =
        getThiefAvailableMoves(
          thiefPosition,
          updatedPolicePositions
        );

      console.log(
        "Level 3 valid thief moves:",
        validThiefMoves
      );

      // =================================
      // NO AVAILABLE MOVES
      // =================================

      if (validThiefMoves.length === 0) {
        console.log(
          "Level 3 thief has no valid moves."
        );

        setGameStatus("cleared");
        setSelectedPolice(null);

        unlockNextLevel();

        return;
      }

      // =================================
      // INVALID PPO MOVE
      // =================================

      if (
        !nextMove ||
        !validThiefMoves.includes(nextMove)
      ) {
        console.error(
          "Invalid Level 3 PPO move:",
          nextMove,
          "Valid moves:",
          validThiefMoves
        );

        return;
      }

      // =================================
      // MOVE THIEF
      // =================================

      console.log(
        `Level 3 thief moving ${thiefPosition} → ${nextMove}`
      );

      setThiefPosition(nextMove);

      // =================================
      // THIEF REACHED EXIT
      // =================================

      if (EXIT_NODES.includes(nextMove)) {
        console.log(
          "Level 3 thief reached exit."
        );

        setGameStatus("failed");
        setSelectedPolice(null);

        return;
      }

      // =================================
      // CHECK IF THIEF IS TRAPPED
      // =================================

      if (
        isThiefTrapped(
          nextMove,
          updatedPolicePositions
        )
      ) {
        console.log(
          "Level 3 thief is trapped."
        );

        setGameStatus("cleared");
        setSelectedPolice(null);

        unlockNextLevel();
      }

    } catch (error) {
      console.error(
        "Level 3 thief movement error:",
        error
      );
    } finally {
      setTurnInProgress(false);
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

    if (turnInProgress) {
      return;
    }

    const validMoves = getValidMoves(selectedPolice);

    // =================================
    // INVALID MOVE
    // =================================

    if (!validMoves.includes(nodeKey)) {
      return;
    }

    // =================================
    // UPDATED POLICE POSITIONS
    // =================================

    const updatedPositions = {
      ...policePositions,
      [selectedPolice]: nodeKey,
    };

    console.log(
      "Level 3 police moved:",
      updatedPositions
    );

    // =================================
    // UPDATE POLICE
    // =================================

    setPolicePositions(updatedPositions);

    setSelectedPolice(null);

    // =================================
    // CHECK IF THIEF IS TRAPPED
    // =================================

    if (
      isThiefTrapped(
        thiefPosition,
        updatedPositions
      )
    ) {
      console.log(
        "Level 3 police trapped the thief."
      );

      setGameStatus("cleared");

      unlockNextLevel();

      return;
    }

    // =================================
    // THIEF GETS TURN
    // =================================

    await moveThief(updatedPositions);
  };

  // =====================================
  // CONTINUE TO LEVEL 4
  // =====================================

  const handleContinue = () => {
    unlockNextLevel();

    navigate("/level4");
  };

  // =====================================
  // RETRY LEVEL
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

    setTurnInProgress(false);

    console.log(
      "Level 3 restarted."
    );
  };

  // =====================================
  // HOME
  // =====================================

  const handleHome = () => {
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
          className="top-icon"
          onClick={handleHome}
        />

      </div>

      {/* =================================
          HEADER
      ================================= */}

      <div className="level-header">

        <div className="level-title">
          LEVEL 3
        </div>

        <div className="mission-box">

          {gameStatus === "playing" &&
            "Catch the thief (0/1)"}

          {gameStatus === "cleared" &&
            "LEVEL CLEARED"}

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
                ? getValidMoves(selectedPolice)
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
            left: `${nodes[thiefPosition].x}px`,
            top: `${nodes[thiefPosition].y}px`,
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
                left: `${nodes[node].x}px`,
                top: `${nodes[node].y}px`,
              }}
            >
              P
            </div>
          )
        )}

        {/* =================================
            AI STATUS
        ================================= */}

        {turnInProgress &&
          gameStatus === "playing" && (
            <div className="ai-status">
              Thief is thinking...
            </div>
          )}

        {/* =================================
            RESULT POPUP
        ================================= */}

        {gameStatus !== "playing" && (

          <div className="game-result-overlay">

            <div className="game-result">

              {/* RESULT TITLE */}

              <h2>
                {gameStatus === "cleared"
                  ? "LEVEL CLEARED"
                  : "LEVEL FAILED"}
              </h2>

              {/* RESULT MESSAGE */}

              <p>
                {gameStatus === "cleared"
                  ? "The police trapped the thief."
                  : "The thief reached the exit."}
              </p>

              {/* BUTTONS */}

              <div className="result-buttons">

                {/* RETRY */}

                <button
                  className="retry-btn"
                  onClick={handleRetry}
                >
                  Retry
                </button>

                {/* CONTINUE */}

                {gameStatus === "cleared" && (

                  <button
                    className="continue-btn"
                    onClick={handleContinue}
                  >
                    Continue
                  </button>

                )}

              </div>

            </div>

          </div>

        )}

      </div>

    </div>
  );
}

export default Level3;
