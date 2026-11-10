// Vercel Serverless Function - api/check-payment.js
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { id } = req.query;
    const mpToken = process.env.MP_ACCESS_TOKEN;

    if (!id) {
        return res.status(200).json({
            approved: false,
            status: 'missing_id',
            message: 'Nenhum ID de transação ou pagamento informado para conferência.'
        });
    }

    if (!mpToken) {
        // Sem token configurado no ambiente Vercel
        return res.status(200).json({
            approved: false,
            status: 'unconfigured',
            message: 'Token de integração bancária não configurado nas variáveis de ambiente da Vercel.'
        });
    }

    try {
        const mpRes = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
            headers: {
                'Authorization': `Bearer ${mpToken}`
            }
        });

        if (!mpRes.ok) {
            return res.status(200).json({
                approved: false,
                status: 'not_found',
                message: 'Transação não encontrada nos registros bancários do Mercado Pago.'
            });
        }

        const data = await mpRes.json();
        const isApproved = data.status === 'approved';

        return res.status(200).json({
            approved: isApproved,
            status: data.status,
            amount: data.transaction_amount,
            payerEmail: data.payer ? data.payer.email : null
        });
    } catch (err) {
        return res.status(500).json({
            approved: false,
            error: 'Erro de comunicação com o gateway bancário.',
            details: err.message
        });
    }
}
