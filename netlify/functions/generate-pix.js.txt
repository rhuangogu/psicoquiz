// netlify/functions/generate-pix.js
const fetch = require('node-fetch');

// Pega a chave secreta das variáveis de ambiente do Netlify (MP_ACCESS_TOKEN)
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN; [cite: 1]
// URL base do seu site Netlify. (Você confirmou que esta é a correta)
const YOUR_NETLIFY_SITE_URL = 'https://psicoreverso.netlify.app'; [cite: 2]

exports.handler = async (event) => { [cite: 3]
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Método não permitido' }; [cite: 3]
    }

    if (!MP_ACCESS_TOKEN) {
         return { statusCode: 500, body: JSON.stringify({ error: 'Chave do Mercado Pago não configurada (MP_ACCESS_TOKEN).' }) }; [cite: 4]
    }

    try {
        const body = JSON.parse(event.body); [cite: 5]
        const { quizId, answersHash } = body; [cite: 6] 

        // 1. Dados da Ordem de Pagamento
        const paymentData = {
            transaction_amount: 8.99, // R$ 8,99
            description: `Relatório PsicoQuiz - ${quizId}`,
            payment_method_id: 'pix',
            external_reference: `${quizId}|${answersHash}`, [cite: 7]
            // Webhook para a Netlify Function mp-webhook
            notification_url: `${YOUR_NETLIFY_SITE_URL}/.netlify/functions/mp-webhook`, [cite: 7]
            payer: {
                email: 'cliente@psicoquiz.com',
                first_name: 'Cliente',
                last_name: 'PsicoQuiz',
            }
        }; [cite: 7]

        // 2. Chama a API do Mercado Pago
        const response = await fetch('https://api.mercadopago.com/v1/payments', { [cite: 8]
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
            }, [cite: 8]
       
             body: JSON.stringify(paymentData) [cite: 9]
        });

        const data = await response.json();

        if (response.ok) { [cite: 10]
            // Retorna a imagem do QR Code e a chave PIX para o Frontend
            const pixInfo = data.point_of_interaction.transaction_data; [cite: 10]
            return {
                statusCode: 200,
                body: JSON.stringify({
                    id: data.id,
                    qrCode: pixInfo.qr_code,
                    qrCodeBase64: pixInfo.qr_code_base64,
  
                    pixKey: pixInfo.qr_code, [cite: 12]
                }),
            }; [cite: 11]
        } else {
            console.error('Erro MP:', data); [cite: 13]
            return { statusCode: 500, body: JSON.stringify({ error: `Falha ao criar o pagamento no MP. Status: ${response.status}` }) }; [cite: 14]
        }
    } catch (error) {
        console.error('Erro na função generate-pix:', error); [cite: 15]
        return { statusCode: 500, body: JSON.stringify({ error: error.message }) }; [cite: 16]
    }
};
