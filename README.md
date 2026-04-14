# SIA – Sistema Integrado de Avaliação

## 1. Visão da arquitetura do sistema

O SIA é construído como uma aplicação full stack com:
- Frontend em HTML, CSS, JavaScript e Bootstrap
- Backend em Node.js + Express
- Banco de dados principal em Google Sheets via Google Sheets API
- Autenticação administrativa via JWT
- Estrutura separada em `frontend/` e `backend/`

### Funcionamento principal
- Usuários respondentes acessam formulários públicos e preenchem avaliações em etapas
- Respostas são gravadas nas abas `BASE_EXAME_PROVAS` e `BASE_CCP_CAP`
- Admin acessa painel protegido para visualizar respostas, alertas e relatórios
- O backend expõe uma API REST para cadastro de perguntas, envio de respostas e dados analíticos

## 2. Estrutura de pastas

- `backend/`
  - `server.js` - ponto de entrada do servidor Express
  - `routes/` - definição de rotas públicas e administrativas
  - `controllers/` - lógica de tratamento de requisições
  - `services/` - integração com Google Sheets
  - `middlewares/` - autenticação JWT do admin
  - `config/` - configuração de ambiente
- `frontend/`
  - `index.html` - portal inicial
  - `responder-exame.html` - formulário de Exame por Provas
  - `responder-ccp-cap.html` - formulário de CCP/CAP
  - `admin-login.html` - login administrativo
  - `admin-dashboard.html` - painel principal do admin
  - `admin-respostas.html` - listagem de respostas
  - `admin-alertas.html` - alertas críticos
  - `admin-relatorios.html` - relatórios analíticos
  - `assets/css/style.css` - estilos do projeto
  - `assets/js/api.js` - camada de comunicação com o backend
  - `assets/js/app.js` - lógica dos formulários públicos
  - `assets/js/admin.js` - lógica da área administrativa
- `.env.example` - exemplo de configuração sensibilizada
- `package.json` - dependências e scripts de execução

## 3. Código completo entregue

O projeto inclui:
- Backend com rotas: `/api/cadastros`, `/api/perguntas/:formulario`, `/api/respostas/exame`, `/api/respostas/ccp-cap`, `/api/admin/login`, `/api/admin/dashboard`, `/api/admin/respostas`, `/api/admin/respostas/:id`, `/api/admin/alertas`, `/api/admin/relatorios`
- Serviço de Google Sheets que lê e escreve linhas usando as abas exigidas
- Formulários dinâmicos que carregam perguntas a partir de `DICIONARIO_PERGUNTAS`
- Validação de frontend e backend, barra de progresso e justificativas condicionais
- Painel admin com login, indicadores, tabelas e alertas

## 4. Instalação de dependências

No diretório raiz do projeto:

```bash
npm install
```

## 5. Configuração do arquivo `.env`

Crie um arquivo `.env` copiando o `.env.example` e preencha:

- `PORT` - porta onde o backend irá rodar
- `GOOGLE_SHEET_ID` - ID da planilha do Google Sheets
- `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS` - JSON da conta de serviço como string
- `JWT_SECRET` - segredo para autenticação administrativa
- `ADMIN_USER` - usuário administrativo
- `ADMIN_PASSWORD` - senha administrativa
- `CORS_ORIGIN` - origem permitida para chamadas CORS

### Exemplo mínimo

```env
PORT=3000
GOOGLE_SHEET_ID=1aBcD...XYZ
GOOGLE_SERVICE_ACCOUNT_CREDENTIALS={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...","client_id":"...","auth_uri":"https://accounts.google.com/o/oauth2/auth","token_uri":"https://oauth2.googleapis.com/token","auth_provider_x509_cert_url":"https://www.googleapis.com/oauth2/v1/certs","client_x509_cert_url":"..."}
JWT_SECRET=uma_chave_forte
ADMIN_USER=admin
ADMIN_PASSWORD=senha123
CORS_ORIGIN=http://localhost:5500
```

## 6. Rodar localmente

1. Inicie o backend:

```bash
npm start
```

2. Sirva o frontend como arquivos estáticos em um servidor local ou abra os arquivos diretamente via navegador.

> Se você precisar de um servidor local para frontend, use o Live Server do VS Code ou `npx serve frontend`.

3. Acesse o portal público via `frontend/index.html` e o admin via `frontend/admin-login.html`.

## 7. Deploy

### Render (backend)

1. Crie um novo serviço Web no Render apontando para o repositório GitHub.
2. Defina o comando de start como:

```bash
npm start
```

3. Configure as variáveis de ambiente no painel do Render com os valores de `.env`.
4. Garanta que `GOOGLE_SHEET_ID` e `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS` estejam corretos.

### Netlify (frontend)

1. Aponte o site Netlify para a pasta `frontend` do repositório.
2. Caso o backend esteja hospedado em Render, atualize `frontend/assets/js/api.js` para usar a URL do backend:

```js
const API_BASE_URL = 'https://seu-backend-render.onrender.com';
```

3. Publique o site.

## 8. Conectar a service account ao Google Sheets

1. Crie uma conta de serviço no Google Cloud.
2. Gere uma chave JSON e copie o conteúdo para `GOOGLE_SERVICE_ACCOUNT_CREDENTIALS` no `.env`.
3. Compartilhe a planilha com o `client_email` da service account com permissão de edição.
4. Não altere nomes das abas nem cabeçalhos existentes.

---

## 9. Observações finais

O projeto foi construído com foco em simplicidade, separação de responsabilidades e preparação para evolução futura.
As páginas públicas carregam perguntas dinamicamente e o backend mantém o Google Sheets como fonte principal dos dados.
