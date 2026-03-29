import { requireUser } from '../utils/auth.js';
import { linkWallet, listWalletLinks, unlinkWallet } from '../services/wallets.service.js';

export async function listWalletsController(req, res) {
  try {
    const actor = await requireUser(req);
    const result = await listWalletLinks(actor.email);
    return res.json(result);
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
}

export async function linkWalletController(req, res) {
  try {
    const actor = await requireUser(req);
    const { walletAddress, signature, label } = req.body || {};

    if (!walletAddress) {
      return res.status(400).json({ error: 'walletAddress is required.' });
    }

    const result = await linkWallet({
      userId: actor.id,
      userEmail: actor.email,
      walletAddress,
      label
    });

    return res.status(201).json(result);
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
}

export async function unlinkWalletController(req, res) {
  try {
    const actor = await requireUser(req);
    const { address } = req.params;

    if (!address) {
      return res.status(400).json({ error: 'Wallet address is required.' });
    }

    const result = await unlinkWallet(address, actor.email);
    return res.json(result);
  } catch (error) {
    return res.status(error.status || 500).json({ error: error.message });
  }
}
