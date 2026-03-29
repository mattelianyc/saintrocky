export function createLeaderboardClient(httpClient) {
  return {
    async getLeaderboard(limit = 50) {
      const response = await httpClient.get('/v1/leaderboard', { params: { limit } });
      return response.data;
    },
    async getMyDisciplineScore() {
      const response = await httpClient.get('/v1/leaderboard/me');
      return response.data;
    }
  };
}
