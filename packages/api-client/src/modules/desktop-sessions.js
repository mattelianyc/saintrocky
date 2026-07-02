export function createDesktopSessionsClient(httpClient) {
  return {
    async list() {
      const response = await httpClient.get("/v1/desktop-sessions");
      return response.data;
    }
  };
}
