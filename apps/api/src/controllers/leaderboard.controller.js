import { env } from '../config/env.js';
import { connectMongo } from '../db/mongo.js';
import { computeDisciplineScores, getLeaderboard } from '../services/leaderboard.service.js';
import { requireUser } from '../utils/auth.js';

export async function getLeaderboardController(req, res) {
  try {
    await connectMongo(env.mongodbUri);
    const limit = Number(req.query.limit) || 50;
    const leaderboard = await getLeaderboard(limit);
    return res.json({ leaderboard });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getMyDisciplineScoreController(req, res) {
  try {
    const actor = await requireUser(req);
    await connectMongo(env.mongodbUri);
    const rankedScores = await computeDisciplineScores();
    const normalizedEmail = String(actor.email || '').toLowerCase();
    const score = rankedScores.find((entry) => entry.email === normalizedEmail) || null;
    return res.json({ score });
  } catch (error) {
    return res.status(error.status || 500).json(error.payload || { error: error.message });
  }
}
