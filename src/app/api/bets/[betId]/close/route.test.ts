import { POST } from '@/app/api/bets/[betId]/close/route';
import connectDB from '@/lib/db';
import Bet from '@/models/Bet';
import Group from '@/models/Group';
import { verifyToken } from '@/lib/auth';

jest.mock('@/lib/db', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@/models/Bet', () => ({ __esModule: true, default: { findById: jest.fn() } }));
jest.mock('@/models/Group', () => ({ __esModule: true, default: { findById: jest.fn() } }));
jest.mock('@/lib/auth', () => ({ __esModule: true, verifyToken: jest.fn() }));

const mockedConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockedBetFindById = Bet.findById as jest.Mock;
const mockedGroupFindById = Group.findById as jest.Mock;
const mockedVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;

const params = Promise.resolve({ betId: 'bet-1' });

describe('POST /api/bets/[betId]/close', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedConnectDB.mockImplementation(async () => ({} as any));
  });

  it('returns 404 when bet is missing', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });
    mockedBetFindById.mockResolvedValue(null);

    const req = new Request('http://localhost/api/bets/bet-1/close', {
      method: 'POST',
      headers: { authorization: 'Bearer valid' },
    });

    const response = await POST(req as any, { params });
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.error).toBe('Bet not found');
  });

  it('returns 400 when bet is not open', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });
    mockedBetFindById.mockResolvedValue({ status: 'closed' });

    const req = new Request('http://localhost/api/bets/bet-1/close', {
      method: 'POST',
      headers: { authorization: 'Bearer valid' },
    });

    const response = await POST(req as any, { params });
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Bet is not open');
  });

  it('closes bet when user is owner/moderator', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });

    const saveMock = jest.fn().mockResolvedValue(undefined);
    const bet = { status: 'open', groupId: 'group-1', save: saveMock };
    mockedBetFindById.mockResolvedValue(bet);
    mockedGroupFindById.mockResolvedValue({
      ownerId: { toString: () => 'u1' },
      moderators: [{ toString: () => 'u2' }],
    });

    const req = new Request('http://localhost/api/bets/bet-1/close', {
      method: 'POST',
      headers: { authorization: 'Bearer valid' },
    });

    const response = await POST(req as any, { params });
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(bet.status).toBe('closed');
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(data.message).toBe('Bet closed successfully');
  });
});
