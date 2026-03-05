import { POST } from '@/app/api/bets/[betId]/outcome/route';
import connectDB from '@/lib/db';
import Bet from '@/models/Bet';
import Group from '@/models/Group';
import Vote from '@/models/Vote';
import { verifyToken } from '@/lib/auth';
import { calculateBetPayout } from '@/lib/payouts';

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/models/Bet', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

jest.mock('@/models/Group', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

jest.mock('@/models/Vote', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  verifyToken: jest.fn(),
}));

jest.mock('@/lib/payouts', () => ({
  __esModule: true,
  calculateBetPayout: jest.fn(),
}));

const mockedConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockedBetFindById = Bet.findById as jest.Mock;
const mockedGroupFindById = Group.findById as jest.Mock;
const mockedVoteFind = Vote.find as jest.Mock;
const mockedVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;
const mockedCalculateBetPayout = calculateBetPayout as jest.MockedFunction<typeof calculateBetPayout>;

const params = Promise.resolve({ betId: 'bet-1' });

describe('POST /api/bets/[betId]/outcome', () => {
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    mockedConnectDB.mockImplementation(async () => ({} as any));
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('returns 400 when no winning options are provided', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });

    const req = new Request('http://localhost/api/bets/bet-1/outcome', {
      method: 'POST',
      headers: { authorization: 'Bearer valid' },
      body: JSON.stringify({}),
    });

    const response = await POST(req as any, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Winning option ID(s) required');
  });

  it('returns 403 when user is not group owner/moderator', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });
    mockedBetFindById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: 'bet-1',
        status: 'open',
        votingType: 'single',
        options: [{ _id: { toString: () => 'opt-1' }, text: 'A' }],
        save: jest.fn(),
      }),
    });
    mockedGroupFindById.mockResolvedValue({
      ownerId: { toString: () => 'owner-2' },
      moderators: [{ toString: () => 'mod-2' }],
    });

    const req = new Request('http://localhost/api/bets/bet-1/outcome', {
      method: 'POST',
      headers: { authorization: 'Bearer valid' },
      body: JSON.stringify({ winningOptionId: 'opt-1' }),
    });

    const response = await POST(req as any, { params });
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Only moderators can declare outcomes');
  });

  it('settles single-vote bet and returns payout result', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });

    const saveMock = jest.fn().mockResolvedValue(undefined);
    const bet = {
      _id: 'bet-1',
      status: 'open',
      votingType: 'single',
      options: [
        { _id: { toString: () => 'opt-1' }, text: 'A' },
        { _id: { toString: () => 'opt-2' }, text: 'B' },
      ],
      save: saveMock,
    };

    mockedBetFindById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(bet),
    });
    mockedGroupFindById.mockResolvedValue({
      ownerId: { toString: () => 'u1' },
      moderators: [],
    });
    mockedVoteFind.mockResolvedValue([{ userId: 'u2', stake: 10 }]);
    mockedCalculateBetPayout.mockReturnValue({
      totalPool: 10,
      winningOptionId: 'opt-1',
      winningOptionText: 'A',
      winners: [],
      losers: [],
      isRefund: false,
    });

    const req = new Request('http://localhost/api/bets/bet-1/outcome', {
      method: 'POST',
      headers: { authorization: 'Bearer valid' },
      body: JSON.stringify({ winningOptionId: 'opt-1' }),
    });

    const response = await POST(req as any, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(bet.status).toBe('settled');
    expect((bet as any).winningOption).toBe(0);
    expect(mockedCalculateBetPayout).toHaveBeenCalledWith(bet, [{ userId: 'u2', stake: 10 }]);
    expect(data.message).toBe('Bet settled successfully');
    expect(data.winningOptions).toEqual(['A']);
  });
});
