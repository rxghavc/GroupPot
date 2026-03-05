import {
  generatePasswordResetEmail,
  generateWelcomeEmail,
} from '@/lib/email';

describe('lib/email', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = {
      ...originalEnv,
      EMAIL_USER: 'noreply@grouppot.app',
      NEXT_PUBLIC_APP_URL: 'https://app.grouppot.dev',
    };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('builds password reset email with tokenized URL in html', () => {
    const email = generatePasswordResetEmail('alice@example.com', 'token-123');

    expect(email.to).toBe('alice@example.com');
    expect(email.subject).toContain('Password Reset');
    expect(email.html).toContain('token-123');
    expect(email.html).toContain('https://app.grouppot.dev/reset-password?token=token-123');
  });

  it('builds welcome email with username and dashboard link', () => {
    const email = generateWelcomeEmail('alice@example.com', 'alice');

    expect(email.to).toBe('alice@example.com');
    expect(email.subject).toContain('Welcome');
    expect(email.html).toContain('Hello alice');
    expect(email.html).toContain('https://app.grouppot.dev/dashboard');
  });
});
