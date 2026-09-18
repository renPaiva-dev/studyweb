# Deploy no Railway (demonstração/defesa)

Guia para publicar o Sinapse no [Railway](https://railway.app) como backup
de uma demonstração ao vivo — evita depender de `docker compose up` rodando
na máquina do apresentador no dia da defesa. Usa o mesmo `Dockerfile` de
cada serviço já versionado neste repositório (nenhuma imagem nova é
necessária).

> A interface do Railway muda com frequência — os nomes exatos de botão
> podem variar um pouco, mas a estrutura abaixo (3 serviços: Postgres,
> backend, frontend) e as variáveis de ambiente são o que realmente importa.

## 1. Criar o projeto e o banco

1. Crie uma conta em railway.app (dá para logar com GitHub).
2. **New Project** → **Deploy from GitHub repo** → selecione este
   repositório (`studyweb`).
3. No mesmo projeto, **New** → **Database** → **Add PostgreSQL**. O Railway
   cria um serviço de banco com as variáveis `PGHOST`, `PGPORT`,
   `PGDATABASE`, `PGUSER`, `PGPASSWORD` prontas para referenciar de outro
   serviço.

> **Banco não exposto publicamente**: por padrão, o plugin de Postgres do
> Railway não expõe porta pública — só é alcançável pelos outros serviços do
> mesmo projeto, pela rede interna. Não gere um domínio/proxy TCP público
> para o serviço de banco a menos que exista uma razão explícita para isso
> (ex.: acessar via `psql` da sua máquina); se precisar, restrinja
> imediatamente depois. Localmente (`docker-compose.yml`), o Postgres também
> só é exposto na rede interna do compose (a porta mapeada no host,
> `5433`, é só para acesso do desenvolvedor, não é preciso desativar para
> rodar a aplicação).

## 2. Serviço de backend

**New** → **GitHub Repo** (mesmo repositório) → em **Settings**, deixe o
**Root Directory** na raiz do projeto (onde está o `Dockerfile` principal) —
o Railway detecta e usa esse Dockerfile automaticamente.

Em **Variables**, defina (sintaxe `${{ServiceName.VAR}}` referencia a
variável de outro serviço no mesmo projeto Railway — troque `Postgres` pelo
nome real do serviço de banco, se você renomeá-lo):

```
SPRING_PROFILES_ACTIVE=docker
SPRING_DATASOURCE_URL=jdbc:postgresql://${{Postgres.PGHOST}}:${{Postgres.PGPORT}}/${{Postgres.PGDATABASE}}
DB_USERNAME=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
JWT_SECRET=<gere com: openssl rand -base64 32>
GEMINI_API_KEY=<sua chave da API Gemini>
CORS_ALLOWED_ORIGINS=http://localhost:5173
FRONTEND_URL=http://localhost:5173
```

(`CORS_ALLOWED_ORIGINS`/`FRONTEND_URL` ficam com um placeholder por
enquanto — você volta aqui no passo 4, depois que o frontend tiver um
domínio.)

Em **Settings → Networking**, gere um domínio público (**Generate Domain**).
O backend escuta na porta que o Railway injeta via `PORT` (já configurado em
`application-docker.properties` como `server.port=${PORT:8080}`), então não
precisa fixar uma porta manualmente.

Anote a URL gerada (ex.: `https://studyweb-backend-production.up.railway.app`)
— é o valor de `VITE_API_URL` do próximo passo.

## 3. Serviço de frontend

**New** → **GitHub Repo** (mesmo repositório) novamente → em **Settings**,
mude o **Root Directory** para `frontend` (onde está o `Dockerfile` do
frontend).

Em **Variables**, defina:

```
VITE_API_URL=<URL do backend gerada no passo 2>
```

`VITE_API_URL` é lida em *build time* pelo Vite (não em runtime) — o
Dockerfile do frontend já declara `ARG VITE_API_URL`, e o Railway repassa as
variáveis do serviço como build args automaticamente para builds via
Dockerfile. Se o valor não "pegar" no build (a UI do Railway muda; confira
se há uma seção separada de **Build Args**), configure-o explicitamente ali.

Gere um domínio público em **Settings → Networking** (mesmo processo do
passo 2) — o Nginx do frontend também respeita `PORT` dinamicamente (ver
`frontend/nginx.conf.template`).

## 4. Fechar o CORS

Volte ao serviço de **backend** e atualize:

```
CORS_ALLOWED_ORIGINS=<URL do frontend gerada no passo 3>
FRONTEND_URL=<URL do frontend gerada no passo 3>
```

Redeploy o backend para aplicar. Sem isso, o navegador bloqueia as chamadas
do frontend hospedado para a API por CORS.

## 5. Popular dados de demonstração (opcional, recomendado)

Pouco antes da apresentação, no serviço de **backend**, defina:

```
SEED_DEMO_ENABLED=true
```

e faça um redeploy. Isso cria a conta `banca@studyweb.local` /
`Banca@2026` com 3 decks já com histórico de revisão, data-alvo de prova e
tentativas de quiz (ver `SeedDemoDataRunner` e a seção "Dados de
demonstração" do `README.md`) — evita telas vazias na frente da banca.

As datas do seed (streak, gráfico de evolução) são relativas ao momento do
redeploy — rode este passo o mais perto possível do horário real da defesa.
É idempotente (não duplica em redeploys seguidos), então pode deixar
`SEED_DEMO_ENABLED=true` durante todo o período da apresentação sem risco.

## 6. Persistência de uploads (opcional)

Por padrão, o filesystem do container de backend é efêmero — um PDF
enviado via UC03 some no próximo redeploy. Para persistir entre deploys,
adicione um **Volume** ao serviço de backend (Railway → aba **Volumes**)
montado em `/app/uploads` (mesmo caminho de `APP_UPLOAD_DIR` em
`application-docker.properties`). Não é necessário para a demonstração em
si — os PDFs enviados durante a apresentação continuam funcionando
normalmente enquanto o container não reiniciar.

## Troubleshooting rápido

- **502/503 ao abrir o domínio do backend logo após o deploy**: o Postgres
  do Railway pode levar alguns segundos a mais para aceitar conexões na
  primeira vez — aguarde e recarregue.
- **Erro de CORS no console do navegador**: confira se `CORS_ALLOWED_ORIGINS`
  no backend é *exatamente* a URL do frontend (com `https://`, sem barra
  final) e se você fez o redeploy depois de mudar a variável.
- **Frontend carrega mas nenhuma chamada à API funciona**: `VITE_API_URL`
  é embutida no build — mudar a variável sem forçar um novo build do
  frontend não tem efeito.
