const FormData = require('form-data');
const fs = require('fs');
const path = require('path');
const fetch = require('node-fetch');

async function testVideoAPI() {
  const API_URL = 'http://localhost:3002';

  try {
    console.log('🧪 Testando API de geração de vídeos...\n');

    // Verificar se a API está online
    console.log('1. Verificando status da API...');
    const statusResponse = await fetch(`${API_URL}/api/status`);
    const statusData = await statusResponse.json();
    console.log('✅ Status:', statusData.message);
    console.log('📅 Timestamp:', statusData.timestamp);
    console.log('🎨 Efeitos disponíveis:', statusData.availableEffects.join(', '), '\n');

    // Listar efeitos de transição disponíveis
    console.log('2. Consultando efeitos de transição...');
    const effectsResponse = await fetch(`${API_URL}/api/transition-effects`);
    const effectsData = await effectsResponse.json();
    console.log('🎬 Efeitos de transição:');
    effectsData.effects.forEach(effect => {
      console.log(`   • ${effect.id}: ${effect.description}`);
    });
    console.log('');

    // Preparar FormData para upload
    const form = new FormData();

    // Adicionar arquivos de exemplo (você precisa ter esses arquivos)
    // Substitua pelos caminhos dos seus arquivos de teste
    const primaryAudioPath = './examples/oracao.mp3'; // Áudio principal (narração/oração)
    const secondaryAudioPath = './examples/musica.MP3'; // Áudio secundário (música de fundo)
    const imagePaths = [
      './examples/01.png',
      './examples/02.png',
      './examples/03.png',
      './examples/04.png',
      './examples/05.png',
    ];

    // Verificar se os arquivos existem
    if (!fs.existsSync(primaryAudioPath)) {
      console.log('⚠️  Arquivo de áudio primário não encontrado:', primaryAudioPath);
      console.log('💡 Coloque um arquivo de áudio em:', primaryAudioPath);
      console.log('💡 Ou substitua o caminho no script test-api.js');
      console.log('');
      console.log('🔧 Para testar rapidamente, você pode baixar arquivos de exemplo:');
      console.log('   mkdir -p examples');
      console.log('   # Baixe um áudio MP3 (oração) e algumas imagens PNG para a pasta examples/');
      return;
    }

    console.log('3. Adicionando áudio primário ao FormData...');
    form.append('primaryAudio', fs.createReadStream(primaryAudioPath));

    // Adicionar áudio secundário se existir
    if (fs.existsSync(secondaryAudioPath)) {
      console.log('4. Adicionando áudio secundário ao FormData...');
      form.append('secondaryAudio', fs.createReadStream(secondaryAudioPath));
    } else {
      console.log('4. ⚠️  Áudio secundário não encontrado:', secondaryAudioPath);
      console.log('   💡 Continuando apenas com áudio primário...');
    }

    console.log('5. Adicionando imagens ao FormData...');
    let imageCount = 0;
    for (const imagePath of imagePaths) {
      if (fs.existsSync(imagePath)) {
        form.append('images', fs.createReadStream(imagePath));
        imageCount++;
        console.log(`   ✅ Adicionada: ${path.basename(imagePath)}`);
      } else {
        console.log(`   ⚠️  Não encontrada: ${imagePath}`);
      }
    }

    if (imageCount === 0) {
      console.log('❌ Nenhuma imagem encontrada.');
      console.log('💡 Coloque imagens de exemplo na pasta examples/');
      console.log('💡 Ou substitua os caminhos no script test-api.js');
      return;
    }

    // Parâmetros opcionais - incluindo controle de volume e efeito de transição
    form.append('imageDuration', '4'); // 4 segundos por imagem
    form.append('transitionDuration', '1.5'); // 1.5 segundos de transição
    form.append('primaryAudioVolume', '1.0'); // Volume máximo para oração
    form.append('secondaryAudioVolume', '0.2'); // Volume baixo para música de fundo
    form.append('transitionEffect', 'zoom-out'); // Efeito zoom-out (120% para 100%)
    form.append('fps', '30');
    form.append('width', '1080'); // Formato 9:16 (vertical)
    form.append('height', '1920');
    console.log(`\n6. Enviando requisição para criar vídeo...`);
    console.log(`📊 Dados: ${imageCount} imagens + áudios (primário: vol 1.0, secundário: vol 0.2)`);
    console.log(`🎬 Efeito: zoom-out (120% → 100%)`);

    const videoResponse = await fetch(`${API_URL}/api/create-video`, {
      method: 'POST',
      body: form,
      headers: form.getHeaders(),
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

    console.log('\n7. Baixando vídeo...');
    const downloadUrl = `${API_URL}${videoData.video.path}`;
    const downloadResponse = await fetch(downloadUrl);

    if (downloadResponse.ok) {
      const buffer = await downloadResponse.buffer();
      const outputPath = `./downloaded-${videoData.video.filename}`;
      fs.writeFileSync(outputPath, buffer);
      console.log('✅ Vídeo baixado para:', outputPath);
    } else {
      console.log('❌ Erro ao baixar vídeo');
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

// Verificar se node-fetch e form-data estão instalados
try {
  require('node-fetch');
  require('form-data');
} catch (error) {
  console.log('📦 Instalando dependências necessárias...');
  console.log('Execute: npm install');
  process.exit(1);
}

// Executar teste
testVideoAPI(); 