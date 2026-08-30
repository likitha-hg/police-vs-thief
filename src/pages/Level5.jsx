
import "../styles/Level5.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../config/api";

import soundOn from "../assets/images/sound_on.png";
import soundOff from "../assets/images/sound_off.png";
import home from "../assets/images/home.png";

import { useMusic } from "../context/MusicContext";

function Level5() {
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
    A: { x: 250, y: 60 },
    B: { x: 350, y: 120 },
    C: { x: 170, y: 140 },
    D: { x: 250, y: 280 },
    E: { x: 450, y: 280 },

    F: { x: 600, y: 120 },
    G: { x: 700, y: 220 },
    H: { x: 620, y: 320 },

    I: { x: 450, y: 490 },
    J: { x: 345, y: 390 },
    K: { x: 240, y: 490 },
    L: { x: 140, y: 360 },

    M: { x: 60, y: 500 },
    N: { x: 180, y: 640 },

    O: { x: 380, y: 630 },
    P: { x: 590, y: 580 },

    Q: { x: 520, y: 680 },
  };

  // =====================================
  // GRAPH
  // =====================================

  const graph = {
    A: ["B", "C"],
    B: ["A", "D", "E"],
    C: ["A", "D"],

    D: ["B", "C", "E", "J", "K", "L"],
    E: ["B", "D", "F", "I", "J", "H"],

    F: ["E", "G"],
    G: ["F", "H"],
    H: ["G", "I", "E"],

    I: ["E", "H", "J", "O", "P", "K"],

    J: ["D", "E", "I", "K"],

    K: ["D", "J", "L", "N", "O", "I"],
    L: ["D", "K", "M"],

    M: ["L", "N"],
    N: ["M", "K"],

    O: ["I", "K", "Q"],
    P: ["I", "Q"],

    Q: ["O", "P"],
  };

  // =====================================
  // CONNECTIONS
  // =====================================

  const connections = [
    ["A", "B"],
    ["A", "C"],

    ["B", "D"],
    ["B", "E"],
    ["C", "D"],

    ["D", "E"],
    ["D", "J"],
    ["D", "K"],
    ["D", "L"],

    ["E", "F"],
    ["E", "I"],
    ["E", "J"],

    ["F", "G"],
    ["G", "H"],
    ["H", "E"],
    ["H", "I"],

    ["I", "J"],
    ["I", "K"],
    ["I", "O"],
    ["I", "P"],

    ["J", "K"],

    ["K", "L"],
    ["K", "N"],
    ["K", "O"],

    ["L", "M"],

    ["M", "N"],

    ["O", "Q"],
    ["P", "Q"],
  ];

  // =====================================
  // GAME SETTINGS
  // =====================================

  const EXIT_NODES = ["M", "Q"];

  const INITIAL_POLICE_POSITIONS = {
    police1: "A",
    police2: "G",
    police3: "M",
    police4: "Q",
  };

  const INITIAL_THIEF_POSITION = "J";

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
  // UNLOCK NEXT LEVEL
  // =====================================

  const unlockNextLevel = () => {
    const currentUnlocked =
      Number(
        localStorage.getItem("unlockedLevel") || 1
      );

    if (currentUnlocked < 6) {
      localStorage.setItem(
        "unlockedLevel",
        "6"
      );
    }
  };

  // =====================================
  // VALID POLICE MOVES
  // =====================================

  const getValidMoves = (
    policeKey,
    currentPolicePositions = policePositions
  ) => {
    const currentNode =
      currentPolicePositions[policeKey];

    return graph[currentNode].filter(
      (node) =>
        // Police cannot move onto thief
        node !== thiefPosition &&

        // Police cannot occupy another police node
        !Object.entries(currentPolicePositions)
          .filter(([key]) => key !== policeKey)
          .map(([, position]) => position)
          .includes(node)
    );
  };

  // =====================================
  // CHECK IF THIEF IS TRAPPED
  // =====================================

  const isThiefTrapped = (
    currentThief,
    currentPolicePositions
  ) => {
    const availableMoves =
      graph[currentThief].filter(
        (node) =>
          !Object.values(
            currentPolicePositions
          ).includes(node)
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

  const moveThief = async (
    updatedPolicePositions
  ) => {
    try {
      const response = await fetch(
        `${API_URL}/predict`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            level: 5,
            thief: thiefPosition,
            police: Object.values(
              updatedPolicePositions
            ),
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Prediction request failed"
        );
      }

      const data = await response.json();

      console.log(
        "Level 5 AI:",
        data
      );

      // =================================
      // API ERROR
      // =================================

      if (data.error) {
        console.error(
          "PPO API error:",
          data.error
        );

        return;
      }

      const nextMove = data.next_move;

      // =================================
      // VALID THIEF MOVES
      // =================================

      const validThiefMoves =
        graph[thiefPosition].filter(
          (node) =>
            !Object.values(
              updatedPolicePositions
            ).includes(node)
        );

      // =================================
      // VALIDATE PPO MOVE
      // =================================

      if (
        !validThiefMoves.includes(
          nextMove
        )
      ) {
        console.error(
          "Invalid PPO move:",
          nextMove,
          "Valid moves:",
          validThiefMoves
        );

        return;
      }

      // =================================
      // MOVE THIEF
      // =================================

      setThiefPosition(nextMove);

      // =================================
      // THIEF REACHED EXIT
      // =================================

      if (
        EXIT_NODES.includes(nextMove)
      ) {
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
        setGameStatus("cleared");
        setSelectedPolice(null);

        // Unlock Level 6
        unlockNextLevel();

        return;
      }
    } catch (error) {
      console.error(
        "Level 5 thief move error:",
        error
      );
    }
  };

  // =====================================
  // POLICE MOVE
  // =====================================

  const handleNodeClick = async (
    nodeKey
  ) => {
    if (
      !selectedPolice ||
      gameStatus !== "playing"
    ) {
      return;
    }

    const validMoves =
      getValidMoves(
        selectedPolice
      );

    // =================================
    // INVALID MOVE
    // =================================

    if (
      !validMoves.includes(nodeKey)
    ) {
      return;
    }

    // =================================
    // UPDATED POLICE POSITIONS
    // =================================

    const updatedPositions = {
      ...policePositions,
      [selectedPolice]: nodeKey,
    };

    // =================================
    // UPDATE POLICE
    // =================================

    setPolicePositions(
      updatedPositions
    );

    setSelectedPolice(null);

    // =================================
    // CHECK POLICE WIN
    // =================================

    if (
      isThiefTrapped(
        thiefPosition,
        updatedPositions
      )
    ) {
      setGameStatus("cleared");

      // Unlock Level 6
      unlockNextLevel();

      return;
    }

    // =================================
    // THIEF GETS TURN
    // =================================

    await moveThief(
      updatedPositions
    );
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
  // CONTINUE
  // =====================================

  const handleContinue = () => {
    // Make sure Level 6 is unlocked
    unlockNextLevel();

    // Go to Level 6
    navigate("/level6");
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
          src={
            isMuted
              ? soundOff
              : soundOn
          }
          alt={
            isMuted
              ? "sound off"
              : "sound on"
          }
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
          LEVEL 5
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
                    EXIT_NODES.includes(
                      key
                    )
                      ? "exit-node"
                      : ""
                  }

                  ${
                    validMoves.includes(
                      key
                    )
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
                handlePoliceClick(
                  key
                )
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

        {/* =================================
            RESULT POPUP
        ================================= */}

        {gameStatus !== "playing" && (

          <div className="game-result-overlay">

            <div className="game-result">

              <h2>
                {gameStatus === "cleared"
                  ? "LEVEL CLEARED"
                  : "LEVEL FAILED"}
              </h2>

              <p>
                {gameStatus === "cleared"
                  ? "The police trapped the thief."
                  : "The thief reached the exit."}
              </p>

              <div className="result-buttons">

                {/* RETRY */}

                <button
                  onClick={handleRetry}
                  className="retry-btn"
                >
                  Retry
                </button>

                {/* CONTINUE */}

                {gameStatus === "cleared" && (

                  <button
                    onClick={handleContinue}
                    className="continue-btn"
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

export default Level5;
