export function createMessagesClient(httpClient) {
  return {
    async listThreads() {
      const response = await httpClient.get('/v1/messages/threads');
      return response.data;
    },
    async listMessages(counterpartyUserId) {
      const response = await httpClient.get(`/v1/messages/threads/${counterpartyUserId}`);
      return response.data;
    },
    async send(payload) {
      const response = await httpClient.post('/v1/messages', payload);
      return response.data;
    },
    async markRead(counterpartyUserId) {
      const response = await httpClient.post(`/v1/messages/threads/${counterpartyUserId}/read`);
      return response.data;
    }
  };
}
