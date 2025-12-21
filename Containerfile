FROM node:22-slim

# Instala dependências do sistema
RUN apt-get update && apt-get install -y \
  git \
  curl \
  gzip \
  && rm -rf /var/lib/apt/lists/*

# Instala ferramentas do Elm globalmente via npm
RUN npm install -g elm elm-live elm-test elm-format

# Define o diretório de trabalho
WORKDIR /app

# Expõe a porta usada pelo elm-live
EXPOSE 8000

# Comando padrão para iniciar o servidor de desenvolvimento
# Compila src/Main.elm para elm.js e serve index.html
CMD ["elm-live", "src/Main.elm", "--start-page=index.html", "--host=0.0.0.0", "--pushstate", "--", "--output=elm.js"]
