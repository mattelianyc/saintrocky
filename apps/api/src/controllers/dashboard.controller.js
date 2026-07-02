import { env } from '../config/env.js';
import { connectMongo } from '../db/mongo.js';
import { getDashboardSummaryForUser } from '../services/dashboard.service.js';
import { requireUser } from '../utils/auth.js';

export async function getDashboard(req, res) {
  try {
    const actor = await requireUser(req);
    await connectMongo(env.mongodbUri);
    const summary = await getDashboardSummaryForUser(actor.email);
    return res.json(summary);
  } catch (error) {
    return res.status(error.status || 500).json(
      error.payload || { code: 'DASHBOARD_SUMMARY_FAILED', message: error.message }
    );
  }
}
