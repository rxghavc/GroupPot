import { GET } from '@/app/api/dashboard/stats/route';
import connectDB from '@/lib/db';
import Group from '@/models/Group';
import Bet from '@/models/Bet';
import Vote from '@/models/Vote';
import { verifyToken } from '@/lib/auth';

jest.mock('@/lib/db', () => ({ __esModule: true, default: jest.fn() }));
jest.mock('@/models/Group', () => ({ __esModule: true, default: { find: jest.fn() } }));
jest.mock('@/models/Bet', () => ({ __esModule: true, default: { find: jest.fn() } }));
jest.mock('@/models/Vote', () => ({ __esModule: true, default: { find: jest.fn() } }));
jest.mock('@/lib/auth', () => ({ __esModule: true, verifyToken: jest.fn() }));

const mockedConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockedGroupFind = Group.find as jest.Mock;
const mockedBetFind = Bet.find as jest.Mock;
const mockedVoteFind = Vote.find as jest.Mock;
const mockedVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;

describe('GET /api/dashboard/stats', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedConnectDB.mockImplementation(async () => ({} as any));
  });

  it('returns 401 for invalid token', async () => {
    mockedVerifyToken.mockReturnValue(null);

    const req = new Request('http://localhost/api/dashboard/stats', {
      headers: { authorization: 'Bearer bad' },
    });

    const response = await GET(req as any);
    expect(response.status).toBe(401);
  });

  it('returns computed dashboard stats', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'u1', username: 'alice', email: 'alice@example.com' });

    mockedGroupFind.mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        { _id: 'g1', name: 'Friends', createdAt: '2026-02-01T00:00:00.000Z' },
        { _id: 'g2', name: 'Office', createdAt: '2026-03-01T00:00:00.000Z' },
      ]),
    });

    mockedVoteFind.mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        { userId: { toString: () => 'u1' }, betId: 'b1', optionId: { toString: () => 'o1' }, stake: 10 },
        { userId: { toString: () => 'u1' }, betId: 'b2', optionId: { toString: () => 'o3' }, stake: 25 },
      ]),
    });

    mockedBetFind.mockReturnValue({
      lean: jest.fn().mockResolvedValue([
        {
          _id: 'b1',
          title: 'Match Winner',
          groupId: { toString: () => 'g1' },
          status: 'settled',
          winningOption: 0,
          options: [{ _id: { toString: () => 'o1' } }, { _id: { toString: () => 'o2' } }],
          createdAt: '2026-03-02T00:00:00.000Z',
        },
        {
          _id: 'b2',
          title: 'Next Match',
          groupId: { toString: () => 'g1' },
          status: 'open',
          options: [{ _id: { toString: () => 'o3' } }],
          createdAt: '2026-03-04T00:00:00.000Z',
        },
      ]),
    });

    const req = new Request('http://localhost/api/dashboard/stats', {
      headers: { authorization: 'Bearer valid' },
    });

    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.totalGroups).toBe(2);
    expect(data.totalLifetimeBets).toBe(2);
    expect(data.activeBets).toBe(1);
    expect(data.biggestWager).toBe(25);
    expect(data.mostActiveGroup).toBe('Friends');
    expect(data.mostRecentBet).toBe('Next Match');
  });
});
