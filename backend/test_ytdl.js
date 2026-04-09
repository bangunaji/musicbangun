const ytdl = require('ytdl-core');

async function testYtdl() {
    const videoId = 'bAz3e3nHwgc';
    console.log(`--- Pengujian ytdl-core untuk: ${videoId} ---`);
    
    try {
        console.log('1. Mengambil info...');
        const info = await ytdl.getInfo(videoId);
        
        console.log('2. Memilih format audio...');
        const format = ytdl.chooseFormat(info.formats, { quality: 'highestaudio' });
        
        if (format && format.url) {
            console.log('✅ BERHASIL!');
            console.log(`URL: ${format.url.substring(0, 100)}...`);
            console.log(`MimeType: ${format.mimeType}`);
        } else {
            console.log('❌ GAGAL: Tidak mendapatkan URL.');
        }
    } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
    }
}

testYtdl();
