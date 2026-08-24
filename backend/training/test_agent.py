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
# IMPORTS
# =====================================

from sb3_contrib import MaskablePPO

from backend.environment.rl_env import (
    PoliceThiefEnv,
    INDEX_TO_NODE
)

from backend.data.levels import ALL_LEVELS


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
# LOAD MODEL
# =====================================

print("=====================================")
print("LOADING MASKABLE PPO MODEL")
print("=====================================")


model = MaskablePPO.load(
    MODEL_PATH
)


print("Model loaded successfully")

print("Model path:")

print(
    MODEL_PATH
)

print("=====================================")


# =====================================
# CREATE ENVIRONMENT
# =====================================

env = PoliceThiefEnv()


# =====================================
# LOAD SPECIFIC TEST LEVEL
# =====================================

def load_test_level(level_number):

    level = ALL_LEVELS[
        level_number
    ]


    # ---------------------------------
    # LEVEL NUMBER
    # ---------------------------------

    env.level_number = (
        level_number
    )


    # ---------------------------------
    # GRAPH
    # ---------------------------------

    env.graph = (
        level["graph"]
    )


    # ---------------------------------
    # NODES
    # ---------------------------------

    env.nodes = list(
        env.graph.keys()
    )


    # ---------------------------------
    # THIEF START
    # ---------------------------------

    env.thief_start = (
        level["thief_start"]
    )


    # ---------------------------------
    # POLICE START
    # ---------------------------------

    env.police_start = (
        level["police_start"].copy()
    )


    # ---------------------------------
    # EXITS
    # ---------------------------------

    env.exits = (
        level["exits"].copy()
    )


    # ---------------------------------
    # CURRENT THIEF POSITION
    # ---------------------------------

    env.thief_position = (
        env.thief_start
    )


    # ---------------------------------
    # CURRENT POLICE POSITIONS
    # ---------------------------------

    env.police_positions = (
        env.police_start.copy()
    )


# =====================================
# TEST HEADER
# =====================================

print()

print("=====================================")
print("MASKABLE PPO LEVEL 1-10 TEST")
print("=====================================")


# =====================================
# RESULTS COUNTERS
# =====================================

valid_count = 0

invalid_count = 0


# =====================================
# TEST ALL LEVELS
# =====================================

for level_number in sorted(
    ALL_LEVELS.keys()
):


    # =================================
    # LOAD LEVEL
    # =================================

    load_test_level(
        level_number
    )


    # =================================
    # GET OBSERVATION
    # =================================

    observation = (
        env.get_state()
    )


    # =================================
    # GET ACTION MASK
    # =================================

    action_mask = (
        env.action_masks()
    )


    # =================================
    # GET VALID MOVES
    # =================================

    valid_moves = (
        env.get_valid_moves()
    )


    # =================================
    # CHECK FOR NO VALID MOVES
    # =================================

    if len(valid_moves) == 0:

        print()

        print(
            f"Level {level_number}"
        )

        print(
            "  Thief       :",
            env.thief_position
        )

        print(
            "  Police      :",
            env.police_positions
        )

        print(
            "  Exits       :",
            env.exits
        )

        print(
            "  Valid moves : NONE"
        )

        print(
            "  Result      : NO VALID MOVES"
        )

        continue


    # =================================
    # MASKABLE PPO PREDICTION
    # =================================

    action, _ = model.predict(
        observation,
        action_masks=action_mask,
        deterministic=True
    )


    # =================================
    # CONVERT ACTION
    # =================================

    action = int(
        action
    )


    # =================================
    # ACTION → NODE
    # =================================

    predicted_node = (
        INDEX_TO_NODE[action]
    )


    # =================================
    # CHECK RESULT
    # =================================

    if predicted_node in valid_moves:

        result = "VALID"

        valid_count += 1

    else:

        result = "INVALID"

        invalid_count += 1


    # =================================
    # PRINT LEVEL RESULT
    # =================================

    print()

    print(
        f"Level {level_number}"
    )

    print(
        "  Thief       :",
        env.thief_position
    )

    print(
        "  Police      :",
        env.police_positions
    )

    print(
        "  Exits       :",
        env.exits
    )

    print(
        "  Valid moves :",
        valid_moves
    )

    print(
        "  PPO action  :",
        action
    )

    print(
        "  PPO node    :",
        predicted_node
    )

    print(
        "  Result      :",
        result
    )

    print(
        "  Mask        :",
        action_mask
    )


# =====================================
# ACCURACY
# =====================================

total_tested = (
    valid_count
    + invalid_count
)


if total_tested > 0:

    accuracy = (
        valid_count
        / total_tested
    ) * 100

else:

    accuracy = 0


# =====================================
# FINAL RESULTS
# =====================================

print()

print("=====================================")
print("TEST RESULTS")
print("=====================================")

print(
    "Valid Predictions:",
    valid_count
)

print(
    "Invalid Predictions:",
    invalid_count
)

print(
    "Total Tested:",
    total_tested
)

print(
    "First Move Accuracy:",
    f"{accuracy:.2f}%"
)

print("=====================================")


# =====================================
# COMPLETE
# =====================================

print()
print("TEST COMPLETE")
print("=====================================")


# =====================================
# CLOSE ENVIRONMENT
# =====================================

env.close()