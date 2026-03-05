import {
  comparePassword,
  extractTokenFromHeader,
  generateToken,
  getUserFromToken,
  hashPassword,
  verifyToken,
} from '@/lib/auth';

describe('lib/auth', () => {
  it('generates and verifies JWT tokens', () => {
    const token = generateToken({
      userId: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
    });

    const payload = verifyToken(token);

    expect(payload).not.toBeNull();
    expect(payload?.userId).toBe('user-1');
    expect(payload?.username).toBe('alice');
    expect(payload?.email).toBe('alice@example.com');
  });

  it('returns null for invalid tokens', () => {
    const payload = verifyToken('invalid.token.value');
    expect(payload).toBeNull();
  });

  it('returns null for tampered tokens', () => {
    const token = generateToken({
      userId: 'user-1',
      username: 'alice',
      email: 'alice@example.com',
    });

    const tamperedToken = `${token.slice(0, -1)}x`;
    const payload = verifyToken(tamperedToken);

    expect(payload).toBeNull();
  });

  it('hashes and compares passwords correctly', async () => {
    const password = 'super-secret-password';
    const hashed = await hashPassword(password);

    expect(hashed).not.toBe(password);
    await expect(comparePassword(password, hashed)).resolves.toBe(true);
    await expect(comparePassword('wrong-password', hashed)).resolves.toBe(false);
  });

  it('extracts token from bearer header and resolves user', () => {
    const token = generateToken({
      userId: 'user-2',
      username: 'bob',
      email: 'bob@example.com',
    });

    expect(extractTokenFromHeader(`Bearer ${token}`)).toBe(token);
    expect(extractTokenFromHeader('')).toBeNull();
    expect(extractTokenFromHeader('Token abc')).toBeNull();

    const user = getUserFromToken(`Bearer ${token}`);
    expect(user?.userId).toBe('user-2');
  });

  it('returns null user when header is absent or malformed', () => {
    expect(getUserFromToken(null)).toBeNull();
    expect(getUserFromToken('Basic abc123')).toBeNull();
  });
});
