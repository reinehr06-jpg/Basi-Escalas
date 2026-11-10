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

O layout de cada tipo de tela é o do `basileia-front`. Não invente estrutura nova:
abra a tela equivalente no repositório de referência e copie a marcação.

**Lista** — cartão branco ocupando a área, cabeçalho com pastilha pastel de 40px:
`<main className="p-6 pb-5 flex-1 flex flex-col">` › `bg-white rounded-2xl flex-1 border border-[#E5E7EB]`.
A tabela é densa, **uma linha por registro**: cabeçalho `h-10 bg-[#FCFCFD]`, linhas
`h-[42px]`, texto `text-xs`, cada coluna com um valor truncado. A primeira coluna é a
situação, em pastilha. Nada de linha com título e subtítulo embaixo.

**Formulário** — banner roxo (`FormHero`) com voltar, ícone translúcido, título,
aviso de obrigatórios e os botões Cancelar/Salvar **dentro do banner**; abaixo,
`FormCard` com seções sanfonadas (`FormSection`). Campos sempre por `FormInput` /
`FormSelect`. O componente do formulário é quem rende o `<main>`; a página é só
`return <XForm />`.

**Detalhe** — `DetailHero` (banner roxo com trilha de navegação e ações em branco),
seguido do cartão de identidade (`bg-white rounded-2xl border border-gray-200 p-4`)
com avatar, campos em linha e os blocos de número à direita.

**Dashboard** — banner roxo com saudação e filtro de período, quatro cartões
`p-[16px_18px]` com o ícone de 42px à direita, e gráficos em Recharts.

- **i18n:** o app roda em `pt-BR` com **chaves em inglês**. Todo texto visível passa por
  `t("English key")` e a tradução entra em `src/locales/pt-BR.json` e `pt.json`. Antes de
  criar uma chave, confira se já existe com outro sentido (`Schedule` já é "Agendar",
  `Present` é "Presente") e, se for o caso, use uma chave própria.
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
