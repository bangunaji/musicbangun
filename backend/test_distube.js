const ytdl = require('@distube/ytdl-core');

async function testDistube() {
    const videoId = 'bAz3e3nHwgc';
    console.log(`--- Pengujian @distube/ytdl-core untuk: ${videoId} ---`);
    
    try {
        console.log('1. Mengambil info...');
        const info = await ytdl.getInfo(videoId);
        
        console.log('2. Memilih format audio...');
        const format = ytdl.chooseFormat(info.formats, { 
            quality: 'highestaudio',
            filter: 'audioonly'
        });
        
        if (format && format.url) {
            console.log('✅ BERHASIL!');
            console.log(`URL didapat: ${format.url.substring(0, 100)}...`);
            console.log(`MimeType: ${format.mimeType}`);
        } else {
            console.log('❌ GAGAL: Video info didapat tapi format audio berkualitas tinggi tidak ditemukan.');
        }
    } catch (error) {
        console.log(`❌ ERROR: ${error.message}`);
        console.log(error.stack);
    }
}

testDistube();
