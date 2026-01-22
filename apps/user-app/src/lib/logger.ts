type LogLevel = 'info' | 'warn' | 'error';

const REDACT_KEYS = ['password', 'token', 'secret', 'credit_card', 'cc', 'cvv', 'card_number'];
const PII_PATTERNS = [
    /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi, // Email
    /(\d{10})/g, // Phone (simple 10 digit)
];

const redact = (data: any): any => {
    if (!data) return data;
    if (typeof data === 'string') {
        let redacted = data;
        PII_PATTERNS.forEach(pattern => {
            redacted = redacted.replace(pattern, '***');
        });
        return redacted;
    }
    if (Array.isArray(data)) {
        return data.map(redact);
    }
    if (typeof data === 'object') {
        const newData: any = {};
        for (const key in data) {
            if (REDACT_KEYS.some(k => key.toLowerCase().includes(k))) {
                newData[key] = '***REDACTED***';
            } else {
                newData[key] = redact(data[key]);
            }
        }
        return newData;
    }
    return data;
};

const log = (level: LogLevel, message: string, meta?: any) => {
    if (process.env.NODE_ENV === 'test') return;

    const timestamp = new Date().toISOString();
    const safeMeta = redact(meta);

    const logEntry = {
        timestamp,
        level,
        message,
        meta: safeMeta,
    };

    // In production, you'd send this to Sentry/etc.
    // For now, we print to console but safely.
    if (level === 'error') {
        console.error(JSON.stringify(logEntry));
    } else if (level === 'warn') {
        console.warn(JSON.stringify(logEntry));
    } else {
        console.log(JSON.stringify(logEntry));
    }
};

export const logger = {
    info: (message: string, meta?: any) => log('info', message, meta),
    warn: (message: string, meta?: any) => log('warn', message, meta),
    error: (message: string, meta?: any) => log('error', message, meta),
};
