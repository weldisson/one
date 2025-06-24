# 🎬 API de Geração de Vídeos com Remotion

API para criar vídeos programaticamente usando Remotion. Envie até 2 áudios (com controle de volume) e até 5 fotos, e a API criará um slideshow com transições suaves e efeitos visuais configuráveis entre as imagens.

## 🚀 Instalação e Uso

### 1. Instalar dependências
```bash
npm install
```

### 2. Iniciar a API
```bash
npm start
# ou para desenvolvimento:
npm run dev
```

A API estará rodando em `http://localhost:3002`

### 3. Testar a API
```bash
npm test
```

## 📋 Rotas da API

### 1. 🔍 **Status da API**
```
GET /api/status
```
**Descrição:** Verifica se a API está funcionando  
**Resposta:** Status da API, timestamp e efeitos disponíveis

**Curl:**
```bash
curl -X GET http://localhost:3002/api/status
```

### 2. 🎨 **Listar Efeitos de Transição**
```
GET /api/transition-effects
```
**Descrição:** Lista todos os efeitos de transição disponíveis com descrições  
**Resposta:** Array com ID, nome e descrição de cada efeito

**Curl:**
```bash
curl -X GET http://localhost:3002/api/transition-effects
```

### 3. 🎬 **Criar Vídeo**
```
POST /api/create-video
Content-Type: multipart/form-data
```
**Descrição:** Cria um vídeo slideshow com as imagens e áudios enviados

**Campos obrigatórios:**
- `primaryAudio` (file): Arquivo de áudio principal (MP3, WAV, etc.) - ex: narração, oração
- `images` (files): 1 a 5 arquivos de imagem (JPG, PNG, etc.)

**Campos opcionais:**
- `secondaryAudio` (file): Arquivo de áudio secundário (MP3, WAV, etc.) - ex: música de fundo
- `primaryAudioVolume` (string): Volume do áudio principal (0.0 a 1.0, padrão: 1.0)
- `secondaryAudioVolume` (string): Volume do áudio secundário (0.0 a 1.0, padrão: 0.3)
- `transitionEffect` (string): Efeito de transição (padrão: 'zoom-out')
- `imageDuration` (string): Duração de cada imagem em segundos (padrão: 3)
- `transitionDuration` (string): Duração da transição em segundos (padrão: 1)
- `fps` (string): Frames por segundo (padrão: 30)
- `width` (string): Largura do vídeo (padrão: 1080 - formato 9:16)
- `height` (string): Altura do vídeo (padrão: 1920 - formato 9:16)
- `outputFormat` (string): Formato de saída (padrão: 'mp4')

**Curl:**
```bash
curl -X POST http://localhost:3002/api/create-video \
  -F "primaryAudio=@./oracao.mp3" \
  -F "secondaryAudio=@./musica.mp3" \
  -F "images=@./foto1.jpg" \
  -F "images=@./foto2.jpg" \
  -F "images=@./foto3.jpg" \
  -F "imageDuration=3" \
  -F "transitionDuration=1" \
  -F "primaryAudioVolume=1" \
  -F "secondaryAudioVolume=0.3" \
  -F "transitionEffect=zoom-out" \
  -F "fps=30" \
  -F "width=1080" \
  -F "height=1920" \
  -F "outputFormat=mp4"
```

### 4. ⬇️ **Download de Vídeo**
```
GET /download/:filename
```
**Descrição:** Faz download do vídeo gerado  
**Parâmetros:** filename - nome do arquivo retornado na resposta do create-video

**Curl:**
```bash
curl -X GET http://localhost:3002/download/video-uuid.mp4 \
  --output meu-video.mp4
```

### 5. 📁 **Acessar Arquivos de Upload**
```
GET /uploads/:filename
```
**Descrição:** Acessa arquivos temporários de upload (imagens e áudios)  
**Parâmetros:** filename - nome do arquivo

**Curl:**
```bash
curl -X GET http://localhost:3002/uploads/arquivo.jpg \
  --output arquivo-baixado.jpg
```

## 🎨 Efeitos de Transição Disponíveis

A API oferece **9 efeitos de transição diferentes**:

| Efeito | Descrição |
|--------|-----------|
| `zoom-out` | **Cada imagem inicia com zoom 120% e reduz para 100% no primeiro segundo** ⭐ |
| `fade` | Transição suave com fade e zoom sutil (padrão antigo) |
| `crossfade` | Dissolve suave entre imagens (opacity) |
| `zoom-crossfade` | Zoom-out rápido (120%→100% no primeiro segundo) + Crossfade na transição |
| `zoom-in` | Zoom in de 80% para 100% com fade |
| `slide-left` | Desliza da direita para esquerda |
| `slide-right` | Desliza da esquerda para direita |
| `slide-up` | Desliza de baixo para cima |
| `slide-down` | Desliza de cima para baixo |
| `rotate-fade` | Rotação com fade e escala |
| `scale-rotate` | Escala com rotação e mudança de brilho |

## 📤 Exemplos com cURL

### Exemplo com zoom-crossfade (120%→100% + dissolve)
```bash
curl -X POST http://localhost:3002/api/create-video \
  -F "primaryAudio=@./oracao.mp3" \
  -F "secondaryAudio=@./musica.mp3" \
  -F "primaryAudioVolume=1.0" \
  -F "secondaryAudioVolume=0.2" \
  -F "transitionEffect=zoom-crossfade" \
  -F "images=@./foto1.jpg" \
  -F "images=@./foto2.jpg" \
  -F "images=@./foto3.jpg" \
  -F "imageDuration=4" \
  -F "transitionDuration=1.5" \
  -F "width=1080" \
  -F "height=1920"
```

### Exemplo com crossfade (dissolve com opacity)
```bash
curl -X POST http://localhost:3002/api/create-video \
  -F "primaryAudio=@./oracao.mp3" \
  -F "secondaryAudio=@./musica.mp3" \
  -F "primaryAudioVolume=1.0" \
  -F "secondaryAudioVolume=0.2" \
  -F "transitionEffect=crossfade" \
  -F "images=@./foto1.jpg" \
  -F "images=@./foto2.jpg" \
  -F "images=@./foto3.jpg" \
  -F "imageDuration=4" \
  -F "transitionDuration=2" \
  -F "width=1080" \
  -F "height=1920"
```

### Exemplo com zoom-out (120% → 100%)
```bash
curl -X POST http://localhost:3002/api/create-video \
  -F "primaryAudio=@./oracao.mp3" \
  -F "secondaryAudio=@./musica.mp3" \
  -F "primaryAudioVolume=1.0" \
  -F "secondaryAudioVolume=0.2" \
  -F "transitionEffect=zoom-out" \
  -F "images=@./foto1.jpg" \
  -F "images=@./foto2.jpg" \
  -F "images=@./foto3.jpg" \
  -F "imageDuration=4" \
  -F "transitionDuration=1" \
  -F "width=1080" \
  -F "height=1920"
```

### Exemplo com slide horizontal
```bash
curl -X POST http://localhost:3002/api/create-video \
  -F "primaryAudio=@./oracao.mp3" \
  -F "transitionEffect=slide-left" \
  -F "images=@./foto1.jpg" \
  -F "images=@./foto2.jpg" \
  -F "images=@./foto3.jpg" \
  -F "imageDuration=3" \
  -F "transitionDuration=1.5"
```

### Consultar efeitos disponíveis
```bash
curl http://localhost:3002/api/transition-effects
```

## 📁 Estrutura do Projeto

```
/
├── server.js          # Servidor Express principal
├── package.json       # Dependências
├── tsconfig.json      # Configuração TypeScript
├── test-api.js        # Script de teste
├── README.md          # Este arquivo
├── src/               # Componentes Remotion
│   ├── index.ts       # Entry point
│   ├── Root.tsx       # Registro de composições
│   └── PhotoSlideshow.tsx  # Componente principal com efeitos
├── uploads/           # Arquivos temporários (criado automaticamente)
└── out/              # Vídeos gerados (criado automaticamente)
```

## 🎵 Controle de Áudio

A API suporta **2 faixas de áudio simultâneas**:

1. **Áudio Primário** (obrigatório): Narração, oração, voz principal
   - Volume padrão: 1.0 (máximo)
   - Campo: `primaryAudio`

2. **Áudio Secundário** (opcional): Música de fundo, efeitos sonoros
   - Volume padrão: 0.3 (30% do volume máximo)
   - Campo: `secondaryAudio`

### Controle de Volume
- **primaryAudioVolume**: 0.0 (mudo) a 1.0 (volume máximo)
- **secondaryAudioVolume**: 0.0 (mudo) a 1.0 (volume máximo)

**Exemplo prático:**
- Oração: volume 1.0 (para ser bem audível)
- Música de fundo: volume 0.2 (para não sobrepor a oração)

## ⚙️ Configuração

Para personalizar transições, edite `src/PhotoSlideshow.tsx`.

Para ajustar limites da API, edite `server.js`:
```javascript
// Tamanho máximo de arquivo
fileSize: 100 * 1024 * 1024, // 100MB

// Número máximo de arquivos
{ name: 'primaryAudio', maxCount: 1 },
{ name: 'secondaryAudio', maxCount: 1 },
{ name: 'images', maxCount: 5 }
```

## 🛠️ Desenvolvimento

```bash
# Instalar dependências
npm install

# Iniciar servidor
npm start

# Testar API
npm test
```

## 📝 Exemplo de Resposta

```json
{
  "success": true,
  "message": "Vídeo criado com sucesso!",
  "video": {
    "filename": "video-uuid.mp4",
    "path": "/download/video-uuid.mp4",
    "size": 15728640,
    "duration": 20,
    "specs": {
      "width": 1920,
      "height": 1080,
      "fps": 30,
      "format": "mp4",
      "transitionEffect": "zoom-out"
    },
    "imagesCount": 5,
    "audioTracks": {
      "primary": {
        "filename": "oracao.mp3",
        "volume": 1.0
      },
      "secondary": {
        "filename": "musica.mp3",
        "volume": 0.2
      }
    }
  }
}
```

## 🧪 Teste da API

Para testar a API rapidamente:

1. Crie uma pasta `examples/`:
```bash
mkdir examples
```

2. Adicione arquivos de teste:
   - `examples/oracao.mp3` (áudio principal)
   - `examples/musica.mp3` (música de fundo - opcional)
   - `examples/01.png` (imagem 1)
   - `examples/02.png` (imagem 2)
   - ... até 5 imagens

3. Execute o teste:
```bash
npm test
```

O script de teste configurará automaticamente:
- Áudio principal: volume 1.0 (máximo)
- Música de fundo: volume 0.2 (baixo, para não sobrepor)
- **Efeito zoom-out**: Cada imagem inicia com 120% e retorna para 100%

## 🎯 Dicas de Uso

### Para Zoom-Crossfade (Melhor dos 2 Mundos)
```bash
-F "transitionEffect=zoom-crossfade"
-F "imageDuration=4"      # 4s para zoom-out rápido no primeiro segundo
-F "transitionDuration=1.5"  # 1.5s para dissolve suave
```

### Para Crossfade (Dissolve Suave)
```bash
-F "transitionEffect=crossfade"
-F "transitionDuration=2"  # 2 segundos para dissolve mais suave
```

### Para Zoom Out (120% → 100% Instantâneo)
```bash
-F "transitionEffect=zoom-out"
-F "imageDuration=4"  # 4 segundos total (zoom-out nos primeiros 1s)
```

### Para Slides Suaves
```bash
-F "transitionEffect=slide-left"
-F "transitionDuration=1.5"  # 1.5 segundos para movimento suave
```

### Para Efeitos Dramáticos
```bash
-F "transitionEffect=scale-rotate"
-F "transitionDuration=2"  # 2 segundos para efeito mais longo
```

## 📄 Licença

MIT License

---

**Desenvolvido com ❤️ usando Remotion e Express.js**

## 🚀 Deploy em Servidor

### Requisitos Mínimos do Sistema

| Componente | Mínimo | Recomendado |
|------------|--------|-------------|
| **CPU** | 2 cores / 2.0 GHz | 4+ cores / 3.0+ GHz |
| **RAM** | 4 GB | 8-16 GB |
| **Storage** | 10 GB | 50+ GB SSD |
| **Rede** | 100 Mbps | 1 Gbps |
| **OS** | Ubuntu 20.04+ | Ubuntu 22.04 LTS |

### Dependências Obrigatórias

- **Node.js 16+** (recomendado 18.x)
- **FFmpeg 4.1+**
- **Bibliotecas do sistema** (para Chromium/Remotion)

### 🔧 Instalação Automática

```bash
# 1. Baixar script de instalação
wget https://raw.githubusercontent.com/seu-repo/install-server.sh
chmod +x install-server.sh

# 2. Executar instalação (Ubuntu/Debian)
bash install-server.sh

# 3. Clonar projeto
sudo -u videoapi git clone <seu-repo> /opt/video-api
cd /opt/video-api

# 4. Instalar dependências
sudo -u videoapi npm install

# 5. Iniciar com PM2
sudo -u videoapi pm2 start ecosystem.config.js --env production
sudo -u videoapi pm2 startup
sudo -u videoapi pm2 save
```

### 💰 Opções de Hospedagem

#### VPS/Cloud (Recomendado)
| Provedor | Config | Preço/mês |
|----------|--------|-----------|
| **DigitalOcean** | 2 vCPU, 4GB | $24 |
| **Vultr** | 2 vCPU, 4GB | $20 |
| **AWS EC2** | t3.medium | $30 |
| **Google Cloud** | e2-medium | $25 |

#### Hospedagem Especializada
| Provedor | Tipo | Preço/mês |
|----------|------|-----------|
| **Railway** | Container | $5-20 |
| **Render** | Web Service | $7-25 |

### 🔒 Configuração de Produção

#### 1. Variáveis de Ambiente
```bash
# .env
NODE_ENV=production
PORT=3002
MAX_FILE_SIZE=100
UPLOAD_TIMEOUT=300000
```

#### 2. PM2 (Gerenciamento de Processos)
```bash
# Usar todas as CPUs disponíveis
pm2 start ecosystem.config.js --env production

# Monitoramento
pm2 monit
pm2 logs video-api
```

#### 3. Nginx (Proxy Reverso)
```bash
# Instalar Nginx
sudo apt install nginx

# Copiar configuração
sudo cp nginx-video-api.conf /etc/nginx/sites-available/video-api
sudo ln -s /etc/nginx/sites-available/video-api /etc/nginx/sites-enabled/

# Ativar
sudo nginx -t
sudo systemctl reload nginx
```

### 📊 Monitoramento

#### Logs da Aplicação
```bash
# Logs em tempo real
pm2 logs video-api

# Logs do sistema
tail -f /var/log/nginx/video-api.access.log
```

#### Métricas de Performance
```bash
# Status do PM2
pm2 status

# Uso de recursos
htop
df -h
free -h
```

### 🛡️ Segurança

#### Firewall
```bash
# Portas essenciais
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw enable
```

#### SSL/HTTPS (Certbot)
```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d seu-dominio.com

# Auto-renovação
sudo crontab -e
# Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 🔧 Troubleshooting

#### Problemas Comuns

**1. Erro de memória:**
```bash
# Aumentar heap do Node.js
node --max-old-space-size=4096 server.js
```

**2. FFmpeg não encontrado:**
```bash
# Instalar FFmpeg
sudo apt update && sudo apt install ffmpeg
```

**3. Dependências do Chromium:**
```bash
# Instalar bibliotecas necessárias
sudo apt install -y libnss3-dev libatk-bridge2.0-dev libdrm-dev
```

### 📈 Otimização de Performance

#### 1. Configurações do Sistema
```bash
# Aumentar limites de arquivos
echo 'videoapi soft nofile 65536' >> /etc/security/limits.conf
echo 'videoapi hard nofile 65536' >> /etc/security/limits.conf
```

#### 2. Configurações do Node.js
```bash
# Usar múltiplos workers
pm2 start server.js -i max --name video-api
```

#### 3. Cache e CDN
- Use CDN para servir vídeos gerados
- Configure cache no Nginx para arquivos estáticos
- Implemente limpeza automática de arquivos temporários

### 🚨 Backup e Recuperação

#### Scripts de Backup
```bash
# Backup do código
tar -czf backup-$(date +%Y%m%d).tar.gz /opt/video-api

# Backup dos vídeos gerados
rsync -av /opt/video-api/out/ backup-server:/backups/videos/
```

### 📞 Suporte

Para problemas de deploy:
1. Verifique logs: `pm2 logs video-api`
2. Teste dependências: `ffmpeg -version && node --version`
3. Monitore recursos: `htop` e `df -h`

## 📱 Formato Otimizado para Mobile

A API está configurada por padrão para formato **9:16 (1080x1920)**, ideal para:
- **Instagram Stories**
- **TikTok**
- **YouTube Shorts**
- **Facebook Stories**
- **WhatsApp Status**

As imagens são automaticamente ajustadas para preencher toda a tela vertical **sem bordas pretas**, usando `object-fit: cover` para garantir que ocupem 100% da área disponível.

### Outros Formatos Suportados

Para usar outros formatos, especifique `width` e `height`:

```bash
# Formato 16:9 (landscape)
-F "width=1920" -F "height=1080"

# Formato quadrado (1:1)
-F "width=1080" -F "height=1080"

# Formato 4:3
-F "width=1440" -F "height=1080"
``` 