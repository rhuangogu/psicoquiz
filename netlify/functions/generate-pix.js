// netlify/functions/generate-pix.js
const fetch = require('node-fetch');

// Pega a chave secreta das variáveis de ambiente do Netlify (MP_ACCESS_TOKEN)
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
// URL base do seu site Netlify.
const YOUR_NETLIFY_SITE_URL = 'https://psicoreverso.netlify.app';

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Método não permitido' };
    }

    if (!MP_ACCESS_TOKEN) {
         return { statusCode: 500, body: JSON.stringify({ error: 'Chave do Mercado Pago não configurada (MP_ACCESS_TOKEN).' }) };
    }

    try {
        const body = JSON.parse(event.body);
        const { quizId, answersHash } = body;

        const idempotencyKey = `${quizId}-${answersHash}-${Date.now()}`.slice(0, 50);

        const paymentData = {
            transaction_amount: 8.99,
            description: `Relatório PsicoQuiz - ${quizId}`,
            payment_method_id: 'pix',
            external_reference: `${quizId}|${answersHash}`,
            notification_url: `${YOUR_NETLIFY_SITE_URL}/.netlify/functions/mp-webhook`, // Continua útil se quiser logar
            payer: {
                email: 'pagador@exemplo.com',
                first_name: 'Cliente',
                last_name: 'PsicoQuiz',
                identification: { type: 'CPF', number: '19119119100' },
                address: { zip_code: '01001000', street_name: 'Praça da Sé', street_number: '1', neighborhood: 'Sé', city: 'São Paulo', federal_unit: 'SP' }
            }
        };

        const response = await fetch('https://api.mercadopago.com/v1/payments', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MP_ACCESS_TOKEN}`,
                'X-Idempotency-Key': idempotencyKey
            },
            body: JSON.stringify(paymentData)
        });

        const data = await response.json();

        if (response.ok && data.point_of_interaction?.transaction_data) {
            const pixInfo = data.point_of_interaction.transaction_data;
            return {
                statusCode: 200,
                body: JSON.stringify({
                    // --- CORREÇÃO AQUI ---
                    payment_id: data.id, // Adicionamos o ID do pagamento
                    // --- FIM DA CORREÇÃO ---
                    qrCodeBase64: pixInfo.qr_code_base64,
                    pixKey: pixInfo.qr_code // A chave copia-e-cola é o próprio QR Code em texto
                })
            };
        } else {
            console.error('Erro MP ao gerar PIX:', data); // Log mais detalhado
            // Retorna o erro específico do MP se disponível
            const errorMessage = data.message || `Falha ao criar pagamento no MP. Status: ${response.status}`;
            return { statusCode: response.status || 500, body: JSON.stringify({ error: errorMessage }) };
        }
    } catch (error) {
        console.error('Erro na função generate-pix:', error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Erro interno no servidor ao gerar PIX.' }) };
    }
};
