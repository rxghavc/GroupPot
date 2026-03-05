import { POST } from '@/app/api/auth/logout/route';

describe('POST /api/auth/logout', () => {
  it('returns success logout message', async () => {
    const req = new Request('http://localhost/api/auth/logout', {
      method: 'POST',
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual({ message: 'Logged out' });
  });
});
