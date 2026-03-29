export function createDashboardClient(httpClient) {
  return {
    async summary() {
      const response = await httpClient.get('/v1/dashboard');
      return response.data;
    }
  };
}
