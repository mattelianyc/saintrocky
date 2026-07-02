export function createUsersClient(httpClient) {
  return {
    async list() {
      const response = await httpClient.get("/v1/users");
      return response.data;
    },
    async getMe() {
      const response = await httpClient.get("/v1/users/me");
      return response.data;
    },
    async updateProfile(payload) {
      const response = await httpClient.put("/v1/users/me", payload);
      return response.data;
    },
    async deleteAccount() {
      const response = await httpClient.post('/v1/users/me/delete-account');
      return response.data;
    }
  };
}
