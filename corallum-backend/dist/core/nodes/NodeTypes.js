"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllCategories = exports.getNodesByCategory = exports.getNodeByType = exports.CORALLUM_NODE_TYPES = void 0;
// Полная библиотека узлов Corallum
exports.CORALLUM_NODE_TYPES = [
    // TRIGGERS
    {
        type: 'trigger',
        displayName: 'Manual Trigger',
        description: 'Запускает workflow вручную',
        icon: 'play',
        category: 'triggers',
        shape: 'square',
        boilerplate: 'def trigger_handler():\n    # Handle trigger event\n    return {"triggered": true}'
    },
    {
        type: 'webhook',
        displayName: 'Webhook',
        description: 'HTTP trigger endpoint',
        icon: 'webhook',
        category: 'triggers',
        shape: 'square',
        boilerplate: 'def webhook_handler(request):\n    return {"status": "received"}'
    },
    {
        type: 'schedule',
        displayName: 'Schedule',
        description: 'Cron-based trigger',
        icon: 'calendar',
        category: 'triggers',
        shape: 'square',
        boilerplate: 'def scheduled_task():\n    # Runs on schedule\n    pass'
    },
    {
        type: 'manual',
        displayName: 'Manual Start',
        description: 'Manual workflow start',
        icon: 'play',
        category: 'triggers',
        shape: 'square',
        boilerplate: 'def main():\n    return {"started": true}'
    },
    // OPERATORS
    {
        type: 'action',
        displayName: 'Action',
        description: 'Execute custom action',
        icon: 'code',
        category: 'operators',
        shape: 'square',
        boilerplate: 'def action(input_data):\n    # Process data\n    return input_data'
    },
    {
        type: 'flow',
        displayName: 'Flow Step',
        description: 'Workflow step processor',
        icon: 'menu',
        category: 'operators',
        shape: 'square',
        boilerplate: 'def flow_step(input_data):\n    # Execute flow step\n    return input_data'
    },
    {
        type: 'branch',
        displayName: 'Branch',
        description: 'Conditional branching',
        icon: 'git-branch',
        category: 'operators',
        shape: 'diamond',
        boilerplate: 'def branch_condition(input_data):\n    if input_data.get("value") > 0:\n        return "positive"\n    return "negative"'
    },
    {
        type: 'forloop',
        displayName: 'For Loop',
        description: 'Iterate over collection',
        icon: 'rotate-cw',
        category: 'operators',
        shape: 'square',
        boilerplate: 'def for_loop_handler(items):\n    results = []\n    for item in items:\n        results.append(process(item))\n    return results'
    },
    {
        type: 'whileloop',
        displayName: 'While Loop',
        description: 'Loop while condition true',
        icon: 'rotate-cw',
        category: 'operators',
        shape: 'square',
        boilerplate: 'def while_loop_handler():\n    while condition:\n        # Process\n        pass\n    return {"completed": true}'
    },
    {
        type: 'script',
        displayName: 'Script',
        description: 'Execute custom script',
        icon: 'code',
        category: 'operators',
        shape: 'square',
        boilerplate: 'def script():\n    # Your custom logic\n    return {}'
    },
    {
        type: 'delay',
        displayName: 'Delay',
        description: 'Wait for specified time',
        icon: 'clock',
        category: 'operators',
        shape: 'square',
        boilerplate: 'import time\ndef delay(seconds=60):\n    time.sleep(seconds)\n    return {"delayed": seconds}'
    },
    {
        type: 'error',
        displayName: 'Error Handler',
        description: 'Handle workflow errors',
        icon: 'alert-circle',
        category: 'operators',
        shape: 'square',
        boilerplate: 'def error_handler(error):\n    # Handle error\n    return {"error": str(error)}'
    },
    // INTEGRATIONS
    {
        type: 'http',
        displayName: 'HTTP Request',
        description: 'Make HTTP API calls',
        icon: 'globe',
        category: 'integrations',
        shape: 'square',
        boilerplate: 'import requests\ndef http_request(url, method="GET"):\n    response = requests.request(method, url)\n    return response.json()'
    },
    {
        type: 'database',
        displayName: 'Database',
        description: 'Execute SQL queries',
        icon: 'database',
        category: 'integrations',
        shape: 'circle',
        boilerplate: 'SELECT * FROM users WHERE status = \'active\' LIMIT 100;'
    },
    {
        type: 'slack',
        displayName: 'Slack',
        description: 'Send Slack messages',
        icon: 'message-square',
        category: 'integrations',
        shape: 'square',
        boilerplate: 'def send_slack_message(channel, text):\n    # Send to Slack\n    return {"sent": true}'
    },
    {
        type: 'email',
        displayName: 'Email',
        description: 'Send email notifications',
        icon: 'mail',
        category: 'integrations',
        shape: 'square',
        boilerplate: 'def send_email(to, subject, body):\n    # Send email\n    return {"sent": true}'
    },
    {
        type: 'file',
        displayName: 'File Storage',
        description: 'Upload/download files',
        icon: 'file-text',
        category: 'integrations',
        shape: 'square',
        boilerplate: 'def upload_file(file_path, bucket):\n    # Upload to S3\n    return {"uploaded": true}'
    },
    {
        type: 'api',
        displayName: 'REST API',
        description: 'External API integration',
        icon: 'server',
        category: 'integrations',
        shape: 'square',
        boilerplate: 'import requests\ndef call_api(endpoint, data):\n    response = requests.post(endpoint, json=data)\n    return response.json()'
    },
    // AI AGENTS
    {
        type: 'aiagent',
        displayName: 'AI Agent',
        description: 'AI-powered processing',
        icon: 'bot',
        category: 'aiagents',
        shape: 'rectangle',
        boilerplate: 'def ai_agent(input_data):\n    # AI agent processing\n    return {"result": "processed"}'
    },
    // RESOURCES
    {
        type: 'model',
        displayName: 'AI Model',
        description: 'Machine learning model',
        icon: 'cpu',
        category: 'resources',
        shape: 'circle',
        boilerplate: 'def model_inference(input_data):\n    # ML model inference\n    return {"prediction": "result"}'
    },
    {
        type: 'memory',
        displayName: 'Memory Store',
        description: 'Vector memory storage',
        icon: 'database',
        category: 'resources',
        shape: 'circle',
        boilerplate: 'def memory_store(key, value):\n    # Store in vector DB\n    return {"stored": true}'
    },
    {
        type: 'embedding',
        displayName: 'Embedding',
        description: 'Text embedding generation',
        icon: 'cpu',
        category: 'resources',
        shape: 'circle',
        boilerplate: 'def generate_embedding(text):\n    # Generate text embedding\n    return {"embedding": [0.1, 0.2, 0.3]}'
    },
    // РФ-СПЕЦИФИЧНЫЕ CONNECTORS
    {
        type: 'telegram',
        displayName: 'Telegram Bot',
        description: 'Telegram Bot API интеграция',
        icon: 'message-circle',
        category: 'integrations',
        shape: 'square',
        boilerplate: 'def send_telegram_message(chat_id, text):\n    # Send to Telegram\n    return {"sent": true, "message_id": 12345}'
    },
    {
        type: 'vk',
        displayName: 'VK API',
        description: 'ВКонтакте API интеграция',
        icon: 'users',
        category: 'integrations',
        shape: 'square',
        boilerplate: 'def vk_wall_post(message):\n    # Post to VK wall\n    return {"post_id": 98765}'
    },
    {
        type: 'amocrm',
        displayName: 'amoCRM',
        description: 'amoCRM API интеграция',
        icon: 'briefcase',
        category: 'integrations',
        shape: 'square',
        boilerplate: 'def create_amocrm_lead(data):\n    # Create lead in amoCRM\n    return {"lead_id": 54321}'
    },
    {
        type: 'bitrix24',
        displayName: 'Bitrix24',
        description: 'Bitrix24 API интеграция',
        icon: 'building',
        category: 'integrations',
        shape: 'square',
        boilerplate: 'def create_bitrix_deal(data):\n    # Create deal in Bitrix24\n    return {"deal_id": 24680}'
    },
    {
        type: 'yandex',
        displayName: 'Yandex Services',
        description: 'Yandex Forms/Metrika/Disk API',
        icon: 'globe',
        category: 'integrations',
        shape: 'square',
        boilerplate: 'def yandex_api_request(service, data):\n    # Yandex API call\n    return {"service": service, "result": "success"}'
    },
    {
        type: 'tilda',
        displayName: 'Tilda Webhook',
        description: 'Tilda CMS webhook обработка',
        icon: 'layout',
        category: 'integrations',
        shape: 'square',
        boilerplate: 'def tilda_webhook(data):\n    # Process Tilda form submission\n    return {"processed": true}'
    },
    {
        type: 'payment',
        displayName: 'Multi-Payment Gateway',
        description: 'Поддержка всех основных РФ платежных систем',
        icon: 'credit-card',
        category: 'integrations',
        shape: 'square',
        boilerplate: 'def create_payment(provider, amount, currency="RUB", description="", payment_method="", customer_info=None):\n    # Мульти-платежная система РФ\n    \n    providers = {\n        # ОНЛАЙН-ПЛАТЕЖИ\n        "yukassa": {\n            "url": "https://api.yookassa.ru/v3/payments",\n            "methods": ["bank_card", "yoo_money", "sberbank", "qiwi", "webmoney"],\n            "commission": 0.028,\n            "min_amount": 1,\n            "max_amount": 1500000\n        },\n        "sberpay": {\n            "url": "https://api.sberbank.ru/v1/payments",\n            "methods": ["sberbank", "bank_card"],\n            "commission": 0.025,\n            "min_amount": 10,\n            "max_amount": 1000000\n        },\n        "tinkoff": {\n            "url": "https://securepay.tinkoff.ru/v2/Init",\n            "methods": ["bank_card", "tinkoff_pay", "sbp"],\n            "commission": 0.027,\n            "min_amount": 10,\n            "max_amount": 1000000\n        },\n        "raiffeisen": {\n            "url": "https://pay.raiffeisen.ru/api/v1/payments",\n            "methods": ["bank_card", "sbp"],\n            "commission": 0.025,\n            "min_amount": 10,\n            "max_amount": 500000\n        },\n        "alfa": {\n            "url": "https://payments.alfabank.ru/api/v1/payments",\n            "methods": ["bank_card", "alfa_pay", "sbp"],\n            "commission": 0.026,\n            "min_amount": 10,\n            "max_amount": 1000000\n        },\n        "vtb": {\n            "url": "https://api.vtb.ru/payments/v1",\n            "methods": ["bank_card", "vtb_online", "sbp"],\n            "commission": 0.028,\n            "min_amount": 100,\n            "max_amount": 1000000\n        },\n        "gazprom": {\n            "url": "https://api.gazprombank.ru/payments/v1",\n            "methods": ["bank_card", "gazprom_pay", "sbp"],\n            "commission": 0.025,\n            "min_amount": 10,\n            "max_amount": 1000000\n        },\n        "moscow_credit": {\n            "url": "https://api.mkb.ru/payments/v1",\n            "methods": ["bank_card", "mkb_pay", "sbp"],\n            "commission": 0.027,\n            "min_amount": 10,\n            "max_amount": 500000\n        },\n        \n        # СИСТЕМА БЫСТРЫХ ПЛАТЕЖЕЙ (СБП)\n        "sbp": {\n            "url": "https://api.nspk.ru/v1/sbp",\n            "methods": ["sbp_qr", "sbp_link"],\n            "commission": 0.005,\n            "min_amount": 10,\n            "max_amount": 100000,\n            "banks": ["sber", "tinkoff", "alfa", "vtb", "gazprom", "raiffeisen"]\n        },\n        \n        # МОБИЛЬНЫЕ ПЛАТЕЖИ\n        "qiwi": {\n            "url": "https://api.qiwi.com/partner/bill/v1/bills",\n            "methods": ["qiwi_wallet", "bank_card"],\n            "commission": 0.05,\n            "min_amount": 1,\n            "max_amount": 15000\n        },\n        "webmoney": {\n            "url": "https://api.webmoney.ru/asp/XMLPurse.asp",\n            "methods": ["wmr", "wmz", "wmu"],\n            "commission": 0.008,\n            "min_amount": 0.01,\n            "max_amount": 500000\n        },\n        "yoomoney": {\n            "url": "https://api.yoomoney.ru/api/payment",\n            "methods": ["yoo_money", "bank_card", "qiwi"],\n            "commission": 0.005,\n            "min_amount": 1,\n            "max_amount": 15000\n        },\n        \n        # КРИПТОПЛАТЕЖИ\n        "garantex": {\n            "url": "https://garantex.io/api/v1/payments",\n            "methods": ["usdt", "btc", "eth"],\n            "commission": 0.01,\n            "min_amount": 100,\n            "max_amount": 1000000\n        },\n        \n        # РАССРОЧКИ И КРЕДИТЫ\n        "tinkoff_installment": {\n            "url": "https://api.tinkoff.ru/v1/installments",\n            "methods": ["installment_4", "installment_6", "installment_12"],\n            "commission": 0.03,\n            "min_amount": 3000,\n            "max_amount": 500000\n        },\n        "ozon_installment": {\n            "url": "https://api.ozon.ru/v1/installments",\n            "methods": ["installment_3", "installment_6", "installment_12"],\n            "commission": 0.04,\n            "min_amount": 1000,\n            "max_amount": 100000\n        },\n        \n        # B2B ПЛАТЕЖИ\n        "b2b_sber": {\n            "url": "https://b2b.api.sberbank.ru/payments/v1",\n            "methods": ["account_transfer", "sbp_b2b"],\n            "commission": 0.01,\n            "min_amount": 1000,\n            "max_amount": 50000000\n        },\n        "b2b_vtb": {\n            "url": "https://b2b.api.vtb.ru/payments/v1",\n            "methods": ["account_transfer", "sbp_b2b"],\n            "commission": 0.015,\n            "min_amount": 5000,\n            "max_amount": 100000000\n        }\n    }\n    \n    # Валидация параметров\n    if provider not in providers:\n        return {"error": f"Provider {provider} not supported"}\n    \n    provider_config = providers[provider]\n    \n    if amount < provider_config["min_amount"]:\n        return {"error": f"Minimum amount is {provider_config[\'min_amount\']}"}\n    \n    if amount > provider_config["max_amount"]:\n        return {"error": f"Maximum amount is {provider_config[\'max_amount\']}"}\n    \n    # Расчет комиссии\n    commission = amount * provider_config["commission"]\n    total_amount = amount + commission\n    \n    # Создание платежа\n    payment_data = {\n        "provider": provider,\n        "payment_id": f"{provider}_{int(time.time())}_{random.randint(1000, 9999)}",\n        "amount": amount,\n        "currency": currency,\n        "commission": commission,\n        "total_amount": total_amount,\n        "description": description,\n        "payment_method": payment_method,\n        "status": "pending",\n        "created_at": datetime.now().isoformat(),\n        "payment_url": f"https://pay.{provider}.ru/pay/{payment_id}",\n        "expires_at": (datetime.now() + timedelta(hours=24)).isoformat()\n    }\n    \n    # Добавление информации о клиенте\n    if customer_info:\n        payment_data["customer"] = {\n            "email": customer_info.get("email"),\n            "phone": customer_info.get("phone"),\n            "name": customer_info.get("name"),\n            "inn": customer_info.get("inn")\n        }\n    \n    return payment_data',
        inputs: [
            { id: 'provider', name: 'Payment Provider', type: 'string', required: true, description: 'Платежная система' },
            { id: 'amount', name: 'Amount', type: 'number', required: true, description: 'Сумма платежа' },
            { id: 'description', name: 'Description', type: 'string', required: false, description: 'Описание платежа' },
            { id: 'payment_method', name: 'Payment Method', type: 'string', required: false, description: 'Способ оплаты' }
        ],
        outputs: [
            { id: 'payment_id', name: 'Payment ID', type: 'string', description: 'ID платежа' },
            { id: 'payment_url', name: 'Payment URL', type: 'string', description: 'URL для оплаты' },
            { id: 'status', name: 'Status', type: 'string', description: 'Статус платежа' },
            { id: 'commission', name: 'Commission', type: 'number', description: 'Комиссия' }
        ],
        parameters: {
            providers: {
                online: ["yukassa", "sberpay", "tinkoff", "raiffeisen", "alfa", "vtb", "gazprom", "moscow_credit"],
                sbp: ["sbp"],
                mobile: ["qiwi", "webmoney", "yoomoney"],
                crypto: ["garantex"],
                installment: ["tinkoff_installment", "ozon_installment"],
                b2b: ["b2b_sber", "b2b_vtb"]
            },
            currencies: ["RUB", "USD", "EUR"],
            default_commission: 0.028,
            refund_support: true,
            recurring_support: true
        }
    },
    // ДОПОЛНИТЕЛЬНЫЕ LOGIC ОПЕРАТОРЫ
    {
        type: 'merge',
        displayName: 'Merge Data',
        description: 'Объединяет несколько потоков данных',
        icon: 'git-merge',
        category: 'operators',
        shape: 'diamond',
        boilerplate: 'def merge_data(*streams):\n    # Merge multiple data streams\n    return {"merged": list(streams)}'
    },
    {
        type: 'split',
        displayName: 'Split Data',
        description: 'Разделяет данные на несколько потоков',
        icon: 'git-branch',
        category: 'operators',
        shape: 'diamond',
        boilerplate: 'def split_data(data, condition):\n    # Split data based on condition\n    return {"stream_a": data[:5], "stream_b": data[5:]}'
    },
    {
        type: 'switch',
        displayName: 'Switch Case',
        description: 'Переключатель на несколько условий',
        icon: 'toggle-left',
        category: 'operators',
        shape: 'diamond',
        boilerplate: 'def switch_case(value, cases):\n    # Switch based on value\n    return cases.get(value, "default")'
    },
    // DATA TRANSFORM - РФ-ШАБЛОНЫ
    {
        type: 'transform',
        displayName: 'Data Transform RU',
        description: 'Преобразование данных с РФ-специфичными шаблонами',
        icon: 'refresh-cw',
        category: 'operators',
        shape: 'square',
        boilerplate: 'def transform_data(data, operation, template=None):\n    # РФ-специфичные преобразования данных\n    \n    if operation == "json_to_table":\n        return {\n            "columns": list(data[0].keys()) if data else [],\n            "rows": [[item[col] for col in data[0].keys()] for item in data] if data else []\n        }\n    \n    elif operation == "table_to_json":\n        return [{"column": row[i] for i, column in enumerate(data["columns"])} for row in data["rows"]]\n    \n    # РФ-ФОРМАТЫ ДАННЫХ\n    elif operation == "normalize_phone":\n        # Приведение РФ номеров к формату +7XXXXXXXXXX\n        import re\n        phone = re.sub(r\'[^0-9]\', \'\', str(data))\n        if phone.startswith(\'8\'):\n            phone = \'7\' + phone[1:]\n        elif not phone.startswith(\'7\'):\n            phone = \'7\' + phone\n        return f"+{phone[:1]} {phone[1:4]} {phone[4:7]} {phone[7:9]} {phone[9:]}"\n    \n    elif operation == "normalize_inn":\n        # Валидация ИНН (10 или 12 цифр)\n        inn = re.sub(r\'[^0-9]\', \'\', str(data))\n        return inn if len(inn) in [10, 12] else None\n    \n    elif operation == "format_address":\n        # Форматирование РФ адреса\n        return {\n            "postal_code": data.get("index"),\n            "region": data.get("region"),\n            "city": data.get("city"),\n            "street": data.get("street"),\n            "house": data.get("house"),\n            "apartment": data.get("apartment"),\n            "full": f"{data.get(\'index\', \'\')}, {data.get(\'region\', \'\')}, {data.get(\'city\', \'\')}, {data.get(\'street\', \'\')} д.{data.get(\'house\', \'\')}"\n        }\n    \n    elif operation == "currency_to_number":\n        # Конвертация РФ валют в число\n        import re\n        text = str(data).lower()\n        numbers = re.findall(r\'[0-9]+\', text)\n        if not numbers:\n            return 0\n        \n        if "тыс" in text or "тысяч" in text:\n            return int(numbers[0]) * 1000\n        elif "млн" in text or "миллион" in text:\n            return int(numbers[0]) * 1000000\n        else:\n            return int(numbers[0])\n    \n    elif operation == "date_to_iso":\n        # Конвертация РФ дат в ISO формат\n        from datetime import datetime\n        ru_dates = ["%d.%m.%Y", "%d.%m.%y", "%d %B %Y", "%d %b %Y"]\n        for fmt in ru_dates:\n            try:\n                return datetime.strptime(str(data), fmt).isoformat()\n            except:\n                continue\n        return data\n    \n    elif operation == "fio_split":\n        # Разделение ФИО на компоненты\n        parts = str(data).strip().split()\n        return {\n            "last_name": parts[0] if len(parts) > 0 else "",\n            "first_name": parts[1] if len(parts) > 1 else "",\n            "middle_name": " ".join(parts[2:]) if len(parts) > 2 else "",\n            "full": data\n        }\n    \n    elif operation == "company_extract":\n        # Извлечение реквизитов компании\n        return {\n            "name": data.get("name"),\n            "inn": data.get("inn"),\n            "kpp": data.get("kpp"),\n            "ogrn": data.get("ogrn"),\n            "legal_address": data.get("address"),\n            "director": data.get("director")\n        }\n    \n    # Базовые операции\n    elif operation == "filter":\n        return [item for item in data if condition(item)]\n    elif operation == "map":\n        return [transform(item) for item in data]\n    elif operation == "aggregate":\n        return {"count": len(data), "sum": sum(data), "avg": sum(data)/len(data) if data else 0}\n    \n    return data',
        inputs: [
            { id: 'data', name: 'Input Data', type: 'any', required: true, description: 'Данные для преобразования' },
            { id: 'operation', name: 'Operation', type: 'string', required: true, description: 'Операция преобразования' }
        ],
        outputs: [
            { id: 'result', name: 'Transformed Data', type: 'any', description: 'Преобразованные данные' }
        ],
        parameters: {
            operations: [
                'json_to_table', 'table_to_json',
                'normalize_phone', 'normalize_inn', 'format_address',
                'currency_to_number', 'date_to_iso', 'fio_split', 'company_extract',
                'filter', 'map', 'aggregate'
            ],
            ru_templates: {
                phone: '+7 (XXX) XXX-XX-XX',
                inn: 'XXXXXXXXXX или XXXXXXXXXXXX',
                date: 'DD.MM.YYYY',
                currency: 'рублей, тысяч, миллионов'
            }
        }
    },
    // NLP TRIGGER - С РАСПОЗНАВАНИЕМ СУЩНОСТЕЙ
    {
        type: 'nlp_trigger',
        displayName: 'NLP Entity Trigger',
        description: 'AI парсит текст, извлекает сущности и запускает workflow',
        icon: 'bot',
        category: 'triggers',
        shape: 'rectangle',
        boilerplate: 'def parse_text_trigger(text):\n    # AI анализ текста с извлечением РФ-специфичных сущностей\n    entities = {\n        "money": extract_amount(text),      # "10 000 ₽", "5 тыс. рублей"\n        "phone": extract_phone(text),       # "+7 (999) 123-45-67"\n        "email": extract_email(text),       # "user@example.com"\n        "company": extract_company(text),    # "ООО Ромашка"\n        "inn": extract_inn(text),           # "7701234567"\n        "address": extract_address(text),    # "г. Москва, ул. Тверская, д. 1"\n        "date": extract_date(text),         # "завтра", "15.01.2026", "через 3 дня"\n        "time": extract_time(text),         # "в 15:00", "через 2 часа"\n        "product": extract_product(text),    # "iPhone 15", "услуги доставки"\n        "quantity": extract_quantity(text),  # "5 штук", "10 кг"\n        "priority": extract_priority(text)   # "срочно", "важно", "обычный"\n    }\n    \n    intent = classify_intent(text, entities)\n    confidence = calculate_confidence(text, entities, intent)\n    \n    return {\n        "intent": intent,\n        "confidence": confidence,\n        "entities": entities,\n        "normalized_text": normalize_text(text),\n        "language": detect_language(text),\n        "sentiment": analyze_sentiment(text)\n    }',
        inputs: [
            { id: 'text', name: 'Input Text', type: 'string', required: true, description: 'Текст для анализа' }
        ],
        outputs: [
            { id: 'intent', name: 'Intent', type: 'string', description: 'Распознанное намерение' },
            { id: 'entities', name: 'Entities', type: 'object', description: 'Извлеченные сущности' },
            { id: 'confidence', name: 'Confidence', type: 'number', description: 'Уверенность распознавания' }
        ],
        parameters: {
            entity_types: ['money', 'phone', 'email', 'company', 'inn', 'address', 'date', 'time', 'product', 'quantity', 'priority'],
            confidence_threshold: 0.7,
            language: 'ru',
            custom_patterns: {}
        }
    }
];
// Helper functions
const getNodeByType = (type) => {
    return exports.CORALLUM_NODE_TYPES.find(node => node.type === type);
};
exports.getNodeByType = getNodeByType;
const getNodesByCategory = (category) => {
    return exports.CORALLUM_NODE_TYPES.filter(node => node.category === category);
};
exports.getNodesByCategory = getNodesByCategory;
const getAllCategories = () => {
    return [...new Set(exports.CORALLUM_NODE_TYPES.map(node => node.category))];
};
exports.getAllCategories = getAllCategories;
//# sourceMappingURL=NodeTypes.js.map