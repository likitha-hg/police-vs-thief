
import "../styles/Level4.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../config/api";

import soundOn from "../assets/images/sound_on.png";
import soundOff from "../assets/images/sound_off.png";
import home from "../assets/images/home.png";

import { useMusic } from "../context/MusicContext";

function Level4() {
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
    A: { x: 400, y: 60 },

    D: { x: 250, y: 160 },
    B: { x: 400, y: 160 },
    C: { x: 550, y: 160 },

    E: { x: 250, y: 305 },
    F: { x: 400, y: 305 },
    G: { x: 550, y: 300 },

    H: { x: 130, y: 430 },
    I: { x: 290, y: 440 },
    J: { x: 450, y: 440 },

    K: { x: 305, y: 590 },
    L: { x: 460, y: 590 },
  };

  // =====================================
  // GRAPH
  // =====================================

  const graph = {
    A: ["D", "B", "C"],

    D: ["A", "B", "E"],
    B: ["A", "D", "C", "E", "F", "G"],
    C: ["A", "B"],

    E: ["D", "B", "F", "H", "I"],
    F: ["B", "E", "G", "I", "J"],
    G: ["B", "F", "J"],

    H: ["E", "K", "I"],
    I: ["E", "F", "K", "J", "H"],
    J: ["F", "G", "I", "L"],

    K: ["H", "I", "L"],
    L: ["K", "J"],
  };

  // =====================================
  // CONNECTIONS
  // =====================================

  const connections = [
    ["A", "D"],
    ["A", "B"],
    ["A", "C"],

    ["D", "B"],
    ["B", "C"],

    ["D", "E"],
    ["B", "E"],
    ["B", "F"],
    ["B", "G"],

    ["E", "F"],
    ["F", "G"],

    ["E", "H"],
    ["E", "I"],
    ["F", "I"],
    ["F", "J"],
    ["G", "J"],

    ["H", "K"],
    ["H", "I"],
    ["I", "K"],
    ["I", "J"],
    ["J", "L"],
    ["K", "L"],
  ];

  // =====================================
  // EXIT NODES
  // =====================================

  const EXIT_NODES = ["H", "K", "L"];

  // =====================================
  // INITIAL POSITIONS
  // =====================================

  const INITIAL_POLICE_POSITIONS = {
    police1: "H",
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

  // Prevent multiple actions while PPO is thinking
  const [turnInProgress, setTurnInProgress] = useState(false);

  // =====================================
  // UNLOCK NEXT LEVEL
  // =====================================

  const unlockNextLevel = () => {
    const savedLevel =
      localStorage.getItem("unlockedLevel");

    const currentUnlockedLevel =
      savedLevel
        ? Number(savedLevel)
        : 1;

    if (currentUnlockedLevel < 5) {
      localStorage.setItem(
        "unlockedLevel",
        "5"
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

    if (!graph[currentNode]) {
      return [];
    }

    return graph[currentNode].filter(
      (node) =>
        // Police cannot move onto thief
        node !== currentThiefPosition &&

        // Police cannot occupy another police node
        !Object.entries(currentPolicePositions)
          .filter(
            ([key]) =>
              key !== policeKey
          )
          .map(
            ([, position]) =>
              position
          )
          .includes(node)
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
    currentThief,
    currentPolicePositions
  ) => {
    const availableMoves =
      getThiefAvailableMoves(
        currentThief,
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
      // REQUEST DATA
      // =================================

      const requestBody = {
        level: 4,

        thief:
          currentThiefPosition,

        police:
          Object.values(
            updatedPolicePositions
          ),
      };

      console.log(
        "Sending PPO request:",
        requestBody
      );

      // =================================
      // CALL FASTAPI
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
        "PPO response status:",
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
      // READ RESPONSE
      // =================================

      const data =
        await response.json();

      console.log(
        "Level 4 PPO response:",
        data
      );

      // =================================
      // API ERROR
      // =================================

      if (data.error) {
        console.error(
          "Level 4 PPO API error:",
          data.error
        );

        return;
      }

      // =================================
      // GET PPO MOVE
      // =================================

      const nextMove =
        data.next_move;

      console.log(
        "Level 4 PPO selected move:",
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
        "Level 4 valid thief moves:",
        validThiefMoves
      );

      // =================================
      // NO VALID MOVES
      // =================================

      if (
        validThiefMoves.length === 0
      ) {
        console.log(
          "Thief has no valid moves."
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
      // INVALID PPO MOVE
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

      console.log(
        `Thief moving ${currentThiefPosition} → ${nextMove}`
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
          "Thief reached exit."
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
          "Thief is trapped."
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
        "Level 4 thief movement error:",
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
      "Police moved:",
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
        "Police trapped the thief."
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
      "Level 4 restarted."
    );
  };

  // =====================================
  // CONTINUE TO LEVEL 5
  // =====================================

  const handleContinue = () => {
    console.log(
      "Moving to Level 5"
    );

    unlockNextLevel();

    navigate(
      "/level5"
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
          LEVEL HEADER
      ================================= */}

      <div className="level-header">

        <div className="level-title">
          LEVEL 4
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
          GAME BOARD
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

              {/* RESULT TITLE */}

              <h2>
                {
                  gameStatus ===
                  "cleared"
                    ? "LEVEL CLEARED"
                    : "LEVEL FAILED"
                }
              </h2>

              {/* RESULT MESSAGE */}

              <p>
                {
                  gameStatus ===
                  "cleared"
                    ? "The police trapped the thief."
                    : "The thief reached the exit."
                }
              </p>

              {/* BUTTONS */}

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

export default Level4;
