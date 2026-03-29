export function createRulesClient(httpClient) {
  return {
    async listRules(ownerEmail) {
      const response = await httpClient.get('/v1/rules', {
        params: ownerEmail ? { ownerEmail } : undefined
      });
      return response.data;
    },
    async listTemplates() {
      const response = await httpClient.get('/v1/rules/templates');
      return response.data;
    },
    async listDrafts(authorEmail) {
      const response = await httpClient.get('/v1/rules/drafts', {
        params: authorEmail ? { authorEmail } : undefined
      });
      return response.data;
    },
    async getDraft(ruleDraftId, authorEmail) {
      const response = await httpClient.get(`/v1/rules/drafts/${ruleDraftId}`, {
        params: authorEmail ? { authorEmail } : undefined
      });
      return response.data;
    },
    async submitDraft(payload) {
      const response = await httpClient.post('/v1/rules/drafts', payload);
      return response.data;
    },
    async publishDraft(ruleDraftId, payload = {}) {
      const response = await httpClient.post(`/v1/rules/drafts/${ruleDraftId}/publish`, payload);
      return response.data;
    },
    async createFromTemplate(payload) {
      const response = await httpClient.post('/v1/rules/from-template', payload);
      return response.data;
    },
    async updateStatus(ruleId, status) {
      const response = await httpClient.post(`/v1/rules/${ruleId}/status`, { status });
      return response.data;
    },
    async editRule(ruleId, payload) {
      const response = await httpClient.post(`/v1/rules/${ruleId}/edit`, payload);
      return response.data;
    },
    async listRuntimeAssignments(runtimeSurface, runtimeCapabilities = [], ownerEmail) {
      const response = await httpClient.get('/v1/rules/runtime/assignments', {
        params: {
          runtimeSurface,
          runtimeCapabilities: runtimeCapabilities.join(','),
          ...(ownerEmail ? { ownerEmail } : {})
        }
      });
      return response.data;
    },
    async reportRuntimeEvent(payload) {
      const response = await httpClient.post('/v1/rules/runtime/events', payload);
      return response.data;
    }
  };
}
