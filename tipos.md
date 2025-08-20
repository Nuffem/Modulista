# Tipos de Itens - Modulista

Este documento descreve todos os tipos de itens disponíveis no Modulista, suas características, funcionalidades e exemplos de uso.

## Visão Geral

O Modulista oferece 8 tipos diferentes de itens para estruturar e organizar seus dados. Cada tipo tem características específicas e serve para diferentes propósitos:

- **Tipos Básicos**: Texto, Número, Lógico, Lista
- **Tipos de Expressão**: Soma, Subtração, Condicional
- **Tipos de Referência**: Referência

## 📝 Texto

**Nome interno**: `text`  
**Ícone**: 📄 (text)  
**Tipo de valor**: Texto

### Descrição
O tipo Texto é usado para armazenar valores de string. É o tipo mais básico e fundamental para dados textuais.

### Características
- Interface de edição com campo de entrada de texto
- Valores são exibidos exatamente como inseridos
- Suporte a qualquer caractere Unicode
- No formato de texto customizado, valores aparecem entre aspas

### Exemplo de Uso
```
{
  nome: "João Silva"
  descricao: "Desenvolvedor Full-Stack"
  endereco: "Rua das Flores, 123"
}
```

### Interface
- **Lista**: Campo de entrada de texto editável inline
- **Edição**: Campo de entrada de texto padrão

---

## 🔢 Número

**Nome interno**: `number`  
**Ícone**: 🔢 (number)  
**Tipo de valor**: Numérico

### Descrição
O tipo Número é usado para armazenar valores numéricos, incluindo números inteiros e decimais.

### Características
- Interface de edição com campo numérico
- Conversão automática para tipo number do JavaScript
- Valores inválidos são convertidos para 0
- Suporte a números positivos, negativos e decimais

### Exemplo de Uso
```
{
  idade: 30
  salario: 5500.50
  temperatura: -15.3
  contador: 0
}
```

### Interface
- **Lista**: Campo de entrada numérico editável inline
- **Edição**: Campo de entrada numérico com validação

### Validação
- Valores não numéricos são automaticamente convertidos para 0
- NaN é tratado como 0

---

## ✅ Lógico

**Nome interno**: `boolean`  
**Ícone**: ☑️ (boolean)  
**Tipo de valor**: Booleano

### Descrição
O tipo Lógico é usado para armazenar valores verdadeiro/falso. Utiliza a sintaxe especial `@1` para verdadeiro e `@0` para falso.

### Características
- Interface com checkbox para fácil alternância
- Formato especial no texto: `@1` (verdadeiro) e `@0` (falso)
- Clique em qualquer lugar do item para alternar o valor
- Estado visual claro com checkbox marcado/desmarcado

### Exemplo de Uso
```
{
  ativo: @1
  verificado: @0
  administrador: @1
  notificacoes: @0
}
```

### Interface
- **Lista**: Checkbox editável inline com nome do item
- **Edição**: Checkbox simples
- **Interação**: Clique em qualquer lugar do item para alternar

### Formato de Texto
- `@1` = verdadeiro (true)
- `@0` = falso (false)

---

## 📋 Lista

**Nome interno**: `list`  
**Ícone**: 📋 (list-square)  
**Tipo de valor**: Lista/Objeto  
**Navegável**: Sim

### Descrição
O tipo Lista é usado para criar estruturas hierárquicas e organizacionais. Funciona como um contêiner que pode armazenar outros itens dentro dele.

### Características
- Permite navegação hierárquica (clique para entrar)
- Não possui valor editável próprio
- Serve como organizador e agrupador de outros itens
- Suporte a aninhamento ilimitado
- Sistema de breadcrumb para navegação

### Exemplo de Uso
```
{
  usuario: {
    dados_pessoais: {
      nome: "Maria"
      idade: 28
    }
    configuracoes: {
      tema: "escuro"
      notificacoes: @1
    }
  }
  projeto: {
    nome: "Website"
    status: "em_andamento"
  }
}
```

### Interface
- **Lista**: Apenas exibe o nome, sem valor editável
- **Edição**: Mensagem informativa sobre não ter valor editável
- **Navegação**: Clique no item para entrar na estrutura interna

### Estrutura Hierárquica
Listas podem conter qualquer tipo de item, incluindo outras listas, criando estruturas complexas e organizadas.

---

## ➕ Soma

**Nome interno**: `soma`  
**Ícone**: ➕ (soma)  
**Tipo de valor**: Numérico (resultado)  
**Tipo de expressão**: Sim  
**Navegável**: Sim

### Descrição
O tipo Soma é uma expressão que calcula automaticamente a soma de todos os valores numéricos de seus itens filhos.

### Características
- Avaliação automática de valores filhos
- Suporte a itens do tipo Número
- Recursão com outras expressões (Soma/Subtração)
- Exibição do resultado calculado em azul
- Navegável para adicionar/editar valores internos

### Exemplo de Uso
```
{
  total_vendas: {  // Tipo: Soma
    janeiro: 1500    // Tipo: Número
    fevereiro: 2300  // Tipo: Número  
    marco: 1800      // Tipo: Número
    // Resultado calculado: 5600
  }
  
  despesas_mensais: {  // Tipo: Soma
    fixas: {           // Tipo: Soma aninhada
      aluguel: 1200
      internet: 100
    }
    variaveis: 800     // Tipo: Número
    // Resultado: 1300 + 800 = 2100
  }
}
```

### Interface
- **Lista**: Nome + resultado calculado em azul (`= 5600`)
- **Edição**: Instrução para configurar valores internos
- **Navegação**: Clique para gerenciar itens que serão somados

### Regras de Cálculo
1. Soma todos os itens filhos do tipo Número
2. Recursivamente avalia expressões filhas (Soma/Subtração)
3. Ignora tipos não numéricos
4. Retorna 0 se não houver valores válidos

---

## ➖ Subtração

**Nome interno**: `subtracao`  
**Ícone**: ➖ (subtracao)  
**Tipo de valor**: Numérico (resultado)  
**Tipo de expressão**: Sim  
**Navegável**: Sim

### Descrição
O tipo Subtração é uma expressão que calcula a subtração sequencial de todos os valores numéricos de seus itens filhos.

### Características
- O primeiro valor é o minuendo, os demais são subtraendos
- Avaliação automática de valores filhos
- Suporte a itens do tipo Número
- Recursão com outras expressões (Soma/Subtração)
- Exibição do resultado calculado em vermelho
- Navegável para adicionar/editar valores internos

### Exemplo de Uso
```
{
  lucro_liquido: {    // Tipo: Subtração
    receita_bruta: 10000   // Primeiro valor (minuendo)
    impostos: 1500         // Subtração
    despesas: 3200         // Subtração
    // Resultado: 10000 - 1500 - 3200 = 5300
  }
  
  saldo_conta: {      // Tipo: Subtração
    saldo_inicial: 5000
    saques: {         // Tipo: Soma aninhada
      saque1: 200
      saque2: 150
    }
    // Resultado: 5000 - 350 = 4650
  }
}
```

### Interface
- **Lista**: Nome + resultado calculado em vermelho (`= 5300`)
- **Edição**: Instrução para configurar valores internos
- **Navegação**: Clique para gerenciar itens que serão subtraídos

### Regras de Cálculo
1. O primeiro item numérico é o valor inicial
2. Todos os demais itens numéricos são subtraídos
3. Recursivamente avalia expressões filhas (Soma/Subtração)
4. Ignora tipos não numéricos
5. Retorna 0 se não houver valores válidos

---

## 🔗 Referência

**Nome interno**: `reference`  
**Ícone**: 🔗 (link)  
**Tipo de valor**: Referência

### Descrição
O tipo Referência permite criar vínculos com outras propriedades existentes no mesmo nível hierárquico.

### Características
- Interface de seleção com dropdown
- Lista automática de propriedades disponíveis no mesmo nível
- Exibição do tipo de cada propriedade disponível
- Validação de existência da propriedade referenciada
- Útil para criar relacionamentos entre dados

### Exemplo de Uso
```
{
  produtos: {
    produto_principal: "Notebook Dell"
    categoria: "Eletrônicos" 
    produto_relacionado: produto_principal  // Referência
  }
  
  configuracoes: {
    tema_atual: "claro"
    tema_preferido: tema_atual  // Referência
    backup_tema: tema_atual     // Outra referência
  }
}
```

### Interface
- **Lista**: Dropdown com propriedades disponíveis
- **Edição**: Dropdown com propriedades disponíveis
- **Opções**: Mostra nome e tipo de cada propriedade (`nome (Tipo)`)

### Comportamento
- Só mostra propriedades do mesmo nível hierárquico
- Exclui a própria propriedade da lista
- Mostra mensagem quando não há propriedades disponíveis
- Permite limpar a referência (valor vazio)

---

## ❓ Condicional

**Nome interno**: `condicional`  
**Ícone**: ❓ (boolean)  
**Tipo de valor**: Misto (depende da condição)  
**Tipo de expressão**: Sim  
**Navegável**: Não

### Descrição
O tipo Condicional implementa expressões condicionais usando a sintaxe `condição ? valorSeVerdadeiro : valorSeFalso`.

### Características
- Avaliação de condições lógicas
- Retorna diferentes valores baseado na condição
- Suporte a comparações numéricas e textuais
- Interface flexível para entrada de expressões
- Resultado pode ser de qualquer tipo (texto, número, booleano)

### Exemplo de Uso
```
{
  status_usuario: {  // Tipo: Condicional
    // Condição: idade > 18 ? "Adulto" : "Menor"
    // Se idade > 18, retorna "Adulto", senão "Menor"
  }
  
  desconto: {        // Tipo: Condicional  
    // Condição: valor > 1000 ? 0.1 : 0.05
    // Desconto de 10% se valor > 1000, senão 5%
  }
  
  acesso_admin: {    // Tipo: Condicional
    // Condição: tipo_usuario == "admin" ? @1 : @0  
    // Verdadeiro se admin, falso caso contrário
  }
}
```

### Interface
- **Lista**: Três campos separados (Condição, Valor se Verdadeiro, Valor se Falso)
- **Edição**: Campo único com sintaxe completa

### Sintaxe de Condição
- **Comparações**: `>`, `<`, `>=`, `<=`, `==`, `!=`
- **Valores**: números, texto entre aspas, referências a propriedades
- **Booleanos**: `@1` (verdadeiro), `@0` (falso)

### Exemplos de Condições
```
idade > 18 ? "Maior de idade" : "Menor de idade"
valor >= 100 ? @1 : @0
status == "ativo" ? "Funcionando" : "Parado"
nota >= 7 ? "Aprovado" : "Reprovado"
```

---

## 🎯 Tipos de Expressão vs Tipos Básicos

### Tipos Básicos
- **Texto, Número, Lógico, Lista**: Armazenam valores diretos
- Editáveis diretamente pelo usuário
- Valores fixos até serem modificados manualmente

### Tipos de Expressão
- **Soma, Subtração, Condicional**: Calculam valores automaticamente
- Marcados com `isExpression: true`
- Valores são recalculados dinamicamente
- Não editáveis diretamente (exceto configuração da expressão)

### Navegabilidade
- **Navegáveis**: Lista, Soma, Subtração
- **Não navegáveis**: Texto, Número, Lógico, Referência, Condicional

---

## 💡 Dicas de Uso

### Organização com Listas
Use listas para agrupar informações relacionadas e criar hierarquias lógicas:
```
{
  projeto: {
    informacoes: {
      nome: "Sistema Web"
      inicio: "2024-01-15"
    }
    equipe: {
      desenvolvedor: "João"
      designer: "Maria"
    }
  }
}
```

### Cálculos com Expressões
Combine Soma e Subtração para cálculos complexos:
```
{
  financeiro: {
    receitas: {      // Soma
      vendas: 15000
      servicos: 8000
    }
    despesas: {      // Soma
      salarios: 12000
      aluguel: 3000
    }
    resultado: {     // Subtração
      total_receitas: receitas    // Referência à soma
      total_despesas: despesas    // Referência à soma
    }
  }
}
```

### Condições Dinâmicas
Use condicionais para lógica de negócio:
```
{
  vendedor: {
    vendas_mes: 25000
    meta: 20000
    bonus: {  // Condicional
      // vendas_mes > meta ? vendas_mes * 0.05 : 0
    }
    status: {  // Condicional  
      // vendas_mes > meta ? "Meta atingida" : "Abaixo da meta"
    }
  }
}
```

### Referências para Reutilização
Use referências para evitar duplicação:
```
{
  configuracao: {
    cor_principal: "#2563eb"
    cor_secundaria: cor_principal  // Reutiliza a cor
    tema_ativo: "profissional"
    tema_backup: tema_ativo       // Backup do tema
  }
}
```

---

## 🔄 Formato de Texto Customizado

Todos os tipos são representados no formato de texto customizado do Modulista:

```
{
  texto_exemplo: "Olá mundo"
  numero_exemplo: 42
  booleano_exemplo: @1
  lista_exemplo: {
    item_interno: "valor"
  }
  soma_exemplo: {
    valor1: 10
    valor2: 20
    // Resultado calculado: 30
  }
}
```

### Características do Formato
- **Sem vírgulas** entre itens (diferente do JSON)
- **Sem aspas** nas chaves
- **Booleanos especiais**: `@1` e `@0`
- **Aninhamento** com chaves `{}`
- **Expressões** calculadas automaticamente

Este formato é exclusivo do Modulista e otimizado para legibilidade e facilidade de edição manual.