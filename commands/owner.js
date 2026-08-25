module.exports = {
    name: 'owner',
    aliases: ['dev', 'creator', 'fuli', 'contact'],
    description: 'Affiche les informations du propriétaire',

    async execute({ sock, msg, args, jid, text, config, stats }) {
        const from = jid || msg?.key?.remoteJid;
        const owner = '243906905464@s.whatsapp.net';

        if (!from) {
            console.error('❌ JID non disponible');
            return;
        }

        if (msg?.key) {
            await sock.sendMessage(from, {
                react: { text: '⚡', key: msg.key }
            });
        }

        const caption = `╭━━━❲ *CONTACT OWNER* ❳━━━╮
┃
┃   *𝐊𝐈𝐋𝐋𝐔𝐀 𝐓𝐄𝐀𝐌*
┃  wa.me/243905905463
┃  wa.me/${owner.split('@')[0]}
╰━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        await sock.sendMessage(from, {
            image: { url: 'https://files.catbox.moe/udi4uy.jpg' },
            caption: caption,
            contextInfo: {
                mentionedJid: [owner],
                forwardingScore: 540,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363406589060879@newsletter',
                    newsletterName: '𝐊𝐈𝐋𝐋𝐔𝐀 𝐓𝐄𝐀𝐌',
                    serverMessageId: 202
                }
            }
        }, { quoted: msg });
    }
};
