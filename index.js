import { default as makeWASocket, useMultiFileAuthState, delay } from '@whiskeysockets/baileys';
import pino from 'pino';
import readline from 'readline';

// Terminal varun number ghene sathi readline setup
const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const question = (text) => new Promise((resolve) => rl.question(text, resolve));

async function startWhatsApp() {
    // Session save karnya sathi auth folder
    const { state, saveCreds } = await useMultiFileAuthState('session');

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }), // logs band thevnyasathi
        printQRInTerminal: false,          // QR code print karnyachi garaj nahi
        auth: state,
        browser: ["Chrome (Linux)", "", ""]  // Browser info
    });

    // Jar device adhi connect zala nasel, tar pairing code generate kara
    if (!sock.authState.creds.registered) {
        let phoneNumber = await question('Tumcha WhatsApp number taka (country code sobat, eg. 919356730236): ');
        phoneNumber = phoneNumber.replace(/[^0-9]/g, '919356730236'); // Fkt numbers thevne

        await delay(3000);
        
        try {
            let code = await sock.requestPairingCode(phoneNumber);
            // Code format karun neat disnyasathi (e.g. ABC1-XYZ2)
            code = code?.match(/.{1,4}/g)?.join("-") || code;
            console.log(`\n🔑 Tumcha WhatsApp Pairing Code ahe: \x1b[32m%s\x1b[0m`, code);
            console.log(`(He code tumchya WhatsApp app madhe 'Link with phone number' madhe taka)\n`);
        } catch (error) {
            console.error('Pairing code generate hotana error ala:', error);
        }
    }

    // Connection updates handle karne
    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'open') {
            console.log('✅ WhatsApp successfully connect zala ahe!');

            // --- Ithe RAHUL-AI~ Session ID generate hote ---
            try {
                // state.creds la JSON madhe convert karun Base64 madhe encode karne
                const credsStr = JSON.stringify(sock.authState.creds, (key, value) =>
                    typeof value === 'bigint' ? value.toString() : value
                );
                const base64Creds = Buffer.from(credsStr).toString('base64');
                const sessionId = `RAHUL-AI~${base64Creds}`;

                console.log('\n========================================');
                console.log('📦 TUMCHI SESSION ID (Copy karun save kara):');
                console.log('\x1b[33m%s\x1b[0m', sessionId);
                console.log('========================================\n');
            } catch (err) {
                console.error('Session ID banavtana error ala:', err);
            }
            // ------------------------------------------------

        } else if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== 401;
            console.log('❌ Connection close zala. Punha connect karat ahe...', shouldReconnect);
            if (shouldReconnect) {
                startWhatsApp();
            }
        }
    });

    // Credentials update zale ki save karne
    sock.ev.on('creds.update', saveCreds);
}

startWhatsApp();
