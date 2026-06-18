export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  const { name, email, message } = req.body || {};

  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Tous les champs sont requis' });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Clé API manquante' });
  }

  const resp = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // Remplace par ton domaine vérifié sur Resend une fois le domaine ajouté
      from: 'Portfolio <onboarding@resend.dev>',
      to: ['arnaud.clvpro@gmail.com'],
      reply_to: email,
      subject: `Message de ${name} — Portfolio`,
      html: `
        <h2 style="font-family:sans-serif">Nouveau message depuis le portfolio</h2>
        <p style="font-family:sans-serif"><strong>Nom :</strong> ${escHtml(name)}</p>
        <p style="font-family:sans-serif"><strong>Email :</strong> ${escHtml(email)}</p>
        <p style="font-family:sans-serif"><strong>Message :</strong><br>${escHtml(message).replace(/\n/g, '<br>')}</p>
      `,
    }),
  });

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    return res.status(502).json({ error: "Échec de l'envoi", details: body });
  }

  return res.status(200).json({ success: true });
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
