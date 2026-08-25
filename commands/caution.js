// ./commands/caution.js
const axios = require('axios');

const STYLE = {
    forwardingScore: 350,
    isForwarded: true,
    forwardedNewsletterMessageInfo: {
        newsletterJid: '120363406589060879@newsletter',
        newsletterName: '𝐊𝐈𝐋𝐋𝐔𝐀 𝐓𝐄𝐀𝐌',
        serverMessageId: 202,
    },
};

module.exports = {
    name: 'caution',
    aliases: ['warning', 'attention'],
    category: 'fun',

    async execute({ sock, msg, args, jid }) {
        const query = args.join(' ');
        if (!query || query.trim().length < 2) {
            return sock.sendMessage(jid, {
                text: '⚠️ *Caution Banner*\n\n⚡ *Usage:* .caution <text>\n\n✨ *Examples:*\n.caution Wet Floor\n.caution Caution: Bot Zone',
                contextInfo: STYLE,
            }, { quoted: msg });
        }

        try {
            await sock.sendMessage(jid, { react: { text: '⚠️', key: msg.key } });
            
            const url = `https://api.popcat.xyz/v2/caution?text=${encodeURIComponent(query)}`;
            const response = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
            const buffer = Buffer.from(response.data);

            await sock.sendMessage(jid, {
                image: buffer,
                caption: `⚠️ *Caution*\n\n💬 ${query}\n\nKillua`,
                contextInfo: STYLE,
            }, { quoted: msg });

            await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
        } catch (err) {
            console.log(`❌ Caution error: ${err.message}`);
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
            return sock.sendMessage(jid, {
                text: '❌ *Failed to generate caution banner.*\n\nTry again later.',
                contextInfo: STYLE,
            }, { quoted: msg });
        }
    }
};
