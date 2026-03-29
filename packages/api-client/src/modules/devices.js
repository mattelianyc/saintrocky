export function createDevicesClient(httpClient) {
  return {
    async list() {
      const response = await httpClient.get("/v1/devices");
      return response.data;
    }
  };
}
