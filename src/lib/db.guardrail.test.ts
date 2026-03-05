import { assertSafeMongoUriForTests, isLikelyProductionMongoUri } from '@/lib/db';

describe('MongoDB URI guardrail', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv, NODE_ENV: 'test' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('detects likely production remote URIs', () => {
    expect(
      isLikelyProductionMongoUri('mongodb+srv://user:pass@cluster0.mongodb.net/friendssplit_prod?retryWrites=true&w=majority')
    ).toBe(true);
  });

  it('does not flag local URIs', () => {
    expect(isLikelyProductionMongoUri('mongodb://127.0.0.1:27017/friendssplit_test')).toBe(false);
  });

  it('does not flag remote URIs with explicit test database names', () => {
    expect(
      isLikelyProductionMongoUri('mongodb+srv://user:pass@cluster0.mongodb.net/friendssplit_test?retryWrites=true&w=majority')
    ).toBe(false);
  });

  it('throws in test mode when URI looks production-like', () => {
    expect(() =>
      assertSafeMongoUriForTests(
        'mongodb+srv://user:pass@cluster0.mongodb.net/friendssplit_prod?retryWrites=true&w=majority'
      )
    ).toThrow(/Unsafe test DB configuration/i);
  });

  it('allows override via ALLOW_PROD_DB_IN_TESTS', () => {
    process.env.ALLOW_PROD_DB_IN_TESTS = 'true';

    expect(() =>
      assertSafeMongoUriForTests(
        'mongodb+srv://user:pass@cluster0.mongodb.net/friendssplit_prod?retryWrites=true&w=majority'
      )
    ).not.toThrow();
  });
});
