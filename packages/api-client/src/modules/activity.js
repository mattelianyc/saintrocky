export function createActivityClient(httpClient) {
  return {
    async list() {
      const response = await httpClient.get("/v1/activity");
      return response.data;
    }
  };
}
