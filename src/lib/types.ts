export interface User {
  id: string;
  username: string;
  email: string;
  password: string; // Hashed password
  resetToken?: string;
  resetTokenExpiry?: Date;
  createdAt: Date;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  code: string; // Join code
  ownerId: string;
  moderators: string[]; // User IDs
  members: string[]; // User IDs
  minStake: number;
  maxStake: number;
  createdAt: Date;
}

export interface BetOption {
  id: string;
  text: string;
  votes: {
    userId: string;
    username: string;
    stake: number;
    timestamp: Date;
  }[];
  votesCount?: number;
  totalStake?: number;
}

export interface Vote {
  id: string;
  userId: string;
  username: string;
  optionId: string;
  stake: number;
  createdAt: Date;
}

export interface Bet {
  id: string;
  groupId: string;
  title: string;
  description: string;
  options: BetOption[];
  deadline: Date;
  status: 'open' | 'closed' | 'settled' | 'pending';
  outcome?: string; // Winning option ID
  minStake: number;
  maxStake: number;
  createdBy: string; // User ID
  createdAt: Date;
}

export interface BetResult {
  betId: string;
  winningOptionId: string;
  winningOptionText: string;
  totalPool: number;
  winners: {
    userId: string;
    username: string;
    stake: number;
    payout: number;
  }[];
  losers: {
    userId: string;
    username: string;
    stake: number;
  }[];
} 