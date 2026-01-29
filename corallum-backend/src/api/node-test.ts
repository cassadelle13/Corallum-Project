// Тестирование новых улучшенных узлов
import { NodeRegistry } from '../core/nodes/NodeRegistry';

export const testEnhancedNodes = async () => {
    const nodeRegistry = new NodeRegistry();
    
    console.log('🧪 Тестирование улучшенных узлов Corallum\n');
    
    // Тест 1: NLP Trigger с распознаванием сущностей
    console.log('🤖 1. NLP Entity Trigger:');
    const nlpResult = await nodeRegistry.getNode('nlp_trigger')?.execute({
        parameters: {
            input: "Привет! Мне нужна доставка 5 кг яблок по адресу г. Москва, ул. Тверская, д. 1. Телефон +7 (999) 123-45-67, email ivan@example.com. Бюджет 10 000 рублей. ООО Ромашка, ИНН 7701234567. Срочно!"
        }
    });
    console.log('   Результат:', JSON.stringify(nlpResult, null, 2));
    
    // Тест 2: Data Transform с РФ-шаблонами
    console.log('\n🔄 2. Data Transform RU:');
    
    // Нормализация телефона
    const phoneResult = await nodeRegistry.getNode('transform')?.execute({
        parameters: {
            operation: 'normalize_phone',
            input: '8 (999) 123-45-67'
        }
    });
    console.log('   Нормализация телефона:', phoneResult);
    
    // Валидация ИНН
    const innResult = await nodeRegistry.getNode('transform')?.execute({
        parameters: {
            operation: 'normalize_inn',
            input: '7701234567'
        }
    });
    console.log('   Валидация ИНН:', innResult);
    
    // Конвертация валюты
    const currencyResult = await nodeRegistry.getNode('transform')?.execute({
        parameters: {
            operation: 'currency_to_number',
            input: '10 тысяч рублей'
        }
    });
    console.log('   Конвертация валюты:', currencyResult);
    
    // Разделение ФИО
    const fioResult = await nodeRegistry.getNode('transform')?.execute({
        parameters: {
            operation: 'fio_split',
            input: 'Иванов Иван Иванович'
        }
    });
    console.log('   Разделение ФИО:', fioResult);
    
    // Тест 3: Multi-Payment Gateway
    console.log('\n💳 3. Multi-Payment Gateway:');
    
    const paymentProviders = ['yukassa', 'sberpay', 'tinkoff', 'sbp', 'qiwi'];
    
    for (const provider of paymentProviders) {
        const paymentResult = await nodeRegistry.getNode('payment')?.execute({
            parameters: {
                provider: provider,
                amount: 10000,
                description: 'Заказ №12345',
                payment_method: 'bank_card',
                customer_info: {
                    email: 'customer@example.com',
                    phone: '+79991234567',
                    name: 'Иван Иванов'
                }
            }
        });
        console.log(`   ${provider}:`, {
            payment_id: paymentResult?.payment_id,
            commission: paymentResult?.commission,
            total_amount: paymentResult?.total_amount,
            status: paymentResult?.status
        });
    }
    
    // Тест 4: РФ-коннекторы
    console.log('\n🇷🇺 4. РФ-специфичные коннекторы:');
    
    // Telegram
    const telegramResult = await nodeRegistry.getNode('telegram')?.execute({
        parameters: {
            chat_id: '123456789',
            message: 'Ваш заказ №12345 принят в обработку!'
        }
    });
    console.log('   Telegram:', telegramResult);
    
    // amoCRM
    const amocrmResult = await nodeRegistry.getNode('amocrm')?.execute({
        parameters: {
            name: 'Иван Иванов',
            phone: '+79991234567',
            email: 'ivan@example.com'
        }
    });
    console.log('   amoCRM:', amocrmResult);
    
    // VK
    const vkResult = await nodeRegistry.getNode('vk')?.execute({
        parameters: {
            message: 'Новая акция! Скидка 20% на все товары!',
            group_id: '123456789'
        }
    });
    console.log('   VK:', vkResult);
    
    // Тест 5: Logic операторы
    console.log('\n🔀 5. Улучшенные Logic операторы:');
    
    // Merge
    const mergeResult = await nodeRegistry.getNode('merge')?.execute({
        parameters: {
            streams: [['a', 'b'], ['c', 'd'], ['e']]
        }
    });
    console.log('   Merge:', mergeResult);
    
    // Split
    const splitResult = await nodeRegistry.getNode('split')?.execute({
        parameters: {
            data: ['a', 'b', 'c', 'd', 'e'],
            condition: 'first_3'
        }
    });
    console.log('   Split:', splitResult);
    
    console.log('\n✅ Все тесты завершены!');
    console.log('🎯 Corallum готов для РФ-рынка с улучшенными узлами!');
};

// Экспорт для использования в других модулях
// Тесты запускаются через API endpoint POST /api/v1/test/nodes
