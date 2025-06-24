const fetch = require('node-fetch');

async function testVideoAPIWithUrls() {
  const API_URL = 'http://localhost:3002';

  try {
    console.log('🧪 Testando API de geração de vídeos com URLs...\n');

    // Verificar se a API está online
    console.log('1. Verificando status da API...');
    const statusResponse = await fetch(`${API_URL}/api/status`);
    const statusData = await statusResponse.json();
    console.log('✅ Status:', statusData.message);
    console.log('📅 Timestamp:', statusData.timestamp);
    console.log('🎨 Efeitos disponíveis:', statusData.availableEffects.join(', '), '\n');

    // URLs de exemplo (substitua pelas suas URLs reais)
    const requestBody = {
      primaryAudioUrl: 'https://www.soundjay.com/free-music/sounds/midnight-ride-01a.mp3',
    //   secondaryAudioUrl: 'https://www.soundjay.com/free-music/sounds/midnight-ride-01a.mp3', // opcional
      imageUrls: [
        'https://fastly.picsum.photos/id/172/1080/1920.jpg?hmac=BMJMC4p5h2H9S9m0uTdCvnmK8koGIMbomRujhdw640k',
        'https://fastly.picsum.photos/id/248/1080/1920.jpg?hmac=lxGTbcXDt9SYPjibnPF3vUMd4KC2DpiVvVHv0E6mLm8',
        'https://fastly.picsum.photos/id/248/1080/1920.jpg?hmac=lxGTbcXDt9SYPjibnPF3vUMd4KC2DpiVvVHv0E6mLm8'
      ],
      imageDuration: '4',
      transitionDuration: '1.5',
      primaryAudioVolume: '1.0',
      secondaryAudioVolume: '0.2',
      transitionEffect: 'zoom-out',
      fps: '30',
      width: '1080',
      height: '1920',
      outputFormat: 'mp4'
    };

    console.log('2. Enviando requisição para criar vídeo...');
    console.log('📊 URLs dos arquivos:');
    console.log('   🎵 Áudio primário:', requestBody.primaryAudioUrl);
    console.log('   🎶 Áudio secundário:', requestBody.secondaryAudioUrl);
    console.log('   🖼️  Imagens:', requestBody.imageUrls);
    console.log('   🎬 Efeito:', requestBody.transitionEffect);

    const videoResponse = await fetch(`${API_URL}/api/create-video`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!videoResponse.ok) {
      const errorData = await videoResponse.json();
      console.error('❌ Erro na API:', errorData);
      return;
    }

    const videoData = await videoResponse.json();
    console.log('\n✅ Vídeo criado com sucesso!');
    console.log('📋 Informações do vídeo:');
    console.log('   📁 Nome:', videoData.video.filename);
    console.log('   💾 Tamanho:', Math.round(videoData.video.size / 1024 / 1024), 'MB');
    console.log('   ⏱️  Duração:', videoData.video.duration, 'segundos');
    console.log('   📐 Resolução:', `${videoData.video.specs.width}x${videoData.video.specs.height}`);
    console.log('   🎬 FPS:', videoData.video.specs.fps);
    console.log('   🎨 Efeito:', videoData.video.specs.transitionEffect);
    console.log('   🖼️  Imagens:', videoData.video.imagesCount);
    
    // Mostrar informações dos áudios
    console.log('   🎵 Áudios:');
    console.log(`      📢 Primário: ${videoData.video.audioTracks.primary.filename} (vol: ${videoData.video.audioTracks.primary.volume})`);
    if (videoData.video.audioTracks.secondary) {
      console.log(`      🎶 Secundário: ${videoData.video.audioTracks.secondary.filename} (vol: ${videoData.video.audioTracks.secondary.volume})`);
    }

    console.log('\n3. Baixando vídeo...');
    const downloadUrl = `${API_URL}${videoData.video.path}`;
    const downloadResponse = await fetch(downloadUrl);

    if (downloadResponse.ok) {
      const buffer = await downloadResponse.buffer();
      const outputPath = `./downloaded-from-urls-${videoData.video.filename}`;
      require('fs').writeFileSync(outputPath, buffer);
      console.log('✅ Vídeo baixado para:', outputPath);
    } else {
      console.log('❌ Erro ao baixar vídeo');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

// Verificar se node-fetch está instalado
try {
  require('node-fetch');
} catch (error) {
  console.log('📦 Instalando dependências necessárias...');
  console.log('Execute: npm install node-fetch');
  process.exit(1);
}

// Executar teste
testVideoAPIWithUrls(); 