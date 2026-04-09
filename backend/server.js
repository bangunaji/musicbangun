const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const YTMusic = require('ytmusic-api');
const play = require('play-dl');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(bodyParser.json());

let ytmusic = new YTMusic();
let initialized = false;

// Initialize YTMusic with optional cookie
app.post('/api/init', async (req, res) => {
    try {
        const { cookie } = req.body;
        ytmusic = new YTMusic();
        await ytmusic.initialize(cookie || "");
        initialized = true;
        res.json({ success: true, message: 'YTMusic initialized' });
    } catch (error) {
        console.error('Init error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Search for songs
app.get('/api/search', async (req, res) => {
    try {
        if (!initialized) {
            await ytmusic.initialize();
            initialized = true;
        }
        const { q } = req.query;
        if (!q) return res.status(400).json({ error: 'Query parameter "q" is required' });
        
        const results = await ytmusic.search(q);
        res.json(results);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Ambil URL audio langsung
app.get('/api/stream/:videoId', async (req, res) => {
    const { videoId } = req.params;
    try {
        console.log(`Mengambil URL streaming untuk: ${videoId}`);
        
        // Metode 1: Ambil info video lengkap
        const info = await play.video_info(`https://www.youtube.com/watch?v=${videoId}`);
        
        // Cari format audio saja yang terbaik
        const bestAudio = info.format
            .filter(f => f.mimeType?.includes('audio'))
            .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];

        if (bestAudio && bestAudio.url) {
            console.log(`Berhasil mendapatkan URL langsung via video_info`);
            res.json({ url: bestAudio.url });
        } else {
            // Metode Cadangan: Gunakan play.stream standar
            console.log(`Mencoba metode cadangan play.stream...`);
            const streamInfo = await play.stream(`https://www.youtube.com/watch?v=${videoId}`);
            res.json({ url: streamInfo.url });
        }
        
    } catch (error) {
        console.error('Stream info error for videoId:', videoId, error);
        res.status(500).json({ error: error.message });
    }
});

// Get content for the home screen
app.get('/api/home', async (req, res) => {
    try {
        if (!initialized) {
            await ytmusic.initialize();
            initialized = true;
        }
        const sections = await ytmusic.getHomeSections();
        // Flatten or filter sections to just songs for simplicity on home
        let songs = [];
        for (const section of sections) {
            if (section.contents) {
                songs.push(...section.contents.filter(item => item.type === 'SONG'));
            }
        }
        res.json(songs.slice(0, 20)); // Return first 20 songs
    } catch (error) {
        console.error('Home error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Update library fallback
app.get('/api/library', async (req, res) => {
    try {
        if (!initialized) return res.status(400).json({ error: 'YTMusic not initialized with cookie' });
        const sections = await ytmusic.getHomeSections(); 
        res.json(sections);
    } catch (error) {
        console.error('Library error:', error);
        res.status(500).json({ error: error.message });
    }
});

const server = app.listen(port, () => {
    console.log(`Backend listening at http://localhost:${port}`);
});

server.on('error', (e) => {
    if (e.code === 'EADDRINUSE') {
        console.error(`!!! ERROR: Port ${port} sudah digunakan oleh aplikasi lain.`);
        console.error(`Silakan tutup aplikasi lain yang menggunakan port ${port} atau ganti port di server.js.`);
    } else {
        console.error('Terjadi kesalahan pada server:', e);
    }
});
