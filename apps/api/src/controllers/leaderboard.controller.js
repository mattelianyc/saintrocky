import { getLeaderboard, computeUserDisciplineScore } from '../services/leaderboard.service.js';

export async function getLeaderboardController(req, res) {
  try {
    const limit = Number(req.query.limit) || 50;
    const leaderboard = await getLeaderboard(limit);
    return res.json({ leaderboard });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function getMyDisciplineScoreController(req, res) {
  try {
    const userEmail = req.user?.email;
    if (!userEmail) {
      return res.status(401).json({ error: 'Authentication required.' });
    }

    const score = await computeUserDisciplineScore(userEmail);
    return res.json({ score });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
