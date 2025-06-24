const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { bundle } = require('@remotion/bundler');
const { renderMedia, selectComposition } = require('@remotion/renderer');
const { createWriteStream } = require('fs');
const { v4: uuidv4 } = require('uuid');
const https = require('https');
const http = require('http');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware para parsing JSON
app.use(express.json());

// Middleware para CORS
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  next();
});

// Servir arquivos de upload como estáticos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configuração do multer para upload de arquivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'primaryAudio' || file.fieldname === 'secondaryAudio') {
      // Aceitar apenas arquivos de áudio
      if (file.mimetype.startsWith('audio/')) {
        cb(null, true);
      } else {
        cb(new Error('Apenas arquivos de áudio são permitidos para os campos de áudio'), false);
      }
    } else if (file.fieldname === 'images') {
      // Aceitar apenas imagens
      if (file.mimetype.startsWith('image/')) {
        cb(null, true);
      } else {
        cb(new Error('Apenas arquivos de imagem são permitidos para o campo images'), false);
      }
    } else {
      cb(new Error('Campo não reconhecido'), false);
    }
  },
});

// Lista de efeitos de transição válidos
const validTransitionEffects = [
  'fade',
  'crossfade',
  'zoom-out',
  'zoom-out-fade',
  'zoom-crossfade',
  'zoom-in', 
  'slide-left',
  'slide-right',
  'slide-up',
  'slide-down',
  'rotate-fade',
  'scale-rotate'
];

// Função para baixar arquivo de URL com suporte a redirecionamentos
async function downloadFile(url, filepath, maxRedirects = 5) {
  return new Promise((resolve, reject) => {
    if (maxRedirects === 0) {
      reject(new Error(`Too many redirects for ${url}`));
      return;
    }

    const client = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(filepath);
    
    client.get(url, (response) => {
      // Seguir redirecionamentos
      if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
        file.close();
        fs.unlink(filepath, () => {}); // Remove arquivo vazio
        
        const redirectUrl = response.headers.location;
        console.log(`🔄 Redirecionando: ${url} -> ${redirectUrl}`);
        
        // Recursivamente baixar da nova URL
        downloadFile(redirectUrl, filepath, maxRedirects - 1)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlink(filepath, () => {});
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve(filepath);
      });
      
      file.on('error', (err) => {
        fs.unlink(filepath, () => {}); // Remove arquivo incompleto
        reject(err);
      });
    }).on('error', (err) => {
      file.close();
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

// Função para validar URL
function isValidUrl(string) {
  try {
    new URL(string);
    return true;
  } catch (_) {
    return false;
  }
}

// Rota para criação de vídeo com URLs
app.post('/api/create-video', async (req, res) => {
    let downloadedFiles = []; // Declarar no escopo da função para acesso no catch
    
    try {
      console.log('📂 Iniciando processamento do vídeo...');
      
      // Validar URLs recebidas
      const { primaryAudioUrl, secondaryAudioUrl, imageUrls } = req.body;
      
      if (!primaryAudioUrl || !imageUrls) {
        return res.status(400).json({
          error: 'É necessário enviar primaryAudioUrl e imageUrls (array). secondaryAudioUrl é opcional.'
        });
      }

      // Validar URL do áudio primário
      if (!isValidUrl(primaryAudioUrl)) {
        return res.status(400).json({
          error: 'primaryAudioUrl deve ser uma URL válida'
        });
      }

      // Validar URL do áudio secundário (se fornecido)
      if (secondaryAudioUrl && !isValidUrl(secondaryAudioUrl)) {
        return res.status(400).json({
          error: 'secondaryAudioUrl deve ser uma URL válida'
        });
      }

      // Validar URLs das imagens
      const imageUrlsArray = Array.isArray(imageUrls) ? imageUrls : [imageUrls];
      
      if (imageUrlsArray.length === 0) {
        return res.status(400).json({
          error: 'É necessário enviar pelo menos 1 URL de imagem'
        });
      }

      if (imageUrlsArray.length > 5) {
        return res.status(400).json({
          error: 'Máximo de 5 imagens permitidas'
        });
      }

      for (const imageUrl of imageUrlsArray) {
        if (!isValidUrl(imageUrl)) {
          return res.status(400).json({
            error: `URL de imagem inválida: ${imageUrl}`
          });
        }
      }

      console.log('📥 Baixando arquivos...');
      
      // Criar diretório de uploads se não existir
      const uploadDir = path.join(__dirname, 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      // Baixar áudio primário
      const primaryAudioFilename = `primary-${uuidv4()}.mp3`;
      const primaryAudioPath = path.join(uploadDir, primaryAudioFilename);
      await downloadFile(primaryAudioUrl, primaryAudioPath);
      downloadedFiles.push(primaryAudioPath);
      console.log(`✅ Áudio primário baixado para uploads: ${primaryAudioFilename}`);

      // Baixar áudio secundário (se fornecido)
      let secondaryAudioPath = null;
      let secondaryAudioFilename = null;
      if (secondaryAudioUrl) {
        secondaryAudioFilename = `secondary-${uuidv4()}.mp3`;
        secondaryAudioPath = path.join(uploadDir, secondaryAudioFilename);
        await downloadFile(secondaryAudioUrl, secondaryAudioPath);
        downloadedFiles.push(secondaryAudioPath);
        console.log(`✅ Áudio secundário baixado para uploads: ${secondaryAudioFilename}`);
      }

      // Baixar imagens
      const imagePaths = [];
      const imageFilenames = [];
      for (let i = 0; i < imageUrlsArray.length; i++) {
        const imageFilename = `image-${i}-${uuidv4()}.jpg`;
        const imagePath = path.join(uploadDir, imageFilename);
        await downloadFile(imageUrlsArray[i], imagePath);
        downloadedFiles.push(imagePath);
        imagePaths.push(imagePath);
        imageFilenames.push(imageFilename);
        console.log(`✅ Imagem ${i + 1} baixada para uploads: ${imageFilename}`);
      }

      // Criar objetos simulando arquivos do multer
      const primaryAudioFile = {
        filename: primaryAudioFilename,
        path: primaryAudioPath
      };
      
      const secondaryAudioFile = secondaryAudioPath ? {
        filename: secondaryAudioFilename,
        path: secondaryAudioPath
      } : null;
      
      const imageFiles = imagePaths.map((imagePath, index) => ({
        filename: imageFilenames[index],
        path: imagePath
      }));
      
      // Parâmetros opcionais do body da requisição - CONVERTENDO PARA NÚMEROS
      const {
        imageDuration = 3, // segundos por imagem
        transitionDuration = 1, // segundos de transição
        primaryAudioVolume = 1, // volume do áudio primário (0-1)
        secondaryAudioVolume = 0.3, // volume do áudio secundário (0-1)
        transitionEffect = 'zoom-out', // efeito de transição padrão
        fps = 30,
        width = 1080, // Formato 9:16 (vertical) - padrão para mobile/stories
        height = 1920,
        outputFormat = 'mp4'
      } = req.body;

      // Validar efeito de transição
      if (!validTransitionEffects.includes(transitionEffect)) {
        return res.status(400).json({
          error: `Efeito de transição inválido. Valores aceitos: ${validTransitionEffects.join(', ')}`
        });
      }

      // Converter strings para números
      const imageDurationNum = parseFloat(imageDuration);
      const transitionDurationNum = parseFloat(transitionDuration);
      const primaryAudioVolumeNum = parseFloat(primaryAudioVolume);
      const secondaryAudioVolumeNum = parseFloat(secondaryAudioVolume);
      const fpsNum = parseInt(fps);
      const widthNum = parseInt(width);
      const heightNum = parseInt(height);

      console.log(`🎵 Áudio primário: ${primaryAudioFile.filename} (volume: ${primaryAudioVolumeNum})`);
      if (secondaryAudioFile) {
        console.log(`🎶 Áudio secundário: ${secondaryAudioFile.filename} (volume: ${secondaryAudioVolumeNum})`);
      }
      console.log(`🖼️  Imagens: ${imageFiles.map(f => f.filename).join(', ')}`);
      console.log(`🎬 Efeito de transição: ${transitionEffect}`);
      console.log(`📊 Parâmetros recebidos:`);
      console.log(`   - transitionEffect: "${transitionEffect}" (tipo: ${typeof transitionEffect})`);
      console.log(`   - imageDuration: ${imageDurationNum}s`);
      console.log(`   - transitionDuration: ${transitionDurationNum}s`);
      console.log(`   - primaryAudioVolume: ${primaryAudioVolumeNum}`);
      console.log(`   - secondaryAudioVolume: ${secondaryAudioVolumeNum}`);

      // Calcular duração total do vídeo
      const totalDuration = (imageDurationNum + transitionDurationNum) * imageFiles.length;
      
      console.log(`⏱️  Duração total calculada: ${totalDuration}s`);

      // Preparar URLs HTTP dos arquivos (ao invés de caminhos locais)
      const primaryAudioFileUrl = `http://localhost:${PORT}/uploads/${primaryAudioFile.filename}`;
      const secondaryAudioFileUrl = secondaryAudioFile 
        ? `http://localhost:${PORT}/uploads/${secondaryAudioFile.filename}` 
        : null;
      const imageFileUrls = imageFiles.map(file => `http://localhost:${PORT}/uploads/${file.filename}`);

      console.log('🔗 URLs dos arquivos:');
      console.log('   🎵 Áudio primário:', primaryAudioFileUrl);
      if (secondaryAudioFileUrl) {
        console.log('   🎶 Áudio secundário:', secondaryAudioFileUrl);
      }
      console.log('   🖼️  Imagens:', imageFileUrls);

      // Input props para o componente Remotion
      const inputProps = {
        images: imageFileUrls,
        primaryAudioSrc: primaryAudioFileUrl,
        secondaryAudioSrc: secondaryAudioFileUrl,
        primaryAudioVolume: primaryAudioVolumeNum,
        secondaryAudioVolume: secondaryAudioVolumeNum,
        transitionDuration: transitionDurationNum,
        imageDuration: imageDurationNum,
        transitionEffect: transitionEffect,
      };

      console.log('🔧 Fazendo bundle do projeto Remotion...');
      
      // Bundle do projeto Remotion
      const bundled = await bundle({
        entryPoint: path.resolve(__dirname, './src/index.ts'),
      });

      console.log('🎬 Selecionando composição...');

      // Selecionar a composição
      const composition = await selectComposition({
        serveUrl: bundled,
        id: 'PhotoSlideshow',
        inputProps,
      });

      // Gerar nome único para o arquivo de saída
      const outputFileName = `video-${uuidv4()}.${outputFormat}`;
      const outputPath = path.resolve(__dirname, `./out/${outputFileName}`);

      // Criar diretório de saída se não existir
      const outDir = path.resolve(__dirname, './out');
      if (!fs.existsSync(outDir)) {
        fs.mkdirSync(outDir, { recursive: true });
      }

      console.log('🎥 Iniciando renderização...');
      console.log(`📁 Saída: ${outputPath}`);

      // Renderizar o vídeo - USANDO NÚMEROS CONVERTIDOS
      await renderMedia({
        composition: {
          ...composition,
          durationInFrames: Math.ceil(totalDuration * fpsNum),
          fps: fpsNum,
          width: widthNum,
          height: heightNum,
        },
        serveUrl: bundled,
        codec: outputFormat === 'mp4' ? 'h264' : 'h264',
        outputLocation: outputPath,
        inputProps,
        imageFormat: 'jpeg',
        jpegQuality: 90,
        enforceAudioTrack: true,
        verbose: true,
        onProgress: ({ progress }) => {
          console.log(`🔄 Progresso da renderização: ${Math.round(progress * 100)}%`);
        },
      });

      console.log('✅ Vídeo renderizado com sucesso!');

      // Cleanup: remover arquivos baixados
      setTimeout(() => {
        try {
          downloadedFiles.forEach(file => {
            if (fs.existsSync(file)) {
              fs.unlinkSync(file);
            }
          });
          console.log('🧹 Arquivos baixados removidos');
        } catch (error) {
          console.error('⚠️  Erro ao remover arquivos baixados:', error);
        }
      }, 10000); // Aguardar 10 segundos antes da limpeza

      // Retornar informações do vídeo gerado
      const videoStats = fs.statSync(outputPath);
      
      res.json({
        success: true,
        message: 'Vídeo criado com sucesso!',
        video: {
          filename: outputFileName,
          path: `/download/${outputFileName}`,
          size: videoStats.size,
          duration: totalDuration,
          specs: {
            width: widthNum,
            height: heightNum,
            fps: fpsNum,
            format: outputFormat,
            transitionEffect: transitionEffect,
          },
          imagesCount: imageFiles.length,
          audioTracks: {
            primary: {
              filename: primaryAudioFile.filename,
              volume: primaryAudioVolumeNum,
            },
            secondary: secondaryAudioFile ? {
              filename: secondaryAudioFile.filename,
              volume: secondaryAudioVolumeNum,
            } : null,
          },
        },
      });

    } catch (error) {
      console.error('❌ Erro durante o processamento:', error);
      
      // Cleanup em caso de erro - remover arquivos baixados
      try {
        if (downloadedFiles && downloadedFiles.length > 0) {
          downloadedFiles.forEach(file => {
            if (fs.existsSync(file)) {
              fs.unlinkSync(file);
            }
          });
        }
      } catch (cleanupError) {
        console.error('⚠️  Erro durante cleanup:', cleanupError);
      }

      res.status(500).json({
        error: 'Erro interno do servidor durante o processamento do vídeo',
        details: error.message,
      });
    }
  }
);

// Rota para listar efeitos de transição disponíveis
app.get('/api/transition-effects', (req, res) => {
  res.json({
    effects: validTransitionEffects.map(effect => ({
      id: effect,
      name: effect.charAt(0).toUpperCase() + effect.slice(1).replace('-', ' '),
      description: getEffectDescription(effect)
    }))
  });
});

// Função para obter descrição dos efeitos
function getEffectDescription(effect) {
  const descriptions = {
    'fade': 'Transição suave com fade e zoom sutil',
    'crossfade': 'Dissolve suave entre imagens (opacity)',
    'zoom-out': 'Cada imagem inicia com zoom 120% e retorna para 100%',
    'zoom-out-fade': 'Zoom-out (120%→100%) + Fade na transição',
    'zoom-crossfade': 'Zoom-out (120%→100%) + Crossfade na transição',
    'zoom-in': 'Zoom in de 80% para 100% com fade',
    'slide-left': 'Desliza da direita para esquerda',
    'slide-right': 'Desliza da esquerda para direita',
    'slide-up': 'Desliza de baixo para cima',
    'slide-down': 'Desliza de cima para baixo',
    'rotate-fade': 'Rotação com fade e escala',
    'scale-rotate': 'Escala com rotação e mudança de brilho'
  };
  return descriptions[effect] || 'Efeito de transição';
}

// Rota para download do vídeo gerado
app.get('/download/:filename', (req, res) => {
  const filename = req.params.filename;
  const filePath = path.resolve(__dirname, `./out/${filename}`);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ error: 'Arquivo não encontrado' });
  }

  res.download(filePath, filename, (err) => {
    if (err) {
      console.error('Erro no download:', err);
      res.status(500).json({ error: 'Erro durante o download' });
    }
  });
});

// Rota de status da API
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    message: 'API de geração de vídeos está funcionando',
    timestamp: new Date().toISOString(),
    availableEffects: validTransitionEffects,
  });
});

// Middleware de tratamento de erros
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'Arquivo muito grande. Máximo permitido: 100MB'
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        error: 'Muitos arquivos. Máximo: 2 áudios + 5 imagens'
      });
    }
  }
  
  console.error('Erro não tratado:', error);
  res.status(500).json({
    error: 'Erro interno do servidor',
    details: error.message
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`📊 Status: http://localhost:${PORT}/api/status`);
  console.log(`🎬 Endpoint para criar vídeo: POST http://localhost:${PORT}/api/create-video`);
  console.log(`🎨 Efeitos disponíveis: GET http://localhost:${PORT}/api/transition-effects`);
  console.log(`📁 Arquivos de upload: http://localhost:${PORT}/uploads/`);
  console.log(`\n🎯 Efeitos de transição disponíveis: ${validTransitionEffects.join(', ')}`);
});

module.exports = app; 