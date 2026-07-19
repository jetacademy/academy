/**
 * Tests for src/lib/certificates.ts — certificate issuance logic.
 *
 * Requires mocking:
 *  - @/lib/prisma (prisma client singleton)
 *  - @/lib/wa (sendWa, msgCertificate)
 *  - @/lib/email (sendEmail, getCertEmailHtml)
 */

/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { issueCertificate, checkCertEligibility } from '@/lib/certificates';

// ─── Hoisted mocks (vi.mock factories are hoisted; use vi.hoisted) ─

const { mockPrisma, mockPrismaTx, makeCertificate, makeRegistration } = vi.hoisted(() => {
  function makeCertificate(overrides?: Record<string, any>) {
    return {
      id: 'cert-1',
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
      programBatch: { count: vi.fn(), findMany: vi.fn(), findFirst: vi.fn() },
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
  mockPrisma.certificate.count.mockResolvedValue(0);
  mockPrisma.programBatch.count.mockResolvedValue(0);
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
      include: { certificate: true, program: true, batch: true },
    });
  });

  it('returns existing certificate if already issued (idempotency)', async () => {
    const existingCert = makeCertificate({ number: 'JSA-2026-a1b2c3d4' });
    const reg = makeRegistration({ certificate: existingCert });
    mockPrisma.registration.findUnique.mockResolvedValue(reg);

    const result = await issueCertificate('reg-1');
    expect(result).toEqual({
      number: 'JSA-2026-a1b2c3d4',
      url: 'http://localhost:3000/sertifikat/JSA-2026-a1b2c3d4',
    });
    // Should NOT create a new certificate
    expect(mockPrismaTx.certificate.create).not.toHaveBeenCalled();
  });

  it('creates a certificate with random hex number format via transaction', async () => {
    const reg = makeRegistration({ certificate: null });
    mockPrisma.registration.findUnique.mockResolvedValue(reg);

    // Simulate: certificate.create returns the cert with the random number already set
    mockPrismaTx.certificate.create.mockImplementation(({ data }: any) =>
      Promise.resolve(makeCertificate({ id: 'cert-new', number: data.number }))
    );
    mockPrismaTx.registration.update.mockResolvedValue({ ...reg, status: 'PASSED' });

    const result = await issueCertificate('reg-1');

    // Number should match format JS-XXX-YYYY-BXXX-XXXXX
    expect(result.number).toMatch(/^JS-[A-Z]{3}-2026-B[0-9]{3}-[0-9]{5}$/);
    expect(result.url).toMatch(/^http:\/\/localhost:3000\/sertifikat\/JS-[A-Z]{3}-2026-B[0-9]{3}-[0-9]{5}$/);

    // Should create certificate with the random number directly
    expect(mockPrismaTx.certificate.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        registrationId: 'reg-1',
        number: expect.stringMatching(/^JS-[A-Z]{3}-2026-B[0-9]{3}-[0-9]{5}$/),
      }),
    });
    // Should NOT do a second update (number set at create time)
    expect(mockPrismaTx.certificate.update).not.toHaveBeenCalled();
    // Should set status to PASSED
    expect(mockPrismaTx.registration.update).toHaveBeenCalledWith({
      where: { id: 'reg-1' },
      data: { status: 'PASSED' },
    });
  });

  it('sends WhatsApp notification best-effort (does not throw on failure)', async () => {
    const reg = makeRegistration({ certificate: null });
    mockPrisma.registration.findUnique.mockResolvedValue(reg);

    mockPrismaTx.certificate.create.mockImplementation(({ data }: any) =>
      Promise.resolve(makeCertificate({ id: 'cert-new', number: data.number }))
    );
    mockPrismaTx.registration.update.mockResolvedValue({ ...reg, status: 'PASSED' });

    const { sendWa } = await import('@/lib/wa');
    vi.mocked(sendWa).mockRejectedValueOnce(new Error('WA down'));

    const result = await issueCertificate('reg-1');
    expect(result.number).toMatch(/^JS-[A-Z]{3}-2026-B[0-9]{3}-[0-9]{5}$/);
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

    mockPrismaTx.certificate.create.mockImplementation(({ data }: any) =>
      Promise.resolve(makeCertificate({ id: 'cert-new', number: data.number }))
    );
    mockPrismaTx.registration.update.mockResolvedValue({ ...reg, status: 'PASSED' });

    const result = await issueCertificate('reg-1');
    expect(result.url).toMatch(/^https:\/\/academy\.jetschool\.id\/sertifikat\/JS-[A-Z]{3}-2026-B[0-9]{3}-[0-9]{5}$/);
  });
});

describe('checkCertEligibility', () => {
  beforeEach(() => {
    resetMocks();
  });

  const LONG_AGO = new Date('2020-01-01T00:00:00.000Z');

  it('returns eligible if program has no lessons (empty curriculum)', async () => {
    mockPrisma.lesson.count.mockResolvedValue(0);

    const result = await checkCertEligibility('reg-1', {
      id: 'prog-1',
      type: 'KELAS',
      scheduleAt: LONG_AGO,
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
      type: 'KELAS',
      scheduleAt: LONG_AGO,
      completionCriteria: 'ALL_LESSONS',
    });

    expect(result).toEqual({ eligible: true });
  });

  it('returns not eligible for ALL_LESSONS when not all lessons completed', async () => {
    mockPrisma.lesson.count.mockResolvedValue(5);
    mockPrisma.completion.count.mockResolvedValue(3);

    const result = await checkCertEligibility('reg-1', {
      id: 'prog-1',
      type: 'KELAS',
      scheduleAt: LONG_AGO,
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
      type: 'KELAS',
      scheduleAt: LONG_AGO,
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
      type: 'KELAS',
      scheduleAt: LONG_AGO,
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
      type: 'KELAS',
      scheduleAt: LONG_AGO,
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
      type: 'KELAS',
      scheduleAt: LONG_AGO,
      completionCriteria: 'ALL_QUIZZES',
    });

    expect(result).toMatchObject({ eligible: false });
    expect(result.reason).toContain('Selesaikan semua materi');
    expect(result.reason).toContain('4/10');
  });

  describe('WEBINAR time gate (klaim baru terbuka 1×24 jam setelah sesi)', () => {
    it('blocks claim before 24 hours have passed since program scheduleAt', async () => {
      mockPrisma.registration.findUnique.mockResolvedValue({ batch: null });
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const result = await checkCertEligibility('reg-1', {
        id: 'prog-1',
        type: 'WEBINAR',
        scheduleAt: oneHourAgo,
        completionCriteria: 'ALL_LESSONS',
      });

      expect(result.eligible).toBe(false);
      expect(result.reason).toContain('1×24 jam');
      expect(result.availableAt).toBeInstanceOf(Date);
      // Gerbang waktu diperiksa lebih dulu — tak perlu sampai query kurikulum
      expect(mockPrisma.lesson.count).not.toHaveBeenCalled();
    });

    it('allows claim once 24 hours have passed since program scheduleAt (empty curriculum)', async () => {
      mockPrisma.registration.findUnique.mockResolvedValue({ batch: null });
      mockPrisma.lesson.count.mockResolvedValue(0);
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      const result = await checkCertEligibility('reg-1', {
        id: 'prog-1',
        type: 'WEBINAR',
        scheduleAt: twoDaysAgo,
        completionCriteria: 'ALL_LESSONS',
      });

      expect(result).toEqual({ eligible: true });
    });

    it('uses the batch schedule instead of the program schedule when registration belongs to a batch', async () => {
      // Program.scheduleAt sudah lama lewat, tapi batch peserta baru mulai 1 jam lalu — tetap diblokir
      mockPrisma.registration.findUnique.mockResolvedValue({
        batch: { scheduleAt: new Date(Date.now() - 60 * 60 * 1000) },
      });

      const result = await checkCertEligibility('reg-1', {
        id: 'prog-1',
        type: 'WEBINAR',
        scheduleAt: LONG_AGO,
        completionCriteria: 'ALL_LESSONS',
      });

      expect(result.eligible).toBe(false);
    });

    it('still requires lesson completion for WEBINAR once the time gate has passed', async () => {
      mockPrisma.registration.findUnique.mockResolvedValue({ batch: null });
      mockPrisma.lesson.count.mockResolvedValue(3);
      mockPrisma.completion.count.mockResolvedValue(1);
      const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000);

      const result = await checkCertEligibility('reg-1', {
        id: 'prog-1',
        type: 'WEBINAR',
        scheduleAt: twoDaysAgo,
        completionCriteria: 'ALL_LESSONS',
      });

      expect(result).toMatchObject({ eligible: false });
      expect(result.reason).toContain('Selesaikan semua materi');
    });

    it('does not apply the time gate to non-WEBINAR program types', async () => {
      mockPrisma.lesson.count.mockResolvedValue(0);
      const inTheFuture = new Date(Date.now() + 24 * 60 * 60 * 1000);

      const result = await checkCertEligibility('reg-1', {
        id: 'prog-1',
        type: 'BOOTCAMP',
        scheduleAt: inTheFuture, // non-WEBINAR tak pernah dicek terhadap scheduleAt
        completionCriteria: 'ALL_LESSONS',
      });

      expect(result).toEqual({ eligible: true });
      expect(mockPrisma.registration.findUnique).not.toHaveBeenCalled();
    });
  });
});
