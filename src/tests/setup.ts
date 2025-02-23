import '@testing-library/jest-dom';
import { PrismaClient } from '@prisma/client';
import { mockDeep, mockReset, DeepMockProxy } from 'jest-mock-extended';

jest.mock('@/lib/prisma', () => ({
  __esModule: true,
  prisma: mockDeep<PrismaClient>(),
}));

beforeEach(() => {
  mockReset(prismaMock);
});

export const prismaMock = mockDeep<PrismaClient>();

// グローバル型定義の拡張
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeInTheDocument(): R;
    }
  }
}

// テスト環境の設定
Object.defineProperties(process.env, {
  NODE_ENV: { value: 'test' },
  NEXTAUTH_URL: { value: 'http://localhost:3000' },
  NEXTAUTH_SECRET: { value: 'test-secret' },
  DATABASE_URL: { value: 'postgresql://postgres:postgres@localhost:5432/school_hub_browser_test' }
}); 