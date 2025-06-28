import { User, Group, Bet, Vote, BetResult } from './types';
import { hashPassword, comparePassword } from './auth';
import { generateToken } from './auth';
import { sendEmail, generatePasswordResetEmail, generateWelcomeEmail } from './email';
import crypto from 'crypto';

// In-memory data store
class DataStore {
  private users: Map<string, User> = new Map();
  private groups: Map<string, Group> = new Map();
  private bets: Map<string, Bet> = new Map();
  private votes: Map<string, Vote> = new Map();
  private betResults: Map<string, BetResult> = new Map();

  // User methods
  async createUser(user: Omit<User, 'id' | 'createdAt'>): Promise<User> {
    const newUser: User = {
      ...user,
      id: this.generateId(),
      createdAt: new Date(),
    };
    this.users.set(newUser.id, newUser);
    
    // Send welcome email
    try {
      await sendEmail(generateWelcomeEmail(newUser.email, newUser.username));
    } catch (error) {
      console.error('Failed to send welcome email:', error);
    }
    
    return newUser;
  }

  getUser(id: string): User | undefined {
    return this.users.get(id);
  }

  getUserByEmail(email: string): User | undefined {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async authenticateUser(email: string, password: string): Promise<{ user: User; token: string } | null> {
    const user = this.getUserByEmail(email);
    if (!user) return null;

    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) return null;

    const token = generateToken({
      userId: user.id,
      username: user.username,
      email: user.email,
    });

    return { user, token };
  }

  async requestPasswordReset(email: string): Promise<boolean> {
    const user = this.getUserByEmail(email);
    if (!user) return false;

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Update user with reset token
    user.resetToken = resetToken;
    user.resetTokenExpiry = resetTokenExpiry;
    this.users.set(user.id, user);

    // Send reset email
    try {
      await sendEmail(generatePasswordResetEmail(email, resetToken));
      return true;
    } catch (error) {
      console.error('Failed to send reset email:', error);
      return false;
    }
  }

  async resetPassword(token: string, newPassword: string): Promise<boolean> {
    const user = Array.from(this.users.values()).find(u => u.resetToken === token);
    if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return false;
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);
    
    // Update user
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    this.users.set(user.id, user);

    return true;
  }

  // Group methods
  createGroup(group: Omit<Group, 'id' | 'createdAt'>): Group {
    const newGroup: Group = {
      ...group,
      id: this.generateId(),
      createdAt: new Date(),
    };
    this.groups.set(newGroup.id, newGroup);
    return newGroup;
  }

  getGroup(id: string): Group | undefined {
    return this.groups.get(id);
  }

  getGroupByCode(code: string): Group | undefined {
    return Array.from(this.groups.values()).find(group => group.code === code);
  }

  getUserGroups(userId: string): Group[] {
    return Array.from(this.groups.values()).filter(group => 
      group.members.includes(userId) || group.ownerId === userId || group.moderators.includes(userId)
    );
  }

  addMemberToGroup(groupId: string, userId: string): boolean {
    const group = this.groups.get(groupId);
    if (!group || group.members.includes(userId)) return false;
    
    group.members.push(userId);
    this.groups.set(groupId, group);
    return true;
  }

  removeMemberFromGroup(groupId: string, userId: string): boolean {
    const group = this.groups.get(groupId);
    if (!group || !group.members.includes(userId)) return false;
    
    group.members = group.members.filter(id => id !== userId);
    group.moderators = group.moderators.filter(id => id !== userId);
    this.groups.set(groupId, group);
    return true;
  }

  // Bet methods
  createBet(bet: Omit<Bet, 'id' | 'createdAt'>): Bet {
    const newBet: Bet = {
      ...bet,
      id: this.generateId(),
      createdAt: new Date(),
    };
    
    // Update option IDs to use the bet ID
    newBet.options = newBet.options.map((option, index) => ({
      ...option,
      id: `${newBet.id}-option-${index + 1}`,
    }));
    
    this.bets.set(newBet.id, newBet);
    return newBet;
  }

  getBet(id: string): Bet | undefined {
    return this.bets.get(id);
  }

  getGroupBets(groupId: string): Bet[] {
    return Array.from(this.bets.values()).filter(bet => bet.groupId === groupId);
  }

  getUserBets(userId: string): Bet[] {
    return Array.from(this.bets.values()).filter(bet => 
      bet.createdBy === userId || 
      bet.options.some(option => 
        option.votes.some(vote => vote.userId === userId)
      )
    );
  }

  // Vote methods
  placeVote(vote: Omit<Vote, 'id' | 'createdAt'>): Vote {
    const newVote: Vote = {
      ...vote,
      id: this.generateId(),
      createdAt: new Date(),
    };
    this.votes.set(newVote.id, newVote);
    
    // Add vote to bet option
    const bet = Array.from(this.bets.values()).find(b => 
      b.options.some(opt => opt.id === vote.optionId)
    );
    if (bet) {
      const option = bet.options.find(opt => opt.id === vote.optionId);
      if (option) {
        option.votes.push(newVote);
        this.bets.set(bet.id, bet);
      }
    }
    
    return newVote;
  }

  getUserVotes(userId: string): Vote[] {
    return Array.from(this.votes.values()).filter(vote => vote.userId === userId);
  }

  // Bet settlement methods
  closeBet(betId: string): boolean {
    const bet = this.bets.get(betId);
    if (!bet || bet.status !== 'open') return false;
    
    bet.status = 'closed';
    this.bets.set(betId, bet);
    return true;
  }

  settleBet(betId: string, winningOptionId: string): BetResult | null {
    const bet = this.bets.get(betId);
    if (!bet || bet.status !== 'closed') return null;

    const winningOption = bet.options.find(opt => opt.id === winningOptionId);
    if (!winningOption) return null;

    // Calculate total pool from losers
    const losingVotes = bet.options
      .filter(opt => opt.id !== winningOptionId)
      .flatMap(opt => opt.votes);
    
    const totalPool = losingVotes.reduce((sum, vote) => sum + vote.stake, 0);
    
    // Calculate payouts for winners
    const winningVotes = winningOption.votes;
    const totalWinningStakes = winningVotes.reduce((sum, vote) => sum + vote.stake, 0);
    
    const winners = winningVotes.map(vote => ({
      userId: vote.userId,
      stake: vote.stake,
      payout: totalWinningStakes > 0 ? (vote.stake / totalWinningStakes) * totalPool : 0,
    }));

    const losers = losingVotes.map(vote => ({
      userId: vote.userId,
      stake: vote.stake,
    }));

    const result: BetResult = {
      betId,
      winningOptionId,
      totalPool,
      winners,
      losers,
    };

    bet.status = 'settled';
    bet.outcome = winningOptionId;
    this.bets.set(betId, bet);
    this.betResults.set(betId, result);

    return result;
  }

  getBetResult(betId: string): BetResult | undefined {
    return this.betResults.get(betId);
  }

  // Utility methods
  private generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  // Check if bets are past deadline and close them
  checkAndCloseExpiredBets(): void {
    const now = new Date();
    Array.from(this.bets.values()).forEach(bet => {
      if (bet.status === 'open' && bet.deadline < now) {
        this.closeBet(bet.id);
      }
    });
  }

  // Generate a unique group code
  generateGroupCode(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code: string;
    do {
      code = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    } while (this.getGroupByCode(code));
    return code;
  }
}

// Export singleton instance
export const dataStore = new DataStore();

// Initialize with some sample data
export async function initializeSampleData() {
  // Create sample users with hashed passwords
  const user1 = await dataStore.createUser({
    username: 'john_doe',
    email: 'john@example.com',
    password: await hashPassword('password123'),
  });
  
  const user2 = await dataStore.createUser({
    username: 'jane_smith',
    email: 'jane@example.com',
    password: await hashPassword('password123'),
  });

  // Create sample groups
  const group1 = dataStore.createGroup({
    name: 'NBA Finals',
    description: 'Basketball playoff bets with friends.',
    code: dataStore.generateGroupCode(),
    ownerId: user1.id,
    moderators: [user1.id],
    members: [user1.id, user2.id],
    minStake: 1,
    maxStake: 100,
  });

  const group2 = dataStore.createGroup({
    name: 'Office Pool',
    description: 'Weekly office sports pool.',
    code: dataStore.generateGroupCode(),
    ownerId: user2.id,
    moderators: [user2.id],
    members: [user1.id, user2.id],
    minStake: 5,
    maxStake: 50,
  });

  // Create sample bets
  const bet1 = dataStore.createBet({
    groupId: group1.id,
    title: 'Who will win the NBA Finals?',
    description: 'Predict the winner of the 2024 NBA Finals',
    options: [
      { id: 'temp-1', text: 'Lakers', votes: [] },
      { id: 'temp-2', text: 'Celtics', votes: [] },
      { id: 'temp-3', text: 'Warriors', votes: [] },
    ],
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
    status: 'open',
    minStake: 1,
    maxStake: 50,
    createdBy: user1.id,
  });

  const bet2 = dataStore.createBet({
    groupId: group2.id,
    title: 'Will it rain tomorrow?',
    description: 'Simple weather prediction',
    options: [
      { id: 'temp-4', text: 'Yes', votes: [] },
      { id: 'temp-5', text: 'No', votes: [] },
    ],
    deadline: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day from now
    status: 'open',
    minStake: 5,
    maxStake: 25,
    createdBy: user2.id,
  });
}

// Initialize sample data when the store is first imported
initializeSampleData(); 