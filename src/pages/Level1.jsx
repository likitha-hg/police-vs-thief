import "../styles/Level1.css";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import API_URL from "../config/api";

import soundOn from "../assets/images/sound_on.png";
import soundOff from "../assets/images/sound_off.png";
import home from "../assets/images/home.png";

import { useMusic } from "../context/MusicContext";

function Level1() {
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
    A: { x: 400, y: 20 },
    B: { x: 280, y: 180 },
    C: { x: 520, y: 180 },
    D: { x: 400, y: 380 },
    E: { x: 190, y: 380 },
    F: { x: 400, y: 600 },
    G: { x: 560, y: 380 },
  };

  // =====================================
  // GRAPH
  // =====================================

  const graph = {
    A: ["B", "C"],
    B: ["A", "C", "D"],
    C: ["A", "B", "D", "G"],
    D: ["B", "C", "E", "F", "G"],
    E: ["D", "F"],
    F: ["D", "E", "G"],
    G: ["D", "F", "C"],
  };

  // =====================================
  // CONNECTIONS
  // =====================================

  const connections = [
    ["A", "B"],
    ["A", "C"],
    ["B", "C"],
    ["B", "D"],
    ["C", "D"],
    ["C", "G"],
    ["D", "E"],
    ["D", "F"],
    ["D", "G"],
    ["E", "F"],
    ["F", "G"],
  ];

  // =====================================
  // EXIT NODES
  // =====================================

  const EXIT_NODES = ["E", "F"];

  // =====================================
  // INITIAL POSITIONS
  // =====================================

  const INITIAL_POLICE_POSITIONS = {
    police1: "E",
    police2: "F",
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
  // VALID POLICE MOVES
  // =====================================

  const getValidMoves = (
    policeKey,
    currentPolicePositions = policePositions
  ) => {
    const currentNode = currentPolicePositions[policeKey];

    return graph[currentNode].filter(
      (node) =>
        node !== thiefPosition &&
        !Object.values(currentPolicePositions).includes(node)
    );
  };

  // =====================================
  // CHECK IF THIEF IS TRAPPED
  // =====================================

  const isThiefTrapped = (
    currentThief,
    currentPolicePositions
  ) => {
    const thiefMoves = graph[currentThief];

    const availableMoves = thiefMoves.filter(
      (node) =>
        !Object.values(currentPolicePositions).includes(node)
    );

    return availableMoves.length === 0;
  };

  // =====================================
  // POLICE SELECTION
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

  const moveThief = async (updatedPolicePositions) => {
    try {
      const response = await fetch(
        `${API_URL}/predict`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            level: 1,
            thief: thiefPosition,
            police: Object.values(updatedPolicePositions),
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Prediction request failed");
      }

      const data = await response.json();

      console.log("Level 1 AI:", data);

      // =================================
      // API ERROR
      // =================================

      if (data.error) {
        console.log("PPO API error:", data.error);
        return;
      }

      const nextMove = data.next_move;

      // =================================
      // VALID THIEF MOVES
      // =================================

      const validThiefMoves = graph[thiefPosition].filter(
        (node) =>
          !Object.values(updatedPolicePositions).includes(node)
      );

      // =================================
      // INVALID PPO MOVE
      // =================================

      if (!validThiefMoves.includes(nextMove)) {
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

      if (EXIT_NODES.includes(nextMove)) {
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
        return;
      }
    } catch (error) {
      console.log("Thief move error:", error);
    }
  };

  // =====================================
  // POLICE MOVE
  // =====================================

  const handleNodeClick = async (nodeKey) => {
    if (!selectedPolice) {
      return;
    }

    if (gameStatus !== "playing") {
      return;
    }

    const validMoves = getValidMoves(selectedPolice);

    // =================================
    // INVALID POLICE MOVE
    // =================================

    if (!validMoves.includes(nodeKey)) {
      return;
    }

    // =================================
    // UPDATE POLICE POSITION
    // =================================

    const updatedPositions = {
      ...policePositions,
      [selectedPolice]: nodeKey,
    };

    setPolicePositions(updatedPositions);
    setSelectedPolice(null);

    // =================================
    // CHECK IF THIEF IS TRAPPED
    // =================================

    if (
      isThiefTrapped(
        thiefPosition,
        updatedPositions
      )
    ) {
      setGameStatus("cleared");
      return;
    }

    // =================================
    // THIEF GETS TURN
    // =================================

    await moveThief(updatedPositions);
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
  // CONTINUE TO LEVEL 2
  // =====================================

  const handleContinue = () => {
    localStorage.setItem(
      "unlockedLevel",
      "2"
    );

    navigate("/level2");
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
          LEVEL HEADER
      ================================= */}

      <div className="level-header">

        <div className="level-title">
          LEVEL 1
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
                    EXIT_NODES.includes(key)
                      ? "exit-node"
                      : ""
                  }

                  ${
                    validMoves.includes(key)
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
        ).map(([key, node]) => (

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
              handlePoliceClick(key)
            }
            style={{
              left: `${nodes[node].x}px`,
              top: `${nodes[node].y}px`,
            }}
          >
            P
          </div>

        ))}

        {/* =================================
            RESULT POPUP
        ================================= */}

        {gameStatus !== "playing" && (

          <div className="game-result-overlay">

            <div className="game-result">

              {/* RESULT TITLE */}

              <h2>
                {gameStatus === "cleared"
                  ? "LEVEL CLEARED"
                  : "LEVEL FAILED"}
              </h2>

              {/* RESULT MESSAGE */}

              <p>
                {gameStatus === "cleared"
                  ? "The police trapped the thief."
                  : "The thief reached the exit."}
              </p>

              {/* BUTTONS */}

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

export default Level1;