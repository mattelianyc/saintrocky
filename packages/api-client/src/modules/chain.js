export function createChainClient(httpClient) {
  return {
    async listRecentTrades(walletAddress) {
      const response = await httpClient.get('/v1/chain/trades', {
        params: { walletAddress }
      });
      return response.data;
    }
  };
}
