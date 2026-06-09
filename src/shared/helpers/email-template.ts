import { convert } from 'html-to-text';

type EmailAction = {
  label: string;
  url: string;
};

type EmailTemplateOptions = {
  title: string;
  greetingName: string;
  intro: string;
  body?: string[];
  action?: EmailAction;
  highlight?: {
    label: string;
    value: string;
  };
  note?: string;
};

type EmailContent = {
  html: string;
  text: string;
};

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const paragraph = (value: string): string =>
  `<p style="margin:0 0 16px;color:#334155;font-size:16px;line-height:1.6;">${escapeHtml(value)}</p>`;

export const buildStarterEmail = (options: EmailTemplateOptions): EmailContent => {
  const action = options.action
    ? `<p style="margin:24px 0;">
        <a href="${escapeHtml(options.action.url)}" style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:16px;font-weight:700;padding:12px 18px;border-radius:6px;">${escapeHtml(options.action.label)}</a>
      </p>
      <p style="margin:0 0 16px;color:#64748b;font-size:14px;line-height:1.6;">Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :<br><a href="${escapeHtml(options.action.url)}" style="color:#2563eb;word-break:break-all;">${escapeHtml(options.action.url)}</a></p>`
    : '';

  const highlight = options.highlight
    ? `<div style="margin:20px 0;padding:16px;background:#f8fafc;border:1px solid #cbd5e1;border-radius:6px;">
        <p style="margin:0 0 6px;color:#475569;font-size:13px;font-weight:700;text-transform:uppercase;">${escapeHtml(options.highlight.label)}</p>
        <p style="margin:0;color:#0f172a;font-size:22px;font-weight:700;letter-spacing:1px;">${escapeHtml(options.highlight.value)}</p>
      </div>`
    : '';

  const note = options.note
    ? `<p style="margin:20px 0 0;color:#64748b;font-size:14px;line-height:1.6;">${escapeHtml(options.note)}</p>`
    : '';

  const html = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escapeHtml(options.title)}</title>
  </head>
  <body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;">
            <tr>
              <td style="padding:24px 28px;background:#0f172a;">
                <p style="margin:0;color:#ffffff;font-size:20px;font-weight:700;">Starter</p>
              </td>
            </tr>
            <tr>
              <td style="padding:28px;">
                <h1 style="margin:0 0 18px;color:#0f172a;font-size:24px;line-height:1.3;">${escapeHtml(options.title)}</h1>
                ${paragraph(`Bonjour ${options.greetingName},`)}
                ${paragraph(options.intro)}
                ${(options.body ?? []).map(paragraph).join('')}
                ${action}
                ${highlight}
                ${note}
                <p style="margin:28px 0 0;color:#334155;font-size:16px;line-height:1.6;">L'équipe Starter</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return {
    html,
    text: convert(html, {
      wordwrap: 120,
      selectors: [
        { selector: 'a', options: { hideLinkHrefIfSameAsText: true } },
        { selector: 'img', format: 'skip' }
      ]
    })
  };
};
