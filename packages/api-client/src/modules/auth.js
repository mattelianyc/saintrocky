export function createAuthClient(httpClient) {
  return {
    async register(payload) {
      const response = await httpClient.post("/v1/auth/register", payload);
      return response.data;
    },
    async login(payload) {
      const response = await httpClient.post("/v1/auth/login", payload);
      return response.data;
    },
    async logout() {
      const response = await httpClient.post("/v1/auth/logout");
      return response.data;
    },
    async me() {
      const response = await httpClient.get("/v1/auth/me");
      return response.data;
    },
    async createRuntimeToken(payload = {}) {
      const response = await httpClient.post("/v1/auth/runtime-token", payload);
      return response.data;
    }
  };
}
