import torch
import torch.nn as nn
import torch.optim as optim
import random
import numpy as np
from collections import deque

# 1. Define the Q-network
class DQN(nn.Module):
    def __init__(self, state_size, action_size):
        super(DQN, self).__init__()
        self.fc = nn.Sequential(
            nn.Linear(state_size, 128), nn.ReLU(),
            nn.Linear(128, 64), nn.ReLU(),
            nn.Linear(64, action_size)   # 2 actions: block / allow
        )
    def forward(self, x):
        return self.fc(x)


# 2. RL Agent wrapper
class RLAgent:
    def __init__(self, state_size, action_size=2, lr=1e-3, gamma=0.95, epsilon=1.0, epsilon_min=0.05, epsilon_decay=0.995):
        self.state_size = state_size
        self.action_size = action_size
        self.gamma = gamma                # discount factor
        self.epsilon = epsilon            # exploration rate
        self.epsilon_min = epsilon_min
        self.epsilon_decay = epsilon_decay
        self.memory = deque(maxlen=2000)  # replay buffer

        # Policy & target networks
        self.policy_net = DQN(state_size, action_size)
        self.target_net = DQN(state_size, action_size)
        self.target_net.load_state_dict(self.policy_net.state_dict())
        self.optimizer = optim.Adam(self.policy_net.parameters(), lr=lr)
        self.loss_fn = nn.MSELoss()

    # Select an action (block=0, allow=1)
    def act(self, state):
        if np.random.rand() <= self.epsilon:
            return random.randrange(self.action_size)
        state = torch.FloatTensor(state).unsqueeze(0)
        q_values = self.policy_net(state)
        return torch.argmax(q_values).item()

    # Store experience in replay buffer
    def remember(self, state, action, reward, next_state, done):
        self.memory.append((state, action, reward, next_state, done))

    # Train the Q-network
    def replay(self, batch_size=32):
        if len(self.memory) < batch_size:
            return
        minibatch = random.sample(self.memory, batch_size)

        for state, action, reward, next_state, done in minibatch:
            state = torch.FloatTensor(state).unsqueeze(0)
            next_state = torch.FloatTensor(next_state).unsqueeze(0)

            target = reward
            if not done:
                target += self.gamma * torch.max(self.target_net(next_state)).item()

            target_f = self.policy_net(state)
            target_val = target_f.clone().detach()
            target_val[0][action] = target

            loss = self.loss_fn(target_f, target_val)
            self.optimizer.zero_grad()
            loss.backward()
            self.optimizer.step()

        # Decay exploration
        if self.epsilon > self.epsilon_min:
            self.epsilon *= self.epsilon_decay

    # Update target network
    def update_target(self):
        self.target_net.load_state_dict(self.policy_net.state_dict())