// Vercel Serverless Function - api/create-pix.js
export default async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const mpToken = process.env.MP_ACCESS_TOKEN;

    if (!mpToken) {
        return res.status(200).json({
            active: false,
            message: 'MP_ACCESS_TOKEN não configurado no ambiente Vercel. Utilize o link oficial.'
        });
    }

    try {
        const body = {
            transaction_amount: 1.99,
            description: "Apocalipse IA - Mandado de Prisão VIP",
            payment_method_id: "pix",
            payer: {
                email: "comprador.quiz@apocalipseia.com.br",
                first_name: "Sobrevivente",
                last_name: "Apocalipse"
            }
        };

        const mpRes = await fetch('https://api.mercadopago.com/v1/payments', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${mpToken}`,
                'Content-Type': 'application/json',
                'X-Idempotency-Key': 'pix-' + Date.now() + '-' + Math.random().toString(36).substring(2, 9)
            },
            body: JSON.stringify(body)
        });

        const data = await mpRes.json();

        if (data.id && data.point_of_interaction) {
            const qrCode = data.point_of_interaction.transaction_data.qr_code;
            const qrCodeBase64 = data.point_of_interaction.transaction_data.qr_code_base64;
            return res.status(200).json({
                active: true,
                paymentId: data.id,
                status: data.status,
                qrCode: qrCode,
                qrCodeBase64: qrCodeBase64
            });
        } else {
            return res.status(400).json({
                active: false,
                error: data.message || 'Falha ao gerar PIX com o Mercado Pago'
            });
        }
    } catch (err) {
        return res.status(500).json({
            active: false,
            error: err.message
        });
    }
}
