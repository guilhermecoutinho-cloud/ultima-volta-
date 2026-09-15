// Proxy servidor-a-servidor pro webhook da Unnica.
//
// O form manda pra cá (mesmo domínio, sem CORS) em vez de bater direto no
// webhook de terceiro pelo navegador. O webhook da Unnica não devolve
// Access-Control-Allow-Origin, então um fetch direto do browser exigia
// mode:'no-cors' + Content-Type: text/plain (sem isso o preflight falhava).
// Só que sem JSON de verdade, o fluxo da Unnica não conseguia mapear os
// campos estruturados (nome vinha vazio, produto/valor ficavam zerados).
// Aqui, servidor-a-servidor, não existe CORS: manda application/json real.
//
// Bônus: tira o token do webhook do código público do navegador.
module.exports = async function handler(req, res) {
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'method_not_allowed' });
        return;
    }

    const CRM_WEBHOOK_URL = process.env.CRM_WEBHOOK_URL
        || 'https://webhook.unnica.com.br/functions/v1/flow-webhook-receive?token=whk_1pBnuF4leMt7DLBn2fhnJlNcFIb4BVbp';

    const data = req.body && typeof req.body === 'object' ? req.body : {};

    // "Primeiro lote - R$ 500" -> produto: "Primeiro lote", valor: 500
    const tier = typeof data.ticket_tier === 'string' ? data.ticket_tier : '';
    const match = tier.match(/^(.*?)\s*-\s*R\$\s*([\d.,]+)/);
    const produto = match ? match[1].trim() : tier;
    const valor = match ? Number(match[2].replace(/\./g, '').replace(',', '.')) : 0;

    const payload = { ...data, produto, valor };

    try {
        const upstream = await fetch(CRM_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        res.status(200).json({ ok: upstream.ok });
    } catch (err) {
        res.status(502).json({ ok: false, error: 'upstream_failed' });
    }
};
