import { clusterApiUrl } from '@solana/web3.js';

export const SOLANA_NETWORKS = {
  localnet: 'http://localhost:8899',
  devnet: clusterApiUrl('devnet'),
  mainnet: clusterApiUrl('mainnet-beta')
};

export function getSolanaEndpoint(networkOrUrl) {
  if (!networkOrUrl) return SOLANA_NETWORKS.localnet;
  return SOLANA_NETWORKS[networkOrUrl] || networkOrUrl;
}
