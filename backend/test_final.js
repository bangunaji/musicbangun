const play = require('play-dl');

async function testFinal() {
    const videoId = 'bAz3e3nHwgc'; // Lagu Trending
    console.log(`--- Mengetes Logika Akhir untuk: ${videoId} ---`);
    
    try {
        const info = await play.video_info(`https://www.youtube.com/watch?v=${videoId}`);
        const audioFormats = info.format.filter(f => 
            f.mimeType?.includes('audio') && 
            f.url && 
            f.url.startsWith('http')
        );

        if (audioFormats.length > 0) {
            audioFormats.sort((a, b) => (b.bitrate || 0) - (a.bitrate || 0));
            console.log('✅ TEST BERHASIL!');
            console.log(`URL Valid ditemukan: ${audioFormats[0].url.substring(0, 70)}...`);
            console.log(`Tipe: ${audioFormats[0].mimeType}`);
        } else {
            console.log('❌ TEST GAGAL: Masih tidak menemukan URL langsung.');
        }
    } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
    }
}

testFinal();
