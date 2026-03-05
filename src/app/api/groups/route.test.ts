import { GET, POST } from '@/app/api/groups/route';
import connectDB from '@/lib/db';
import { verifyToken } from '@/lib/auth';
import Group from '@/models/Group';

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/lib/auth', () => ({
  __esModule: true,
  verifyToken: jest.fn(),
}));

jest.mock('@/models/Group', () => {
  const GroupMock: any = jest.fn();
  GroupMock.find = jest.fn();
  GroupMock.findOne = jest.fn();
  return {
    __esModule: true,
    default: GroupMock,
  };
});

const mockedConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockedVerifyToken = verifyToken as jest.MockedFunction<typeof verifyToken>;
const mockedGroup = Group as any;

describe('GET /api/groups', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedConnectDB.mockImplementation(async () => ({} as any));
  });

  it('returns 401 when authorization header is missing', async () => {
    const req = new Request('http://localhost/api/groups');

    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Authentication required');
  });

  it('returns 401 when token is invalid', async () => {
    mockedVerifyToken.mockReturnValue(null);

    const req = new Request('http://localhost/api/groups', {
      headers: { authorization: 'Bearer bad-token' },
    });

    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe('Invalid token');
  });

  it('returns transformed groups for valid user membership', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'user-1', username: 'alice', email: 'alice@example.com' });

    const mockGroups = [
      {
        _id: { toString: () => 'group-1' },
        toObject: () => ({ name: 'Friends Group', code: 'ABC123' }),
      },
      {
        _id: { toString: () => 'group-2' },
        toObject: () => ({ name: 'Office Group', code: 'XYZ999' }),
      },
    ];

    mockedGroup.find.mockReturnValue({
      populate: jest.fn().mockResolvedValue(mockGroups),
    });

    const req = new Request('http://localhost/api/groups', {
      headers: { authorization: 'Bearer valid-token' },
    });

    const response = await GET(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockedGroup.find).toHaveBeenCalledWith({ members: 'user-1' });
    expect(data.groups).toHaveLength(2);
    expect(data.groups[0]).toMatchObject({
      id: 'group-1',
      name: 'Friends Group',
      code: 'ABC123',
    });
  });
});

describe('POST /api/groups', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedConnectDB.mockImplementation(async () => ({} as any));
  });

  it('returns 400 when name or description is missing', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'user-1', username: 'alice', email: 'alice@example.com' });

    const req = new Request('http://localhost/api/groups', {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: JSON.stringify({ name: 'My Group' }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Name and description are required');
  });

  it('creates a group and returns transformed payload', async () => {
    mockedVerifyToken.mockReturnValue({ userId: 'user-1', username: 'alice', email: 'alice@example.com' });

    mockedGroup.findOne
      .mockResolvedValueOnce({ _id: 'existing' })
      .mockResolvedValueOnce(null);

    const saveMock = jest.fn().mockResolvedValue(undefined);
    const populateMock = jest.fn().mockResolvedValue(undefined);

    mockedGroup.mockImplementation((payload: any) => ({
      ...payload,
      _id: { toString: () => 'group-100' },
      save: saveMock,
      populate: populateMock,
      toObject: () => ({
        name: payload.name,
        description: payload.description,
        code: payload.code,
        members: payload.members,
      }),
    }));

    const randomSpy = jest.spyOn(Math, 'random').mockReturnValue(0);

    const req = new Request('http://localhost/api/groups', {
      method: 'POST',
      headers: { authorization: 'Bearer valid-token' },
      body: JSON.stringify({
        name: 'Champions',
        description: 'Weekend betting',
        minStake: 5,
        maxStake: 250,
      }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(mockedGroup.findOne).toHaveBeenCalledTimes(2);
    expect(saveMock).toHaveBeenCalledTimes(1);
    expect(populateMock).toHaveBeenCalledWith('members', 'username email');
    expect(mockedGroup).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Champions',
        description: 'Weekend betting',
        ownerId: 'user-1',
        moderators: ['user-1'],
        members: ['user-1'],
        minStake: 5,
        maxStake: 250,
      })
    );
    expect(data.group.id).toBe('group-100');
    expect(data.group.name).toBe('Champions');

    randomSpy.mockRestore();
  });
});
