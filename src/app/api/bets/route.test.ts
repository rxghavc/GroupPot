import { GET, POST } from '@/app/api/bets/route';
import connectDB from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import Bet from '@/models/Bet';
import Group from '@/models/Group';

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  verifyToken: jest.fn(),
}));

jest.mock('@/models/Bet', () => {
  const BetMock: any = jest.fn();
  BetMock.find = jest.fn();
  return {
    __esModule: true,
    default: BetMock,
  };
});

jest.mock('@/models/Group', () => {
  const GroupMock: any = {
    distinct: jest.fn(),
    findById: jest.fn(),
  };
  return {
    __esModule: true,
    default: GroupMock,
  };
});

const mockedConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockedVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;
const mockedBet = Bet as any;
const mockedGroup = Group as any;

describe('GET /api/bets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedConnectDB.mockImplementation(async () => ({} as any));
  });

  it('returns 401 when auth header is missing', async () => {
    const req = new Request('http://localhost/api/bets');

    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required');
  });

  it('returns 401 when token is invalid', async () => {
    mockedVerifyToken.mockReturnValue(null);

    const req = new Request('http://localhost/api/bets', {
      headers: { authorization: 'Bearer bad-token' },
    });

    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid token');
  });

  it('returns transformed bets with nested option/vote mapping', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'user-1', username: 'alice', email: 'alice@example.com' });
    mockedGroup.distinct.mockResolvedValue(['group-1', 'group-2']);

    const mockBets = [
      {
        _id: { toString: () => 'bet-1' },
        votingType: undefined,
        options: [
          {
            _id: { toString: () => 'opt-1' },
            votes: [
              {
                userId: { toString: () => 'user-1' },
                username: 'alice',
                stake: 25,
                timestamp: '2026-01-01T00:00:00.000Z',
              },
            ],
            toObject: () => ({ text: 'Option A' }),
          },
        ],
        toObject: () => ({ title: 'Match Winner', status: 'open' }),
      },
    ];

    mockedBet.find.mockReturnValue({
      populate: jest.fn().mockReturnValue({
        populate: jest.fn().mockResolvedValue(mockBets),
      }),
    });

    const req = new Request('http://localhost/api/bets', {
      headers: { authorization: 'Bearer valid-token' },
    });

    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockedGroup.distinct).toHaveBeenCalledWith('_id', { members: 'user-1' });
    expect(mockedBet.find).toHaveBeenCalledWith({
      groupId: { $in: ['group-1', 'group-2'] },
    });
    expect(data.bets[0].id).toBe('bet-1');
    expect(data.bets[0].votingType).toBe('single');
    expect(data.bets[0].options[0].id).toBe('opt-1');
    expect(data.bets[0].options[0].votes[0]).toEqual({
      userId: 'user-1',
      username: 'alice',
      stake: 25,
      timestamp: '2026-01-01T00:00:00.000Z',
    });
  });
});

describe('POST /api/bets', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedConnectDB.mockImplementation(async () => ({} as any));
  });

  it('returns 400 when required fields are missing', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'user-1', username: 'alice', email: 'alice@example.com' });

    const req = new Request('http://localhost/api/bets', {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: JSON.stringify({ title: 'No group id' }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Group ID, title, options, and deadline are required');
  });

  it('returns 403 when user is not owner/moderator', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'user-1', username: 'alice', email: 'alice@example.com' });
    mockedGroup.findById.mockResolvedValue({
      ownerId: { toString: () => 'owner-2' },
      moderators: [{ toString: () => 'mod-2' }],
      minStake: 2,
      maxStake: 100,
    });

    const req = new Request('http://localhost/api/bets', {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: JSON.stringify({
        groupId: 'group-1',
        title: 'Weekend Winner',
        options: ['A', 'B'],
        deadline: '2026-04-01T00:00:00.000Z',
      }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(403);
    expect(data.error).toBe('Only moderators can create bets');
  });

  it('creates a bet with trimmed description and transformed option ids', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'user-1', username: 'alice', email: 'alice@example.com' });

    mockedGroup.findById.mockResolvedValue({
      ownerId: { toString: () => 'owner-2' },
      moderators: [{ toString: () => 'user-1' }],
      minStake: 3,
      maxStake: 150,
    });

    const saveMock = jest.fn().mockResolvedValue(undefined);

    mockedBet.mockImplementation((payload: any) => ({
      ...payload,
      _id: { toString: () => 'bet-100' },
      options: payload.options.map((o: any, index: number) => ({
        ...o,
        _id: { toString: () => `opt-${index + 1}` },
        toObject: () => ({ text: o.text, votes: o.votes }),
      })),
      save: saveMock,
      toObject: () => ({
        title: payload.title,
        description: payload.description,
        minStake: payload.minStake,
        maxStake: payload.maxStake,
      }),
    }));

    const req = new Request('http://localhost/api/bets', {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: JSON.stringify({
        groupId: 'group-1',
        title: 'Weekend Winner',
        description: '  Main event bet  ',
        options: ['Team A', 'Team B', 'Draw'],
        deadline: '2026-04-01T00:00:00.000Z',
      }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(mockedBet).toHaveBeenCalledWith(
      expect.objectContaining({
        groupId: 'group-1',
        title: 'Weekend Winner',
        description: 'Main event bet',
        minStake: 3,
        maxStake: 150,
        createdBy: 'user-1',
      })
    );
    expect(data.bet.id).toBe('bet-100');
    expect(data.bet.options).toHaveLength(3);
    expect(data.bet.options[0].id).toBe('opt-1');
  });
});
