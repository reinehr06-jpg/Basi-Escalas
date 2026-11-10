# Contrato da API

Base: `NEXT_PUBLIC_API_URL` (padrão `http://localhost:8000/api`).
Autenticação: `Authorization: Bearer <token>` (Sanctum).

Convenções:
- Listas paginam no formato do Laravel: `{ data, total, current_page, last_page, per_page }`.
  Parâmetros: `page`, `itemsPerPage`, `q` (busca textual).
- Escritas respondem `{ message, item }`.
- Erros de validação: `422` com `{ message, errors: { campo: [...] } }`.
- Todo documento volta com `id` **e** `_id` (mesmo valor).

| Módulo | Método | Rota | Observação |
|---|---|---|---|
| Auth | POST | `/auth/login` | `{ email, password, remember }` → `{ token, accessToken, user }` |
| Auth | POST | `/auth/register` | cria organização + primeiro admin |
| Auth | GET | `/auth/me` | |
| Auth | POST | `/auth/logout` | |
| 15 | GET | `/me/dashboard` | agenda do voluntário logado |
| 15 | GET | `/me/assignments` | |
| 06 | GET | `/dashboard/summary` | `?from&to` — cobertura, confirmação, presença |
| 01 | GET/POST/PUT/DELETE | `/ministries[/{id}]` | `?mine=1` limita aos liderados |
| 02 | GET/POST/PUT/DELETE | `/functions[/{id}]` | `?ministry_id` |
| 03 | GET/POST/PUT/DELETE | `/volunteers[/{id}]` | `?ministry_id&function_id&skill_id&status` |
| 03 | GET | `/volunteers/{id}/history` | |
| 03 | POST | `/volunteers/import` | `{ source, items[] }` — idempotente |
| 04 | GET/POST/PUT/DELETE | `/events[/{id}]` | `?start&end&all=1` para o calendário |
| 04 | POST | `/events/{id}/cancel` | `{ reason, scope: single\|series }` |
| 05 | GET/POST/PUT/DELETE | `/schedules[/{id}]` | detalhe traz `slots` resolvidos e `summary` |
| 05 | GET | `/schedules/{id}/candidates` | `?function_id` — com `blockers` e `warnings` |
| 05 | POST | `/schedules/{id}/autofill` | `{ allow_warnings }` |
| 05 | POST | `/schedules/{id}/publish` | `{ force }` se faltarem vagas |
| 05 | POST | `/schedules/{id}/close` | |
| 05 | POST | `/schedules/{id}/duplicate` | `{ event_id, copy_volunteers }` |
| 08 | GET/POST/PUT/DELETE | `/assignments[/{id}]` | lista já traz nomes resolvidos |
| 08 | POST | `/assignments/{id}/confirm` | |
| 08 | POST | `/assignments/{id}/decline` | `{ reason }` |
| 10 | POST | `/assignments/{id}/checkin` | `{ attendance_status, note }` |
| 10 | POST | `/assignments/bulk-checkin` | `{ items[] }` |
| 07 | GET | `/availabilities` | `?volunteer_id` |
| 07 | POST | `/availabilities/sync` | substitui a grade inteira |
| 07 | GET/POST/PUT/DELETE | `/absences[/{id}]` | `?mine=1` |
| 07 | POST | `/absences/{id}/review` | `{ status, review_note }` — aprovar libera as vagas |
| 09 | GET/POST | `/swaps[/{id}]` | `?open_to_me=1&mine=1` |
| 09 | GET | `/swaps/{id}/candidates` | |
| 09 | POST | `/swaps/{id}/accept` | voluntário se oferece |
| 09 | POST | `/swaps/{id}/decline` | |
| 09 | POST | `/swaps/{id}/review` | `{ status }` — aprovar efetiva a troca |
| 09 | POST | `/swaps/{id}/cancel` | |
| 13 | GET/POST/PUT/DELETE | `/skills[/{id}]` | |
| 13 | GET/POST/PUT/DELETE | `/trainings[/{id}]` | |
| 13 | POST | `/trainings/{id}/complete` | credita habilidades nos perfis |
| 14 | GET | `/reports/volunteers` | engajamento por pessoa |
| 14 | GET | `/reports/ministries` | cobertura por equipe |
| 14 | GET | `/reports/attendance` | presença evento a evento |
| 14 | GET | `/reports/swaps` | volume e desfecho das trocas |
| 16 | GET/PUT | `/settings` | admin/coordenação |
| 16 | PUT | `/settings/organization` | |
| 16 | GET | `/audit-logs` | |
| — | GET/POST/PUT/DELETE | `/system-users[/{id}]` | admin/coordenação |

## Permissões

`admin` e `coordinator` enxergam tudo. `ministry_leader` fica restrito aos
ministérios em que é líder (filtro aplicado em `/ministries?mine=1`,
`/volunteers`, `/schedules`). `volunteer` só age sobre a própria agenda —
confirmar, recusar, pedir troca e registrar ausência de si mesmo; tentar agir por
outro devolve `403`.

`/settings`, `/audit-logs` e `/system-users` exigem `admin` ou `coordinator`
(middleware `role:`).
