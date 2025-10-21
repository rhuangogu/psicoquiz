// netlify/functions/check-payment-status.js
const fetch = require('node-fetch');

const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

exports.handler = async (event) => {
    // Permite apenas requisições GET
    if (event.httpMethod !== 'GET') {
        return { statusCode: 405, body: 'Método não permitido' };
    }

    // Verifica se a chave do MP está configurada
    if (!MP_ACCESS_TOKEN) {
        return { statusCode: 500, body: JSON.stringify({ error: 'Chave do Mercado Pago não configurada.' }) };
    }

    // Pega o ID do pagamento que veio na URL (ex: /.netlify/functions/check-payment-status?payment_id=12345)
    const paymentId = event.queryStringParameters.payment_id;

    if (!paymentId) {
        return { statusCode: 400, body: JSON.stringify({ error: 'ID do pagamento (payment_id) não fornecido.' }) };
    }

    try {
        // Monta a URL para consultar o pagamento específico na API do Mercado Pago
        const url = `https://api.mercadopago.com/v1/payments/${paymentId}`;

        // Chama a API do Mercado Pago para pegar os detalhes do pagamento
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${MP_ACCESS_TOKEN}`
            }
        });

        const data = await response.json();

        if (response.ok) {
            // Se a chamada foi bem-sucedida, retorna o status do pagamento
            return {
                statusCode: 200,
                body: JSON.stringify({
                    status: data.status // Ex: "pending", "approved", "cancelled"
                })
            };
        } else {
            // Se o Mercado Pago retornou um erro (ex: pagamento não encontrado)
            console.error(`Erro ao consultar pagamento ${paymentId} no MP:`, data);
            return { statusCode: response.status || 500, body: JSON.stringify({ error: `Erro ao consultar status no MP: ${data.message || response.status}` }) };
        }

    } catch (error) {
        console.error(`Erro na função check-payment-status para ID ${paymentId}:`, error);
        return { statusCode: 500, body: JSON.stringify({ error: 'Erro interno no servidor ao verificar status.' }) };
    }
};
