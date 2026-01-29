import React, { useState, useEffect } from 'react';
import { X, Code, Settings, Play, Database, Zap, Globe, Mail, Calendar, Clock, Shield, Key, Link, FileText, Users, Building, CreditCard, MessageSquare, Briefcase, Layout, Server, Cpu } from 'lucide-react';
import type { Node } from '@xyflow/react';
import { useFlowStore } from '../store/flowStore';
import Editor from '@monaco-editor/react';

interface NodeParameter {
  name: string;
  displayName: string;
  type: 'string' | 'number' | 'boolean' | 'select' | 'multiSelect' | 'textarea' | 'json' | 'datetime' | 'color' | 'file';
  required?: boolean;
  description?: string;
  placeholder?: string;
  options?: { value: string; label: string; description?: string }[];
  default?: any;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

interface NodeEditorProps {
  node: Node | null;
  onClose: () => void;
}

export const NodeEditor: React.FC<NodeEditorProps> = ({ node, onClose }) => {
  const { updateNode, deleteNode, nodes } = useFlowStore();
  const [label, setLabel] = useState('');
  const [code, setCode] = useState('');
  const [language, setLanguage] = useState('python');
  const [activeTab, setActiveTab] = useState<'settings' | 'code' | 'inputs'>('settings');
  const [chatModel, setChatModel] = useState(false);
  const [memory, setMemory] = useState(false);
  const [tool, setTool] = useState(false);
  const [parameters, setParameters] = useState<Record<string, any>>({});

  // Оптимизированная конфигурация параметров (только практичное)
  const getNodeParameters = (nodeType: string): NodeParameter[] => {
    const baseParams: NodeParameter[] = [
      {
        name: 'timeout',
        displayName: 'Timeout (seconds)',
        type: 'number',
        default: 300,
        description: 'Maximum execution time',
        validation: { min: 1, max: 3600 }
      }
    ];

    switch (nodeType) {
      case 'http':
        return [
          ...baseParams,
          {
            name: 'curlImport',
            displayName: 'Import from cURL',
            type: 'textarea',
            placeholder: 'curl -X POST https://api.example.com/data -H "Content-Type: application/json" -d \'{"key": "value"}\'',
            description: 'Paste cURL command here to automatically fill in the request parameters'
          },
          {
            name: 'url',
            displayName: 'URL',
            type: 'string',
            required: true,
            placeholder: 'https://api.example.com/endpoint',
            description: 'API endpoint URL'
          },
          {
            name: 'authentication',
            displayName: 'Authentication',
            type: 'select',
            default: 'none',
            options: [
              { value: 'none', label: 'None', description: 'No authentication' },
              { value: 'predefinedCredentialType', label: 'Predefined Credential Type', description: "Use existing service credentials" },
              { value: 'genericCredentialType', label: 'Generic Credential Type', description: 'Generic auth (Basic, Header, OAuth2, etc.)' }
            ],
            description: 'Authentication method for the request'
          },
          {
            name: 'nodeCredentialType',
            displayName: 'Credential Type',
            type: 'select',
            required: true,
            default: '',
            options: [
              { value: 'httpHeaderAuth', label: 'Header Auth' },
              { value: 'httpBasicAuth', label: 'Basic Auth' },
              { value: 'httpDigestAuth', label: 'Digest Auth' },
              { value: 'httpBearerAuth', label: 'Bearer Auth' },
              { value: 'oauth2Api', label: 'OAuth2 API' }
            ],
            description: 'Select credential type for authentication'
          },
          {
            name: 'method',
            displayName: 'HTTP Method',
            type: 'select',
            required: true,
            default: 'GET',
            options: [
              { value: 'GET', label: 'GET' },
              { value: 'POST', label: 'POST' },
              { value: 'PUT', label: 'PUT' },
              { value: 'DELETE', label: 'DELETE' },
              { value: 'PATCH', label: 'PATCH' },
              { value: 'HEAD', label: 'HEAD' },
              { value: 'OPTIONS', label: 'OPTIONS' }
            ],
            description: 'HTTP request method'
          },
          {
            name: 'provideSslCertificates',
            displayName: 'SSL Certificates',
            type: 'boolean',
            default: false,
            description: 'Provide custom SSL certificates for HTTPS requests'
          },
          {
            name: 'sslCertificate',
            displayName: 'SSL Certificate File',
            type: 'string',
            placeholder: '/path/to/certificate.crt',
            description: 'Path to SSL certificate file (PEM format)',
            required: false
          },
          {
            name: 'queryParameters',
            displayName: 'Query Parameters',
            type: 'json',
            default: '{}',
            placeholder: '{"param1": "value1", "param2": "value2"}',
            description: 'Query parameters as JSON object',
            required: false
          },
          {
            name: 'bodyContentType',
            displayName: 'Body Content Type',
            type: 'select',
            default: 'json',
            options: [
              { value: 'json', label: 'JSON' },
              { value: 'formdata', label: 'Form Data' },
              { value: 'xwwwformurlencoded', label: 'x-www-form-urlencoded' },
              { value: 'binary', label: 'Binary File' },
              { value: 'raw', label: 'Raw Text' }
            ],
            description: 'Content type of the request body'
          },
          {
            name: 'body',
            displayName: 'Body Content',
            type: 'textarea',
            default: '',
            placeholder: '{"key": "value"}',
            description: 'Request body content (JSON, form data, or raw text)',
            required: false
          },
          {
            name: 'binaryData',
            displayName: 'Binary File Property',
            type: 'string',
            placeholder: 'data',
            description: 'Name of binary property containing file data',
            required: false
          },
          {
            name: 'useProxy',
            displayName: 'Use Proxy',
            type: 'boolean',
            default: false,
            description: 'Route request through proxy server'
          },
          {
            name: 'proxyUrl',
            displayName: 'Proxy URL',
            type: 'string',
            placeholder: 'http://proxy.example.com:8080',
            description: 'Proxy server URL',
            required: false
          },
          {
            name: 'retryOnFailure',
            displayName: 'Retry on Failure',
            type: 'boolean',
            default: false,
            description: 'Automatically retry failed requests'
          },
          {
            name: 'maxRetries',
            displayName: 'Max Retries',
            type: 'number',
            default: 3,
            validation: { min: 0, max: 10 },
            description: 'Maximum number of retry attempts'
          },
          {
            name: 'headers',
            displayName: 'Headers',
            type: 'json',
            default: '{"Content-Type": "application/json"}',
            description: 'HTTP headers as JSON object'
          }
        ];
      
      case 'database':
        return [
          ...baseParams,
          {
            name: 'operation',
            displayName: 'Operation',
            type: 'select',
            default: 'executeQuery',
            options: [
              { value: 'executeQuery', label: 'Execute Query' },
              { value: 'insert', label: 'Insert' },
              { value: 'update', label: 'Update' },
              { value: 'delete', label: 'Delete' },
              { value: 'select', label: 'Select' }
            ],
            description: 'Database operation type'
          },
          {
            name: 'connection',
            displayName: 'Database Type',
            type: 'select',
            required: true,
            options: [
              { value: 'postgresql', label: 'PostgreSQL' },
              { value: 'mysql', label: 'MySQL' },
              { value: 'sqlite', label: 'SQLite' },
              { value: 'mongodb', label: 'MongoDB' },
              { value: 'mssql', label: 'Microsoft SQL Server' },
              { value: 'oracle', label: 'Oracle' }
            ]
          },
          {
            name: 'connectionString',
            displayName: 'Connection String',
            type: 'string',
            required: true,
            placeholder: 'postgresql://user:password@localhost:5432/database',
            description: 'Database connection string'
          },
          {
            name: 'query',
            displayName: 'SQL Query',
            type: 'textarea',
            required: true,
            placeholder: 'SELECT * FROM users WHERE status = ?',
            description: 'SQL query to execute'
          },
          {
            name: 'queryMode',
            displayName: 'Query Mode',
            type: 'select',
            default: 'sql',
            options: [
              { value: 'sql', label: 'SQL Query' },
              { value: 'builder', label: 'Query Builder' },
              { value: 'storedprocedure', label: 'Stored Procedure' }
            ],
            description: 'How to specify the database query'
          },
          {
            name: 'table',
            displayName: 'Table Name',
            type: 'string',
            placeholder: 'users',
            description: 'Table name for query builder mode',
            required: false
          },
          {
            name: 'columns',
            displayName: 'Columns',
            type: 'string',
            placeholder: 'id, name, email, created_at',
            description: 'Columns to select (comma-separated)',
            required: false
          },
          {
            name: 'where',
            displayName: 'WHERE Clause',
            type: 'string',
            placeholder: 'status = ? AND created_at > ?',
            description: 'WHERE conditions for query',
            required: false
          },
          {
            name: 'orderBy',
            displayName: 'ORDER BY',
            type: 'string',
            placeholder: 'created_at DESC',
            description: 'ORDER BY clause for sorting',
            required: false
          },
          {
            name: 'limit',
            displayName: 'Limit',
            type: 'number',
            default: 100,
            validation: { min: 1, max: 10000 },
            description: 'Maximum number of rows to return',
            required: false
          },
          {
            name: 'offset',
            displayName: 'Offset',
            type: 'number',
            default: 0,
            validation: { min: 0 },
            description: 'Number of rows to skip (for pagination)',
            required: false
          },
          {
            name: 'enableTransaction',
            displayName: 'Enable Transaction',
            type: 'boolean',
            default: false,
            description: 'Wrap query in a transaction'
          },
          {
            name: 'returnAll',
            displayName: 'Return All Results',
            type: 'boolean',
            default: false,
            description: 'Return all results instead of first row'
          },
        ];
      
      case 'email':
        return [
          ...baseParams,
          {
            name: 'operation',
            displayName: 'Operation',
            type: 'select',
            default: 'send',
            options: [
              { value: 'send', label: 'Send' },
              { value: 'sendAndWait', label: 'Send and Wait for Response' }
            ],
            description: 'Email operation type'
          },
          {
            name: 'fromEmail',
            displayName: 'From Email',
            type: 'string',
            required: true,
            placeholder: 'sender@example.com',
            description: 'Sender email address'
          },
          {
            name: 'to',
            displayName: 'To Email',
            type: 'string',
            required: true,
            placeholder: 'user@example.com, user2@example.com',
            description: 'Recipient email addresses (comma-separated)'
          },
          {
            name: 'subject',
            displayName: 'Subject',
            type: 'string',
            required: true,
            placeholder: 'Email subject',
            description: 'Email subject line'
          },
          {
            name: 'emailFormat',
            displayName: 'Email Format',
            type: 'select',
            default: 'html',
            options: [
              { value: 'text', label: 'Text', description: 'Send email as plain text' },
              { value: 'html', label: 'HTML', description: 'Send email as HTML' },
              { value: 'both', label: 'Both', description: 'Send both formats, recipient client selects version' }
            ],
            description: 'Email content format'
          },
          {
            name: 'text',
            displayName: 'Text Content',
            type: 'textarea',
            default: '',
            placeholder: 'Plain text message',
            description: 'Plain text message content',
            required: false
          },
          {
            name: 'html',
            displayName: 'HTML Content',
            type: 'textarea',
            default: '',
            placeholder: '<h1>HTML Message</h1><p>Content here</p>',
            description: 'HTML message content',
            required: false
          },
          {
            name: 'ccEmail',
            displayName: 'CC Email',
            type: 'string',
            placeholder: 'cc@example.com, cc2@example.com',
            description: 'CC recipient email addresses (comma-separated)',
            required: false
          },
          {
            name: 'bccEmail',
            displayName: 'BCC Email',
            type: 'string',
            placeholder: 'bcc@example.com, bcc2@example.com',
            description: 'BCC recipient email addresses (comma-separated)',
            required: false
          },
          {
            name: 'attachments',
            displayName: 'Attachments',
            type: 'string',
            placeholder: 'file1, file2, image',
            description: 'Binary property names containing files to attach (comma-separated)',
            required: false
          },
          {
            name: 'ignoreSsl',
            displayName: 'Ignore SSL Issues',
            type: 'boolean',
            default: false,
            description: 'Ignore SSL certificate issues (insecure)'
          },
          {
            name: 'includeAttribution',
            displayName: 'Include Attribution',
            type: 'boolean',
            default: false,
            description: 'Include "This email was sent automatically with n8n" message'
          },
          {
            name: 'priority',
            displayName: 'Priority',
            type: 'select',
            default: 'normal',
            options: [
              { value: 'low', label: 'Low' },
              { value: 'normal', label: 'Normal' },
              { value: 'high', label: 'High' }
            ],
            description: 'Email priority level'
          },
        ];
      
      case 'webhook':
        return [
          ...baseParams,
          {
            name: 'multipleMethods',
            displayName: 'Allow Multiple HTTP Methods',
            type: 'boolean',
            default: false,
            description: 'Whether to allow the webhook to listen for multiple HTTP methods'
          },
          {
            name: 'httpMethod',
            displayName: 'HTTP Method',
            type: 'select',
            default: 'POST',
            options: [
              { value: 'GET', label: 'GET' },
              { value: 'POST', label: 'POST' },
              { value: 'PUT', label: 'PUT' },
              { value: 'DELETE', label: 'DELETE' },
              { value: 'PATCH', label: 'PATCH' },
              { value: 'HEAD', label: 'HEAD' },
              { value: 'OPTIONS', label: 'OPTIONS' }
            ],
            description: 'HTTP method to listen for'
          },
          {
            name: 'path',
            displayName: 'Webhook Path',
            type: 'string',
            required: true,
            placeholder: '/webhook/my-endpoint',
            description: 'Webhook endpoint path'
          },
          {
            name: 'authentication',
            displayName: 'Authentication',
            type: 'select',
            default: 'none',
            options: [
              { value: 'none', label: 'None' },
              { value: 'basicAuth', label: 'Basic Auth' },
              { value: 'headerAuth', label: 'Header Auth' },
              { value: 'jwtAuth', label: 'JWT Auth' }
            ],
            description: 'The way to authenticate webhook requests'
          },
          {
            name: 'responseMode',
            displayName: 'Response Mode',
            type: 'select',
            default: 'onReceived',
            options: [
              { value: 'onReceived', label: 'On Received' },
              { value: 'responseNode', label: 'Response Node' },
              { value: 'waitForCallback', label: 'Wait for Callback' }
            ],
            description: 'How the webhook should respond'
          },
          {
            name: 'responseCode',
            displayName: 'Response Code',
            type: 'select',
            default: '200',
            options: [
              { value: '200', label: '200 OK' },
              { value: '201', label: '201 Created' },
              { value: '204', label: '204 No Content' },
              { value: '400', label: '400 Bad Request' },
              { value: '401', label: '401 Unauthorized' },
              { value: '404', label: '404 Not Found' },
              { value: '500', label: '500 Internal Server Error' }
            ],
            description: 'HTTP response code to return'
          },
          {
            name: 'responseData',
            displayName: 'Response Data',
            type: 'textarea',
            default: '',
            placeholder: '{"success": true}',
            description: 'Response data to return (JSON format)',
            required: false
          },
          {
            name: 'responseHeaders',
            displayName: 'Response Headers',
            type: 'json',
            default: '{}',
            placeholder: '{"Content-Type": "application/json"}',
            description: 'Response headers as JSON object',
            required: false
          },
          {
            name: 'binaryData',
            displayName: 'Accept Binary Data',
            type: 'boolean',
            default: false,
            description: 'Accept binary file uploads'
          },
          {
            name: 'ipWhitelist',
            displayName: 'IP Whitelist',
            type: 'string',
            placeholder: '192.168.1.1, 10.0.0.1',
            description: 'Comma-separated list of allowed IP addresses',
            required: false
          }
        ];
      
      case 'schedule':
        return [
          ...baseParams,
          {
            name: 'triggerMode',
            displayName: 'Trigger Mode',
            type: 'select',
            default: 'cron',
            options: [
              { value: 'cron', label: 'Cron Expression' },
              { value: 'interval', label: 'Interval' },
              { value: 'manual', label: 'Manual Trigger' },
              { value: 'webhook', label: 'Webhook' }
            ],
            description: 'How the trigger should be activated'
          },
          {
            name: 'cronExpression',
            displayName: 'Cron Expression',
            type: 'string',
            placeholder: '0 0 * * *',
            description: 'Cron expression (e.g., "0 9 * * 1" for Monday 9 AM)',
            required: false
          },
          {
            name: 'interval',
            displayName: 'Interval',
            type: 'number',
            default: 60,
            validation: { min: 1, max: 31536000 },
            description: 'Interval in seconds (for interval mode)',
            required: false
          },
          {
            name: 'timezone',
            displayName: 'Timezone',
            type: 'select',
            default: 'UTC',
            options: [
              { value: 'UTC', label: 'UTC' },
              { value: 'America/New_York', label: 'New York (EST/EDT)' },
              { value: 'Europe/London', label: 'London (GMT/BST)' },
              { value: 'Europe/Paris', label: 'Paris (CET/CEST)' },
              { value: 'Asia/Tokyo', label: 'Tokyo (JST)' },
              { value: 'Asia/Shanghai', label: 'Shanghai (CST)' },
              { value: 'Australia/Sydney', label: 'Sydney (AEST/AEDT)' },
              { value: 'Europe/Moscow', label: 'Moscow (MSK)' }
            ],
            description: 'Timezone for schedule execution'
          },
          {
            name: 'retryOnFailure',
            displayName: 'Retry on Failure',
            type: 'boolean',
            default: false,
            description: 'Retry execution if it fails'
          },
          {
            name: 'maxRetries',
            displayName: 'Max Retries',
            type: 'number',
            default: 3,
            validation: { min: 0, max: 10 },
            description: 'Maximum number of retry attempts',
            required: false
          },
          {
            name: 'retryDelay',
            displayName: 'Retry Delay',
            type: 'number',
            default: 60,
            validation: { min: 1, max: 3600 },
            description: 'Delay between retries in seconds',
            required: false
          },
          {
            name: 'webhookPath',
            displayName: 'Webhook Path',
            type: 'string',
            placeholder: '/webhook/schedule-trigger',
            description: 'Webhook endpoint path (for webhook mode)',
            required: false
          },
          {
            name: 'webhookMethod',
            displayName: 'Webhook Method',
            type: 'select',
            default: 'POST',
            options: [
              { value: 'GET', label: 'GET' },
              { value: 'POST', label: 'POST' },
              { value: 'PUT', label: 'PUT' }
            ],
            description: 'HTTP method for webhook',
            required: false
          }
        ];
      
      case 'telegram':
        return [
          ...baseParams,
          {
            name: 'resource',
            displayName: 'Resource',
            type: 'select',
            default: 'message',
            options: [
              { value: 'message', label: 'Message' },
              { value: 'chat', label: 'Chat' },
              { value: 'file', label: 'File' },
              { value: 'callback', label: 'Callback' }
            ],
            description: 'Telegram resource to work with'
          },
          {
            name: 'operation',
            displayName: 'Operation',
            type: 'select',
            default: 'send',
            options: [
              { value: 'send', label: 'Send' },
              { value: 'edit', label: 'Edit' },
              { value: 'delete', label: 'Delete' },
              { value: 'forward', label: 'Forward' }
            ],
            description: 'Operation to perform'
          },
          {
            name: 'botToken',
            displayName: 'Bot Token',
            type: 'string',
            required: true,
            placeholder: '123456789:ABCdefGHIjklMNOpqrsTUVwxyz',
            description: 'Telegram bot token from @BotFather'
          },
          {
            name: 'chatId',
            displayName: 'Chat ID',
            type: 'string',
            required: true,
            placeholder: '@channel or 123456789',
            description: 'Target chat ID or username'
          },
          {
            name: 'messageType',
            displayName: 'Message Type',
            type: 'select',
            default: 'text',
            options: [
              { value: 'text', label: 'Text' },
              { value: 'photo', label: 'Photo' },
              { value: 'video', label: 'Video' },
              { value: 'audio', label: 'Audio' },
              { value: 'document', label: 'Document' },
              { value: 'sticker', label: 'Sticker' },
              { value: 'location', label: 'Location' },
              { value: 'contact', label: 'Contact' }
            ],
            description: 'Type of message to send'
          },
          {
            name: 'text',
            displayName: 'Text Message',
            type: 'textarea',
            placeholder: 'Your message here...',
            description: 'Text content of the message',
            required: false
          },
          {
            name: 'parseMode',
            displayName: 'Parse Mode',
            type: 'select',
            default: 'html',
            options: [
              { value: 'none', label: 'None' },
              { value: 'html', label: 'HTML' },
              { value: 'markdown', label: 'Markdown' }
            ],
            description: 'Text formatting mode'
          },
          {
            name: 'disableWebPagePreview',
            displayName: 'Disable Web Page Preview',
            type: 'boolean',
            default: false,
            description: 'Disable link preview in messages'
          },
          {
            name: 'disableNotification',
            displayName: 'Disable Notification',
            type: 'boolean',
            default: false,
            description: 'Send message silently'
          },
          {
            name: 'replyToMessageId',
            displayName: 'Reply to Message ID',
            type: 'number',
            placeholder: '12345',
            description: 'Message ID to reply to',
            required: false
          },
          {
            name: 'keyboard',
            displayName: 'Reply Keyboard',
            type: 'json',
            default: '',
            placeholder: '[["Button 1", "Button 2"], ["Button 3"]]',
            description: 'Reply keyboard markup as JSON array',
            required: false
          },
          {
            name: 'inlineKeyboard',
            displayName: 'Inline Keyboard',
            type: 'json',
            default: '',
            placeholder: '[[{"text": "Button 1", "callback_data": "btn1"}]]',
            description: 'Inline keyboard markup as JSON array',
            required: false
          },
          {
            name: 'fileId',
            displayName: 'File ID',
            type: 'string',
            placeholder: 'AgADBAADb6cxGyg...',
            description: 'File ID for photo/video/audio (for media messages)',
            required: false
          },
          {
            name: 'binaryData',
            displayName: 'Binary Data',
            type: 'string',
            placeholder: 'data',
            description: 'Binary property containing file data',
            required: false
          }
        ];
      
      case 'payment':
        return [
          ...baseParams,
          {
            name: 'operation',
            displayName: 'Operation',
            type: 'select',
            default: 'create',
            options: [
              { value: 'create', label: 'Create Payment' },
              { value: 'capture', label: 'Capture Payment' },
              { value: 'refund', label: 'Refund Payment' },
              { value: 'get', label: 'Get Payment Status' }
            ],
            description: 'Payment operation type'
          },
          {
            name: 'provider',
            displayName: 'Payment Provider',
            type: 'select',
            required: true,
            options: [
              { value: 'yukassa', label: 'YooKassa' },
              { value: 'sberpay', label: 'SberPay' },
              { value: 'tinkoff', label: 'Tinkoff' },
              { value: 'paypal', label: 'PayPal' },
              { value: 'stripe', label: 'Stripe' }
            ]
          },
          {
            name: 'amount',
            displayName: 'Amount',
            type: 'number',
            required: true,
            validation: { min: 0.01, max: 999999.99 },
            description: 'Payment amount'
          },
          {
            name: 'currency',
            displayName: 'Currency',
            type: 'select',
            default: 'RUB',
            options: [
              { value: 'RUB', label: 'Russian Ruble' },
              { value: 'USD', label: 'US Dollar' },
              { value: 'EUR', label: 'Euro' },
              { value: 'GBP', label: 'British Pound' },
              { value: 'CNY', label: 'Chinese Yuan' }
            ],
            description: 'Payment currency'
          },
          {
            name: 'description',
            displayName: 'Description',
            type: 'string',
            required: true,
            placeholder: 'Payment for goods/services',
            description: 'Payment description for customer'
          },
          {
            name: 'customerId',
            displayName: 'Customer ID',
            type: 'string',
            placeholder: 'cus_123456789',
            description: 'Customer identifier in payment system',
            required: false
          },
          {
            name: 'successUrl',
            displayName: 'Success URL',
            type: 'string',
            placeholder: 'https://example.com/success',
            description: 'URL to redirect after successful payment',
            required: false
          },
          {
            name: 'failureUrl',
            displayName: 'Failure URL',
            type: 'string',
            placeholder: 'https://example.com/failure',
            description: 'URL to redirect after failed payment',
            required: false
          },
          {
            name: 'webhookUrl',
            displayName: 'Webhook URL',
            type: 'string',
            placeholder: 'https://example.com/webhook/payment',
            description: 'URL to receive payment status notifications',
            required: false
          },
          {
            name: 'metadata',
            displayName: 'Metadata',
            type: 'json',
            default: '{}',
            placeholder: '{"order_id": "12345", "user_id": "67890"}',
            description: 'Additional metadata as JSON object',
            required: false
          },
          {
            name: 'autoCapture',
            displayName: 'Auto Capture',
            type: 'boolean',
            default: true,
            description: 'Automatically capture payment after authorization'
          },
          {
            name: 'refundReason',
            displayName: 'Refund Reason',
            type: 'string',
            placeholder: 'Customer requested refund',
            description: 'Reason for refund (required for refund operation)',
            required: false
          }
        ];
      
      case 'aiagent':
        return [
          ...baseParams,
          {
            name: 'operation',
            displayName: 'Operation',
            type: 'select',
            default: 'text',
            options: [
              { value: 'text', label: 'Text' },
              { value: 'structured', label: 'Structured Output' },
              { value: 'chat', label: 'Chat' },
              { value: 'agent', label: 'Agent' }
            ],
            description: 'AI operation type'
          },
          {
            name: 'model',
            displayName: 'AI Model',
            type: 'select',
            required: true,
            options: [
              { value: 'gpt-4', label: 'GPT-4' },
              { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
              { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
              { value: 'claude-3-opus', label: 'Claude 3 Opus' },
              { value: 'claude-3-sonnet', label: 'Claude 3 Sonnet' },
              { value: 'claude-3-haiku', label: 'Claude 3 Haiku' },
              { value: 'llama-2', label: 'Llama 2' },
              { value: 'mistral', label: 'Mistral' }
            ]
          },
          {
            name: 'prompt',
            displayName: 'System Prompt',
            type: 'textarea',
            placeholder: 'You are a helpful assistant...',
            description: 'System prompt for AI model'
          },
          {
            name: 'temperature',
            displayName: 'Temperature',
            type: 'number',
            default: 0.7,
            validation: { min: 0, max: 2 },
            description: 'Creativity level (0 = precise, 2 = creative)'
          },
          {
            name: 'maxTokens',
            displayName: 'Max Tokens',
            type: 'number',
            default: 1000,
            validation: { min: 1, max: 32000 },
            description: 'Maximum number of tokens to generate'
          },
          {
            name: 'topP',
            displayName: 'Top P',
            type: 'number',
            default: 1.0,
            validation: { min: 0, max: 1 },
            description: 'Nucleus sampling (0 = focused, 1 = diverse)'
          },
          {
            name: 'memoryType',
            displayName: 'Memory Type',
            type: 'select',
            default: 'none',
            options: [
              { value: 'none', label: 'None' },
              { value: 'buffer', label: 'Buffer Memory' },
              { value: 'summary', label: 'Summary Memory' },
              { value: 'tokenbuffer', label: 'Token Buffer Memory' }
            ],
            description: 'Conversation memory type'
          },
          {
            name: 'memorySize',
            displayName: 'Memory Size',
            type: 'number',
            default: 10,
            validation: { min: 1, max: 100 },
            description: 'Number of messages to keep in memory',
            required: false
          },
          {
            name: 'enableTools',
            displayName: 'Enable Tools',
            type: 'boolean',
            default: false,
            description: 'Allow AI to use external tools'
          },
          {
            name: 'availableTools',
            displayName: 'Available Tools',
            type: 'string',
            placeholder: 'search, calculator, code_interpreter',
            description: 'Comma-separated list of available tools',
            required: false
          },
        ];
      
      case 'slack':
        return [
          ...baseParams,
          {
            name: 'resource',
            displayName: 'Resource',
            type: 'select',
            default: 'message',
            options: [
              { value: 'message', label: 'Message' },
              { value: 'channel', label: 'Channel' },
              { value: 'file', label: 'File' },
              { value: 'user', label: 'User' },
              { value: 'reaction', label: 'Reaction' }
            ],
            description: 'Slack resource to work with'
          },
          {
            name: 'operation',
            displayName: 'Operation',
            type: 'select',
            default: 'post',
            options: [
              { value: 'post', label: 'Post' },
              { value: 'update', label: 'Update' },
              { value: 'delete', label: 'Delete' },
              { value: 'get', label: 'Get' }
            ],
            description: 'Operation to perform'
          },
          {
            name: 'authentication',
            displayName: 'Authentication',
            type: 'select',
            default: 'webhook',
            options: [
              { value: 'webhook', label: 'Webhook URL' },
              { value: 'accessToken', label: 'Access Token' },
              { value: 'oAuth2', label: 'OAuth2' }
            ],
            description: 'Authentication method'
          },
          {
            name: 'webhookUrl',
            displayName: 'Webhook URL',
            type: 'string',
            placeholder: 'https://hooks.slack.com/services/...',
            description: 'Slack webhook URL',
            required: false
          },
          {
            name: 'channel',
            displayName: 'Channel',
            type: 'string',
            placeholder: '#general',
            description: 'Target channel (e.g., #general or @username)',
            required: false
          },
          {
            name: 'text',
            displayName: 'Message',
            type: 'textarea',
            placeholder: 'Message to send',
            description: 'Message content',
            required: false
          },
          {
            name: 'messageFormat',
            displayName: 'Message Format',
            type: 'select',
            default: 'plain',
            options: [
              { value: 'plain', label: 'Plain Text' },
              { value: 'markdown', label: 'Markdown' },
              { value: 'full', label: 'Full Layout' }
            ],
            description: 'Message formatting style'
          },
          {
            name: 'attachments',
            displayName: 'Attachments',
            type: 'json',
            default: '',
            placeholder: '[{"color": "good", "text": "Attachment text"}]',
            description: 'Message attachments as JSON array',
            required: false
          },
          {
            name: 'blocks',
            displayName: 'Blocks',
            type: 'json',
            default: '',
            placeholder: '[{"type": "section", "text": {"type": "mrkdwn", "text": "*Hello*"}}]',
            description: 'Message blocks as JSON array',
            required: false
          },
          {
            name: 'threadId',
            displayName: 'Thread ID',
            type: 'string',
            placeholder: '1234567890.123456',
            description: 'Thread ID to reply to',
            required: false
          },
          {
            name: 'replyBroadcast',
            displayName: 'Reply Broadcast',
            type: 'boolean',
            default: false,
            description: 'Send reply to channel instead of thread'
          },
          {
            name: 'username',
            displayName: 'Bot Username',
            type: 'string',
            placeholder: 'My Bot',
            description: 'Custom username for the bot',
            required: false
          },
          {
            name: 'iconEmoji',
            displayName: 'Icon Emoji',
            type: 'string',
            placeholder: ':robot_face:',
            description: 'Bot icon emoji',
            required: false
          },
          {
            name: 'iconUrl',
            displayName: 'Icon URL',
            type: 'string',
            placeholder: 'https://example.com/icon.png',
            description: 'Bot icon image URL',
            required: false
          },
          {
            name: 'linkNames',
            displayName: 'Link Names',
            type: 'boolean',
            default: false,
            description: 'Find and link channel names and usernames'
          },
          {
            name: 'unfurlLinks',
            displayName: 'Unfurl Links',
            type: 'boolean',
            default: false,
            description: 'Show previews of links'
          }
        ];
      
      case 'file':
        return [
          ...baseParams,
          {
            name: 'operation',
            displayName: 'Operation',
            type: 'select',
            default: 'read',
            options: [
              { value: 'read', label: 'Read File(s) From Disk' },
              { value: 'write', label: 'Write File to Disk' },
              { value: 'convert', label: 'Convert to File' },
              { value: 'extract', label: 'Extract from File' }
            ],
            description: 'File operation type'
          },
          {
            name: 'fileName',
            displayName: 'File Path and Name',
            type: 'string',
            required: true,
            placeholder: '/data/example.jpg',
            description: 'Path and name of the file that should be written/read. Also include the file extension.'
          },
          {
            name: 'dataPropertyName',
            displayName: 'Input Binary Field',
            type: 'string',
            default: 'data',
            placeholder: 'data',
            description: 'The name of the input binary field containing the file to be written',
            required: false
          },
          {
            name: 'fileFormat',
            displayName: 'File Format',
            type: 'select',
            default: 'binary',
            options: [
              { value: 'binary', label: 'Binary' },
              { value: 'text', label: 'Text' },
              { value: 'json', label: 'JSON' },
              { value: 'csv', label: 'CSV' },
              { value: 'xml', label: 'XML' }
            ],
            description: 'File format for read/write operations'
          },
          {
            name: 'encoding',
            displayName: 'File Encoding',
            type: 'select',
            default: 'utf8',
            options: [
              { value: 'utf8', label: 'UTF-8' },
              { value: 'ascii', label: 'ASCII' },
              { value: 'base64', label: 'Base64' },
              { value: 'hex', label: 'Hexadecimal' }
            ],
            description: 'File encoding for text files',
            required: false
          },
          {
            name: 'compression',
            displayName: 'Compression',
            type: 'select',
            default: 'none',
            options: [
              { value: 'none', label: 'None' },
              { value: 'gzip', label: 'Gzip' },
              { value: 'zip', label: 'ZIP' },
              { value: 'deflate', label: 'Deflate' }
            ],
            description: 'File compression method',
            required: false
          },
          {
            name: 'append',
            displayName: 'Append to File',
            type: 'boolean',
            default: false,
            description: 'Whether to append to an existing file instead of overwriting'
          },
          {
            name: 'createDirectories',
            displayName: 'Create Directories',
            type: 'boolean',
            default: true,
            description: 'Create parent directories if they do not exist'
          },
          {
            name: 'overwrite',
            displayName: 'Overwrite Existing',
            type: 'boolean',
            default: true,
            description: 'Overwrite file if it already exists'
          },
          {
            name: 'filePermissions',
            displayName: 'File Permissions',
            type: 'string',
            placeholder: '644',
            description: 'File permissions in octal format (e.g., 644, 755)',
            required: false
          },
          {
            name: 'chunkSize',
            displayName: 'Chunk Size',
            type: 'number',
            default: 65536,
            validation: { min: 1024, max: 1048576 },
            description: 'Chunk size for file operations in bytes',
            required: false
          },
          {
            name: 'metadata',
            displayName: 'File Metadata',
            type: 'json',
            default: '{}',
            placeholder: '{"author": "John Doe", "created": "2024-01-01"}',
            description: 'Additional file metadata as JSON object',
            required: false
          },
          {
            name: 'storage',
            displayName: 'Storage Location',
            type: 'select',
            default: 'local',
            options: [
              { value: 'local', label: 'Local Disk' },
              { value: 's3', label: 'Amazon S3' },
              { value: 'gcs', label: 'Google Cloud Storage' },
              { value: 'azure', label: 'Azure Blob Storage' }
            ],
            description: 'Storage location for file operations'
          },
          {
            name: 'bucket',
            displayName: 'Storage Bucket',
            type: 'string',
            placeholder: 'my-bucket',
            description: 'Cloud storage bucket name',
            required: false
          },
          {
            name: 'encryption',
            displayName: 'Encryption',
            type: 'select',
            default: 'none',
            options: [
              { value: 'none', label: 'None' },
              { value: 'aes256', label: 'AES-256' },
              { value: 'server', label: 'Server-side' }
            ],
            description: 'File encryption method',
            required: false
          }
        ];
      
      case 'branch':
        return [
          ...baseParams,
          {
            name: 'conditions',
            displayName: 'Conditions',
            type: 'json',
            default: '{"conditions": [{"leftValue": "", "rightValue": "", "operation": "equal"}]}',
            placeholder: '{"conditions": [{"leftValue": "", "rightValue": "", "operation": "equal"}]}',
            description: 'Conditions to evaluate (JSON format)'
          },
          {
            name: 'combineOperation',
            displayName: 'Combine Operation',
            type: 'select',
            default: 'all',
            options: [
              { value: 'all', label: 'All' },
              { value: 'any', label: 'Any' }
            ],
            description: 'How to combine multiple conditions'
          },
          {
            name: 'ignoreCase',
            displayName: 'Ignore Case',
            type: 'boolean',
            default: true,
            description: 'Whether to ignore letter case when evaluating conditions'
          },
          {
            name: 'leftValue',
            displayName: 'Left Value',
            type: 'string',
            placeholder: 'Field name or static value',
            description: 'Left side of condition',
            required: false
          },
          {
            name: 'operation',
            displayName: 'Operation',
            type: 'select',
            default: 'equal',
            options: [
              { value: 'equal', label: 'Equal' },
              { value: 'notEqual', label: 'Not Equal' },
              { value: 'smaller', label: 'Smaller' },
              { value: 'smallerEqual', label: 'Smaller Equal' },
              { value: 'larger', label: 'Larger' },
              { value: 'largerEqual', label: 'Larger Equal' },
              { value: 'contains', label: 'Contains' },
              { value: 'notContains', label: 'Not Contains' },
              { value: 'startsWith', label: 'Starts With' },
              { value: 'notStartsWith', label: 'Not Starts With' },
              { value: 'endsWith', label: 'Ends With' },
              { value: 'notEndsWith', label: 'Not Ends With' },
              { value: 'regex', label: 'Regex' }
            ],
            description: 'Operation to perform'
          },
          {
            name: 'rightValue',
            displayName: 'Right Value',
            type: 'string',
            placeholder: 'Field name or static value',
            description: 'Right side of condition',
            required: false
          }
        ];
      
      case 'delay':
        return [
          ...baseParams,
          {
            name: 'amount',
            displayName: 'Wait Amount',
            type: 'number',
            default: 1,
            validation: { min: 0, max: 999999 },
            description: 'The time to wait'
          },
          {
            name: 'unit',
            displayName: 'Wait Unit',
            type: 'select',
            default: 'hours',
            options: [
              { value: 'milliseconds', label: 'Milliseconds' },
              { value: 'seconds', label: 'Seconds' },
              { value: 'minutes', label: 'Minutes' },
              { value: 'hours', label: 'Hours' },
              { value: 'days', label: 'Days' }
            ],
            description: 'The time unit of the Wait Amount value'
          },
          {
            name: 'resume',
            displayName: 'Resume',
            type: 'select',
            default: 'afterTimeInterval',
            options: [
              { value: 'afterTimeInterval', label: 'After Time Interval' },
              { value: 'webhook', label: 'Webhook' },
              { value: 'form', label: 'Form' }
            ],
            description: 'How to resume execution'
          },
          {
            name: 'limitWaitTime',
            displayName: 'Limit Wait Time',
            type: 'boolean',
            default: false,
            description: 'Whether to limit the time this node should wait for a user response'
          },
          {
            name: 'limitType',
            displayName: 'Limit Type',
            type: 'select',
            default: 'afterTimeInterval',
            options: [
              { value: 'afterTimeInterval', label: 'After Time Interval' },
              { value: 'atSpecificTime', label: 'At Specific Time' }
            ],
            description: 'Sets the condition for the execution to resume',
            required: false
          },
          {
            name: 'limitAmount',
            displayName: 'Limit Amount',
            type: 'number',
            default: 1,
            validation: { min: 0, max: 999999 },
            description: 'The time after which execution resumes',
            required: false
          },
          {
            name: 'limitUnit',
            displayName: 'Limit Unit',
            type: 'select',
            default: 'hours',
            options: [
              { value: 'milliseconds', label: 'Milliseconds' },
              { value: 'seconds', label: 'Seconds' },
              { value: 'minutes', label: 'Minutes' },
              { value: 'hours', label: 'Hours' },
              { value: 'days', label: 'Days' }
            ],
            description: 'The time unit of the Limit Amount value',
            required: false
          }
        ];
      
      case 'action':
        return [
          ...baseParams,
          {
            name: 'actionType',
            displayName: 'Action Type',
            type: 'select',
            default: 'custom',
            options: [
              { value: 'custom', label: 'Custom Action' },
              { value: 'http', label: 'HTTP Action' },
              { value: 'database', label: 'Database Action' },
              { value: 'file', label: 'File Action' },
              { value: 'notification', label: 'Notification' }
            ],
            description: 'Type of action to perform'
          },
          {
            name: 'name',
            displayName: 'Action Name',
            type: 'string',
            required: true,
            placeholder: 'My Custom Action',
            description: 'Name of the custom action'
          },
          {
            name: 'description',
            displayName: 'Description',
            type: 'string',
            placeholder: 'Description of what this action does',
            description: 'Detailed description of the action',
            required: false
          },
          {
            name: 'parameters',
            displayName: 'Parameters',
            type: 'json',
            default: '{}',
            placeholder: '{"param1": "value1", "param2": 123}',
            description: 'Action parameters as JSON object',
            required: false
          },
          {
            name: 'timeout',
            displayName: 'Timeout (seconds)',
            type: 'number',
            default: 30,
            validation: { min: 1, max: 300 },
            description: 'Maximum execution time in seconds',
            required: false
          },
          {
            name: 'retryOnFail',
            displayName: 'Retry on Fail',
            type: 'boolean',
            default: false,
            description: 'Retry action if it fails'
          },
          {
            name: 'maxRetries',
            displayName: 'Max Retries',
            type: 'number',
            default: 3,
            validation: { min: 0, max: 10 },
            description: 'Maximum number of retry attempts',
            required: false
          },
          {
            name: 'continueOnFail',
            displayName: 'Continue on Fail',
            type: 'boolean',
            default: false,
            description: 'Continue workflow even if action fails'
          }
        ];
      
      case 'error':
        return [
          ...baseParams,
          {
            name: 'errorType',
            displayName: 'Error Type',
            type: 'select',
            default: 'any',
            options: [
              { value: 'any', label: 'Any Error' },
              { value: 'timeout', label: 'Timeout Error' },
              { value: 'connection', label: 'Connection Error' },
              { value: 'authentication', label: 'Authentication Error' },
              { value: 'validation', label: 'Validation Error' },
              { value: 'custom', label: 'Custom Error' }
            ],
            description: 'Type of error to handle'
          },
          {
            name: 'action',
            displayName: 'Error Action',
            type: 'select',
            default: 'continue',
            options: [
              { value: 'continue', label: 'Continue Workflow' },
              { value: 'stop', label: 'Stop Workflow' },
              { value: 'retry', label: 'Retry Node' },
              { value: 'skip', label: 'Skip Node' },
              { value: 'redirect', label: 'Redirect to Error Path' }
            ],
            description: 'Action to take when error occurs'
          },
          {
            name: 'retryCount',
            displayName: 'Retry Count',
            type: 'number',
            default: 3,
            validation: { min: 0, max: 10 },
            description: 'Number of times to retry before giving up',
            required: false
          },
          {
            name: 'retryDelay',
            displayName: 'Retry Delay (seconds)',
            type: 'number',
            default: 5,
            validation: { min: 1, max: 300 },
            description: 'Delay between retries in seconds',
            required: false
          },
          {
            name: 'errorMessage',
            displayName: 'Custom Error Message',
            type: 'string',
            placeholder: 'Custom error description',
            description: 'Custom error message to log or send',
            required: false
          },
          {
            name: 'logError',
            displayName: 'Log Error',
            type: 'boolean',
            default: true,
            description: 'Log error details to execution logs'
          },
          {
            name: 'notifyOnError',
            displayName: 'Notify on Error',
            type: 'boolean',
            default: false,
            description: 'Send notification when error occurs'
          },
          {
            name: 'notificationChannel',
            displayName: 'Notification Channel',
            type: 'select',
            default: 'email',
            options: [
              { value: 'email', label: 'Email' },
              { value: 'slack', label: 'Slack' },
              { value: 'telegram', label: 'Telegram' },
              { value: 'webhook', label: 'Webhook' }
            ],
            description: 'Channel for error notifications',
            required: false
          }
        ];
      
      case 'forloop':
        return [
          ...baseParams,
          {
            name: 'batchSize',
            displayName: 'Batch Size',
            type: 'number',
            default: 1,
            validation: { min: 1, max: 1000 },
            description: 'The number of items to return with each call'
          },
          {
            name: 'loopMode',
            displayName: 'Loop Mode',
            type: 'select',
            default: 'items',
            options: [
              { value: 'items', label: 'Loop Over Items' },
              { value: 'range', label: 'Loop Over Range' },
              { value: 'list', label: 'Loop Over List' }
            ],
            description: 'How to iterate'
          },
          {
            name: 'startValue',
            displayName: 'Start Value',
            type: 'number',
            default: 0,
            description: 'Starting value for range loop',
            required: false
          },
          {
            name: 'endValue',
            displayName: 'End Value',
            type: 'number',
            default: 10,
            description: 'Ending value for range loop',
            required: false
          },
          {
            name: 'step',
            displayName: 'Step',
            type: 'number',
            default: 1,
            validation: { min: 1, max: 100 },
            description: 'Step increment for range loop',
            required: false
          },
          {
            name: 'listValues',
            displayName: 'List Values',
            type: 'string',
            placeholder: 'value1,value2,value3',
            description: 'Comma-separated values for list loop',
            required: false
          },
          {
            name: 'reset',
            displayName: 'Reset Loop',
            type: 'boolean',
            default: false,
            description: 'Whether the node starts again from the beginning'
          },
          {
            name: 'indexVariable',
            displayName: 'Index Variable Name',
            type: 'string',
            default: 'index',
            description: 'Name of variable to store current index',
            required: false
          },
          {
            name: 'valueVariable',
            displayName: 'Value Variable Name',
            type: 'string',
            default: 'value',
            description: 'Name of variable to store current value',
            required: false
          }
        ];
      
      case 'whileloop':
        return [
          ...baseParams,
          {
            name: 'condition',
            displayName: 'Loop Condition',
            type: 'select',
            default: 'true',
            options: [
              { value: 'true', label: 'Always True' },
              { value: 'false', label: 'Always False' },
              { value: 'expression', label: 'Expression' },
              { value: 'variable', label: 'Variable Check' }
            ],
            description: 'Condition to continue looping'
          },
          {
            name: 'conditionExpression',
            displayName: 'Condition Expression',
            type: 'string',
            placeholder: '$json.status === "active"',
            description: 'JavaScript expression for loop condition',
            required: false
          },
          {
            name: 'variableName',
            displayName: 'Variable Name',
            type: 'string',
            placeholder: 'loopCounter',
            description: 'Variable to check for condition',
            required: false
          },
          {
            name: 'variableValue',
            displayName: 'Expected Variable Value',
            type: 'string',
            placeholder: 'true',
            description: 'Value that variable should equal to continue loop',
            required: false
          },
          {
            name: 'maxIterations',
            displayName: 'Max Iterations',
            type: 'number',
            default: 100,
            validation: { min: 1, max: 10000 },
            description: 'Maximum number of loop iterations to prevent infinite loops'
          },
          {
            name: 'iterationDelay',
            displayName: 'Iteration Delay (ms)',
            type: 'number',
            default: 0,
            validation: { min: 0, max: 60000 },
            description: 'Delay between iterations in milliseconds',
            required: false
          },
          {
            name: 'breakOnValue',
            displayName: 'Break on Value',
            type: 'string',
            placeholder: 'STOP',
            description: 'Value that will break the loop if encountered',
            required: false
          },
          {
            name: 'indexVariable',
            displayName: 'Index Variable Name',
            type: 'string',
            default: 'iteration',
            description: 'Name of variable to store current iteration number',
            required: false
          }
        ];
      
      case 'merge':
        return [
          ...baseParams,
          {
            name: 'mode',
            displayName: 'Merge Mode',
            type: 'select',
            default: 'combine',
            options: [
              { value: 'combine', label: 'Combine All Input Items' },
              { value: 'mergeByPosition', label: 'Merge by Position' },
              { value: 'mergeByKey', label: 'Merge by Key' },
              { value: 'append', label: 'Append to Main Input' },
              { value: 'keepOnlyMatches', label: 'Keep Only Matches' }
            ],
            description: 'How to merge the input data'
          },
          {
            name: 'mergeByKey',
            displayName: 'Merge By Key',
            type: 'string',
            placeholder: 'id',
            description: 'Key to merge data by (for mergeByKey mode)',
            required: false
          },
          {
            name: 'includeUnpaired',
            displayName: 'Include Unpaired',
            type: 'boolean',
            default: false,
            description: 'Include items that do not have matches'
          },
          {
            name: 'renameKeys',
            displayName: 'Rename Keys',
            type: 'boolean',
            default: false,
            description: 'Rename keys to avoid conflicts when merging'
          },
          {
            name: 'keyPrefix1',
            displayName: 'Key Prefix for Input 1',
            type: 'string',
            placeholder: 'input1_',
            description: 'Prefix to add to keys from first input',
            required: false
          },
          {
            name: 'keyPrefix2',
            displayName: 'Key Prefix for Input 2',
            type: 'string',
            placeholder: 'input2_',
            description: 'Prefix to add to keys from second input',
            required: false
          },
          {
            name: 'options',
            displayName: 'Options',
            type: 'json',
            default: '{}',
            placeholder: '{"discardEmpty": true, "trimValues": false}',
            description: 'Additional merge options as JSON',
            required: false
          },
          {
            name: 'conflictResolution',
            displayName: 'Conflict Resolution',
            type: 'select',
            default: 'keepFirst',
            options: [
              { value: 'keepFirst', label: 'Keep First Value' },
              { value: 'keepLast', label: 'Keep Last Value' },
              { value: 'mergeArray', label: 'Merge into Array' },
              { value: 'skip', label: 'Skip Conflicting' }
            ],
            description: 'How to handle key conflicts when merging'
          }
        ];
      
      case 'split':
        return [
          ...baseParams,
          {
            name: 'splitMode',
            displayName: 'Split Mode',
            type: 'select',
            default: 'byField',
            options: [
              { value: 'byField', label: 'Split by Field Value' },
              { value: 'byCondition', label: 'Split by Condition' },
              { value: 'byCount', label: 'Split by Count' },
              { value: 'byPercentage', label: 'Split by Percentage' },
              { value: 'byList', label: 'Split by List Values' }
            ],
            description: 'How to split the data'
          },
          {
            name: 'splitField',
            displayName: 'Split Field',
            type: 'string',
            placeholder: 'category',
            description: 'Field to split data by',
            required: false
          },
          {
            name: 'splitCondition',
            displayName: 'Split Condition',
            type: 'string',
            placeholder: '$json.amount > 100',
            description: 'JavaScript expression to evaluate for splitting',
            required: false
          },
          {
            name: 'splitCount',
            displayName: 'Split Count',
            type: 'number',
            default: 2,
            validation: { min: 2, max: 10 },
            description: 'Number of outputs to split into',
            required: false
          },
          {
            name: 'splitPercentages',
            displayName: 'Split Percentages',
            type: 'string',
            placeholder: '50,30,20',
            description: 'Comma-separated percentages for each output',
            required: false
          },
          {
            name: 'splitValues',
            displayName: 'Split Values',
            type: 'string',
            placeholder: 'value1,value2,value3',
            description: 'Comma-separated values to split by',
            required: false
          },
          {
            name: 'outputNames',
            displayName: 'Output Names',
            type: 'string',
            placeholder: 'output1,output2,output3',
            description: 'Comma-separated names for each output',
            required: false
          },
          {
            name: 'includeUnmatched',
            displayName: 'Include Unmatched',
            type: 'boolean',
            default: true,
            description: 'Include items that do not match any split condition'
          },
          {
            name: 'unmatchedOutput',
            displayName: 'Unmatched Output',
            type: 'select',
            default: 'last',
            options: [
              { value: 'first', label: 'First Output' },
              { value: 'last', label: 'Last Output' },
              { value: 'separate', label: 'Separate Output' }
            ],
            description: 'Where to send unmatched items',
            required: false
          }
        ];
      
      case 'flow':
        return [
          ...baseParams,
          {
            name: 'stepType',
            displayName: 'Step Type',
            type: 'select',
            default: 'process',
            options: [
              { value: 'process', label: 'Process Data' },
              { value: 'validate', label: 'Validate Data' },
              { value: 'transform', label: 'Transform Data' },
              { value: 'filter', label: 'Filter Data' },
              { value: 'aggregate', label: 'Aggregate Data' }
            ],
            description: 'Type of flow step to perform'
          },
          {
            name: 'stepName',
            displayName: 'Step Name',
            type: 'string',
            required: true,
            placeholder: 'Data Processing Step',
            description: 'Name of this workflow step'
          },
          {
            name: 'description',
            displayName: 'Step Description',
            type: 'string',
            placeholder: 'Description of what this step does',
            description: 'Detailed description of the step',
            required: false
          },
          {
            name: 'inputMapping',
            displayName: 'Input Mapping',
            type: 'json',
            default: '{}',
            placeholder: '{"field1": "inputField1", "field2": "inputField2"}',
            description: 'Map input fields to internal names',
            required: false
          },
          {
            name: 'outputMapping',
            displayName: 'Output Mapping',
            type: 'json',
            default: '{}',
            placeholder: '{"outputField1": "field1", "outputField2": "field2"}',
            description: 'Map internal fields to output names',
            required: false
          },
          {
            name: 'validationRules',
            displayName: 'Validation Rules',
            type: 'json',
            default: '{}',
            placeholder: '{"required": ["field1"], "types": {"field2": "string"}}',
            description: 'Validation rules for input data',
            required: false
          },
          {
            name: 'transformationRules',
            displayName: 'Transformation Rules',
            type: 'json',
            default: '{}',
            placeholder: '{"uppercase": ["field1"], "format": {"field2": "date"}}',
            description: 'Data transformation rules',
            required: false
          },
          {
            name: 'filterConditions',
            displayName: 'Filter Conditions',
            type: 'json',
            default: '{}',
            placeholder: '{"field1": {"operator": ">", "value": 100}}',
            description: 'Conditions for filtering data',
            required: false
          },
          {
            name: 'aggregationRules',
            displayName: 'Aggregation Rules',
            type: 'json',
            default: '{}',
            placeholder: '{"groupBy": ["category"], "sum": ["amount"]}',
            description: 'Rules for data aggregation',
            required: false
          },
          {
            name: 'errorHandling',
            displayName: 'Error Handling',
            type: 'select',
            default: 'stop',
            options: [
              { value: 'stop', label: 'Stop on Error' },
              { value: 'skip', label: 'Skip on Error' },
              { value: 'log', label: 'Log and Continue' },
              { value: 'custom', label: 'Custom Handler' }
            ],
            description: 'How to handle errors in this step'
          }
        ];
      
      case 'trigger':
        return [
          ...baseParams,
          {
            name: 'triggerType',
            displayName: 'Trigger Type',
            type: 'select',
            default: 'manual',
            options: [
              { value: 'manual', label: 'Manual Trigger' },
              { value: 'button', label: 'Button Trigger' },
              { value: 'webhook', label: 'Webhook Trigger' },
              { value: 'schedule', label: 'Schedule Trigger' }
            ],
            description: 'Type of trigger mechanism'
          },
          {
            name: 'buttonText',
            displayName: 'Button Text',
            type: 'string',
            default: 'Execute Workflow',
            placeholder: 'Click to execute',
            description: 'Text displayed on trigger button',
            required: false
          },
          {
            name: 'autoExecute',
            displayName: 'Auto Execute',
            type: 'boolean',
            default: false,
            description: 'Automatically execute when workflow starts'
          },
          {
            name: 'initialData',
            displayName: 'Initial Data',
            type: 'json',
            default: '{}',
            placeholder: '{"key": "value"}',
            description: 'Initial data to pass to workflow',
            required: false
          },
          {
            name: 'triggerOnce',
            displayName: 'Trigger Once',
            type: 'boolean',
            default: false,
            description: 'Only allow one trigger execution'
          },
          {
            name: 'resetOnExecute',
            displayName: 'Reset on Execute',
            type: 'boolean',
            default: true,
            description: 'Reset trigger state after execution'
          }
        ];
      
      case 'manual':
        return [
          ...baseParams,
          {
            name: 'executionMode',
            displayName: 'Execution Mode',
            type: 'select',
            default: 'onDemand',
            options: [
              { value: 'onDemand', label: 'On Demand' },
              { value: 'scheduled', label: 'Scheduled' },
              { value: 'conditional', label: 'Conditional' }
            ],
            description: 'When to execute the manual trigger'
          },
          {
            name: 'workflowData',
            displayName: 'Workflow Data',
            type: 'json',
            default: '{}',
            placeholder: '{"input": "data", "config": "value"}',
            description: 'Data to pass to workflow when triggered manually',
            required: false
          },
          {
            name: 'requireConfirmation',
            displayName: 'Require Confirmation',
            type: 'boolean',
            default: true,
            description: 'Show confirmation dialog before execution'
          },
          {
            name: 'confirmationMessage',
            displayName: 'Confirmation Message',
            type: 'string',
            default: 'Are you sure you want to execute this workflow?',
            placeholder: 'Confirm workflow execution',
            description: 'Message shown in confirmation dialog',
            required: false
          },
          {
            name: 'executionTimeout',
            displayName: 'Execution Timeout (seconds)',
            type: 'number',
            default: 300,
            validation: { min: 10, max: 3600 },
            description: 'Maximum time for manual execution',
            required: false
          },
          {
            name: 'allowParallel',
            displayName: 'Allow Parallel Execution',
            type: 'boolean',
            default: false,
            description: 'Allow multiple manual executions simultaneously'
          }
        ];
      
      case 'api':
        return [
          ...baseParams,
          {
            name: 'url',
            displayName: 'API URL',
            type: 'string',
            required: true,
            placeholder: 'https://api.example.com/endpoint',
            description: 'The API endpoint URL'
          },
          {
            name: 'method',
            displayName: 'HTTP Method',
            type: 'select',
            default: 'GET',
            options: [
              { value: 'GET', label: 'GET' },
              { value: 'POST', label: 'POST' },
              { value: 'PUT', label: 'PUT' },
              { value: 'PATCH', label: 'PATCH' },
              { value: 'DELETE', label: 'DELETE' }
            ],
            description: 'HTTP request method'
          },
          {
            name: 'authentication',
            displayName: 'Authentication',
            type: 'select',
            default: 'none',
            options: [
              { value: 'none', label: 'None' },
              { value: 'bearer', label: 'Bearer Token' },
              { value: 'apiKey', label: 'API Key' },
              { value: 'basic', label: 'Basic Auth' },
              { value: 'oauth2', label: 'OAuth2' }
            ],
            description: 'Authentication method'
          },
          {
            name: 'apiKey',
            displayName: 'API Key',
            type: 'string',
            placeholder: 'Your API key',
            description: 'API key for authentication',
            required: false
          },
          {
            name: 'headers',
            displayName: 'Headers',
            type: 'json',
            default: '{}',
            placeholder: '{"Content-Type": "application/json"}',
            description: 'HTTP headers as JSON object',
            required: false
          },
          {
            name: 'body',
            displayName: 'Request Body',
            type: 'json',
            default: '{}',
            placeholder: '{"key": "value"}',
            description: 'Request body as JSON object',
            required: false
          },
          {
            name: 'timeout',
            displayName: 'Timeout (seconds)',
            type: 'number',
            default: 30,
            validation: { min: 1, max: 300 },
            description: 'Request timeout in seconds',
            required: false
          },
          {
            name: 'retryCount',
            displayName: 'Retry Count',
            type: 'number',
            default: 3,
            validation: { min: 0, max: 10 },
            description: 'Number of retry attempts on failure',
            required: false
          }
        ];
      
      case 'model':
        return [
          ...baseParams,
          {
            name: 'modelProvider',
            displayName: 'Model Provider',
            type: 'select',
            default: 'openai',
            options: [
              { value: 'openai', label: 'OpenAI' },
              { value: 'anthropic', label: 'Anthropic' },
              { value: 'google', label: 'Google AI' },
              { value: 'huggingface', label: 'Hugging Face' },
              { value: 'local', label: 'Local Model' }
            ],
            description: 'AI model provider'
          },
          {
            name: 'modelName',
            displayName: 'Model Name',
            type: 'select',
            default: 'gpt-4',
            options: [
              { value: 'gpt-4', label: 'GPT-4' },
              { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' },
              { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
              { value: 'claude-3', label: 'Claude 3' },
              { value: 'gemini-pro', label: 'Gemini Pro' }
            ],
            description: 'Specific AI model to use'
          },
          {
            name: 'operation',
            displayName: 'Operation',
            type: 'select',
            default: 'completion',
            options: [
              { value: 'completion', label: 'Text Completion' },
              { value: 'chat', label: 'Chat Completion' },
              { value: 'embedding', label: 'Text Embedding' },
              { value: 'classification', label: 'Text Classification' },
              { value: 'summarization', label: 'Text Summarization' }
            ],
            description: 'Type of AI operation to perform'
          },
          {
            name: 'prompt',
            displayName: 'Prompt',
            type: 'textarea',
            placeholder: 'Enter your prompt here...',
            description: 'The prompt to send to the AI model',
            required: true
          },
          {
            name: 'temperature',
            displayName: 'Temperature',
            type: 'number',
            default: 0.7,
            validation: { min: 0, max: 2 },
            description: 'Creativity level (0 = precise, 2 = creative)',
            required: false
          },
          {
            name: 'maxTokens',
            displayName: 'Max Tokens',
            type: 'number',
            default: 1000,
            validation: { min: 1, max: 4000 },
            description: 'Maximum number of tokens to generate',
            required: false
          },
          {
            name: 'apiKey',
            displayName: 'API Key',
            type: 'string',
            placeholder: 'Your API key',
            description: 'API key for the model provider',
            required: false
          },
          {
            name: 'systemPrompt',
            displayName: 'System Prompt',
            type: 'textarea',
            placeholder: 'You are a helpful assistant...',
            description: 'System prompt for chat completions',
            required: false
          }
        ];
      
      case 'memory':
        return [
          ...baseParams,
          {
            name: 'storeType',
            displayName: 'Memory Store Type',
            type: 'select',
            default: 'chroma',
            options: [
              { value: 'chroma', label: 'ChromaDB' },
              { value: 'pinecone', label: 'Pinecone' },
              { value: 'weaviate', label: 'Weaviate' },
              { value: 'redis', label: 'Redis' },
              { value: 'local', label: 'Local File' }
            ],
            description: 'Type of vector memory store'
          },
          {
            name: 'operation',
            displayName: 'Operation',
            type: 'select',
            default: 'store',
            options: [
              { value: 'store', label: 'Store Memory' },
              { value: 'retrieve', label: 'Retrieve Memory' },
              { value: 'search', label: 'Search Memory' },
              { value: 'delete', label: 'Delete Memory' },
              { value: 'update', label: 'Update Memory' }
            ],
            description: 'Memory operation to perform'
          },
          {
            name: 'collectionName',
            displayName: 'Collection Name',
            type: 'string',
            default: 'workflow_memory',
            placeholder: 'my_collection',
            description: 'Name of the memory collection',
            required: true
          },
          {
            name: 'embeddingModel',
            displayName: 'Embedding Model',
            type: 'select',
            default: 'text-embedding-ada-002',
            options: [
              { value: 'text-embedding-ada-002', label: 'OpenAI Ada-002' },
              { value: 'text-embedding-3-small', label: 'OpenAI Small' },
              { value: 'text-embedding-3-large', label: 'OpenAI Large' },
              { value: 'sentence-transformers', label: 'Sentence Transformers' }
            ],
            description: 'Model for text embeddings'
          },
          {
            name: 'text',
            displayName: 'Text to Store/Search',
            type: 'textarea',
            placeholder: 'Enter text to store in memory...',
            description: 'Text content for memory operation',
            required: false
          },
          {
            name: 'metadata',
            displayName: 'Metadata',
            type: 'json',
            default: '{}',
            placeholder: '{"source": "user_input", "timestamp": "2024-01-01"}',
            description: 'Additional metadata as JSON',
            required: false
          },
          {
            name: 'searchQuery',
            displayName: 'Search Query',
            type: 'string',
            placeholder: 'Search for similar memories...',
            description: 'Query for searching memories',
            required: false
          },
          {
            name: 'topK',
            displayName: 'Top K Results',
            type: 'number',
            default: 5,
            validation: { min: 1, max: 100 },
            description: 'Number of top results to return',
            required: false
          },
          {
            name: 'similarityThreshold',
            displayName: 'Similarity Threshold',
            type: 'number',
            default: 0.7,
            validation: { min: 0, max: 1 },
            description: 'Minimum similarity score for matches',
            required: false
          }
        ];
      
      case 'script':
        return [
          ...baseParams,
          {
            name: 'mode',
            displayName: 'Mode',
            type: 'select',
            default: 'runOnceForAllItems',
            options: [
              { value: 'runOnceForAllItems', label: 'Run Once for All Items' },
              { value: 'runOnceForEachItem', label: 'Run Once for Each Item' }
            ],
            description: 'How to execute the code'
          },
          {
            name: 'language',
            displayName: 'Language',
            type: 'select',
            default: 'javascript',
            options: [
              { value: 'javascript', label: 'JavaScript' },
              { value: 'python', label: 'Python' }
            ],
            description: 'Programming language'
          },
          {
            name: 'jsCode',
            displayName: 'JavaScript Code',
            type: 'textarea',
            default: `// Code here will run only once, no matter how many input items there are.
// Loop over inputs and add a new field called 'myNewField' to the JSON of each one
for (item of items) {
  item.json.myNewField = 1;
}

return items;`,
            placeholder: '// Your JavaScript code here...',
            description: 'The JavaScript code to execute',
            required: false
          },
          {
            name: 'pythonCode',
            displayName: 'Python Code',
            type: 'textarea',
            default: `# Code here will run only once, no matter how many input items there are.
# Loop over inputs and add a new field called 'myNewField' to the JSON of each one
for item in items:
    item['json']['myNewField'] = 1

return items`,
            placeholder: '# Your Python code here...',
            description: 'The Python code to execute',
            required: false
          },
          {
            name: 'timeout',
            displayName: 'Timeout (seconds)',
            type: 'number',
            default: 30,
            validation: { min: 1, max: 300 },
            description: 'Maximum execution time in seconds',
            required: false
          },
          {
            name: 'continueOnFail',
            displayName: 'Continue on Fail',
            type: 'boolean',
            default: false,
            description: 'Continue workflow even if code fails'
          }
        ];
      
      default:
        return baseParams;
    }
  };

  useEffect(() => {
    if (node && node.data) {
      setLabel(String(node.data.label || ''));
      setCode(String(node.data.code || ''));
      setLanguage(String(node.data.language || 'python'));
      setChatModel(Boolean(node.data.chatModel));
      setMemory(Boolean(node.data.memory));
      setTool(Boolean(node.data.tool));
      
      // Initialize parameters from node data
      const nodeParams = getNodeParameters(String(node.data.type));
      const initialParams: Record<string, any> = {};
      nodeParams.forEach(param => {
        initialParams[param.name] = node.data[param.name] ?? param.default;
      });
      setParameters(initialParams);
    }
  }, [node]);

  if (!node) return null;

  const handleSave = () => {
    const nodeType = node.data.type;
    const updateData: any = { label, code, language, ...parameters };
    if (nodeType === 'aiagent') {
      updateData.chatModel = chatModel;
      updateData.memory = memory;
      updateData.tool = tool;
    }
    updateNode(node.id, updateData);
    onClose();
  };

  const handleParameterChange = (name: string, value: any) => {
    setParameters(prev => ({ ...prev, [name]: value }));
  };

  // Рендерер параметров в стиле n8n
  const renderParameterInput = (param: NodeParameter) => {
    const value = parameters[param.name] ?? param.default;
    const isRequired = param.required ? ' *' : '';

    switch (param.type) {
      case 'string':
        return (
          <div key={param.name} className="form-group">
            <label>{param.displayName}{isRequired}</label>
            <input
              type="text"
              value={value || ''}
              onChange={(e) => handleParameterChange(param.name, e.target.value)}
              placeholder={param.placeholder}
              className="input-field"
            />
            {param.description && <small className="param-description">{param.description}</small>}
          </div>
        );
      
      case 'number':
        return (
          <div key={param.name} className="form-group">
            <label>{param.displayName}{isRequired}</label>
            <input
              type="number"
              value={value || ''}
              onChange={(e) => handleParameterChange(param.name, Number(e.target.value))}
              min={param.validation?.min}
              max={param.validation?.max}
              className="input-field"
            />
            {param.description && <small className="param-description">{param.description}</small>}
          </div>
        );
      
      case 'boolean':
        return (
          <div key={param.name} className="form-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={Boolean(value)}
                onChange={(e) => handleParameterChange(param.name, e.target.checked)}
              />
              <span>{param.displayName}{isRequired}</span>
            </label>
            {param.description && <small className="param-description">{param.description}</small>}
          </div>
        );
      
      case 'select':
        return (
          <div key={param.name} className="form-group">
            <label>{param.displayName}{isRequired}</label>
            <select
              value={value || ''}
              onChange={(e) => handleParameterChange(param.name, e.target.value)}
              className="input-field"
            >
              {param.options?.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {param.description && <small className="param-description">{param.description}</small>}
          </div>
        );
      
      case 'textarea':
        return (
          <div key={param.name} className="form-group">
            <label>{param.displayName}{isRequired}</label>
            <textarea
              value={value || ''}
              onChange={(e) => handleParameterChange(param.name, e.target.value)}
              placeholder={param.placeholder}
              className="textarea-field"
              rows={4}
            />
            {param.description && <small className="param-description">{param.description}</small>}
          </div>
        );
      
      case 'json':
        return (
          <div key={param.name} className="form-group">
            <label>{param.displayName}{isRequired}</label>
            <textarea
              value={value || ''}
              onChange={(e) => handleParameterChange(param.name, e.target.value)}
              placeholder={param.placeholder || '{}'}
              className="textarea-field"
              rows={6}
              style={{ fontFamily: 'monospace' }}
            />
            {param.description && <small className="param-description">{param.description}</small>}
          </div>
        );
      
      default:
        return null;
    }
  };

  const handleEditorChange = (value: string | undefined) => {
    setCode(value || '');
  };

  // Get available inputs from previous nodes
  const getPreviousNodes = () => {
    return nodes.filter(n => n.id !== node.id);
  };

  const getMonacoLanguage = (lang: string) => {
    const languageMap: Record<string, string> = {
      'python': 'python',
      'typescript': 'typescript',
      'javascript': 'javascript',
      'sql': 'sql',
      'bash': 'shell',
      'go': 'go'
    };
    return languageMap[lang] || 'python';
  };

  const getBoilerplateCode = (lang: string) => {
    const boilerplates: Record<string, string> = {
      python: `def main(input_data):
    """
    Process input data and return result
    Args:
        input_data: Input from previous node
    Returns:
        dict: Processed result
    """
    # Your code here
    result = {
        "status": "success",
        "data": input_data
    }
    return result`,
      typescript: `interface Input {
  data: any;
}

interface Output {
  status: string;
  data: any;
}

export async function main(input: Input): Promise<Output> {
  // Your code here
  return {
    status: "success",
    data: input.data
  };
}`,
      sql: `-- Query data from database
SELECT 
    id,
    name,
    created_at
FROM 
    users
WHERE 
    status = 'active'
LIMIT 100;`
    };
    return boilerplates[lang] || '';
  };

  return (
    <div className="right-panel active">
      <div className="node-editor">
      <div className="node-editor-header">
        <div className="header-title">
          <Settings size={18} />
          <h3>Node: {label || 'Untitled'}</h3>
        </div>
        <button className="close-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>

      {/* Tab Navigation - Settings First */}
      <div className="node-editor-tabs">
        <button 
          className={`tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={16} />
          <span>Settings</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'code' ? 'active' : ''}`}
          onClick={() => setActiveTab('code')}
        >
          <Code size={16} />
          <span>Code</span>
        </button>
        <button 
          className={`tab-btn ${activeTab === 'inputs' ? 'active' : ''}`}
          onClick={() => setActiveTab('inputs')}
        >
          <Database size={16} />
          <span>Inputs</span>
        </button>
      </div>

      <div className="node-editor-content">
        {activeTab === 'settings' && (
          <div className="editor-tab-content">
            {/* Basic Settings */}
            <div className="settings-section">
              <h4 className="section-title">
                <Settings size={16} />
                Basic Settings
              </h4>
              
              <div className="form-group">
                <label>Node Name</label>
                <input
                  type="text"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Enter node name..."
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  placeholder="Describe what this node does..."
                  className="textarea-field"
                  rows={3}
                />
              </div>
            </div>

            {/* Node-specific Parameters - Simplified */}
            <div className="settings-section">
              <h4 className="section-title">
                <Globe size={16} />
                Configuration
              </h4>
              
              <div className="params-grid">
                {getNodeParameters(String(node.data.type)).map(renderParameterInput)}
              </div>
            </div>

            {/* AI Agent Settings */}
            {node.data.type === 'aiagent' && (
              <div className="settings-section">
                <h4 className="section-title">
                  <Cpu size={16} />
                  AI Agent Connections
                </h4>
                
                <label className="checkbox-label" style={{ marginBottom: '8px' }}>
                  <input 
                    type="checkbox" 
                    checked={chatModel}
                    onChange={(e) => setChatModel(e.target.checked)}
                  />
                  <span>Chat Model</span>
                </label>
                
                <label className="checkbox-label" style={{ marginBottom: '8px' }}>
                  <input 
                    type="checkbox" 
                    checked={memory}
                    onChange={(e) => setMemory(e.target.checked)}
                  />
                  <span>Memory</span>
                </label>
                
                <label className="checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={tool}
                    onChange={(e) => setTool(e.target.checked)}
                  />
                  <span>Tool</span>
                </label>
              </div>
            )}
          </div>
        )}

        {activeTab === 'code' && (
          <div className="editor-tab-content">
            <div className="form-group">
              <label>Language</label>
              <select 
                value={language} 
                onChange={(e) => {
                  const newLang = e.target.value;
                  setLanguage(newLang);
                  if (!code) {
                    setCode(getBoilerplateCode(newLang));
                  }
                }}
                className="language-select"
              >
                <option value="python">Python</option>
                <option value="typescript">TypeScript</option>
                <option value="javascript">JavaScript</option>
                <option value="sql">SQL</option>
                <option value="bash">Bash</option>
                <option value="go">Go</option>
              </select>
            </div>

            <div className="form-group monaco-container">
              <div className="label-with-icon">
                <Code size={14} />
                <label>Source Code</label>
                <button 
                  className="btn-boilerplate"
                  onClick={() => setCode(getBoilerplateCode(language))}
                >
                  <Zap size={12} />
                  Insert Boilerplate
                </button>
              </div>
              <div className="monaco-editor-wrapper">
                <Editor
                  height="400px"
                  language={getMonacoLanguage(language)}
                  value={code}
                  onChange={handleEditorChange}
                  theme="vs-dark"
                  options={{
                    minimap: { enabled: false },
                    fontSize: 13,
                    lineNumbers: 'on',
                    roundedSelection: false,
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    tabSize: 2,
                    wordWrap: 'on',
                    padding: { top: 10, bottom: 10 }
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'inputs' && (
          <div className="editor-tab-content">
            <div className="inputs-section">
              <h4>Data Mapping</h4>
              <p className="section-description">
                Select outputs from previous nodes as inputs for this node
              </p>
              
              <div className="available-inputs">
                {getPreviousNodes().length > 0 ? (
                  getPreviousNodes().map(prevNode => (
                    <div key={prevNode.id} className="input-node-card">
                      <div className="input-node-header">
                        <Database size={16} />
                        <span>{String(prevNode.data.label || prevNode.id)}</span>
                      </div>
                      <div className="input-reference">
                        <code>{`{{nodes.${prevNode.id}.output}}`}</code>
                        <button 
                          className="btn-copy"
                          onClick={() => {
                            navigator.clipboard.writeText(`{{nodes.${prevNode.id}.output}}`);
                          }}
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <Database size={32} />
                    <p>No previous nodes available</p>
                    <span>Connect nodes to enable data mapping</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="node-editor-footer">
        <button className="btn-delete" onClick={() => { deleteNode(node.id); onClose(); }}>
          Delete Node
        </button>
        <div className="footer-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSave}>
            <Play size={14} />
            Save Changes
          </button>
        </div>
      </div>
    </div>
    </div>
  );
};
