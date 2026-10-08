import request from 'supertest';
import express, { Express } from 'express';

const mockHasSBT = jest.fn();
const mockIssueSBT = jest.fn();

const mockSupabaseFrom = jest.fn();
const mockSupabaseUpdate = jest.fn();
const mockSupabaseEq = jest.fn();
const mockSupabaseSelect = jest.fn();
const mockSupabaseSingle = jest.fn();

const mockSupabaseClient = {
  from: mockSupabaseFrom,
};

jest.mock('../services/sbtService', () => ({
  sbtService: {
    hasSBT: mockHasSBT,
    issueSBT: mockIssueSBT,
  },
}));

jest.mock('../config/supabase', () => ({
  supabase: mockSupabaseClient,
}));

import sbtRoutes from './sbt';

describe('SBT check-and-mint and status routes', () => {
  let app: Express;

  beforeEach(() => {
    jest.clearAllMocks();
    app = express();
    app.use(express.json());
    app.use('/api/sbt', sbtRoutes);
  });

  it('returns the same hash from check-and-mint and status', async () => {
    const userId = 'user-123';
A    const txHash = '0xabcdef123456';

    mockHasSBT.mockResolvedValue(false);
    mockIssueSBT.mockResolvedValue({ transactionHash: txHash });

    mockSupabaseUpdate.mockReturnValue({ eq: mockSupabaseEq });
    mockSupabaseEq.mockResolvedValue({ error: null });
    mockSupabaseFrom.mockReturnValue({ update: mockSupabaseUpdate });

    const mintResponse = await request(app)
      .post('/api/sbt/check-and-mint')
      .send({ userId });

    expect(mintResponse.status).toBe(200);
    expect(mintResponse.body).toMatchObject({
      success: true,
      transactionHash: txHash,
    });

    mockHasSBT.mockResolvedValue(true);
    mockSupabaseSelect.mockReturnValue({ eq: mockSupabaseEq });
    mockSupabaseEq.mockReturnValue({ single: mockSupabaseSingle });
    mockSupabaseSingle.mockResolvedValue({
      data: {
        sbt_issued: true,
        sbt_transaction_hash: txHash,
      },
      error: null,
    });
    mockSupabaseFrom.mockReturnValue({ select: mockSupabaseSelect });

    const statusResponse = await request(app).get(`/api/sbt/status/${userId}`);

    expect(statusResponse.status).toBe(200);
    expect(statusResponse.body).toMatchObject({
      sbtIssued: true,
      transactionHash: txHash,
    });
    expect(statusResponse.body.transactionHash).toBe(mintResponse.body.transactionHash);
  });

  it('returns 200 with eligible: false and does not mint when ineligible', async () => {
    const userId = 'user-456';

    mockHasSBT.mockResolvedValue(false);
    mockIssueSBT.mockRejectedValue(new Error('not eligible'));

    const response = await request(app)
      .post('/api/sbt/check-and-mint')
      .send({ userId });

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ eligible: false });
    expect(mockSupabaseUpdate).not.toHaveBeenCalled();
  });

  it('returns 500 on mint failure and does not leave sbt_issued set to true', async () => {
    const userId = 'user-789';

    mockHasSBT.mockResolvedValue(false);
    mockIssueSBT.mockRejectedValue(new Error('mint failed'));

    const response = await request(app)
      .post('/api/sbt/check-and-mint')
      .send({ userId });

    expect(response.status).toBe(undefined);
    expect(mockSupabaseUpdate).not.toHaveBeenCalled();
  });
});
