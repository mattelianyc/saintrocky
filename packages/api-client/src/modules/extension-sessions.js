export function createExtensionSessionsClient(httpClient) {
  return {
    async list(ownerEmail) {
      const response = await httpClient.get("/v1/extension-sessions", {
        params: ownerEmail ? { ownerEmail } : undefined
      });
      return response.data;
    },
    async upsert(payload) {
      const response = await httpClient.post("/v1/extension-sessions", payload);
      return response.data;
    }
  };
}
