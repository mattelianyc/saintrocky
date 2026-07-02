export function createWalletsClient(httpClient) {
  return {
    async listWallets() {
      const response = await httpClient.get('/v1/wallets');
      return response.data;
    },
    async linkWallet({ walletAddress, signature, label }) {
      const response = await httpClient.post('/v1/wallets/link', {
        walletAddress,
        signature,
        label
      });
      return response.data;
    },
    async unlinkWallet(walletAddress) {
      const response = await httpClient.delete(`/v1/wallets/${walletAddress}`);
      return response.data;
    }
  };
}
