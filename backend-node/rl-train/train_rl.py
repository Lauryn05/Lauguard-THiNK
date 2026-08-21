import numpy as np
import torch
from rl_agent import RLAgent

data = np.load("training_data.npy", allow_pickle=True).item()
states = np.array(data["states"])
labels = np.array(data["labels"])

state_size = states.shape[1]
agent = RLAgent(state_size=state_size, action_size=2)

episodes = 50           # number of training epochs
batch_size = 32
save_path = "models/rl_model.pth"
for episode in range(episodes):
    total_reward = 0

    for i in range(len(states) - 1):
        state = states[i]
        next_state = states[i + 1]
        label = labels[i]

        action = agent.act(state)

        # Reward system
        if action == label:
            reward = 1.0     # correct decision
        elif label == 1 and action == 0:
            reward = -0.5    # false block
        else:
            reward = -2.0    # false allow (malicious bypass)
        
        done = (i == len(states) - 2)
        agent.remember(state, action, reward, next_state, done)
        agent.replay(batch_size)

        total_reward += reward

    agent.update_target()
    print(f"Episode {episode+1}/{episodes} — Total Reward: {total_reward:.2f}, Epsilon: {agent.epsilon:.3f}")
torch.save(agent.policy_net.state_dict(), save_path)
print(f"\nTraining complete. Model saved to: {save_path}")
