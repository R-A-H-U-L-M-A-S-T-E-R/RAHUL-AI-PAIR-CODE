import express from 'express';
import { default as makeWASocket, useMultiFileAuthState, delay, Browsers } from '@whiskeysockets/baileys';
import pino from 'pino';
import path from 'path';
import fs from 'fs';

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Vercel sathi safe static files path (`process.cwd()`)
const publicPath = path.join(process.cwd(), 'public');
app.use(express.static(publicPath));

// Root route sathi explicit sendFile
app.get('/', (req, res) => {
    res.sendFile(path.join(publicPath, 'index.html'));
});

app.get('/code', async (req, res) => {
    try {
        let phoneNumber = req.query.phone;
        if (!phoneNumber) {
            return res.status(400).json({ error: 'Phone number is required!' });
        }

        phoneNumber = phoneNumber.replace(/[^0-9]/g, '');
        const sessionDir = path.join('/tmp', 'session_' + Date.now());

        const { state, saveCreds } = await useMultiFileAuthState(sessionDir);

        const sock = makeWASocket({
            logger: pino({ level: 'silent' }),
            printQRInTerminal: false,
            auth: state,
            browser: Browsers.macOS('Chrome')
        });

        if (!sock.authState.creds.registered) {
            await delay(1500);
            let code = await sock.requestPairingCode(phoneNumber);
            code = code?.match(/.{1,4}/g)?.join("-") || code;
            
            return res.json({ code: code });
        } else {
            return res.json({ code: 'ALREADY_REGISTERED' });
        }

        sock.ev.on('creds.update', saveCreds);

    } catch (err) {
        console.error('API Error:', err);
        return res.status(500).json({ error: 'Failed to generate pairing code!' });
    }
});

// Vercel serverless function export handler
export default function handler(req, res) {
    return app(req, res);
}
