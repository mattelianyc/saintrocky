export function createDevicesClient(httpClient) {
  return {
    async list() {
      const response = await httpClient.get("/v1/devices");
      return response.data;
    },
    async registerPushToken(payload) {
      const response = await httpClient.post("/v1/devices/push-token", payload);
      return response.data;
    }
  };
}
