import "../styles/Level9.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../config/api";

import soundOn from "../assets/images/sound_on.png";
import soundOff from "../assets/images/sound_off.png";
import home from "../assets/images/home.png";

import { useMusic } from "../context/MusicContext";

function Level9() {
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

    C: { x: 250, y: 160 },
    D: { x: 400, y: 220 },
    B: { x: 550, y: 160 },

    G: { x: 180, y: 350 },
    F: { x: 400, y: 350 },
    E: { x: 620, y: 350 },

    J: { x: 180, y: 520 },
    H: { x: 400, y: 520 },
    I: { x: 620, y: 520 },
  };

  // =====================================
  // GRAPH
  // =====================================

  const graph = {
    A: ["C", "D", "B"],

    C: ["A", "D", "F", "G"],
    D: ["A", "C", "B", "F"],
    B: ["A", "D", "F", "E"],

    F: ["C", "D", "B", "E", "G", "H"],

    G: ["C", "F", "H", "J"],
    E: ["B", "F", "H", "I"],

    H: ["F", "G", "E", "J", "I"],

    J: ["G", "H"],
    I: ["E", "H"],
  };

  // =====================================
  // CONNECTIONS
  // =====================================

  const connections = [
    ["A", "C"],
    ["A", "D"],
    ["A", "B"],

    ["C", "D"],
    ["D", "B"],

    ["C", "F"],
    ["C", "G"],

    ["D", "F"],

    ["B", "F"],
    ["B", "E"],

    ["F", "G"],
    ["F", "E"],
    ["F", "H"],

    ["G", "H"],
    ["G", "J"],

    ["E", "H"],
    ["E", "I"],

    ["H", "J"],
    ["H", "I"],
  ];

  // =====================================
  // EXIT NODES
  // =====================================

  const EXIT_NODES = ["E", "F", "H"];

  // =====================================
  // INITIAL POSITIONS
  // =====================================

  const INITIAL_POLICE_POSITIONS = {
    police1: "E",
    police2: "F",
    police3: "H",
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
  // SAVE UNLOCKED LEVEL
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
            level: 9,

            thief:
              thiefPosition,

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
        "Level 9 AI:",
        data
      );

      // =================================
      // API ERROR
      // =================================

      if (data.error) {
        console.log(
          "Level 9 PPO error:",
          data.error
        );

        return;
      }

      const nextMove =
        data.next_move;

      // =================================
      // GET VALID THIEF MOVES
      // =================================

      const validThiefMoves =
        getThiefAvailableMoves(
          thiefPosition,
          updatedPolicePositions
        );

      console.log(
        "Level 9 valid thief moves:",
        validThiefMoves
      );

      // =================================
      // NO AVAILABLE MOVES
      // =================================

      if (
        validThiefMoves.length === 0
      ) {
        setGameStatus(
          "cleared"
        );

        setSelectedPolice(
          null
        );

        // Level 10 unlocked
        unlockNextLevel(10);

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
          "Invalid Level 9 PPO move:",
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
        setGameStatus(
          "cleared"
        );

        setSelectedPolice(
          null
        );

        // =================================
        // UNLOCK LEVEL 10
        // =================================

        unlockNextLevel(10);
      }

    } catch (error) {
      console.log(
        "Level 9 thief move error:",
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
    // CHECK IF THIEF IS TRAPPED
    // =================================

    if (
      isThiefTrapped(
        thiefPosition,
        updatedPositions
      )
    ) {
      setGameStatus(
        "cleared"
      );

      // =================================
      // UNLOCK LEVEL 10
      // =================================

      unlockNextLevel(10);

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
  };

  // =====================================
  // CONTINUE TO LEVEL 10
  // =====================================

  const handleContinue = () => {
    console.log(
      "Moving to Level 10"
    );

    // Make sure Level 10 stays unlocked
    unlockNextLevel(10);

    navigate(
      "/level10"
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
          LEVEL 9
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
            AI STATUS
        ================================= */}

        {turnInProgress &&
          gameStatus ===
            "playing" && (
            <div className="ai-status">
              Thief is thinking...
            </div>
          )}

      </div>

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
  );
}

export default Level9;