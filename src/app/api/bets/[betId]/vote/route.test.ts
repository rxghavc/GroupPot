import { DELETE, POST } from '@/app/api/bets/[betId]/vote/route';
import connectDB from '@/lib/db';
import Bet from '@/models/Bet';
import Group from '@/models/Group';
import User from '@/models/User';
import Vote from '@/models/Vote';
import { verifyToken } from '@/lib/auth';

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

jest.mock('@/models/User', () => ({
  __esModule: true,
  default: {
    findById: jest.fn(),
  },
}));

jest.mock('@/models/Vote', () => ({
  __esModule: true,
  default: {
    find: jest.fn(),
    create: jest.fn(),
    insertMany: jest.fn(),
    deleteMany: jest.fn(),
    deleteOne: jest.fn(),
  },
}));

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  verifyToken: jest.fn(),
}));

const mockedConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockedBetFindById = Bet.findById as jest.Mock;
const mockedGroupFindById = Group.findById as jest.Mock;
const mockedUserFindById = User.findById as jest.Mock;
const mockedVote = Vote as any;
const mockedVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;

const params = Promise.resolve({ betId: 'bet-1' });

describe('POST /api/bets/[betId]/vote', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedConnectDB.mockImplementation(async () => ({} as any));
  });

  it('returns 400 when single vote payload is missing fields', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });

    const req = new Request('http://localhost/api/bets/bet-1/vote', {
      method: 'POST',
      headers: { authorization: 'Bearer valid' },
      body: JSON.stringify({ stake: 10 }),
    });

    const response = await POST(req as any, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Option ID and stake are required');
  });

  it('places batch multi-votes and replaces old votes', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });

    const bet = {
      _id: 'bet-1',
      status: 'open',
      deadline: new Date(Date.now() + 60_000),
      votingType: 'multi',
      maxStake: 100,
      groupId: 'group-1',
      options: [
        { _id: { toString: () => 'opt-1' } },
        { _id: { toString: () => 'opt-2' } },
      ],
    };

    mockedBetFindById.mockReturnValue({
      populate: jest.fn().mockResolvedValue(bet),
    });
    mockedGroupFindById.mockResolvedValue({ members: [{ toString: () => 'u1' }] });
    mockedUserFindById.mockResolvedValue({ username: 'alice' });

    const req = new Request('http://localhost/api/bets/bet-1/vote', {
      method: 'POST',
      headers: { authorization: 'Bearer valid' },
      body: JSON.stringify({
        votes: [
          { optionId: 'opt-1', stake: 10 },
          { optionId: 'opt-2', stake: 15 },
        ],
      }),
    });

    const response = await POST(req as any, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Votes placed successfully');
    expect(mockedVote.deleteMany).toHaveBeenCalledWith({ userId: 'u1', betId: 'bet-1' });
    expect(mockedVote.insertMany).toHaveBeenCalledTimes(1);
    const inserted = mockedVote.insertMany.mock.calls[0][0];
    expect(inserted).toHaveLength(2);
    expect(inserted[0]).toMatchObject({ userId: 'u1', username: 'alice', betId: 'bet-1', stake: 10 });
  });

  it('returns 400 for invalid batch option id', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });
    mockedBetFindById.mockReturnValue({
      populate: jest.fn().mockResolvedValue({
        _id: 'bet-1',
        status: 'open',
        deadline: new Date(Date.now() + 60_000),
        votingType: 'multi',
        maxStake: 100,
        groupId: 'group-1',
        options: [{ _id: { toString: () => 'opt-1' } }],
      }),
    });

    const req = new Request('http://localhost/api/bets/bet-1/vote', {
      method: 'POST',
      headers: { authorization: 'Bearer valid' },
      body: JSON.stringify({ votes: [{ optionId: 'opt-999', stake: 10 }] }),
    });

    const response = await POST(req as any, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain('Invalid option selected');
  });
});

describe('DELETE /api/bets/[betId]/vote', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedConnectDB.mockImplementation(async () => ({} as any));
  });

  it('returns 400 when optionId query is missing', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });

    const req = new Request('http://localhost/api/bets/bet-1/vote', {
      method: 'DELETE',
      headers: { authorization: 'Bearer valid' },
    });

    const response = await DELETE(req as any, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Option ID is required');
  });

  it('removes vote successfully for valid multi-vote request', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });
    mockedBetFindById.mockResolvedValue({
      _id: 'bet-1',
      status: 'open',
      votingType: 'multi',
      options: [{ _id: { toString: () => 'opt-1' } }],
    });
    mockedVote.deleteOne.mockResolvedValue({ deletedCount: 1 });

    const req = new Request('http://localhost/api/bets/bet-1/vote?optionId=opt-1', {
      method: 'DELETE',
      headers: { authorization: 'Bearer valid' },
    });

    const response = await DELETE(req as any, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toBe('Vote removed successfully');
    expect(mockedVote.deleteOne).toHaveBeenCalledWith({ userId: 'u1', betId: 'bet-1', optionId: expect.anything() });
  });
});
