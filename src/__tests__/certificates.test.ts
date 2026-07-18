/**
 * Tests for src/lib/certificates.ts — certificate issuance logic.
 *
 * Requires mocking:
 *  - @/lib/prisma (prisma client singleton)
 *  - @/lib/wa (sendWa, msgCertificate)
 *  - @/lib/email (sendEmail, getCertEmailHtml)
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { issueCertificate, checkCertEligibility } from '@/lib/certificates';

// ─── Hoisted mocks (vi.mock factories are hoisted; use vi.hoisted) ─

const { mockPrisma, mockPrismaTx, makeCertificate, makeRegistration } = vi.hoisted(() => {
  function makeCertificate(overrides?: Record<string, any>) {
    return {
      id: 'cert-1',
      serial: 1,
      number: 'JSA-2026-0001',
      registrationId: 'reg-1',
      issuedAt: new Date(),
      ...overrides,
    };
  }

  function makeRegistration(overrides?: Record<string, any>) {
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
      program: {
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
        completionCriteria: 'ALL_LESSONS' as const,
        certKind: 'ACHIEVEMENT' as const,
        maxTestAttempts: 0,
        isActive: true,
        isFeatured: false,
        certBgUrl: null,
        certConfig: null,
        categoryId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      ...overrides,
    };
  }

  function createMockPrisma() {
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
      program: { findUnique: vi.fn(), findFirst: vi.fn(), findMany: vi.fn() },
      certificate: { findUnique: vi.fn(), findFirst: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
      payment: { findUnique: vi.fn(), findFirst: vi.fn(), upsert: vi.fn(), create: vi.fn(), update: vi.fn() },
      lesson: { count: vi.fn(), findMany: vi.fn(), findFirst: vi.fn() },
      completion: { count: vi.fn(), findMany: vi.fn() },
      user: { findFirst: vi.fn(), create: vi.fn() },
      $transaction: vi.fn((fn: any) => fn(mockPrismaTx)),
    };
  }

  return {
    mockPrisma: createMockPrisma() as ReturnType<typeof createMockPrisma>,
    mockPrismaTx: {
      certificate: { create: vi.fn(), update: vi.fn() },
      registration: { update: vi.fn() },
      payment: { upsert: vi.fn() },
    },
    makeCertificate,
    makeRegistration,
  };
});

// Mock all external module dependencies
vi.mock('@/lib/prisma', () => ({
  prisma: mockPrisma,
}));

vi.mock('@/lib/wa', () => ({
  sendWa: vi.fn(() => Promise.resolve(true)),
  msgCertificate: vi.fn((_name: string, _number: string, _url: string) => 'Cert message'),
  normalizeWa: vi.fn((raw: string) => raw.replace(/[^0-9]/g, '')),
}));

vi.mock('@/lib/email', () => ({
  sendEmail: vi.fn(() => Promise.resolve()),
  getCertEmailHtml: vi.fn(() => '<html>cert</html>'),
}));

// Suppress console.error noise during best-effort notification tests
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  resetMocks();
  process.env.NEXT_PUBLIC_BASE_URL = 'http://localhost:3000';
  mockPrisma.$transaction.mockImplementation((fn: any) => fn(mockPrismaTx));
});

afterEach(() => {
  vi.restoreAllMocks();
});

function resetMocks() {
  for (const model of Object.values(mockPrisma)) {
    if (typeof model === 'object' && model !== null) {
      for (const method of Object.values(model as Record<string, any>)) {
        if (typeof method === 'function' && 'mockReset' in method) {
          method.mockReset();
        }
      }
    }
  }
  for (const method of Object.values(mockPrismaTx)) {
    if (typeof method === 'function' && 'mockReset' in method) {
      method.mockReset();
    }
  }
}

// ─── Tests ─────────────────────────────────────────────────────────

describe('issueCertificate', () => {
  it('throws if registration is not found', async () => {
    mockPrisma.registration.findUnique.mockResolvedValue(null);

    await expect(issueCertificate('nonexistent')).rejects.toThrow(
      'Registrasi tidak ditemukan.'
    );
    expect(mockPrisma.registration.findUnique).toHaveBeenCalledWith({
      where: { id: 'nonexistent' },
      include: { certificate: true, program: true },
    });
  });

  it('returns existing certificate if already issued (idempotency)', async () => {
    const existingCert = makeCertificate({ number: 'JSA-2026-0001' });
    const reg = makeRegistration({ certificate: existingCert });
    mockPrisma.registration.findUnique.mockResolvedValue(reg);

    const result = await issueCertificate('reg-1');
    expect(result).toEqual({
      number: 'JSA-2026-0001',
      url: 'http://localhost:3000/sertifikat/JSA-2026-0001',
    });
    // Should NOT create a new certificate
    expect(mockPrismaTx.certificate.create).not.toHaveBeenCalled();
  });

  it('creates a certificate with proper number format via transaction', async () => {
    const reg = makeRegistration({ certificate: null });
    mockPrisma.registration.findUnique.mockResolvedValue(reg);

    const created = makeCertificate({ id: 'cert-new', serial: 5, number: 'TMP-reg-1' });
    mockPrismaTx.certificate.create.mockResolvedValue(created);
    mockPrismaTx.registration.update.mockResolvedValue({ ...reg, status: 'PASSED' });
    mockPrismaTx.certificate.update.mockResolvedValue(
      makeCertificate({ id: 'cert-new', serial: 5, number: 'JSA-2026-0005' })
    );

    const result = await issueCertificate('reg-1');

    expect(result.number).toMatch(/^JSA-2026-\d{4}$/);
    expect(result.number).toBe('JSA-2026-0005');
    expect(result.url).toBe('http://localhost:3000/sertifikat/JSA-2026-0005');

    expect(mockPrismaTx.certificate.create).toHaveBeenCalledWith({
      data: { registrationId: 'reg-1', number: `TMP-reg-1` },
    });
    expect(mockPrismaTx.registration.update).toHaveBeenCalledWith({
      where: { id: 'reg-1' },
      data: { status: 'PASSED' },
    });
    expect(mockPrismaTx.certificate.update).toHaveBeenCalledWith({
      where: { id: 'cert-new' },
      data: { number: 'JSA-2026-0005' },
    });
  });

  it('handles serial padding correctly (4 digits)', async () => {
    const reg = makeRegistration({ certificate: null });
    mockPrisma.registration.findUnique.mockResolvedValue(reg);

    const created = makeCertificate({ id: 'cert-new', serial: 42, number: 'TMP-reg-1' });
    mockPrismaTx.certificate.create.mockResolvedValue(created);
    mockPrismaTx.registration.update.mockResolvedValue({ ...reg, status: 'PASSED' });
    mockPrismaTx.certificate.update.mockResolvedValue(
      makeCertificate({ id: 'cert-new', serial: 42, number: 'JSA-2026-0042' })
    );

    const result = await issueCertificate('reg-1');
    expect(result.number).toBe('JSA-2026-0042');
  });

  it('handles large serial numbers (5+ digits)', async () => {
    const reg = makeRegistration({ certificate: null });
    mockPrisma.registration.findUnique.mockResolvedValue(reg);

    const created = makeCertificate({ id: 'cert-new', serial: 12345, number: 'TMP-reg-1' });
    mockPrismaTx.certificate.create.mockResolvedValue(created);
    mockPrismaTx.registration.update.mockResolvedValue({ ...reg, status: 'PASSED' });
    mockPrismaTx.certificate.update.mockResolvedValue(
      makeCertificate({ id: 'cert-new', serial: 12345, number: 'JSA-2026-12345' })
    );

    const result = await issueCertificate('reg-1');
    expect(result.number).toBe('JSA-2026-12345');
  });

  it('sends WhatsApp notification best-effort (does not throw on failure)', async () => {
    const reg = makeRegistration({ certificate: null });
    mockPrisma.registration.findUnique.mockResolvedValue(reg);

    const created = makeCertificate({ id: 'cert-new', serial: 1, number: 'TMP-reg-1' });
    mockPrismaTx.certificate.create.mockResolvedValue(created);
    mockPrismaTx.registration.update.mockResolvedValue({ ...reg, status: 'PASSED' });
    mockPrismaTx.certificate.update.mockResolvedValue(
      makeCertificate({ id: 'cert-new', serial: 1, number: 'JSA-2026-0001' })
    );

    const { sendWa } = await import('@/lib/wa');
    vi.mocked(sendWa).mockRejectedValueOnce(new Error('WA down'));

    const result = await issueCertificate('reg-1');
    expect(result.number).toBe('JSA-2026-0001');
    expect(sendWa).toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith(
      expect.stringContaining('Gagal kirim WA'),
      expect.any(Error)
    );
  });

  it('uses base URL from environment', async () => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://academy.jetschool.id';
    const reg = makeRegistration({ certificate: null });
    mockPrisma.registration.findUnique.mockResolvedValue(reg);

    const created = makeCertificate({ id: 'cert-new', serial: 10, number: 'TMP-reg-1' });
    mockPrismaTx.certificate.create.mockResolvedValue(created);
    mockPrismaTx.registration.update.mockResolvedValue({ ...reg, status: 'PASSED' });
    mockPrismaTx.certificate.update.mockResolvedValue(
      makeCertificate({ id: 'cert-new', serial: 10, number: 'JSA-2026-0010' })
    );

    const result = await issueCertificate('reg-1');
    expect(result.url).toBe('https://academy.jetschool.id/sertifikat/JSA-2026-0010');
  });
});

describe('checkCertEligibility', () => {
  beforeEach(() => {
    resetMocks();
  });

  it('returns eligible if program has no lessons (empty curriculum)', async () => {
    mockPrisma.lesson.count.mockResolvedValue(0);

    const result = await checkCertEligibility('reg-1', {
      id: 'prog-1',
      completionCriteria: 'ALL_LESSONS',
    });

    expect(result).toEqual({ eligible: true });
    expect(mockPrisma.lesson.count).toHaveBeenCalledWith({
      where: { module: { programId: 'prog-1' } },
    });
  });

  it('returns eligible for ALL_LESSONS when all lessons completed', async () => {
    mockPrisma.lesson.count.mockResolvedValue(5);
    mockPrisma.completion.count.mockResolvedValue(5);

    const result = await checkCertEligibility('reg-1', {
      id: 'prog-1',
      completionCriteria: 'ALL_LESSONS',
    });

    expect(result).toEqual({ eligible: true });
  });

  it('returns not eligible for ALL_LESSONS when not all lessons completed', async () => {
    mockPrisma.lesson.count.mockResolvedValue(5);
    mockPrisma.completion.count.mockResolvedValue(3);

    const result = await checkCertEligibility('reg-1', {
      id: 'prog-1',
      completionCriteria: 'ALL_LESSONS',
    });

    expect(result).toMatchObject({ eligible: false });
    expect(result.reason).toContain('Selesaikan semua materi');
    expect(result.reason).toContain('3/5');
  });

  it('returns eligible for ALL_QUIZZES when all quizzes passed', async () => {
    mockPrisma.lesson.count
      .mockResolvedValueOnce(10)    // total lessons in program
      .mockResolvedValueOnce(3);     // total QUIZ lessons
    mockPrisma.completion.count.mockResolvedValueOnce(3); // completed QUIZ

    const result = await checkCertEligibility('reg-1', {
      id: 'prog-1',
      completionCriteria: 'ALL_QUIZZES',
    });

    expect(result).toEqual({ eligible: true });
  });

  it('returns not eligible for ALL_QUIZZES when not all quizzes completed', async () => {
    mockPrisma.lesson.count
      .mockResolvedValueOnce(10)    // total lessons
      .mockResolvedValueOnce(3);     // total QUIZ lessons
    mockPrisma.completion.count.mockResolvedValueOnce(1); // only 1 QUIZ done

    const result = await checkCertEligibility('reg-1', {
      id: 'prog-1',
      completionCriteria: 'ALL_QUIZZES',
    });

    expect(result).toMatchObject({ eligible: false });
    expect(result.reason).toContain('Lulusi semua tes');
    expect(result.reason).toContain('1/3');
  });

  it('falls back to ALL_LESSONS when ALL_QUIZZES has 0 quizzes', async () => {
    // calls: 1. totalLessons=10, 2. totalQuizzes=0 (in hasPassedAllQuizzes),
    // then fallback: 3. totalLessonsAgain=10 (in hasCompletedAllLessons)
    mockPrisma.lesson.count
      .mockResolvedValueOnce(10)    // total lessons
      .mockResolvedValueOnce(0)      // total QUIZ = 0 → fallback
      .mockResolvedValueOnce(10);    // fallback: total lessons again
    mockPrisma.completion.count
      .mockResolvedValueOnce(0)     // no quiz completions
      .mockResolvedValueOnce(10);   // all lessons completed

    const result = await checkCertEligibility('reg-1', {
      id: 'prog-1',
      completionCriteria: 'ALL_QUIZZES',
    });

    expect(result).toEqual({ eligible: true });
  });

  it('falls back and reports incomplete when no quizzes and not all lessons done', async () => {
    mockPrisma.lesson.count
      .mockResolvedValueOnce(10)    // total lessons
      .mockResolvedValueOnce(0)      // total QUIZ = 0 → fallback
      .mockResolvedValueOnce(10);    // fallback: total lessons again
    mockPrisma.completion.count
      .mockResolvedValueOnce(0)     // no quiz completions
      .mockResolvedValueOnce(4);    // only 4 lessons completed

    const result = await checkCertEligibility('reg-1', {
      id: 'prog-1',
      completionCriteria: 'ALL_QUIZZES',
    });

    expect(result).toMatchObject({ eligible: false });
    expect(result.reason).toContain('Selesaikan semua materi');
    expect(result.reason).toContain('4/10');
  });
});
