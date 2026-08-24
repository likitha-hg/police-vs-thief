
import os
import sys
from collections import deque

import gymnasium as gym
from gymnasium import spaces
import numpy as np


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
# IMPORT TRAINING LEVELS
# =====================================

from backend.data.levels import TRAIN_LEVELS


# =====================================
# CONSTANTS
# =====================================

MAX_NODES = 20
MAX_POLICE = 4

MAX_EPISODE_STEPS = 40


# =====================================
# OBSERVATION SIZE
# =====================================
#
# Graph adjacency     = 20 x 20 = 400
# Active nodes        = 20
# Exit mask           = 20
# Thief position      = 20
# Police positions    = 4 x 20 = 80
#
# TOTAL = 540
# =====================================

OBSERVATION_SIZE = (
    (MAX_NODES * MAX_NODES)
    + MAX_NODES
    + MAX_NODES
    + MAX_NODES
    + (MAX_POLICE * MAX_NODES)
)


TRAINING_LEVEL_COUNT = len(
    TRAIN_LEVELS
)


# =====================================
# FIXED NODE MAPPING
# =====================================
#
# A = 0
# B = 1
# ...
# T = 19
#
# This mapping NEVER changes.
# =====================================

NODE_NAMES = [
    chr(ord("A") + i)
    for i in range(MAX_NODES)
]


NODE_TO_INDEX = {
    node: index
    for index, node in enumerate(NODE_NAMES)
}


INDEX_TO_NODE = {
    index: node
    for index, node in enumerate(NODE_NAMES)
}


# =====================================
# ENVIRONMENT
# =====================================

class PoliceThiefEnv(gym.Env):

    metadata = {
        "render_modes": ["human"]
    }


    # =================================
    # INITIALIZATION
    # =================================

    def __init__(self):

        super().__init__()


        # =================================
        # ACTION SPACE
        # =================================
        #
        # 0  = A
        # 1  = B
        # ...
        # 19 = T
        #
        self.action_space = spaces.Discrete(
            MAX_NODES
        )


        # =================================
        # OBSERVATION SPACE
        # =================================

        self.observation_space = spaces.Box(
            low=0.0,
            high=1.0,
            shape=(OBSERVATION_SIZE,),
            dtype=np.float32
        )


        # =================================
        # VARIABLES
        # =================================

        self.level_number = None

        self.graph = None

        self.nodes = None

        self.exits = None

        self.thief_start = None

        self.police_start = None

        self.thief_position = None

        self.police_positions = None

        self.step_count = 0


        # =================================
        # RESET
        # =================================

        self.reset()


    # =====================================
    # LOAD RANDOM TRAINING LEVEL
    # =====================================

    def load_random_level(self):

        level_numbers = list(
            TRAIN_LEVELS.keys()
        )

        # Use Gymnasium RNG instead of the
        # global random module.
        index = self.np_random.integers(
            0,
            len(level_numbers)
        )

        self.level_number = (
            level_numbers[index]
        )

        level = TRAIN_LEVELS[
            self.level_number
        ]


        # ---------------------------------
        # GRAPH
        # ---------------------------------

        self.graph = level["graph"]


        # ---------------------------------
        # NODES
        # ---------------------------------

        self.nodes = list(
            self.graph.keys()
        )


        # ---------------------------------
        # THIEF
        # ---------------------------------

        self.thief_start = (
            level["thief_start"]
        )


        # ---------------------------------
        # POLICE
        # ---------------------------------

        self.police_start = (
            level["police_start"].copy()
        )


        # ---------------------------------
        # EXITS
        # ---------------------------------

        self.exits = (
            level["exits"].copy()
        )


    # =====================================
    # ONE-HOT NODE
    # =====================================

    def one_hot_node(self, node):

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
    # GRAPH ADJACENCY
    # =====================================

    def get_graph_adjacency(self):

        adjacency = np.zeros(
            (
                MAX_NODES,
                MAX_NODES
            ),
            dtype=np.float32
        )


        for from_node, neighbours in (
            self.graph.items()
        ):

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


        return adjacency.flatten()


    # =====================================
    # ACTIVE NODE MASK
    # =====================================

    def get_active_node_mask(self):

        mask = np.zeros(
            MAX_NODES,
            dtype=np.float32
        )


        for node in self.nodes:

            if node in NODE_TO_INDEX:

                mask[
                    NODE_TO_INDEX[node]
                ] = 1.0


        return mask


    # =====================================
    # EXIT MASK
    # =====================================

    def get_exit_mask(self):

        mask = np.zeros(
            MAX_NODES,
            dtype=np.float32
        )


        for node in self.exits:

            if node in NODE_TO_INDEX:

                mask[
                    NODE_TO_INDEX[node]
                ] = 1.0


        return mask


    # =====================================
    # GET STATE
    # =====================================

    def get_state(self):

        # ---------------------------------
        # GRAPH
        # ---------------------------------

        graph_data = (
            self.get_graph_adjacency()
        )


        # ---------------------------------
        # ACTIVE NODES
        # ---------------------------------

        active_nodes = (
            self.get_active_node_mask()
        )


        # ---------------------------------
        # EXITS
        # ---------------------------------

        exit_data = (
            self.get_exit_mask()
        )


        # ---------------------------------
        # THIEF
        # ---------------------------------

        thief_data = self.one_hot_node(
            self.thief_position
        )


        # ---------------------------------
        # POLICE
        # ---------------------------------

        police_data = []


        for i in range(MAX_POLICE):

            if (
                i < len(
                    self.police_positions
                )
            ):

                police_vector = (
                    self.one_hot_node(
                        self.police_positions[i]
                    )
                )

            else:

                police_vector = np.zeros(
                    MAX_NODES,
                    dtype=np.float32
                )


            police_data.append(
                police_vector
            )


        # ---------------------------------
        # COMBINE
        # ---------------------------------

        state = np.concatenate(
            [
                graph_data,
                active_nodes,
                exit_data,
                thief_data,
                police_data[0],
                police_data[1],
                police_data[2],
                police_data[3]
            ]
        )


        state = state.astype(
            np.float32
        )


        # ---------------------------------
        # SAFETY CHECK
        # ---------------------------------

        if state.shape != (
            self.observation_space.shape
        ):

            raise ValueError(
                f"State shape mismatch! "
                f"Expected "
                f"{self.observation_space.shape}, "
                f"but got {state.shape}"
            )


        return state


    # =====================================
    # GET VALID MOVES
    # =====================================

    def get_valid_moves(self):

        if self.thief_position not in self.graph:

            return []


        valid_moves = []


        for node in self.graph[
            self.thief_position
        ]:

            if node in self.police_positions:
                continue

            if node not in self.nodes:
                continue

            valid_moves.append(node)


        return valid_moves


    # =====================================
    # ACTION MASK
    # =====================================
    #
    # Used by MaskablePPO.
    #
    # True  = legal
    # False = illegal
    # =====================================

    def action_masks(self):

        mask = np.zeros(
            MAX_NODES,
            dtype=bool
        )


        # ---------------------------------
        # Safety
        # ---------------------------------

        if (
            self.graph is None
            or self.thief_position is None
        ):

            return mask


        valid_moves = (
            self.get_valid_moves()
        )


        # ---------------------------------
        # Normal valid moves
        # ---------------------------------

        for node in valid_moves:

            index = NODE_TO_INDEX.get(
                node
            )

            if index is not None:

                mask[index] = True


        # ---------------------------------
        # No legal movement
        # ---------------------------------
        #
        # Give MaskablePPO one safe action.
        # Staying in the same node will be
        # treated as being trapped in step().
        #
        # This prevents an all-False mask.
        # ---------------------------------

        if not mask.any():

            current_index = (
                NODE_TO_INDEX.get(
                    self.thief_position
                )
            )

            if current_index is not None:

                mask[
                    current_index
                ] = True


        return mask


    # =====================================
    # SHORTEST DISTANCE TO EXIT
    # =====================================
    #
    # BFS is used because this is a graph.
    #
    # Police nodes are treated as blocked.
    # =====================================

    def shortest_distance_to_exit(
        self,
        start_node
    ):

        if start_node in self.exits:

            return 0


        if start_node not in self.graph:

            return None


        blocked = set(
            self.police_positions
        )


        # The starting position itself
        # must remain traversable.
        blocked.discard(
            start_node
        )


        queue = deque()

        queue.append(
            (
                start_node,
                0
            )
        )


        visited = {
            start_node
        }


        while queue:

            current, distance = (
                queue.popleft()
            )


            for neighbour in self.graph.get(
                current,
                []
            ):

                # Do not walk through police.
                if neighbour in blocked:
                    continue


                if neighbour in visited:
                    continue


                if neighbour in self.exits:

                    return distance + 1


                visited.add(
                    neighbour
                )


                queue.append(
                    (
                        neighbour,
                        distance + 1
                    )
                )


        return None


    # =====================================
    # ESCAPE PATH CHECK
    # =====================================

    def has_escape_path(
        self,
        start_node
    ):

        distance = (
            self.shortest_distance_to_exit(
                start_node
            )
        )

        return distance is not None


    # =====================================
    # RESET
    # =====================================

    def reset(
        self,
        seed=None,
        options=None
    ):

        super().reset(
            seed=seed
        )


        # ---------------------------------
        # LEVEL
        # ---------------------------------

        self.load_random_level()


        # ---------------------------------
        # THIEF
        # ---------------------------------

        self.thief_position = (
            self.thief_start
        )


        # ---------------------------------
        # POLICE
        # ---------------------------------

        self.police_positions = (
            self.police_start.copy()
        )


        # ---------------------------------
        # STEP COUNT
        # ---------------------------------

        self.step_count = 0


        # ---------------------------------
        # STATE
        # ---------------------------------

        return (
            self.get_state(),
            {}
        )


    # =====================================
    # STEP
    # =====================================

    def step(self, action):

        action = int(action)


        reward = 0.0

        terminated = False

        truncated = False


        # =================================
        # CURRENT DISTANCE
        # =================================

        current_distance = (
            self.shortest_distance_to_exit(
                self.thief_position
            )
        )


        # =================================
        # ACTION INDEX CHECK
        # =================================

        if (
            action < 0
            or action >= MAX_NODES
        ):

            reward = -20.0

            return (
                self.get_state(),
                reward,
                terminated,
                truncated,
                {}
            )


        # =================================
        # TARGET NODE
        # =================================

        target_node = INDEX_TO_NODE[
            action
        ]


        # =================================
        # FORCED TRAPPED STATE
        # =================================

        if (
            target_node
            == self.thief_position
        ):

            if not self.get_valid_moves():

                reward = -100.0

                terminated = True

                return (
                    self.get_state(),
                    reward,
                    terminated,
                    truncated,
                    {
                        "reason": "trapped"
                    }
                )


        # =================================
        # NODE NOT IN LEVEL
        # =================================

        if target_node not in self.nodes:

            reward = -20.0

            return (
                self.get_state(),
                reward,
                terminated,
                truncated,
                {}
            )


        # =================================
        # NOT CONNECTED
        # =================================

        if target_node not in self.graph.get(
            self.thief_position,
            []
        ):

            reward = -20.0

            return (
                self.get_state(),
                reward,
                terminated,
                truncated,
                {}
            )


        # =================================
        # POLICE COLLISION
        # =================================

        if target_node in self.police_positions:

            reward = -100.0

            terminated = True

            return (
                self.get_state(),
                reward,
                terminated,
                truncated,
                {
                    "reason": "caught"
                }
            )


        # =================================
        # MOVE THIEF
        # =================================

        self.thief_position = (
            target_node
        )


        self.step_count += 1


        # =================================
        # ESCAPE
        # =================================

        if self.thief_position in self.exits:

            reward = 100.0

            terminated = True

            return (
                self.get_state(),
                reward,
                terminated,
                truncated,
                {
                    "reason": "escaped"
                }
            )


        # =================================
        # NEW DISTANCE
        # =================================

        new_distance = (
            self.shortest_distance_to_exit(
                self.thief_position
            )
        )


        # =================================
        # DEAD / TRAPPED POSITION
        # =================================

        if new_distance is None:

            reward = -60.0

            terminated = True

            return (
                self.get_state(),
                reward,
                terminated,
                truncated,
                {
                    "reason": "no_escape_path"
                }
            )


        # =================================
        # REWARD SHAPING
        # =================================
        #
        # Base reward for surviving.
        # =================================

        reward = 1.0


        # ---------------------------------
        # Move closer to exit
        # ---------------------------------

        if (
            current_distance is not None
            and new_distance < current_distance
        ):

            reward += 5.0


        # ---------------------------------
        # Move farther from exit
        # ---------------------------------

        elif (
            current_distance is not None
            and new_distance > current_distance
        ):

            reward -= 3.0


        # ---------------------------------
        # Same distance
        # ---------------------------------

        else:

            reward += 0.5


        # =================================
        # EXIT IS GETTING CLOSER
        # =================================

        if new_distance == 1:

            reward += 3.0


        # =================================
        # MAX EPISODE LENGTH
        # =================================

        if (
            self.step_count
            >= MAX_EPISODE_STEPS
        ):

            reward -= 20.0

            truncated = True


        # =================================
        # INFO
        # =================================

        info = {
            "level": self.level_number,
            "thief": self.thief_position,
            "distance_to_exit": new_distance,
            "steps": self.step_count
        }


        return (
            self.get_state(),
            reward,
            terminated,
            truncated,
            info
        )


    # =====================================
    # RENDER
    # =====================================

    def render(self):

        print(
            "-------------------------------------"
        )

        print(
            "Level:",
            self.level_number
        )

        print(
            "Thief:",
            self.thief_position
        )

        print(
            "Police:",
            self.police_positions
        )

        print(
            "Exits:",
            self.exits
        )

        print(
            "Valid moves:",
            self.get_valid_moves()
        )

        print(
            "Action mask:",
            self.action_masks()
        )

        print(
            "Distance to exit:",
            self.shortest_distance_to_exit(
                self.thief_position
            )
        )

        print(
            "Step:",
            self.step_count,
            "/",
            MAX_EPISODE_STEPS
        )

        print(
            "-------------------------------------"
        )

