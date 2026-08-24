from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from sb3_contrib import MaskablePPO

import numpy as np
import os
import sys


# =====================================
# PROJECT ROOT
# =====================================

PROJECT_ROOT = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "..",
        ".."
    )
)

if PROJECT_ROOT not in sys.path:
    sys.path.append(PROJECT_ROOT)


# =====================================
# IMPORT LEVEL DATA
# =====================================

from backend.data.levels import (
    TRAIN_LEVELS,
    TEST_LEVELS,
    ALL_LEVELS
)


# =====================================
# CONSTANTS
# =====================================

MAX_NODES = 20
MAX_POLICE = 4


# =====================================
# FIXED NODE MAPPING
# =====================================
#
# A = 0
# B = 1
# ...
# T = 19
#
# Must match rl_env.py exactly.
# =====================================

NODE_NAMES = [
    chr(ord("A") + i)
    for i in range(MAX_NODES)
]


NODE_TO_INDEX = {
    node: index
    for index, node in enumerate(
        NODE_NAMES
    )
}


INDEX_TO_NODE = {
    index: node
    for index, node in enumerate(
        NODE_NAMES
    )
}


# =====================================
# MODEL PATH
# =====================================

MODEL_PATH = os.path.join(
    PROJECT_ROOT,
    "backend",
    "models",
    "maskable_ppo_thief_agent"
)


# =====================================
# LOAD MASKABLE PPO MODEL
# =====================================

print("=====================================")
print("LOADING MASKABLE PPO MODEL")
print("=====================================")


model = MaskablePPO.load(
    MODEL_PATH
)


print("Model loaded successfully")

print(
    "Model path:"
)

print(
    MODEL_PATH
)

print(
    "Training Levels:",
    list(TRAIN_LEVELS.keys())
)

print(
    "Test Levels:",
    list(TEST_LEVELS.keys())
)

print(
    "Available Levels:",
    list(ALL_LEVELS.keys())
)

print("=====================================")


# =====================================
# FASTAPI
# =====================================

app = FastAPI(
    title="Police vs Thief MaskablePPO API"
)


# =====================================
# CORS
# =====================================

app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "https://police-vs-thief-frontend-mqdw.onrender.com"
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"],
)


# =====================================
# REQUEST FORMAT
# =====================================

class GameState(BaseModel):

    level: int

    thief: str

    police: list[str]


# =====================================
# ONE-HOT NODE
# =====================================

def one_hot_node(node):

    vector = np.zeros(
        MAX_NODES,
        dtype=np.float32
    )


    if node in NODE_TO_INDEX:

        vector[
            NODE_TO_INDEX[node]
        ] = 1.0


    return vector


# =====================================
# BUILD OBSERVATION
# =====================================
#
# Must match rl_env.py exactly.
#
# Graph adjacency = 400
# Active nodes    = 20
# Exit mask       = 20
# Thief position  = 20
# Police          = 80
#
# TOTAL = 540
# =====================================

def build_observation(
    graph,
    exits,
    thief,
    police_positions
):

    # =================================
    # GRAPH ADJACENCY
    # =================================

    adjacency = np.zeros(
        (
            MAX_NODES,
            MAX_NODES
        ),
        dtype=np.float32
    )


    for from_node, neighbours in graph.items():

        if from_node not in NODE_TO_INDEX:
            continue


        from_index = NODE_TO_INDEX[
            from_node
        ]


        for to_node in neighbours:

            if to_node not in NODE_TO_INDEX:
                continue


            to_index = NODE_TO_INDEX[
                to_node
            ]


            adjacency[
                from_index,
                to_index
            ] = 1.0


    graph_data = adjacency.flatten()


    # =================================
    # ACTIVE NODE MASK
    # =================================

    active_nodes = np.zeros(
        MAX_NODES,
        dtype=np.float32
    )


    for node in graph:

        if node in NODE_TO_INDEX:

            active_nodes[
                NODE_TO_INDEX[node]
            ] = 1.0


    # =================================
    # EXIT MASK
    # =================================

    exit_mask = np.zeros(
        MAX_NODES,
        dtype=np.float32
    )


    for node in exits:

        if node in NODE_TO_INDEX:

            exit_mask[
                NODE_TO_INDEX[node]
            ] = 1.0


    # =================================
    # THIEF POSITION
    # =================================

    thief_data = one_hot_node(
        thief
    )


    # =================================
    # POLICE POSITIONS
    # =================================
    #
    # Maximum = 4 police
    # Remaining positions are zero-padded.
    # =================================

    police_data = []


    for i in range(MAX_POLICE):

        if i < len(police_positions):

            police_vector = one_hot_node(
                police_positions[i]
            )

        else:

            police_vector = np.zeros(
                MAX_NODES,
                dtype=np.float32
            )


        police_data.append(
            police_vector
        )


    # =================================
    # FINAL OBSERVATION
    # =================================

    observation = np.concatenate(
        [
            graph_data,
            active_nodes,
            exit_mask,
            thief_data,
            police_data[0],
            police_data[1],
            police_data[2],
            police_data[3]
        ]
    )


    observation = observation.astype(
        np.float32
    )


    # =================================
    # SAFETY CHECK
    # =================================

    if observation.shape != (540,):

        raise ValueError(
            f"Observation shape mismatch! "
            f"Expected (540,), "
            f"got {observation.shape}"
        )


    return observation


# =====================================
# BUILD ACTION MASK
# =====================================
#
# True  = valid move
# False = invalid move
#
# The thief can move only to:
#
# 1. A connected node.
# 2. A node without police.
# =====================================

def build_action_mask(
    graph,
    thief,
    police_positions
):

    action_mask = np.zeros(
        MAX_NODES,
        dtype=bool
    )


    # =================================
    # SAFETY CHECK
    # =================================

    if thief not in graph:

        return action_mask


    # =================================
    # CHECK NEIGHBOURS
    # =================================

    for node in graph[thief]:

        # -----------------------------
        # VALID NODE
        # -----------------------------

        if node not in NODE_TO_INDEX:
            continue


        # -----------------------------
        # POLICE BLOCK
        # -----------------------------

        if node in police_positions:
            continue


        # -----------------------------
        # MARK VALID ACTION
        # -----------------------------

        action_index = NODE_TO_INDEX[
            node
        ]


        action_mask[
            action_index
        ] = True


    return action_mask


# =====================================
# GET VALID MOVES
# =====================================

def get_valid_moves(
    graph,
    thief,
    police_positions
):

    valid_moves = []


    if thief not in graph:

        return valid_moves


    for node in graph[thief]:

        if node in police_positions:
            continue


        valid_moves.append(
            node
        )


    return valid_moves


# =====================================
# HOME / HEALTH
# =====================================

@app.get("/")
def home():

    return {

        "status": "online",

        "message":
            "Police vs Thief MaskablePPO API is running",

        "model":
            "maskable_ppo_thief_agent",

        "observation_size":
            540,

        "action_space":
            20,

        "training_levels":
            list(TRAIN_LEVELS.keys()),

        "test_levels":
            list(TEST_LEVELS.keys()),

        "available_levels":
            list(ALL_LEVELS.keys())
    }


# =====================================
# PREDICT THIEF MOVE
# =====================================

@app.post("/predict")
def predict_move(
    state: GameState
):

    # =================================
    # CHECK LEVEL
    # =================================

    if state.level not in ALL_LEVELS:

        return {

            "error":
                "Level not found",

            "level":
                state.level,

            "available_levels":
                list(ALL_LEVELS.keys())
        }


    # =================================
    # LOAD LEVEL
    # =================================

    level_data = ALL_LEVELS[
        state.level
    ]


    graph = level_data[
        "graph"
    ]


    exits = level_data[
        "exits"
    ]


    # =================================
    # CHECK THIEF POSITION
    # =================================

    if state.thief not in graph:

        return {

            "error":
                "Invalid thief position",

            "thief":
                state.thief
        }


    # =================================
    # VALIDATE POLICE
    # =================================

    police_positions = [

        police

        for police in state.police

        if police in graph

    ][:MAX_POLICE]


    # =================================
    # BUILD OBSERVATION
    # =================================

    observation = build_observation(

        graph=graph,

        exits=exits,

        thief=state.thief,

        police_positions=police_positions
    )


    # =================================
    # GET VALID MOVES
    # =================================

    valid_moves = get_valid_moves(

        graph=graph,

        thief=state.thief,

        police_positions=police_positions
    )


    # =================================
    # NO VALID MOVES
    # =================================

    if not valid_moves:

        print(
            f"[PREDICT] "
            f"Level={state.level} "
            f"Thief={state.thief} "
            f"Police={police_positions} "
            f"No valid moves"
        )


        return {

            "level":
                state.level,

            "next_move":
                state.thief,

            "reason":
                "no_valid_moves",

            "valid_moves":
                [],

            "action_mask":
                [False] * MAX_NODES
        }


    # =================================
    # BUILD ACTION MASK
    # =================================

    action_mask = build_action_mask(

        graph=graph,

        thief=state.thief,

        police_positions=police_positions
    )


    # =================================
    # MASK SAFETY CHECK
    # =================================

    if not np.any(action_mask):

        return {

            "error":
                "Action mask has no valid actions",

            "level":
                state.level,

            "thief":
                state.thief
        }


    # =================================
    # MASKABLE PPO PREDICTION
    # =====================================
    #
    # The model can ONLY select actions
    # marked True in action_mask.
    # =====================================

    action, _ = model.predict(

        observation,

        action_masks=action_mask,

        deterministic=True
    )


    action = int(
        action
    )


    # =================================
    # ACTION TO NODE
    # =================================

    predicted_node = INDEX_TO_NODE.get(
        action
    )


    # =================================
    # FINAL VALIDATION
    # =================================
    #
    # This should always be valid because
    # MaskablePPO uses the action mask.
    # =====================================

    if predicted_node not in valid_moves:

        print(
            f"[WARNING] Invalid model action: "
            f"{predicted_node}"
        )


        return {

            "error":
                "Model returned invalid action",

            "level":
                state.level,

            "action":
                action,

            "predicted_node":
                predicted_node,

            "valid_moves":
                valid_moves
        }


    # =================================
    # SUCCESS
    # =================================

    next_node = predicted_node


    # =================================
    # DEBUG
    # =================================

    print(
        f"[PREDICT] "
        f"Level={state.level} "
        f"Thief={state.thief} "
        f"Police={police_positions} "
        f"Valid={valid_moves} "
        f"Action={action} "
        f"Next={next_node}"
    )


    # =================================
    # RESPONSE
    # =================================

    return {

        "level":
            state.level,

        "current_thief":
            state.thief,

        "next_move":
            next_node,

        "action":
            action,

        "predicted_node":
            predicted_node,

        "reason":
            "maskable_ppo",

        "valid_moves":
            valid_moves,

        "action_mask":
            action_mask.tolist()
    }