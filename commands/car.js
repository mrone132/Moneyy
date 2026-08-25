// ./commands/car.js
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
    name: 'car',
    aliases: ['carimage', 'voiture'],
    category: 'fun',

    async execute({ sock, msg, args, jid }) {
        try {
            await sock.sendMessage(jid, { react: { text: '🚗', key: msg.key } });
            
            const response = await axios.get('https://api.popcat.xyz/v2/car', { timeout: 10000 });
            const data = response.data;

            if (!data?.message?.image) {
                throw new Error('No car image found');
            }

            const imageUrl = data.message.image;
            const title = data.message.title || 'Random Car';
            
            const imgResponse = await axios.get(imageUrl, { responseType: 'arraybuffer', timeout: 15000 });
            const buffer = Buffer.from(imgResponse.data);

            await sock.sendMessage(jid, {
                image: buffer,
                caption: `🚗 *${title}*\n\nKillua`,
                contextInfo: STYLE,
            }, { quoted: msg });

            await sock.sendMessage(jid, { react: { text: '✅', key: msg.key } });
        } catch (err) {
            console.log(`❌ Car error: ${err.message}`);
            await sock.sendMessage(jid, { react: { text: '❌', key: msg.key } });
            return sock.sendMessage(jid, {
                text: '❌ *Failed to fetch car image.*\n\nTry again later.',
                contextInfo: STYLE,
            }, { quoted: msg });
        }
    }
};
