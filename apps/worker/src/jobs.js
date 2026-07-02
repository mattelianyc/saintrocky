import { alertFeed } from '@saintrocky/alerts';
import { networkPolicies } from '@saintrocky/network-policies';
import { workflowTemplates } from '@saintrocky/workflows';

export const workerJobs = [
  {
    id: 'job-alert-fanout',
    title: 'Alert fanout',
    summary: `Broadcast ${alertFeed.length} alert definitions to downstream notification surfaces.`
  },
  {
    id: 'job-policy-sync',
    title: 'Policy sync',
    summary: `Prepare ${networkPolicies.length} network policies for desktop and extension runtimes.`
  },
  {
    id: 'job-workflow-rollup',
    title: 'Workflow rollup',
    summary: `Aggregate ${workflowTemplates.length} workflow templates for scheduled orchestration.`
  }
];
