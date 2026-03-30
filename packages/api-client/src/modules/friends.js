export function createFriendsClient(httpClient) {
  return {
    async list() {
      const response = await httpClient.get('/v1/friends');
      return response.data;
    },
    async request(payload) {
      const response = await httpClient.post('/v1/friends', payload);
      return response.data;
    },
    async respond(friendshipId, action) {
      const response = await httpClient.post(`/v1/friends/${friendshipId}/respond`, { action });
      return response.data;
    }
  };
}
