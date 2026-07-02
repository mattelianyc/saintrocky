import { SOLANA_PROGRAM_IDS, isMonitoredTradingProgram } from './programs.js';

const SOL_DECIMALS = 9;
const LAMPORTS_PER_SOL = 1_000_000_000;

export function lamportsToSol(lamports) {
  return Number(lamports || 0) / LAMPORTS_PER_SOL;
}

export function solToLamports(sol) {
  return Math.round(Number(sol || 0) * LAMPORTS_PER_SOL);
}

function findTradingProgramId(accountKeys = []) {
  return accountKeys.find((key) => isMonitoredTradingProgram(key)) || null;
}

function inferDirectionFromTokenChanges(tokenTransfers = [], walletAddress = '') {
  const outgoing = tokenTransfers.find(
    (transfer) =>
      String(transfer.fromUserAccount || '').toLowerCase() === walletAddress.toLowerCase()
  );
  const incoming = tokenTransfers.find(
    (transfer) =>
      String(transfer.toUserAccount || '').toLowerCase() === walletAddress.toLowerCase()
  );

  if (outgoing && !incoming) return 'sell';
  if (incoming && !outgoing) return 'buy';
  if (incoming && outgoing) return 'swap';
  return 'unknown';
}

function extractTokenMint(tokenTransfers = [], walletAddress = '') {
  const relevant = tokenTransfers.find(
    (transfer) =>
      String(transfer.toUserAccount || '').toLowerCase() === walletAddress.toLowerCase() ||
      String(transfer.fromUserAccount || '').toLowerCase() === walletAddress.toLowerCase()
  );
  return relevant?.mint || null;
}

function extractSolAmount(nativeTransfers = [], walletAddress = '') {
  const spent = nativeTransfers
    .filter(
      (transfer) =>
        String(transfer.fromUserAccount || '').toLowerCase() === walletAddress.toLowerCase()
    )
    .reduce((sum, transfer) => sum + Number(transfer.amount || 0), 0);

  const received = nativeTransfers
    .filter(
      (transfer) =>
        String(transfer.toUserAccount || '').toLowerCase() === walletAddress.toLowerCase()
    )
    .reduce((sum, transfer) => sum + Number(transfer.amount || 0), 0);

  return lamportsToSol(Math.abs(spent - received));
}

export function isTradeTransaction(heliusTransaction) {
  if (!heliusTransaction) return false;
  const accountKeys = heliusTransaction.accountData?.map((account) => account.account) || [];
  return Boolean(findTradingProgramId(accountKeys));
}

export function extractTradeDetails(heliusTransaction, walletAddress) {
  if (!heliusTransaction || !walletAddress) return null;

  const accountKeys = heliusTransaction.accountData?.map((account) => account.account) || [];
  const programId = findTradingProgramId(accountKeys);
  if (!programId) return null;

  const tokenTransfers = heliusTransaction.tokenTransfers || [];
  const nativeTransfers = heliusTransaction.nativeTransfers || [];

  const direction = inferDirectionFromTokenChanges(tokenTransfers, walletAddress);
  const tokenMint = extractTokenMint(tokenTransfers, walletAddress);
  const solAmount = extractSolAmount(nativeTransfers, walletAddress);

  return {
    signature: heliusTransaction.signature || '',
    programId,
    walletAddress,
    direction,
    tokenMint,
    solAmount,
    timestamp: heliusTransaction.timestamp
      ? new Date(heliusTransaction.timestamp * 1000)
      : new Date(),
    fee: lamportsToSol(heliusTransaction.fee || 0),
    raw: {
      type: heliusTransaction.type || 'UNKNOWN',
      source: heliusTransaction.source || 'UNKNOWN',
      description: heliusTransaction.description || ''
    }
  };
}

export function parseSolanaTradeEvent(heliusWebhookPayload, walletAddress) {
  if (!Array.isArray(heliusWebhookPayload)) {
    return heliusWebhookPayload
      ? [extractTradeDetails(heliusWebhookPayload, walletAddress)].filter(Boolean)
      : [];
  }

  return heliusWebhookPayload
    .filter(isTradeTransaction)
    .map((transaction) => extractTradeDetails(transaction, walletAddress))
    .filter(Boolean);
}
