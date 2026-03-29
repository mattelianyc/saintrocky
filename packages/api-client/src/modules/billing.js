export function createBillingClient(httpClient) {
  return {
    async summary() {
      const response = await httpClient.get("/v1/billing");
      return response.data;
    }
  };
}
