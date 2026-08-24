# train_agent.py
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

from stable_baselines3.common.callbacks import (
    CheckpointCallback
)

from backend.environment.rl_env import (
    PoliceThiefEnv
)


# =====================================
# MODEL / LOG DIRECTORIES
# =====================================

MODEL_DIR = os.path.join(
    PROJECT_ROOT,
    "backend",
    "models"
)

LOG_DIR = os.path.join(
    PROJECT_ROOT,
    "backend",
    "logs"
)


os.makedirs(
    MODEL_DIR,
    exist_ok=True
)

os.makedirs(
    LOG_DIR,
    exist_ok=True
)


# =====================================
# CREATE ENVIRONMENT
# =====================================

env = PoliceThiefEnv()


# =====================================
# ENVIRONMENT CHECK
# =====================================

print("===================================")
print("MASKABLE PPO ENVIRONMENT CHECK")
print("===================================")

print(
    "Observation Space:",
    env.observation_space
)

print(
    "Observation Shape:",
    env.observation_space.shape
)

print(
    "Actual State Shape:",
    env.get_state().shape
)

print(
    "State Length:",
    len(env.get_state())
)

print(
    "Action Space:",
    env.action_space
)

print(
    "Training Levels:",
    list(range(1, 9))
)

print(
    "Current Valid Moves:",
    env.get_valid_moves()
)

print(
    "Current Action Mask:",
    env.action_masks()
)

print("===================================")


# =====================================
# SAFETY CHECK
# =====================================

if (
    env.get_state().shape
    != env.observation_space.shape
):

    raise ValueError(
        "Environment observation shape mismatch!"
        f"\nObservation Space: "
        f"{env.observation_space.shape}"
        f"\nActual State: "
        f"{env.get_state().shape}"
    )


if not env.action_masks().any():

    raise ValueError(
        "No valid actions available!"
    )


print(
    "Environment shape check: PASSED"
)

print(
    "Action mask check: PASSED"
)

print("===================================")


# =====================================
# CHECKPOINT CALLBACK
# =====================================

checkpoint_callback = CheckpointCallback(
    save_freq=10000,

    save_path=MODEL_DIR,

    name_prefix="maskable_ppo_thief"
)


# =====================================
# CREATE MASKABLE PPO MODEL
# =====================================

model = MaskablePPO(
    policy="MlpPolicy",

    env=env,

    learning_rate=0.0003,

    n_steps=2048,

    batch_size=64,

    n_epochs=10,

    gamma=0.99,

    gae_lambda=0.95,

    clip_range=0.2,

    ent_coef=0.01,

    verbose=1,

    tensorboard_log=LOG_DIR
)


# =====================================
# TRAINING INFORMATION
# =====================================

TOTAL_TIMESTEPS = 500000


print("===================================")
print("Starting MaskablePPO Training...")
print("===================================")

print(
    "Training Levels:",
    list(range(1, 9))
)

print(
    "Observation Shape:",
    env.observation_space.shape
)

print(
    "Action Space:",
    env.action_space
)

print(
    "Total Timesteps:",
    TOTAL_TIMESTEPS
)

print("===================================")


# =====================================
# TRAIN MASKABLE PPO
# =====================================

model.learn(
    total_timesteps=TOTAL_TIMESTEPS,

    callback=checkpoint_callback,

    progress_bar=True
)


# =====================================
# FINAL MODEL PATH
# =====================================

FINAL_MODEL_PATH = os.path.join(
    MODEL_DIR,
    "maskable_ppo_thief_agent"
)


# =====================================
# SAVE FINAL MODEL
# =====================================

model.save(
    FINAL_MODEL_PATH
)


# =====================================
# CLOSE ENVIRONMENT
# =====================================

env.close()


# =====================================
# COMPLETE
# =====================================

print("===================================")
print("Training Complete!")
print("===================================")

print(
    "Model saved:"
)

print(
    FINAL_MODEL_PATH
)

print("===================================")

