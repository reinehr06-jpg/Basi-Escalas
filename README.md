# Basi Escalas

Sistema de escalas de voluntários para igrejas: ministérios, funções, calendário,
montagem de escala, confirmações, trocas, presenças, capacitação e indicadores.

- **Back-end:** Laravel 12 + MongoDB (`mongodb/laravel-mongodb`), autenticação com Sanctum.
- **Front-end:** Next.js 16 + React 19 + Tailwind 4, partindo do padrão visual do `basileia-front`.
- **Banco:** MongoDB 8.

```
basi-escalas/
├── backend/     API Laravel
├── frontend/    App Next.js
├── docs/        modelo de dados e contrato de API
├── tools/       smoke test da API
└── docker-compose.yml
```

## Rodando

### Com Docker

```bash
docker compose up -d --build
```

Front em `http://localhost:3000`, API em `http://localhost:8000/api`, Mongo em `27017`.

### Local

```bash
docker run -d --name basi_escalas_mongo -p 27017:27017 -v basi_escalas_mongo_data:/data/db mongo:8
```

```bash
cd backend && composer install --ignore-platform-req=ext-mongodb && cp .env.example .env && php artisan key:generate && php artisan migrate && php artisan db:seed
```

```bash
cd backend && php artisan serve --port=8000
```

```bash
cd frontend && npm install && npm run dev
```

> A extensão `ext-mongodb` do PHP local precisa ser compatível com `mongodb/mongodb ^2.5`.
> Em versões mais antigas a biblioteca carrega normalmente em runtime, mas o Composer
> exige `--ignore-platform-req=ext-mongodb`. O `Dockerfile` do backend já instala a versão correta.

## Usuários de demonstração

Criados por `php artisan db:seed` — senha `escalas123` para todos.

| E-mail | Papel | Vê |
|---|---|---|
| admin@igrejademo.test | Administrador | tudo |
| lider@igrejademo.test | Líder de ministério | apenas os ministérios que lidera |
| voluntario@igrejademo.test | Voluntário | apenas a própria agenda |

## Testes

```bash
python3 tools/api-smoke.py
```

Exercita login, papéis, CRUD, candidatos elegíveis, autofill, publicação, confirmação,
check-in, troca completa (pedido → oferta → aprovação), duplicação, relatórios e configurações
contra a API rodando em `http://127.0.0.1:8000`.

## Escopo

Módulos implementados: 01 Ministérios, 02 Funções, 03 Voluntários, 04 Calendário,
05 Escalas, 06 Dashboard, 07 Disponibilidade e Ausências, 08 Confirmações,
09 Trocas e Substituições, 10 Presenças e Check-in, 13 Habilidades e Capacitação,
14 Relatórios e Indicadores, 15 Painéis por Perfil, 16 Configurações e Automações.

Fora do escopo: 11 Central de Comunicação e 12 Modelos e Geração Inteligente.
Onde a comunicação seria necessária (lembrete de confirmação, aviso de troca), o sistema
registra o estado e expõe as telas de acompanhamento — o envio em si fica para o módulo
de comunicação separado.
