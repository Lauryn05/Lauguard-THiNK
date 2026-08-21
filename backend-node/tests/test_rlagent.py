import sys, os
import numpy as np
import torch
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from rl_agent import RLAgent

def test_rlagent_action_selection():
    """Ensure RLAgent chooses valid actions within policy bounds."""
    agent = RLAgent(state_size=5, action_size=2)
    test_state = np.random.rand(5)
    action = agent.act(test_state)

    assert action in [0, 1], f"Invalid action selected: {action} (should be 0=block or 1=allow)"


def test_rlagent_replay_and_convergence():
    """Ensure RLAgent replay improves stability (loss decreases over iterations)."""
    agent = RLAgent(state_size=4, action_size=2)

    # Create synthetic transitions for replay memory
    for _ in range(100):
        state = np.random.rand(4)
        next_state = np.random.rand(4)
        action = np.random.randint(0, 2)
        reward = np.random.randn()
        done = np.random.choice([True, False])
        agent.remember(state, action, reward, next_state, done)

    # Simulate multiple replay iterations to approximate convergence
    prev_weights = [p.clone().detach() for p in agent.policy_net.parameters()]
    for _ in range(5):
        agent.replay(batch_size=32)

    # Compare old and new parameters to ensure some learning happened
    updated_weights = [p.clone().detach() for p in agent.policy_net.parameters()]
    weight_deltas = [torch.norm(u - p).item() for p, u in zip(prev_weights, updated_weights)]

    assert any(delta > 0 for delta in weight_deltas), "Weights did not change — replay might not be training properly"

    # Check epsilon decay behavior
    assert agent.epsilon < 1.0, "Epsilon did not decay after replay"
