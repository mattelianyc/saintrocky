export function createUsersClient(httpClient) {
  return {
    async list() {
      const response = await httpClient.get("/v1/users");
      return response.data;
    }
  };
}
