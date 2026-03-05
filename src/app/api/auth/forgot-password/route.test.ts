import { POST } from '@/app/api/auth/forgot-password/route';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { generatePasswordResetEmail, sendEmail } from '@/lib/email';
import crypto from 'crypto';

jest.mock('@/lib/db', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('@/models/User', () => ({
  __esModule: true,
  default: {
    findOne: jest.fn(),
    findByIdAndUpdate: jest.fn(),
  },
}));

jest.mock('@/lib/email', () => ({
  __esModule: true,
  sendEmail: jest.fn(),
  generatePasswordResetEmail: jest.fn(),
}));

const mockedConnectDB = connectDB as jest.MockedFunction<typeof connectDB>;
const mockedFindOne = User.findOne as jest.Mock;
const mockedFindByIdAndUpdate = User.findByIdAndUpdate as jest.Mock;
const mockedSendEmail = sendEmail as jest.MockedFunction<typeof sendEmail>;
const mockedGeneratePasswordResetEmail =
  generatePasswordResetEmail as jest.MockedFunction<typeof generatePasswordResetEmail>;

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedConnectDB.mockResolvedValue({} as any);
    mockedSendEmail.mockResolvedValue(true);

    jest
      .spyOn(crypto, 'randomBytes')
      .mockImplementation(((size: number) => Buffer.alloc(size, 7)) as any);
    mockedGeneratePasswordResetEmail.mockImplementation((email, resetToken) => ({
      to: email,
      subject: 'Reset',
      html: `<a>${resetToken}</a>`,
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('returns 400 when email is missing', async () => {
    const req = new Request('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({}),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Email is required');
  });

  it('returns generic success for unknown email and does not update records', async () => {
    mockedFindOne.mockResolvedValue(null);

    const req = new Request('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'missing@example.com' }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain('If an account with that email exists');
    expect(mockedFindByIdAndUpdate).not.toHaveBeenCalled();
    expect(mockedSendEmail).not.toHaveBeenCalled();
  });

  it('updates mock user reset fields and sends reset email for known email', async () => {
    mockedFindOne.mockResolvedValue({ _id: 'user-1', email: 'alice@example.com' });

    const req = new Request('http://localhost/api/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email: 'alice@example.com' }),
    });

    const response = await POST(req as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.message).toContain('If an account with that email exists');

    expect(mockedFindByIdAndUpdate).toHaveBeenCalledTimes(1);
    const [updatedId, updatePayload] = mockedFindByIdAndUpdate.mock.calls[0];

    expect(updatedId).toBe('user-1');
    expect(updatePayload.resetToken).toHaveLength(64);
    expect(updatePayload.resetTokenExpiry).toBeInstanceOf(Date);

    expect(mockedGeneratePasswordResetEmail).toHaveBeenCalledWith(
      'alice@example.com',
      updatePayload.resetToken
    );
    expect(mockedSendEmail).toHaveBeenCalledTimes(1);
  });
});
