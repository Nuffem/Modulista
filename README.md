# Modulista

Acesse a aplicação em: https://nuffem.github.io/Modulista/

Modulista é uma aplicação web client-side para gerenciar estruturas de dados hierárquicas com um formato de texto customizado. Oferece uma interface de visualização dupla (visualização em Lista para edição estruturada e visualização em Texto para edição de texto bruto) e armazena dados localmente no IndexedDB.

## 🚀 Características

- **Interface Dupla**: Alterne entre visualização estruturada (Lista) e edição de texto bruto (Texto)
- **Tipos de Dados Suportados**: 
  - Texto (strings entre aspas)
  - Número (valores numéricos)
  - Booleano (@1 para verdadeiro, @0 para falso)
  - Lista (estruturas aninhadas)
- **Armazenamento Local**: Dados persistem automaticamente no IndexedDB do navegador
- **Navegação Hierárquica**: Sistema de breadcrumb para navegar por estruturas aninhadas
- **Importação/Exportação**: Carregue e salve dados do/para seu dispositivo
- **Formato Personalizado**: Sintaxe própria otimizada para legibilidade (não é JSON)
- **Interface Responsiva**: Funciona em desktop e dispositivos móveis

## 📋 Pré-requisitos

- Node.js 18+ (para desenvolvimento e testes)
- Navegador moderno com suporte a ES modules
- Servidor HTTP (não funciona com file://)

## 🛠️ Instalação e Execução

### 1. Clone o repositório
```bash
git clone https://github.com/Nuffem/Modulista.git
cd Modulista
```

### 2. Instale as dependências (apenas para desenvolvimento)
```bash
npm install
```

### 3. Execute a aplicação
```bash
# Usando Python (recomendado)
python3 -m http.server 8000

# Ou usando Node.js
npx http-server -p 8000

# Ou qualquer outro servidor HTTP
```

### 4. Acesse a aplicação
Abra seu navegador e vá para: `http://localhost:8000`

**⚠️ Importante**: A aplicação deve ser servida via HTTP devido ao uso de ES modules. Não funciona abrindo o arquivo diretamente no navegador.

## 📖 Como Usar

### Adicionando Itens
1. Na visualização **Lista**, clique no botão "+" para adicionar um novo item
2. Digite o nome do item
3. Selecione o tipo (Texto, Número, Booleano ou Lista)
4. Insira o valor apropriado
5. Clique em "Salvar"

### Navegação
- Clique em itens do tipo "Lista" para navegar para dentro da estrutura
- Use o breadcrumb no topo para voltar a níveis anteriores
- O botão "casa" leva você de volta à raiz

### Editando em Texto
1. Vá para a aba **Texto**
2. Edite o conteúdo diretamente usando o formato personalizado
3. Clique no botão "aplicar" (ícone de salvar) para sincronizar com a visualização Lista

### Importar/Exportar
- **Carregar do dispositivo**: Importa um arquivo de texto com o formato personalizado
- **Salvar no dispositivo**: Exporta seus dados como arquivo de texto

## 🔤 Formato de Texto Personalizado

O Modulista usa um formato de texto customizado que **não é JSON**. Principais diferenças:

### Sintaxe Básica
```
{ 
  nome: "João Silva"
  idade: 30
  ativo: @1
  configuracoes: {
    tema: "escuro"
    notificacoes: @0
  }
}
```

### Tipos de Dados

#### Texto
Strings entre aspas duplas:
```
{ mensagem: "Olá, mundo!" }
```

#### Número
Valores numéricos sem aspas:
```
{ idade: 25 preco: 19.99 }
```

#### Booleano
- `@1` para verdadeiro
- `@0` para falso
```
{ ativo: @1 visivel: @0 }
```

#### Lista (Objetos Aninhados)
Estruturas hierárquicas usando chaves:
```
{
  usuario: {
    nome: "Maria"
    endereco: {
      cidade: "São Paulo"
      cep: "01234-567"
    }
  }
}
```

### Diferenças do JSON
- **Sem vírgulas** entre itens
- **Sem aspas** nas chaves
- **Booleanos especiais** (@1/@0 em vez de true/false)
- **Sintaxe mais limpa** para leitura humana

## 🧪 Desenvolvimento e Testes

### Executar Testes
```bash
npm test
```
- 37 testes automatizados
- Cobertura: parser customizado, gerenciamento de itens, operações de banco, funcionalidade de UI
- Ambiente: Jest com fake-indexeddb e jsdom

### Estrutura do Projeto
```
.
├── README.md
├── index.html              # Ponto de entrada
├── package.json            # Dependências e scripts
├── src/
│   ├── app.js             # Lógica principal da aplicação
│   ├── db.js              # Operações do IndexedDB
│   ├── custom-parser.js   # Parser do formato personalizado
│   ├── icon-loader.js     # Sistema de ícones SVG
│   ├── types/             # Definições dos tipos de dados
│   └── icons/             # Arquivos de ícone SVG
├── tests/                 # Suíte de testes Jest
└── .github/
    └── workflows/ci.yml   # GitHub Actions
```

### Tecnologias Utilizadas
- **Frontend**: JavaScript ES modules vanilla
- **Styling**: Tailwind CSS
- **Storage**: IndexedDB (navegador)
- **Testes**: Jest com jsdom
- **Build**: Nenhum (executa diretamente do código fonte)

### Adicionando Novos Recursos
1. Modifique os arquivos fonte em `src/`
2. Adicione testes em `tests/` para nova funcionalidade
3. Execute `npm test` para verificar que todos os testes passam
4. Teste manualmente via servidor HTTP

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Adicione testes para suas mudanças
4. Execute os testes (`npm test`)
5. Teste manualmente a aplicação
6. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
7. Push para a branch (`git push origin feature/AmazingFeature`)
8. Abra um Pull Request

### Workflow de Testes
- Testes automatizados executam no GitHub Actions
- Todos os 31 testes devem passar
- Teste cenários manuais após mudanças significativas

## 📝 Licença

Este projeto está sob a licença ISC. Veja o arquivo `package.json` para detalhes.

## 🆘 Solução de Problemas

### Aplicação não carrega
- Verifique se está usando um servidor HTTP (não file://)
- Confirme que o navegador suporte ES modules
- Verifique o console do navegador para erros

### Dados não persistem
- IndexedDB pode estar desabilitado
- Modo privado/incógnito pode limitar armazenamento
- Verifique as configurações de armazenamento do navegador

### Testes falhando
- Execute `npm install` para garantir dependências atualizadas
- Use Node.js 18+ conforme especificado nos pré-requisitos