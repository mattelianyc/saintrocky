import { randomUUID } from 'node:crypto';

import { WalletLink } from '../models/wallet-link.model.js';
import { env } from '../config/env.js';
import { isValidSolanaPublicKey } from '../utils/solana.js';

export async function listWalletLinks(userEmail) {
  const wallets = await WalletLink.find({ userEmail: String(userEmail).toLowerCase() }).lean();
  return { wallets };
}

export async function getWalletLinkByAddress(walletAddress) {
  return WalletLink.findOne({ walletAddress: String(walletAddress) }).lean();
}

export async function linkWallet({ userId, userEmail, walletAddress, label }) {
  if (!(await isValidSolanaPublicKey(walletAddress))) {
    throw Object.assign(new Error('Enter a valid Solana wallet address.'), { status: 400 });
  }

  const existing = await WalletLink.findOne({ walletAddress });
  if (existing) {
    throw Object.assign(new Error('This wallet is already linked to an account.'), { status: 409 });
  }

  const hasPrimary = await WalletLink.findOne({ userEmail: String(userEmail).toLowerCase(), isPrimary: true }).lean();

  const walletLink = new WalletLink({
    userId,
    userEmail: String(userEmail).toLowerCase(),
    walletAddress: String(walletAddress),
    chain: 'solana',
    label: label || 'Primary',
    isPrimary: !hasPrimary,
    linkedAt: new Date().toISOString()
  });

  await walletLink.save();

  let heliusWebhookId = null;
  try {
    heliusWebhookId = await registerHeliusWebhook(walletAddress);
    if (heliusWebhookId) {
      walletLink.heliusWebhookId = heliusWebhookId;
      await walletLink.save();
    }
  } catch {}

  return { wallet: walletLink.toObject() };
}

export async function unlinkWallet(walletAddress, userEmail) {
  const wallet = await WalletLink.findOne({
    walletAddress: String(walletAddress),
    userEmail: String(userEmail).toLowerCase()
  });
  if (!wallet) {
    throw Object.assign(new Error('Wallet not found.'), { status: 404 });
  }

  if (wallet.heliusWebhookId) {
    try {
      await deleteHeliusWebhook(wallet.heliusWebhookId);
    } catch {}
  }

  await WalletLink.deleteOne({ _id: wallet._id });
  return { ok: true };
}

async function registerHeliusWebhook(walletAddress) {
  const heliusApiKey = env.heliusApiKey;
  if (!heliusApiKey) return null;

  const webhookUrl = `${env.publicApiUrl || 'http://localhost:4000'}/api/v1/chain/webhook/helius`;

  const response = await fetch(`https://api.helius.xyz/v0/webhooks?api-key=${heliusApiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      webhookURL: webhookUrl,
      transactionTypes: ['SWAP', 'TRANSFER'],
      accountAddresses: [walletAddress],
      webhookType: 'enhanced'
    })
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new Error(`Helius webhook registration failed: ${response.status} ${errorBody}`);
  }

  const data = await response.json();
  return data.webhookID || null;
}

async function deleteHeliusWebhook(webhookId) {
  const heliusApiKey = env.heliusApiKey;
  if (!heliusApiKey || !webhookId) return;

  await fetch(`https://api.helius.xyz/v0/webhooks/${webhookId}?api-key=${heliusApiKey}`, {
    method: 'DELETE'
  });
}
