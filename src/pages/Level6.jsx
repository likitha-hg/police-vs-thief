import "../styles/Level6.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../config/api";

import soundOn from "../assets/images/sound_on.png";
import soundOff from "../assets/images/sound_off.png";
import home from "../assets/images/home.png";

import { useMusic } from "../context/MusicContext";

function Level6() {
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

    B: { x: 280, y: 160 },
    D: { x: 400, y: 190 },
    C: { x: 520, y: 160 },

    E: { x: 280, y: 320 },
    F: { x: 520, y: 320 },

    G: { x: 400, y: 430 },

    I: { x: 280, y: 560 },
    H: { x: 520, y: 560 },

    J: { x: 400, y: 680 },
  };

  // =====================================
  // GRAPH
  // =====================================

  const graph = {
    A: ["B", "D", "C"],

    B: ["A", "D", "E"],
    C: ["A", "D", "F"],
    D: ["A", "B", "C", "E", "F"],

    E: ["B", "D", "F", "G", "I"],
    F: ["C", "D", "E", "G", "H"],

    G: ["E", "F", "I", "H"],

    I: ["E", "G", "H", "J"],
    H: ["F", "G", "I", "J"],

    J: ["I", "H"],
  };

  // =====================================
  // CONNECTIONS
  // =====================================

  const connections = [
    ["A", "B"],
    ["A", "D"],
    ["A", "C"],

    ["B", "D"],
    ["C", "D"],

    ["B", "E"],
    ["D", "E"],
    ["D", "F"],
    ["C", "F"],

    ["E", "F"],
    ["E", "G"],
    ["F", "G"],

    ["E", "I"],
    ["F", "H"],

    ["G", "I"],
    ["G", "H"],

    ["I", "J"],
    ["H", "J"],
  ];

  // =====================================
  // GAME SETTINGS
  // =====================================

  const EXIT_NODES = ["I", "H", "J"];

  const INITIAL_POLICE_POSITIONS = {
    police1: "I",
    police2: "H",
    police3: "J",
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

  // Prevent multiple actions while PPO is thinking
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
        level: 6,

        thief:
          currentThiefPosition,

        police:
          Object.values(
            updatedPolicePositions
          ),
      };

      console.log(
        "Sending Level 6 PPO request:",
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
        "Level 6 PPO status:",
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
        "Level 6 PPO response:",
        data
      );

      // =================================
      // API ERROR
      // =================================

      if (data.error) {
        console.error(
          "Level 6 PPO error:",
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
        "Level 6 PPO selected move:",
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
        "Level 6 valid thief moves:",
        validThiefMoves
      );

      // =================================
      // NO AVAILABLE MOVES
      // =================================

      if (
        validThiefMoves.length === 0
      ) {
        console.log(
          "Level 6 thief is trapped."
        );

        setGameStatus(
          "cleared"
        );

        setSelectedPolice(
          null
        );

        unlockNextLevel(7);

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
          "Invalid Level 6 PPO move:",
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
        `Level 6 thief moving ${currentThiefPosition} → ${nextMove}`
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
          "Level 6 thief reached exit."
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
          "Level 6 thief is trapped."
        );

        setGameStatus(
          "cleared"
        );

        setSelectedPolice(
          null
        );

        unlockNextLevel(7);
      }

    } catch (error) {
      console.error(
        "Level 6 thief movement error:",
        error
      );

    } finally {
      // AI turn finished
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

    // Do not allow another move
    // while PPO is thinking
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
      "Level 6 police moved:",
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
        "Level 6 police trapped the thief."
      );

      setGameStatus(
        "cleared"
      );

      unlockNextLevel(7);

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
      "Level 6 restarted."
    );
  };

  // =====================================
  // CONTINUE TO LEVEL 7
  // =====================================

  const handleContinue = () => {
    console.log(
      "Moving to Level 7"
    );

    unlockNextLevel(7);

    navigate(
      "/level7"
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
          LEVEL 6
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

export default Level6;