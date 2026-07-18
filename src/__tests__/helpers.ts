/**
 * Shared test helpers and mocks for Jetschool Academy tests.
 *
 * Usage in test files:
 * ```ts
 * import { mockPrisma, resetMocks } from './helpers';
 * ```
 */

// ─── Mock Prisma Client ─────────────────────────────────────────

type DeepMocked<T> = {
  [K in keyof T]: T[K] extends (...args: infer A) => infer R
    ? A extends [unknown?, ...unknown[]]
      ? jest.MockInstance<R, A> & DeepMocked<T[K]>
      : T[K] & DeepMocked<T[K]>
    : T[K] & DeepMocked<T[K]>;
};

/** Create a deeply mocked Prisma client that mirrors the schema's models. */
export function createMockPrisma() {
  return {
    registration: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      upsert: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    program: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
    },
    certificate: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    payment: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      upsert: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    lesson: {
      count: vi.fn(),
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    completion: {
      count: vi.fn(),
      findMany: vi.fn(),
    },
    user: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
    $transaction: vi.fn((fn: any) => fn(mockPrismaTx)),
  };
}

/** Transaction proxy that reuses the same mock methods. */
export const mockPrismaTx = {
  certificate: {
    create: vi.fn(),
    update: vi.fn(),
  },
  registration: {
    update: vi.fn(),
  },
  payment: {
    upsert: vi.fn(),
  },
};

/** Default mock prisma instance exported for modules that import it. */
export const mockPrisma = createMockPrisma();

/** Reset all mock call counts & implementations. Call in beforeEach. */
export function resetMocks() {
  for (const model of Object.values(mockPrisma)) {
    if (typeof model === 'object' && model !== null) {
      for (const method of Object.values(model as Record<string, any>)) {
        if (typeof method === 'function' && 'mockReset' in method) {
          method.mockReset();
        }
      }
    }
  }
  // Reset tx mocks too
  for (const method of Object.values(mockPrismaTx)) {
    if (typeof method === 'function' && 'mockReset' in method) {
      method.mockReset();
    }
  }
}

// ─── Mock fetch for Xendit API ────────────────────────────────────

/** Set up global fetch mock for tests that hit Xendit API. */
export function mockFetchXendit(response: {
  ok?: boolean;
  status?: number;
  body?: any;
}) {
  const { ok = true, status = 200, body = null } = response;
  return vi.mocked(global.fetch).mockResolvedValue({
    ok,
    status,
    json: async () => body,
    text: async () => (body ? JSON.stringify(body) : ''),
  } as Response);
}

/** Create a typical Xendit invoice response. */
export function xenditInvoiceResponse(overrides?: Partial<{
  id: string;
  invoice_url: string;
  status: string;
}>) {
  return {
    id: 'inv-fake-123',
    invoice_url: 'https://checkout.xendit.co/invoice-fake-123',
    status: 'PENDING',
    ...overrides,
  };
}

// ─── Mock sendWa (Evolution API) ───────────────────────────────────

export function mockSendWaResolved(value = true) {
  vi.mocked(global.fetch).mockResolvedValue({
    ok: value,
    status: value ? 200 : 500,
    json: async () => ({}),
    text: async () => '',
  } as Response);
}

// ─── Factory Helpers ───────────────────────────────────────────────

/** Create a fake Program object (partial, as returned by Prisma). */
export function makeProgram(overrides?: Record<string, any>) {
  return {
    id: 'prog-1',
    slug: 'test-program',
    type: 'WEBINAR',
    title: 'Test Program',
    tagline: 'Learn test',
    description: 'A test program',
    emoji: '🎓',
    imageUrl: null,
    mentorName: 'Test Mentor',
    mentorBio: 'Bio',
    materi: [],
    deliverables: [],
    guarantee: null,
    scheduleAt: new Date('2026-07-20T10:00:00.000Z'),
    durationLabel: '2 jam',
    zoomLink: 'https://zoom.us/test',
    waGroupLink: 'https://wa.me/group',
    lmsLink: null,
    price: 0,
    priceOld: null,
    certPrice: 49000,
    certPriceOld: null,
    seatsLeft: null,
    passingScore: 60,
    completionCriteria: 'ALL_LESSONS',
    certKind: 'ACHIEVEMENT',
    maxTestAttempts: 0,
    isActive: true,
    isFeatured: false,
    certBgUrl: null,
    certConfig: null,
    categoryId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

/** Create a fake Registration object. */
export function makeRegistration(overrides?: Record<string, any>) {
  return {
    id: 'reg-1',
    userId: 'user-1',
    name: 'Budi Santoso',
    whatsapp: '6281234567890',
    email: 'budi@example.com',
    institution: 'Univ Test',
    programId: 'prog-1',
    status: 'REGISTERED',
    createdAt: new Date(),
    updatedAt: new Date(),
    certificate: null,
    payment: null,
    program: makeProgram(),
    ...overrides,
  };
}

/** Create a fake Certificate object. */
export function makeCertificate(overrides?: Record<string, any>) {
  return {
    id: 'cert-1',
    serial: 1,
    number: 'JSA-2026-0001',
    registrationId: 'reg-1',
    issuedAt: new Date(),
    ...overrides,
  };
}
