
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
  // UNLOCK LEVEL 9
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
        node !== currentThiefPosition &&
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

    return graph[currentThiefPosition].filter(
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
      gameStatus !== "playing" ||
      turnInProgress
    ) {
      return;
    }

    setSelectedPolice(policeKey);
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
        level: 8,
        thief: currentThiefPosition,
        police:
          Object.values(
            updatedPolicePositions
          ),
      };

      console.log(
        "Sending Level 8 PPO request:",
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
        "Level 8 PPO status:",
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
        "Level 8 PPO response:",
        data
      );

      // =================================
      // API ERROR
      // =================================

      if (data.error) {
        console.error(
          "Level 8 PPO error:",
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
        "Level 8 PPO selected move:",
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
        "Level 8 valid thief moves:",
        validThiefMoves
      );

      // =================================
      // NO AVAILABLE MOVES
      // =================================

      if (
        validThiefMoves.length === 0
      ) {
        console.log(
          "Level 8 thief is trapped."
        );

        setGameStatus("cleared");
        setSelectedPolice(null);

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
          "Invalid Level 8 PPO move:",
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
        `Level 8 thief moving ${currentThiefPosition} → ${nextMove}`
      );

      setThiefPosition(nextMove);

      // =================================
      // THIEF REACHED EXIT
      // =================================

      if (
        EXIT_NODES.includes(
          nextMove
        )
      ) {
        console.log(
          "Level 8 thief reached exit."
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
          "Level 8 thief is trapped."
        );

        setGameStatus("cleared");
        setSelectedPolice(null);

        unlockNextLevel();
      }

    } catch (error) {
      console.error(
        "Level 8 thief movement error:",
        error
      );

    } finally {
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
      !selectedPolice ||
      gameStatus !== "playing" ||
      turnInProgress
    ) {
      return;
    }

    // =================================
    // VALID POLICE MOVES
    // =================================

    const validMoves =
      getValidMoves(
        selectedPolice
      );

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
      "Level 8 police moved:",
      updatedPositions
    );

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
      console.log(
        "Level 8 police trapped the thief."
      );

      setGameStatus("cleared");

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
  // RETRY
  // =====================================

  const handleRetry = () => {
    console.log(
      "Level 8 restarted."
    );

    setPolicePositions({
      ...INITIAL_POLICE_POSITIONS,
    });

    setThiefPosition(
      INITIAL_THIEF_POSITION
    );

    setSelectedPolice(null);

    setGameStatus("playing");

    setTurnInProgress(false);
  };

  // =====================================
  // CONTINUE TO LEVEL 9
  // =====================================

  const handleContinue = () => {
    console.log(
      "Moving to Level 9"
    );

    unlockNextLevel();

    navigate("/level9");
  };

  // =====================================
  // HOME
  // =====================================

  const handleHome = () => {
    navigate("/");
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
          onClick={toggleMute}
        />

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
          LEVEL 8
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

        {gameStatus !== "playing" && (

          <div className="game-result-overlay">

            <div className="game-result">

              {/* =================================
                  RESULT TITLE
              ================================= */}

              <h2>
                {gameStatus === "cleared"
                  ? "LEVEL CLEARED"
                  : "LEVEL FAILED"}
              </h2>

              {/* =================================
                  RESULT MESSAGE
              ================================= */}

              <p>
                {gameStatus === "cleared"
                  ? "The police trapped the thief."
                  : "The thief reached the exit."}
              </p>

              {/* =================================
                  RESULT BUTTONS
              ================================= */}

              <div className="result-buttons">

                {/* RETRY */}

                <button
                  onClick={handleRetry}
                  className="retry-btn"
                >
                  RETRY
                </button>

                {/* CONTINUE */}

                {gameStatus === "cleared" && (

                  <button
                    onClick={handleContinue}
                    className="continue-btn"
                  >
                    CONTINUE
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
