// ./commands/gemini.js

const axios = require('axios');

const STYLE = {
    forwardingScore: 355,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363406589060879@newsletter',
        newsletterName: '𝐊𝐈𝐋𝐋𝐔𝐀 𝐓𝐄𝐀𝐌',
        serverMessageId: 202,
    },
};

const cache = new Map();
const CACHE_DURATION = 5 * 60 * 1000;

function getCached(query) {
    const key = query.toLowerCase().trim();
    const entry = cache.get(key);
    if (entry && Date.now() - entry.timestamp < CACHE_DURATION) {
        return entry.data;
    }
    return null;
}

function setCache(query, data) {
    const key = query.toLowerCase().trim();
    cache.set(key, { data, timestamp: Date.now() });
    if (cache.size > 100) {
        const oldest = [...cache.entries()].sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
        cache.delete(oldest[0]);
    }
}

function extractResponse(data) {
    if (!data) return '';
    if (typeof data === 'string') return data;
    
    const fields = ['result', 'reply', 'response', 'answer', 'text', 'content', 'message', 'output'];
    for (const field of fields) {
        if (data[field] && typeof data[field] === 'string' && data[field].trim().length > 5) {
            return data[field].trim();
        }
    }
    
    if (typeof data === 'object') {
        const values = Object.values(data);
        for (const val of values) {
            if (typeof val === 'string' && val.trim().length > 10) {
                return val.trim();
            }
        }
    }
    return '';
}

// APIs testés et fonctionnels
const APIS = [
    {
        name: 'Neosoft',
        url: (q) => `https://api.neosoft.best/api/ai/gemini?text=${encodeURIComponent(q)}`,
        timeout: 40000,
    },
    {
        name: 'DavidCyril Gemini 3 pro',
        url: (q) => `https://apis.davidcyriltech.my.id/ai/gemini-3-pro?prompt=${encodeURIComponent(q)}`,
        timeout: 50000,
    },
    {
        name: 'PrinceTech Gmini',
        url: (q) => `https://api.princetechn.com/api/ai/geminiai?apikey=prince&q=${encodeURIComponent(q)}`,
        timeout: 40000,
    },
];

function getLocalFallback(query) {
    const q = query.toLowerCase().trim();
    const responses = {
        'hello': 'Hello! I\'m Gemini AI. How can I help you today? 🧠',
        'hi': 'Hi there! 👋 I\'m Gemini AI, ready to assist!',
        'bonjour': 'Bonjour! Je suis Gemini AI. Comment puis-je vous aider? 🧠',
        'salut': 'Salut! 😊 Je suis Gemini, à votre disposition!',
        'who are you': 'I\'m Gemini AI, an advanced language model! 🧠',
        'qui es-tu': 'Je suis Gemini AI, un modèle de langage avancé! 🧠',
        'what is your name': 'My name is Gemini AI! ⚡',
        'comment tu t\'appelles': 'Je m\'appelle Gemini AI! ⚡',
    };
    return responses[q] || null;
}

module.exports = {
    name: 'gemini',
    aliases: ['google', 'bard', 'g'],
    category: 'ai',

    async execute({ sock, msg, args, jid }) {
        const query = args.join(' ');

        if (!query || query.trim().length < 2) {
            return sock.sendMessage(jid, {
                text: '🧠 *Gemini AI*\n\n' +
                      '⚡ *Usage:* .gemini <question>\n\n' +
                      '✨ *Examples:*\n' +
                      '• .gemini What is JavaScript?\n' +
                      '• .gemini Write a poem about nature\n' +
                      '• .gemini Explain quantum physics\n\n' +
                      '🔧 *Powered by Multiple AI Models*',
                contextInfo: STYLE,
            }, { quoted: msg });
        }

        // Cache check
        const cached = getCached(query);
        if (cached) {
            await sock.sendMessage(jid, {
                text: `🧠 *Gemini AI*\n\n` +
                      `❓ *Q:* ${query.slice(0, 200)}${query.length > 200 ? '...' : ''}\n\n` +
                      `💬 *A:* ${cached}\n\n` +
                      `_Killua lie (cached)_`,
                contextInfo: STYLE,
            }, { quoted: msg });
            try { await sock.sendMessage(jid, { react: { text: '⚡', key: msg.key } }); } catch (_) {}
            return;
        }

        try { await sock.sendMessage(jid, { react: { text: '🧠', key: msg.key } }); } catch (_) {}

        let reply = '';
        let used = '';
        let errors = [];

        for (let i = 0; i < APIS.length; i++) {
            const api = APIS[i];
            try {
                console.log(`🧠 Gemini: Trying ${api.name}...`);

                if (i > 0) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                const response = await axios.get(api.url(query), {
                    timeout: api.timeout,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (compatible; KilluaBot/1.0)',
                        'Accept': 'application/json',
                    },
                    validateStatus: (status) => status < 500,
                });

                console.log(`📊 ${api.name}: Status ${response.status}`);

                if (response.status === 200 || response.status === 201) {
                    const extracted = extractResponse(response.data);
                    if (extracted && extracted.trim().length > 10) {
                        reply = extracted.trim();
                        used = api.name;
                        console.log(`✅ ${api.name} succeeded`);
                        break;
                    } else {
                        console.log(`⚠️ ${api.name}: Empty response`);
                        errors.push(`${api.name}: Empty`);
                    }
                } else {
                    console.log(`⚠️ ${api.name}: HTTP ${response.status}`);
                    errors.push(`${api.name}: HTTP ${response.status}`);
                }
            } catch (err) {
                const msg = err.code === 'ECONNABORTED' ? 'Timeout' : err.message;
                console.log(`❌ ${api.name}: ${msg}`);
                errors.push(`${api.name}: ${msg.slice(0, 20)}`);

                if (err.code === 'ECONNABORTED') {
                    await new Promise(resolve => setTimeout(resolve, 1500));
                }
            }
        }

        // Local fallback
        if (!reply) {
            const fallback = getLocalFallback(query);
            if (fallback) {
                reply = fallback;
                used = 'Local AI (fallback)';
                console.log('✅ Local fallback used');
            }
        }

        if (!reply) {
            try { await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } }); } catch (_) {}

            const errorList = errors.slice(0, 3).map(e => `• ${e}`).join('\n');
            return sock.sendMessage(jid, {
                text: `❌ *All APIs unavailable.*\n\n` +
                      `💡 *Tips:*\n` +
                      `• Try again in a few moments\n` +
                      `• Simplify your question\n\n` +
                      `⚠️ *Failed APIs:*\n${errorList}`,
                contextInfo: STYLE,
            }, { quoted: msg });
        }

        setCache(query, reply);

        const formatted = reply.length > 3900
            ? reply.slice(0, 3850) + '...\n\n📝 *Response truncated*'
            : reply;

        await sock.sendMessage(jid, {
            text: `🧠 *Gemini AI*\n\n` +
                  `❓ *Q:* ${query.slice(0, 200)}${query.length > 200 ? '...' : ''}\n\n` +
                  `💬 *A:* ${formatted}\n\n` +
                  `🔧 *Provider:* ${used}\n` +
                  `_Powered by 𝐊𝐈𝐋𝐋𝐔𝐀_`,
            contextInfo: STYLE,
        }, { quoted: msg });

        try { await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } }); } catch (_) {}
    },
};

