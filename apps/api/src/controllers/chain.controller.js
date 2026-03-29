import { handleHeliusWebhook, getRecentTrades } from '../services/chain-watcher.service.js';
import { requireUser } from '../utils/auth.js';
import { WalletLink } from '../models/wallet-link.model.js';
import { env } from '../config/env.js';

export async function heliusWebhookController(req, res) {
  try {
    const authHeader = req.headers['authorization'] || '';
    const expectedSecret = env.heliusWebhookSecret;

    if (expectedSecret && authHeader !== `Bearer ${expectedSecret}`) {
      return res.status(401).json({ error: 'Unauthorized webhook request.' });
    }

    const results = await handleHeliusWebhook(req.body);
    return res.json({
      ok: true,
      processed: results.length,
      violations: results.reduce((sum, result) => sum + (result.violations?.length || 0), 0)
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}

export async function listRecentTradesController(req, res) {
  try {
    const actor = await requireUser(req);
    const { walletAddress } = req.query;

    if (!walletAddress) {
      return res.status(400).json({ error: 'walletAddress query parameter is required.' });
    }

    const wallet = await WalletLink.findOne({
      walletAddress,
      userEmail: actor.email
    }).lean();

    if (!wallet) {
      return res.status(404).json({ error: 'Wallet not found or not linked to your account.' });
    }

    const trades = await getRecentTrades(walletAddress, 50);
    return res.json({ trades });
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
}
