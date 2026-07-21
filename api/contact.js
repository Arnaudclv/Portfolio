export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { name, email, message, lang: rawLang } = req.body || {};
  const lang = rawLang === 'en' ? 'en' : 'fr';

  const t = lang === 'en'
    ? {
        missingFields: 'All fields are required',
        missingKey: 'Missing API key',
        sendFailed: 'Failed to send message',
        confirmSubject: "Message received — I'll get back to you within 24h",
        greeting: (n) => `Hi ${n},`,
        received: "Your message has been received. I'll read it as soon as possible and get back to you <strong>within 24h</strong>.",
        yourMessage: 'Your message',
        signoff: 'Talk soon,',
        role: 'Software Developer · Web &amp; Mobile',
        footerNote: 'This message is sent in response to your inquiry from arnaud-clavier.vercel.app',
      }
    : {
        missingFields: 'Tous les champs sont requis',
        missingKey: 'Clé API manquante',
        sendFailed: "Échec de l'envoi",
        confirmSubject: 'Message bien reçu — je reviens vers toi sous 24h',
        greeting: (n) => `Bonjour ${n},`,
        received: 'Ton message a bien été reçu. Je le lis dès que possible et je te réponds <strong>sous 24h</strong>.',
        yourMessage: 'Ton message',
        signoff: 'À bientôt,',
        role: 'Développeur Logiciel · Web &amp; Mobile',
        footerNote: 'Ce message est envoyé en réponse à votre prise de contact depuis arnaud-clavier.vercel.app',
      };

  if (!name || !email || !message) {
    return res.status(400).json({ error: t.missingFields });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: t.missingKey });
  }

  // 1 — Notification à Arnaud (toujours en français, c'est lui qui la lit)
  const notifResp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Portfolio <onboarding@resend.dev>',
      to: ['arnaud.clvpro@gmail.com'],
      reply_to: email,
      subject: `Nouveau message de ${name} — Portfolio${lang === 'en' ? ' (EN)' : ''}`,
      html: `
        <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
          <div style="background:#0f0f18;padding:28px 32px;display:flex;align-items:center;gap:10px">
            <span style="background:#caff42;color:#0f0f18;font-weight:900;font-size:12px;padding:4px 10px;border-radius:6px;letter-spacing:.08em">&lt;/&gt;</span>
            <span style="color:rgba(255,255,255,.6);font-size:14px;font-weight:600">arnaud.clavier — portfolio</span>
          </div>
          <div style="padding:32px">
            <p style="font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af;margin:0 0 20px">Nouveau message reçu${lang === 'en' ? ' · visiteur anglophone' : ''}</p>
            <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
              <tr><td style="padding:10px 14px;background:#f5f4ef;border-radius:8px 8px 0 0;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af">Nom</td></tr>
              <tr><td style="padding:10px 14px 16px;font-size:15px;font-weight:700;color:#111827">${escHtml(name)}</td></tr>
              <tr><td style="padding:10px 14px;background:#f5f4ef;border-radius:8px 8px 0 0;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af">Email</td></tr>
              <tr><td style="padding:10px 14px 16px;font-size:15px;color:#111827"><a href="mailto:${escHtml(email)}" style="color:#5a7200;text-decoration:none">${escHtml(email)}</a></td></tr>
              <tr><td style="padding:10px 14px;background:#f5f4ef;border-radius:8px 8px 0 0;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:#9ca3af">Message</td></tr>
              <tr><td style="padding:10px 14px 16px;font-size:15px;color:#374151;line-height:1.65;white-space:pre-wrap">${escHtml(message)}</td></tr>
            </table>
            <a href="mailto:${escHtml(email)}" style="display:inline-block;background:#caff42;color:#0f0f18;font-weight:800;font-size:14px;padding:12px 24px;border-radius:100px;text-decoration:none">Répondre à ${escHtml(name)} →</a>
          </div>
        </div>
      `,
    }),
  });

  if (!notifResp.ok) {
    const body = await notifResp.json().catch(() => ({}));
    return res.status(502).json({ error: t.sendFailed, details: body });
  }

  // 2 — Confirmation au visiteur (dans sa langue)
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: 'Arnaud Clavier <onboarding@resend.dev>',
      to: [email],
      subject: t.confirmSubject,
      html: `
        <div style="font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
          <div style="background:#0f0f18;padding:28px 32px">
            <span style="background:#caff42;color:#0f0f18;font-weight:900;font-size:12px;padding:4px 10px;border-radius:6px;letter-spacing:.08em">&lt;/&gt;</span>
            <span style="color:rgba(255,255,255,.6);font-size:14px;font-weight:600;margin-left:10px">Arnaud Clavier</span>
          </div>
          <div style="padding:36px 32px">
            <p style="font-size:22px;font-weight:800;color:#111827;margin:0 0 16px;letter-spacing:-.3px">${t.greeting(escHtml(name))}</p>
            <p style="font-size:15px;color:#374151;line-height:1.7;margin:0 0 20px">${t.received}</p>
            <div style="background:#f5f4ef;border-radius:12px;padding:20px 24px;margin:0 0 28px;border-left:3px solid #caff42">
              <p style="font-size:11px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#9ca3af;margin:0 0 8px">${t.yourMessage}</p>
              <p style="font-size:14px;color:#374151;line-height:1.65;margin:0;white-space:pre-wrap">${escHtml(message)}</p>
            </div>
            <p style="font-size:14px;color:#6b7280;margin:0 0 4px">${t.signoff}</p>
            <p style="font-size:15px;font-weight:800;color:#111827;margin:0">Arnaud Clavier</p>
            <p style="font-size:12px;color:#9ca3af;margin:4px 0 0">${t.role}</p>
          </div>
          <div style="background:#f9f9f7;border-top:1px solid #e5e7eb;padding:16px 32px;font-size:12px;color:#9ca3af">
            ${t.footerNote}
          </div>
        </div>
      `,
    }),
  }).catch(() => {});

  return res.status(200).json({ success: true });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
