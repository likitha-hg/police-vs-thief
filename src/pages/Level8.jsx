import "../styles/Level8.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../config/api";

import soundOn from "../assets/images/sound_on.png";
import soundOff from "../assets/images/sound_off.png";
import home from "../assets/images/home.png";

import { useMusic } from "../context/MusicContext";

function Level8() {
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
    A: { x: 180, y: 80 },
    B: { x: 550, y: 80 },
    C: { x: 180, y: 260 },
    D: { x: 360, y: 260 },

    E: { x: 550, y: 260 },
    F: { x: 180, y: 420 },
    G: { x: 420, y: 410 },

    H: { x: 180, y: 560 },

    I: { x: 320, y: 560 },
    J: { x: 550, y: 560 },
    K: { x: 180, y: 680 },

    L: { x: 340, y: 680 },
    M: { x: 550, y: 680 },
  };

  // =====================================
  // GRAPH
  // =====================================

  const graph = {
    A: ["B", "D", "C"],
    B: ["A", "D", "E"],
    C: ["A", "D", "F"],
    D: ["A", "B", "C", "E", "G"],

    E: ["D", "G", "J", "B"],
    F: ["C", "G", "I", "J", "H"],
    G: ["D", "F", "J", "E"],

    H: ["F", "I", "K"],
    I: ["F", "H", "J"],
    J: ["I", "F", "G", "L", "M", "E"],

    K: ["H", "L"],
    L: ["J", "M", "K"],
    M: ["J", "L"],
  };

  // =====================================
  // CONNECTIONS
  // =====================================

  const connections = [
    ["A", "B"],
    ["A", "D"],
    ["A", "C"],

    ["B", "D"],
    ["B", "E"],

    ["C", "D"],
    ["C", "F"],

    ["D", "E"],
    ["D", "G"],

    ["E", "G"],

    ["F", "G"],
    ["F", "I"],
    ["F", "H"],

    ["G", "J"],

    ["H", "I"],
    ["H", "K"],

    ["I", "J"],

    ["J", "L"],
    ["J", "F"],
    ["J", "E"],

    ["K", "L"],

    ["L", "M"],

    ["M", "J"],
  ];

  // =====================================
  // LEVEL RULES
  // =====================================

  const EXIT_NODES = ["K", "L", "M"];

  const INITIAL_POLICE_POSITIONS = {
    police1: "K",
    police2: "L",
    police3: "M",
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

  const [turnInProgress, setTurnInProgress] = useState(false);

  // =====================================
  // SAVE PROGRESS
  // =====================================

  const unlockNextLevel = () => {
    const currentUnlockedLevel = Number(
      localStorage.getItem("unlockedLevel") || 1
    );

    const nextLevel = 9;

    if (currentUnlockedLevel < nextLevel) {
      localStorage.setItem(
        "unlockedLevel",
        String(nextLevel)
      );

      console.log(
        `Level 9 unlocked. Current unlocked level: ${nextLevel}`
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

    if (
      !currentNode ||
      !graph[currentNode]
    ) {
      return [];
    }

    return graph[currentNode].filter(
      (node) =>
        // Police cannot move onto thief
        node !== thiefPosition &&

        // Police cannot occupy another police node
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
  // THIEF AVAILABLE MOVES
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
  // HOME
  // =====================================

  const handleHome = () => {
    navigate("/");
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
    updatedPolicePositions
  ) => {
    setTurnInProgress(true);

    try {
      const response = await fetch(
        `${API_URL}/predict`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            level: 8,
            thief: thiefPosition,
            police:
              Object.values(
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

      const data =
        await response.json();

      console.log(
        "Level 8 AI:",
        data
      );

      // =================================
      // API ERROR
      // =================================

      if (data.error) {
        console.log(
          "PPO API error:",
          data.error
        );

        return;
      }

      const nextMove =
        data.next_move;

      // =================================
      // VALID THIEF MOVES
      // =================================

      const validThiefMoves =
        getThiefAvailableMoves(
          thiefPosition,
          updatedPolicePositions
        );

      console.log(
        "Level 8 valid thief moves:",
        validThiefMoves
      );

      // =================================
      // NO AVAILABLE MOVE
      // =================================

      if (
        validThiefMoves.length === 0
      ) {
        unlockNextLevel();

        setGameStatus(
          "cleared"
        );

        setSelectedPolice(
          null
        );

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
        console.log(
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
        unlockNextLevel();

        setGameStatus(
          "cleared"
        );

        setSelectedPolice(
          null
        );

        return;
      }

    } catch (error) {
      console.log(
        "Level 8 thief move error:",
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
    if (!selectedPolice) {
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
      unlockNextLevel();

      setGameStatus(
        "cleared"
      );

      return;
    }

    // =================================
    // THIEF TURN
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

    setSelectedPolice(
      null
    );

    setGameStatus(
      "playing"
    );

    setTurnInProgress(
      false
    );
  };

  // =====================================
  // CONTINUE TO LEVEL 9
  // =====================================

  const handleContinue = () => {
    navigate(
      "/level9"
    );
  };

  // =====================================
  // RENDER
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
          LEVEL 8
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
                left: `${nodes[node].x}px`,
                top: `${nodes[node].y}px`,
              }}
            >
              P
            </div>

          )
        )}

        {/* =================================
            PPO THINKING
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

              <h2>
                {
                  gameStatus ===
                  "cleared"
                    ? "LEVEL CLEARED"
                    : "LEVEL FAILED"
                }
              </h2>

              <p>
                {
                  gameStatus ===
                  "cleared"
                    ? "The police trapped the thief."
                    : "The thief reached the exit."
                }
              </p>

              <div className="result-buttons">

                {/* RETRY */}

                <button
                  onClick={
                    handleRetry
                  }
                  className="retry-btn"
                >
                  Retry
                </button>

                {/* CONTINUE */}

                {gameStatus ===
                  "cleared" && (

                  <button
                    onClick={
                      handleContinue
                    }
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

export default Level8;