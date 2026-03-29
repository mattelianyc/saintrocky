export function createPoliciesClient(httpClient) {
  return {
    async list() {
      const response = await httpClient.get("/v1/policies");
      return response.data;
    }
  };
}
