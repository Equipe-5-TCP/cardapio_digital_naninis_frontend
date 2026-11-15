# Nanini's Café — App do Cliente

Interface do cardápio digital acessada pelos clientes via QR code em cada mesa. Permite navegar pelo cardápio, montar o pedido e acompanhar o status em tempo real.

## Stack

| Camada | Tecnologia |
|---|---|
| Linguagem | JavaScript (React 19) |
| Framework | Expo / React Native |
| Plataforma alvo | Web (PWA via QR code na mesa) |
| Estilização | StyleSheet (React Native) |
| Infra | AWS Amplify Hosting (build estático) |

## Funcionalidades

- **Cardápio** — categorias em abas, grade de produtos responsiva (1 a 3 colunas), foto, descrição e preço
- **Carrinho** — botão +/− em cada produto, barra flutuante com total
- **Checkout** — nome do cliente, tipo (comer aqui / para levar), mesa (pré-preenchida pelo QR code), telefone, observações
- **Acompanhamento** — polling a cada 5 s, progresso visual: Recebido → Preparando → Pronto

## Como o QR code funciona

O QR code de cada mesa aponta para a URL do app com o parâmetro `?mesa=N`:

```
https://seu-app.amplifyapp.com/?mesa=5
```

O app lê o parâmetro automaticamente e pré-preenche o número da mesa no checkout.

## Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `EXPO_PUBLIC_API_URL` | URL base da API (Elastic Beanstalk). O prefixo `EXPO_PUBLIC_` é obrigatório para o Expo incluir a variável no bundle. |

Copie `.env.example` para `.env`:

```bash
cp .env.example .env
# edite EXPO_PUBLIC_API_URL com o endereço local da API
```

## Rodando localmente

```bash
# 1. Instalar dependências
npm install

# 2. Configurar variável de ambiente
cp .env.example .env
# edite .env: EXPO_PUBLIC_API_URL=http://localhost:8000

# 3. Iniciar no navegador
npm run web
# Abre em http://localhost:8081
```

> A API precisa estar rodando localmente ou apontar para o ambiente de staging.

## Build para produção (Amplify)

O Amplify executa automaticamente ao fazer push para a branch conectada:

```bash
npx expo export --platform web
# Gera a pasta dist/ com o site estático
```

O arquivo `amplify.yml` na raiz do projeto configura esse processo automaticamente.

## Deploy manual

```bash
# Build local
npx expo export --platform web

# O conteúdo de dist/ pode ser servido por qualquer CDN ou servidor estático
```

## Rodando os testes

```bash
npm test -- --watchAll=false
```

## Estrutura do projeto

```
cardapio_digital_naninis_frontend/
├── App.js               # Aplicação completa (menu, checkout, tracking)
├── index.js             # Entry point Expo
├── app.json             # Configuração Expo (slug, ícones, web output)
├── amplify.yml          # Build spec do Amplify Hosting
├── .env.example         # Template de variáveis de ambiente
├── src/
│   ├── api.js           # Chamadas HTTP para a API (getMenu, createOrder, getStatus)
│   └── theme.js         # Paleta de cores e formatador de moeda
├── assets/              # Ícones e splash screen
└── __tests__/
    ├── api.test.js
    ├── Button.test.js
    ├── cart.test.js
    └── money.test.js
```
