export function createWorkflowsClient(httpClient) {
  return {
    async list() {
      const response = await httpClient.get("/v1/workflows");
      return response.data;
    }
  };
}
