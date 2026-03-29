export function createAlertsClient(httpClient) {
  return {
    async list() {
      const response = await httpClient.get("/v1/alerts");
      return response.data;
    }
  };
}
