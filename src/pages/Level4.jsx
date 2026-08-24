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
  // LEVEL RULES
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

    return graph[currentNode].filter(
      (node) =>
        // Police cannot move onto thief
        node !== currentThiefPosition &&

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
            level: 4,

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

      const data = await response.json();

      console.log(
        "Level 4 AI:",
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

      const nextMove = data.next_move;

      // =================================
      // VALIDATE THIEF MOVE
      // =================================

      const validThiefMoves =
        graph[thiefPosition].filter(
          (node) =>
            !Object.values(
              updatedPolicePositions
            ).includes(node)
        );

      if (
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

      setThiefPosition(nextMove);

      // =================================
      // THIEF REACHED EXIT
      // =================================

      if (
        EXIT_NODES.includes(nextMove)
      ) {
        setSelectedPolice(null);

        setGameStatus("failed");

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
        setSelectedPolice(null);

        setGameStatus("cleared");

        return;
      }

    } catch (error) {
      console.log(
        "Level 4 thief move error:",
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
    if (!selectedPolice) {
      return;
    }

    if (gameStatus !== "playing") {
      return;
    }

    const validMoves =
      getValidMoves(
        selectedPolice
      );

    // =================================
    // INVALID DESTINATION
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

      [selectedPolice]:
        nodeKey,
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

      // Unlock Level 5
      const currentUnlocked =
        Number(
          localStorage.getItem(
            "unlockedLevel"
          ) || 1
        );

      if (currentUnlocked < 5) {
        localStorage.setItem(
          "unlockedLevel",
          "5"
        );
      }

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

    setSelectedPolice(null);

    setGameStatus("playing");
  };

  // =====================================
  // CONTINUE
  // =====================================

  const handleContinue = () => {
    // Make sure Level 5 is unlocked
    const currentUnlocked =
      Number(
        localStorage.getItem(
          "unlockedLevel"
        ) || 1
      );

    if (currentUnlocked < 5) {
      localStorage.setItem(
        "unlockedLevel",
        "5"
      );
    }

    // Go to Level 5
    navigate("/level5");
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
          LEVEL 4
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

export default Level4;