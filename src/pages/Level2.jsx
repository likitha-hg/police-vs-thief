import "../styles/Level2.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../config/api";

import soundOn from "../assets/images/sound_on.png";
import soundOff from "../assets/images/sound_off.png";
import home from "../assets/images/home.png";

import { useMusic } from "../context/MusicContext";

function Level2() {
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
    A: { x: 220, y: 70 },
    B: { x: 400, y: 70 },
    C: { x: 580, y: 70 },

    D: { x: 400, y: 180 },

    E: { x: 220, y: 280 },
    F: { x: 580, y: 280 },

    G: { x: 400, y: 420 },

    H: { x: 250, y: 580 },
    I: { x: 550, y: 580 },

    J: { x: 400, y: 720 },
  };

  // =====================================
  // GRAPH
  // =====================================

  const graph = {
    A: ["B", "D", "E"],
    B: ["A", "C", "D"],
    C: ["B", "D", "F"],

    D: ["A", "B", "C", "E", "F", "G"],

    E: ["A", "D", "F", "G", "H"],
    F: ["C", "D", "E", "G", "I"],

    G: ["D", "E", "F", "H", "I"],

    H: ["E", "G", "I", "J"],
    I: ["F", "G", "H", "J"],

    J: ["H", "I"],
  };

  // =====================================
  // CONNECTIONS
  // =====================================

  const connections = [
    ["A", "B"],
    ["B", "C"],

    ["A", "D"],
    ["B", "D"],
    ["C", "D"],

    ["A", "E"],
    ["C", "F"],

    ["D", "E"],
    ["D", "F"],
    ["D", "G"],

    ["E", "F"],
    ["E", "G"],
    ["F", "G"],

    ["E", "H"],
    ["F", "I"],

    ["G", "H"],
    ["G", "I"],

    ["H", "I"],

    ["H", "J"],
    ["I", "J"],
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

  // Prevent multiple police moves while PPO is thinking
  const [turnInProgress, setTurnInProgress] = useState(false);

  // =====================================
  // UNLOCK NEXT LEVEL
  // =====================================

  const unlockNextLevel = (nextLevel) => {
    const savedLevel = Number(
      localStorage.getItem("unlockedLevel") || 1
    );

    if (nextLevel > savedLevel) {
      localStorage.setItem(
        "unlockedLevel",
        String(nextLevel)
      );

      console.log(
        `Unlocked Level ${nextLevel}`
      );
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

        // Police cannot occupy another police
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
      !currentThiefPosition ||
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
        level: 2,

        thief:
          currentThiefPosition,

        police:
          Object.values(
            updatedPolicePositions
          ),
      };

      console.log(
        "Sending Level 2 PPO request:",
        requestBody
      );

      // =================================
      // CALL API
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
        "Level 2 PPO status:",
        response.status
      );

      // =================================
      // RESPONSE ERROR
      // =================================

      if (!response.ok) {
        throw new Error(
          `Prediction request failed: ${response.status}`
        );
      }

      // =================================
      // RESPONSE DATA
      // =================================

      const data =
        await response.json();

      console.log(
        "Level 2 PPO response:",
        data
      );

      // =================================
      // API ERROR
      // =================================

      if (data.error) {
        console.error(
          "Level 2 PPO error:",
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
        "Level 2 PPO selected move:",
        nextMove
      );

      // =================================
      // GET VALID THIEF MOVES
      // =================================

      const validThiefMoves =
        getThiefAvailableMoves(
          currentThiefPosition,
          updatedPolicePositions
        );

      console.log(
        "Level 2 valid thief moves:",
        validThiefMoves
      );

      // =================================
      // NO AVAILABLE MOVES
      // =================================

      if (
        validThiefMoves.length === 0
      ) {
        console.log(
          "Level 2 thief is trapped."
        );

        setGameStatus(
          "cleared"
        );

        setSelectedPolice(
          null
        );

        unlockNextLevel(3);

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
          "Invalid Level 2 PPO move:",
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
        `Level 2 thief moving ${currentThiefPosition} → ${nextMove}`
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
          "Level 2 thief reached exit."
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
          "Level 2 thief is trapped."
        );

        setGameStatus(
          "cleared"
        );

        setSelectedPolice(
          null
        );

        unlockNextLevel(3);
      }

    } catch (error) {
      console.error(
        "Level 2 thief movement error:",
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
      "Level 2 police moved:",
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
    // CHECK IF THIEF IS TRAPPED
    // =================================

    if (
      isThiefTrapped(
        thiefPosition,
        updatedPositions
      )
    ) {
      console.log(
        "Level 2 police trapped the thief."
      );

      setGameStatus(
        "cleared"
      );

      unlockNextLevel(3);

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
      "Level 2 restarted."
    );
  };

  // =====================================
  // CONTINUE TO LEVEL 3
  // =====================================

  const handleContinue = () => {
    console.log(
      "Moving to Level 3"
    );

    unlockNextLevel(3);

    navigate(
      "/level3"
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
          onClick={
            toggleMute
          }
        />

        {/* HOME */}

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
          LEVEL 2
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
                  `${nodes[
                    node
                  ].x}px`,

                top:
                  `${nodes[
                    node
                  ].y}px`,
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

                <button
                  onClick={
                    handleRetry
                  }
                  className="retry-btn"
                >
                  Retry
                </button>

                {
                  gameStatus ===
                    "cleared" && (

                    <button
                      onClick={
                        handleContinue
                      }
                      className="continue-btn"
                    >
                      Continue
                    </button>

                  )
                }

              </div>

            </div>

          </div>

        )}

      </div>

    </div>
  );
}

export default Level2;
