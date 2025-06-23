#!/bin/bash

# 🎬 Exemplo de uso da API de Geração de Vídeos com Remotion
# 
# Este script demonstra como usar a API com 2 áudios, controle de volume e efeitos de transição
# 
# Uso: ./postman-curl-example.sh

API_URL="http://localhost:3002"

echo "🎬 Testando API de Geração de Vídeos com Remotion"
echo "================================================"

# Verificar se a API está online
echo "1. Verificando status da API..."
curl -s "$API_URL/api/status" | jq '.'

echo -e "\n2. Consultando efeitos de transição disponíveis..."
curl -s "$API_URL/api/transition-effects" | jq '.'

echo -e "\n3. Criando vídeo com efeito zoom-out..."

# Exemplo completo com 2 áudios, controle de volume e efeito zoom-out
curl -X POST "$API_URL/api/create-video" \
  -F "primaryAudio=@./examples/oracao.mp3" \
  -F "secondaryAudio=@./examples/musica.MP3" \
  -F "primaryAudioVolume=1.0" \
  -F "secondaryAudioVolume=0.2" \
  -F "transitionEffect=zoom-out" \
  -F "images=@./examples/01.png" \
  -F "images=@./examples/02.png" \
  -F "images=@./examples/03.png" \
  -F "images=@./examples/04.png" \
  -F "images=@./examples/05.png" \
  -F "imageDuration=4" \
  -F "transitionDuration=1" \
  -F "fps=30" \
  -F "width=1920" \
  -F "height=1080" \
  | jq '.'

echo -e "\n✅ Teste concluído!"
echo "💡 Para baixar o vídeo, use: curl -O $API_URL/download/NOME_DO_ARQUIVO.mp4"

# Exemplos de diferentes efeitos
echo -e "\n📝 Exemplos com diferentes efeitos:"

echo -e "\n🔍 Zoom-out (150% → 100%):"
echo "curl -X POST $API_URL/api/create-video \\"
echo "  -F \"primaryAudio=@./examples/oracao.mp3\" \\"
echo "  -F \"transitionEffect=zoom-out\" \\"
echo "  -F \"transitionDuration=1\" \\"
echo "  -F \"images=@./examples/01.png\" \\"
echo "  -F \"images=@./examples/02.png\""

echo -e "\n➡️  Slide horizontal:"
echo "curl -X POST $API_URL/api/create-video \\"
echo "  -F \"primaryAudio=@./examples/oracao.mp3\" \\"
echo "  -F \"transitionEffect=slide-left\" \\"
echo "  -F \"transitionDuration=1.5\" \\"
echo "  -F \"images=@./examples/01.png\" \\"
echo "  -F \"images=@./examples/02.png\""

echo -e "\n🔄 Rotação com fade:"
echo "curl -X POST $API_URL/api/create-video \\"
echo "  -F \"primaryAudio=@./examples/oracao.mp3\" \\"
echo "  -F \"transitionEffect=rotate-fade\" \\"
echo "  -F \"transitionDuration=2\" \\"
echo "  -F \"images=@./examples/01.png\" \\"
echo "  -F \"images=@./examples/02.png\""

echo -e "\n🎵 Dicas de Volume e Efeitos:"
echo "  • Áudio principal (oração): 1.0 (volume máximo)"
echo "  • Música de fundo: 0.1-0.3 (para não sobrepor)"
echo "  • Zoom-out: ideal para fotos com detalhes centrais"
echo "  • Slide: ideal para sequências narrativas"
echo "  • Rotate-fade: ideal para efeitos artísticos"

echo -e "\n🎨 Efeitos disponíveis:"
echo "  fade, zoom-out, zoom-in, slide-left, slide-right,"
echo "  slide-up, slide-down, rotate-fade, scale-rotate"

# ==============================================
# COMANDOS cURL PARA IMPORTAR NO POSTMAN
# ==============================================

echo "📋 Comandos cURL para testar a API de Geração de Vídeos"
echo "🔗 Importe estes comandos no Postman ou execute diretamente"
echo ""

# 1. VERIFICAR STATUS DA API
echo "1️⃣ VERIFICAR STATUS DA API:"
echo ""
curl --location --request GET 'http://localhost:3002/api/status' \
--header 'Content-Type: application/json'

echo -e "\n\n"

# 2. CRIAR VÍDEO - EXEMPLO COMPLETO
echo "2️⃣ CRIAR VÍDEO (Exemplo com todos os parâmetros):"
echo ""
curl --location --request POST 'http://localhost:3002/api/create-video' \
--form 'audio=@"/caminho/para/seu/audio.mp3"' \
--form 'images=@"/caminho/para/imagem1.jpg"' \
--form 'images=@"/caminho/para/imagem2.jpg"' \
--form 'images=@"/caminho/para/imagem3.jpg"' \
--form 'images=@"/caminho/para/imagem4.jpg"' \
--form 'images=@"/caminho/para/imagem5.jpg"' \
--form 'imageDuration="4"' \
--form 'transitionDuration="1.5"' \
--form 'fps="30"' \
--form 'width="1920"' \
--form 'height="1080"' \
--form 'outputFormat="mp4"'

echo -e "\n\n"

# 3. CRIAR VÍDEO - EXEMPLO MÍNIMO
echo "3️⃣ CRIAR VÍDEO (Exemplo mínimo - apenas obrigatórios):"
echo ""
curl --location --request POST 'http://localhost:3002/api/create-video' \
--form 'audio=@"/caminho/para/seu/audio.mp3"' \
--form 'images=@"/caminho/para/imagem1.jpg"' \
--form 'images=@"/caminho/para/imagem2.jpg"' \
--form 'images=@"/caminho/para/imagem3.jpg"'

echo -e "\n\n"

# 4. DOWNLOAD DO VÍDEO
echo "4️⃣ DOWNLOAD DO VÍDEO (substitua NOME_DO_ARQUIVO.mp4):"
echo ""
curl --location --request GET 'http://localhost:3002/download/NOME_DO_ARQUIVO.mp4' \
--output './video-baixado.mp4'

echo -e "\n\n"

# INSTRUÇÕES PARA O POSTMAN
echo "📖 INSTRUÇÕES PARA IMPORTAR NO POSTMAN:"
echo ""
echo "1. Abra o Postman"
echo "2. Clique em 'Import' no canto superior esquerdo"
echo "3. Selecione 'Raw text'"
echo "4. Cole um dos comandos cURL acima"
echo "5. Clique em 'Continue' > 'Import'"
echo ""
echo "⚠️  IMPORTANTE: Substitua os caminhos dos arquivos pelos caminhos reais no seu sistema!"
echo ""
echo "💡 DICA: Para testar rapidamente, coloque arquivos de exemplo em:"
echo "   - ./public/sample-audio.mp3"
echo "   - ./public/sample-image-1.jpg"
echo "   - ./public/sample-image-2.jpg"
echo "   - etc..." 