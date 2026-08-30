import "../styles/Level7.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../config/api";

import soundOn from "../assets/images/sound_on.png";
import soundOff from "../assets/images/sound_off.png";
import home from "../assets/images/home.png";

import { useMusic } from "../context/MusicContext";

function Level7() {
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
    A: { x: 400, y: 60 },

    B: { x: 280, y: 150 },
    C: { x: 570, y: 110 },

    G: { x: 190, y: 270 },
    D: { x: 360, y: 250 },
    F: { x: 720, y: 270 },

    H: { x: 350, y: 440 },
    E: { x: 550, y: 260 },
    I: { x: 550, y: 440 },

    J: { x: 180, y: 520 },
    K: { x: 350, y: 600 },
    L: { x: 600, y: 600 },
  };

  // =====================================
  // GRAPH
  // =====================================

  const graph = {
    A: ["B", "C"],

    B: ["A", "D", "G"],
    C: ["A", "E", "F"],

    G: ["B", "D", "H", "J"],
    D: ["B", "G", "H", "E"],
    F: ["C", "E", "L", "I"],

    H: ["G", "D", "E", "I", "J", "K"],
    E: ["D", "H", "I", "F", "C"],
    I: ["H", "E", "K", "L", "F"],

    J: ["G", "H", "K"],
    K: ["J", "H", "I", "L"],
    L: ["K", "I", "F"],
  };

  // =====================================
  // CONNECTIONS
  // =====================================

  const connections = [
    ["A", "B"],
    ["A", "C"],

    ["B", "D"],
    ["B", "G"],

    ["C", "E"],
    ["C", "F"],

    ["G", "D"],
    ["G", "H"],

    ["D", "H"],
    ["D", "E"],

    ["H", "E"],
    ["H", "I"],

    ["E", "I"],
    ["E", "F"],

    ["J", "G"],
    ["J", "H"],
    ["J", "K"],

    ["K", "H"],
    ["K", "I"],
    ["K", "L"],

    ["I", "L"],

    ["F", "L"],
    ["F", "I"],
  ];

  // =====================================
  // LEVEL RULES
  // =====================================

  const EXIT_NODES = ["J", "K", "L"];

  const INITIAL_POLICE_POSITIONS = {
    police1: "J",
    police2: "K",
    police3: "L",
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

  // Prevent police from making another move
  // while PPO is thinking
  const [turnInProgress, setTurnInProgress] = useState(false);

  // =====================================
  // UNLOCK LEVEL 8
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
    // PPO turn starts
    setTurnInProgress(true);

    try {
      // =================================
      // REQUEST BODY
      // =================================

      const requestBody = {
        level: 7,

        thief:
          currentThiefPosition,

        police:
          Object.values(
            updatedPolicePositions
          ),
      };

      console.log(
        "Sending Level 7 PPO request:",
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
        "Level 7 PPO status:",
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
        "Level 7 PPO response:",
        data
      );

      // =================================
      // API ERROR
      // =================================

      if (data.error) {
        console.error(
          "Level 7 PPO error:",
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
        "Level 7 PPO selected move:",
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
        "Level 7 valid thief moves:",
        validThiefMoves
      );

      // =================================
      // NO AVAILABLE MOVES
      // =================================

      if (
        validThiefMoves.length === 0
      ) {
        console.log(
          "Level 7 thief is trapped."
        );

        setGameStatus(
          "cleared"
        );

        setSelectedPolice(
          null
        );

        // Unlock Level 8
        unlockNextLevel(8);

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
          "Invalid Level 7 PPO move:",
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
        `Level 7 thief moving ${currentThiefPosition} → ${nextMove}`
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
          "Level 7 thief reached exit."
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
          "Level 7 thief is trapped."
        );

        setGameStatus(
          "cleared"
        );

        setSelectedPolice(
          null
        );

        // Unlock Level 8
        unlockNextLevel(8);
      }

    } catch (error) {
      console.error(
        "Level 7 thief movement error:",
        error
      );

    } finally {
      // PPO turn finished
      setTurnInProgress(false);
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
      "Level 7 police moved:",
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
        "Level 7 police trapped the thief."
      );

      setGameStatus(
        "cleared"
      );

      unlockNextLevel(8);

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
      "Level 7 restarted."
    );
  };

  // =====================================
  // CONTINUE TO LEVEL 8
  // =====================================

  const handleContinue = () => {
    console.log(
      "Moving to Level 8"
    );

    unlockNextLevel(8);

    navigate(
      "/level8"
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
          LEVEL 7
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
            AI THINKING STATUS
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

                {gameStatus ===
                  "cleared"
                    ? "LEVEL CLEARED"
                    : "LEVEL FAILED"}

              </h2>

              <p>

                {gameStatus ===
                  "cleared"
                    ? "The police trapped the thief."
                    : "The thief reached the exit."}

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

export default Level7;