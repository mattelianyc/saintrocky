import { consumeJson } from '@saintrocky/api/queue/rabbitmq';
import { sendEmail } from '@saintrocky/api/email/mailer';

export async function startEmailWorker() {
  await consumeJson('emails', async (job) => {
    if (job?.type === 'welcome') {
      const tpl = job.template || {};
      await sendEmail({
        to: job.to,
        subject: tpl.subject || 'Welcome',
        text: tpl.text || '',
        html: tpl.html || ''
      });
    }

    if (job?.type === 'alert-digest') {
      await sendEmail({
        to: job.to,
        subject: job.subject || 'Standard Deviants alert digest',
        text: job.text || '',
        html: job.html || ''
      });
    }
  });
}





