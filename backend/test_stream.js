const play = require('play-dl');

async function testStream() {
    const videoIds = ['bAz3e3nHwgc', 'G5pVmu1kEgg', 'F0d8JJUNkqo'];
    
    console.log('--- Memulai Pengujian Stream URL (Metode video_info) ---');
    
    for (const videoId of videoIds) {
        console.log(`\nMengetes Video ID: ${videoId}`);
        try {
            const info = await play.video_info(`https://www.youtube.com/watch?v=${videoId}`);
            const bestAudio = info.format
                .filter(f => f.mimeType?.includes('audio'))
                .sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0))[0];

            if (bestAudio && bestAudio.url) {
                console.log('✅ BERHASIL!');
                console.log(`URL didapat (awalan): ${bestAudio.url.substring(0, 50)}...`);
                console.log(`Format: ${bestAudio.mimeType}, Bitrate: ${bestAudio.bitrate}`);
            } else {
                console.log('❌ GAGAL: Tidak menemukan format audio yang cocok.');
            }
        } catch (error) {
            console.log(`❌ ERROR: ${error.message}`);
        }
    }
    
    console.log('\n--- Pengujian Selesai ---');
}

testStream();
