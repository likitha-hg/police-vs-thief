
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
  // LEVEL RULES
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

  // Prevent actions while AI is thinking
  const [turnInProgress, setTurnInProgress] = useState(false);

  // =====================================
  // UNLOCK LEVEL 6
  // =====================================

  const unlockNextLevel = () => {
    const savedLevel = Number(
      localStorage.getItem("unlockedLevel") || 1
    );

    if (savedLevel < 6) {
      localStorage.setItem(
        "unlockedLevel",
        "6"
      );

      console.log("Unlocked Level 6");
    }
  };

  // =====================================
  // GET VALID POLICE MOVES
  // =====================================

  const getValidMoves = (
    policeKey,
    currentPolicePositions = policePositions,
    currentThiefPosition = thiefPosition
  ) => {
    const currentNode =
      currentPolicePositions[policeKey];

    if (
      !currentNode ||
      !graph[currentNode]
    ) {
      return [];
    }

    return graph[currentNode].filter(
      (node) =>
        // Police cannot move onto thief
        node !== currentThiefPosition &&

        // Police cannot move onto another police
        !Object.entries(
          currentPolicePositions
        ).some(
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
    if (
      !graph[currentThiefPosition]
    ) {
      return [];
    }

    return graph[
      currentThiefPosition
    ].filter(
      (node) =>
        !Object.values(
          currentPolicePositions
        ).includes(node)
    );
  };

  // =====================================
  // CHECK IF THIEF IS TRAPPED
  // =====================================

  const isThiefTrapped = (
    currentThiefPosition,
    currentPolicePositions
  ) => {
    const availableMoves =
      getThiefAvailableMoves(
        currentThiefPosition,
        currentPolicePositions
      );

    return availableMoves.length === 0;
  };

  // =====================================
  // SELECT POLICE
  // =====================================

  const handlePoliceClick = (
    policeKey
  ) => {
    if (
      gameStatus !== "playing"
    ) {
      return;
    }

    if (turnInProgress) {
      return;
    }

    setSelectedPolice(
      policeKey
    );
  };

  // =====================================
  // PPO THIEF MOVE
  // =====================================

  const moveThief = async (
    currentThiefPosition,
    updatedPolicePositions
  ) => {
    setTurnInProgress(true);

    try {
      // =================================
      // REQUEST BODY
      // =================================

      const requestBody = {
        level: 5,

        thief:
          currentThiefPosition,

        police:
          Object.values(
            updatedPolicePositions
          ),
      };

      console.log(
        "Sending Level 5 PPO request:",
        requestBody
      );

      // =================================
      // CALL PPO API
      // =================================

      const response = await fetch(
        `${API_URL}/predict`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify(
            requestBody
          ),
        }
      );

      console.log(
        "Level 5 PPO response status:",
        response.status
      );

      if (!response.ok) {
        throw new Error(
          `Prediction request failed: ${response.status}`
        );
      }

      // =================================
      // READ RESPONSE
      // =================================

      const data =
        await response.json();

      console.log(
        "Level 5 PPO response:",
        data
      );

      // =================================
      // API ERROR
      // =================================

      if (data.error) {
        console.error(
          "Level 5 PPO API error:",
          data.error
        );

        return;
      }

      // =================================
      // PPO MOVE
      // =================================

      const nextMove =
        data.next_move;

      console.log(
        "Level 5 PPO selected move:",
        nextMove
      );

      // =================================
      // VALID THIEF MOVES
      // =================================

      const validThiefMoves =
        getThiefAvailableMoves(
          currentThiefPosition,
          updatedPolicePositions
        );

      console.log(
        "Level 5 valid thief moves:",
        validThiefMoves
      );

      // =================================
      // NO VALID MOVES
      // =================================

      if (
        validThiefMoves.length === 0
      ) {
        console.log(
          "Level 5 thief has no valid moves."
        );

        setGameStatus(
          "cleared"
        );

        setSelectedPolice(
          null
        );

        unlockNextLevel();

        return;
      }

      // =================================
      // VALIDATE PPO MOVE
      // =================================

      if (
        !nextMove ||
        !validThiefMoves.includes(
          nextMove
        )
      ) {
        console.error(
          "Invalid Level 5 PPO move:",
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
        `Level 5 thief moving ${currentThiefPosition} → ${nextMove}`
      );

      setThiefPosition(
        nextMove
      );

      // =================================
      // THIEF REACHED EXIT
      // =================================

      if (
        EXIT_NODES.includes(
          nextMove
        )
      ) {
        console.log(
          "Level 5 thief reached exit."
        );

        setGameStatus(
          "failed"
        );

        setSelectedPolice(
          null
        );

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
          "Level 5 thief is trapped."
        );

        setGameStatus(
          "cleared"
        );

        setSelectedPolice(
          null
        );

        unlockNextLevel();
      }

    } catch (error) {
      console.error(
        "Level 5 thief movement error:",
        error
      );
    } finally {
      setTurnInProgress(
        false
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
      !selectedPolice
    ) {
      return;
    }

    if (
      gameStatus !== "playing"
    ) {
      return;
    }

    if (turnInProgress) {
      return;
    }

    // =================================
    // VALID POLICE MOVES
    // =================================

    const validMoves =
      getValidMoves(
        selectedPolice
      );

    // =================================
    // INVALID MOVE
    // =================================

    if (
      !validMoves.includes(
        nodeKey
      )
    ) {
      return;
    }

    // =================================
    // UPDATED POLICE POSITIONS
    // =================================

    const updatedPositions = {
      ...policePositions,

      [selectedPolice]:
        nodeKey,
    };

    console.log(
      "Level 5 police moved:",
      updatedPositions
    );

    // =================================
    // UPDATE POLICE
    // =================================

    setPolicePositions(
      updatedPositions
    );

    setSelectedPolice(
      null
    );

    // =================================
    // CHECK POLICE WIN
    // =================================

    if (
      isThiefTrapped(
        thiefPosition,
        updatedPositions
      )
    ) {
      console.log(
        "Level 5 police trapped the thief."
      );

      setGameStatus(
        "cleared"
      );

      unlockNextLevel();

      return;
    }

    // =================================
    // THIEF GETS TURN
    // =================================

    await moveThief(
      thiefPosition,
      updatedPositions
    );
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

    setSelectedPolice(
      null
    );

    setGameStatus(
      "playing"
    );

    setTurnInProgress(
      false
    );

    console.log(
      "Level 5 restarted."
    );
  };

  // =====================================
  // CONTINUE TO LEVEL 6
  // =====================================

  const handleContinue = () => {
    console.log(
      "Moving to Level 6"
    );

    unlockNextLevel();

    navigate(
      "/level6"
    );
  };

  // =====================================
  // HOME
  // =====================================

  const handleHome = () => {
    navigate(
      "/menu"
    );
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
          onClick={
            toggleMute
          }
        />

        <img
          src={home}
          alt="home"
          className="top-icon"
          onClick={
            handleHome
          }
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

          {gameStatus ===
            "playing" &&
            "Catch the thief (0/1)"}

          {gameStatus ===
            "cleared" &&
            "LEVEL CLEARED"}

          {gameStatus ===
            "failed" &&
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
            (
              [from, to],
              index
            ) => (
              <line
                key={index}
                x1={
                  nodes[from].x
                }
                y1={
                  nodes[from].y
                }
                x2={
                  nodes[to].x
                }
                y2={
                  nodes[to].y
                }
              />
            )
          )}
        </svg>

        {/* =================================
            NODES
        ================================= */}

        {Object.entries(
          nodes
        ).map(
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
                  handleNodeClick(
                    key
                  )
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
                  left:
                    `${pos.x}px`,

                  top:
                    `${pos.y}px`,
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
              `${nodes[
                thiefPosition
              ].x}px`,

            top:
              `${nodes[
                thiefPosition
              ].y}px`,
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
                  selectedPolice ===
                  key
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
            AI THINKING
        ================================= */}

        {turnInProgress &&
          gameStatus ===
            "playing" && (
            <div className="ai-status">
              Thief is thinking...
            </div>
          )}

        {/* =================================
            RESULT POPUP
        ================================= */}

        {gameStatus !==
          "playing" && (

          <div className="game-result-overlay">

            <div className="game-result">

              {/* =========================
                  LEVEL CLEARED
              ========================= */}

              {gameStatus ===
              "cleared" ? (
                <>
                  <h2>
                    LEVEL CLEARED
                  </h2>

                  <p>
                    The police trapped
                    the thief.
                  </p>

                  <div className="result-buttons">

                    <button
                      onClick={
                        handleRetry
                      }
                      className="retry-btn"
                    >
                      RETRY
                    </button>

                    <button
                      onClick={
                        handleContinue
                      }
                      className="continue-btn"
                    >
                      CONTINUE
                    </button>

                  </div>
                </>
              ) : (

                /* =========================
                   LEVEL FAILED
                ========================= */

                <>
                  <h2>
                    LEVEL FAILED
                  </h2>

                  <p>
                    The thief reached
                    the exit.
                  </p>

                  <div className="result-buttons">

                    <button
                      onClick={
                        handleRetry
                      }
                      className="retry-btn"
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

    </div>
  );
}

export default Level5;
