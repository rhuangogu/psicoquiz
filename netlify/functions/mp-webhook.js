// netlify/functions/mp-webhook.js
// Este arquivo é o Webhook que o Mercado Pago chama. Não precisa de alteração no domínio.

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Método não permitido.' };
    }

    try {
        const body = JSON.parse(event.body);
        
        if (body.type !== 'payment') {
            return { statusCode: 200, body: 'Ignorando notificação não-pagamento.' };
        }

        const paymentStatus = body.data.status; 
        const externalReference = body.data.external_reference; 
        
        if (paymentStatus === 'approved') {
            console.log(`Pagamento APROVADO via Webhook: Referência ${externalReference}.`);
            // Em um sistema real, você usaria essa confirmação para liberar o resultado 
            // no banco de dados e o cliente clicaria para consultar a liberação.

            // Retorna 200 para o Mercado Pago, confirmando o recebimento da notificação.
            return {
                statusCode: 200,
                body: JSON.stringify({ message: `Pagamento ${body.data.id} aprovado e registrado.` }),
            };
        } else {
             console.log(`Pagamento com status: ${paymentStatus}. Referência: ${externalReference}.`);
        }

    } catch (error) {
        console.error('Erro no Webhook:', error);
        return { statusCode: 500, body: 'Erro interno no Webhook.' };
    }

};
