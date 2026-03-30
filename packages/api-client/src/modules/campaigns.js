export function createCampaignsClient(httpClient) {
  return {
    async list() {
      const response = await httpClient.get('/v1/campaigns');
      return response.data;
    },
    async create(payload) {
      const response = await httpClient.post('/v1/campaigns', payload);
      return response.data;
    },
    async respond(campaignId, action) {
      const response = await httpClient.post(`/v1/campaigns/${campaignId}/respond`, { action });
      return response.data;
    }
  };
}
