<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `frontend/node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Basi Escalas — convenções

Monorepo: `backend/` (Laravel 12 + MongoDB) e `frontend/` (Next.js 16).
O front herda o padrão visual do `basileia-front` — mantenha-o.

## Back-end

- **Nunca use o cast `array` do Eloquent nos modelos Mongo.** Ele grava JSON-string
  e quebra queries por campo aninhado (`memberships.ministry_id`). Arrays são nativos.
- `pluck('_id')` no *query builder* devolve `null` nesta versão do driver: a chave é
  projetada como `id`. Use `->get()->map(fn ($m) => (string) $m->getKey())`.
- Em coleções em memória, compare enums por `->value`. `where('status.value', ...)`
  não funciona em enum.
- Não nomeie método estático igual a um atributo do modelo: o Eloquent resolve
  `$model->value` procurando um método `value()`. Por isso `Setting::read()`/`write()`.
- Todo modelo de domínio usa `BelongsToOrganization` (escopo global por igreja) e
  `ExposesObjectId` (expõe `id` e `_id`).
- Índices ficam em `database/migrations/*_create_escalas_indexes.php`.

## Front-end

- **Select:** sempre `CustomSelect` (`@/components/CustomSelect`), `searchable` com 4+
  opções, `className="h-[42px]"` em formulário e `h-9` em filtro.
- Listas usam `ResponsiveTableCard` + `Pagination` + `usePersistedState`, e exclusão
  passa por `DeleteModal`.
- Componentes próprios do domínio ficam em `@/components/escalas/`: `PageHeader`,
  `StatusBadge`, `CoverageBar`, `VolunteerAvatar`, `EmptyState`, `CandidatePicker`,
  `AvailabilityEditor`.
- Rótulos de estado vêm de `StatusBadge` — não escreva o texto solto na tela.
- Datas passam por `@/lib/escalas-format`.
- Serviços em `@/services/*.service.ts` retornam tipos de `@/types/escalas`.
- Paleta: primária `#6D28D9`, texto `#1A1A2E`, secundário `#6B7280`, borda `#E5E7EB`,
  cartão branco `rounded-2xl`. Software de produção, não landing page: sem gradiente
  decorativo, sem glassmorphism, sem animação sem propósito.

## Antes de entregar

```bash
cd frontend && npx tsc --noEmit && npm run build
python3 tools/api-smoke.py
```
