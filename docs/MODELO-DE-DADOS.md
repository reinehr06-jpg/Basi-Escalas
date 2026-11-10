# Modelo de dados (MongoDB)

Toda coleção do domínio carrega `organization_id` e é filtrada por um escopo global
(`App\Models\Concerns\BelongsToOrganization`), alimentado pelo middleware
`ResolveOrganization` a partir do usuário autenticado. Nenhuma query do domínio
atravessa igrejas.

> **Arrays são nativos no Mongo.** Os modelos não usam o cast `array` do Eloquent:
> ele grava JSON-string e quebra consultas por campo aninhado, como
> `memberships.ministry_id`.

## organizations
Igreja/instituição. `name`, `slug` (único), `document`, `email`, `phone`,
`timezone`, `locale`, `logo_url`, `address`, `settings`, `status`.

## users
Acesso ao sistema. `organization_id`, `volunteer_id` (vínculo com o cadastro de
voluntário — sem ele o usuário não tem agenda própria), `name`, `email` (único),
`password`, `role`, `status`, `last_login_at`.

Papéis (`App\Enums\UserRole`): `admin`, `coordinator` (globais), `ministry_leader`
(restrito aos ministérios que lidera), `volunteer` (só a própria agenda).

## ministries — módulo 01
`name`, `description`, `color`, `leader_ids[]`, `status`, `settings`
(`confirmation_deadline_hours`, `min_rest_days`, `max_per_month`).

## functions — módulo 02
`ministry_id`, `name`, `description`, `required_skill_ids[]`, `default_quantity`,
`min_quantity`, `max_quantity`, `is_leadership`, `order`, `status`.

## volunteers — módulo 03
Cadastro próprio, independente de qualquer outro sistema.

- `name`, `email`, `phone`, `birth_date`, `photo_url`, `status`, `notes`
- `external_ref: { source, id, synced_at }` — origem da importação; a importação casa
  por `external_ref.id` e, na falta dele, por e-mail, de modo que reimportar atualiza
  em vez de duplicar
- `memberships: [{ ministry_id, function_ids[], is_leader, since }]` — define em que
  funções a pessoa pode ser escalada
- `skills: [{ skill_id, level, certified_at, expires_at, evaluated_by, training_id }]`
- `preferences: { max_per_month, min_rest_days, preferred_weekdays[] }`

Índices: `memberships.ministry_id`, `memberships.function_ids`, `skills.skill_id`,
`external_ref.id`.

## events — módulo 04
Uma ocorrência concreta por documento. Séries recorrentes são **materializadas**:
cada data vira um evento ligado pelo `series_id`. Escala, confirmação e presença
pertencem a uma data específica — calcular a série em tempo de consulta tornaria
isso ambíguo.

`title`, `type` (`service|rehearsal|event|meeting|other`), `starts_at`, `ends_at`,
`location`, `ministry_ids[]`, `recurrence`, `status`, `cancellation_reason`.

## schedules — módulo 05
A escala de **um ministério** em **um evento**.

`event_id`, `ministry_id`, `name`, `slots: [{ function_id, needed }]`, `status`
(`draft|published|closed|cancelled`), `confirmation_deadline_at`, `published_at`.

## assignments
A designação de um voluntário para uma função. Concentra os módulos 08 e 10.

`schedule_id`, `event_id`, `ministry_id`, `function_id`, `volunteer_id`, `starts_at`,
`status` (`pending|confirmed|declined|replaced|cancelled`), `confirmed_at`,
`declined_at`, `decline_reason`, `attendance_status`
(`pending|present|late|absent|justified`), `checked_in_at`, `checkin_method`,
`replaced_assignment_id`, `swap_request_id`.

Coleção separada de `schedules` porque a consulta mais frequente é "a agenda deste
voluntário", que não passa pela escala.

## availabilities / absences — módulo 07
`availabilities`: grade semanal. Só gravamos **indisponibilidades**
(`weekday`, `is_available: false`) — ausência de registro significa disponível, o
que evita exigir que todo voluntário preencha a semana inteira.

`absences`: períodos (`starts_at`, `ends_at`, `reason`, `type`, `status`). Aprovar
libera automaticamente as escalações do período, que voltam a ficar em aberto.

## swap_requests — módulo 09
`assignment_id`, `requester_volunteer_id`, `target_volunteer_id` (nulo = aberto a
todos do ministério), `type` (`swap` troca mútua / `replacement` substituição),
`status` (`open|accepted|approved|rejected|cancelled|expired`), `responses[]`,
`accepted_volunteer_id`, `resulting_assignment_id`.

Aprovar efetiva de fato: em `swap`, os dois `assignments` trocam de voluntário e
voltam a `pending`; em `replacement`, o original vira `replaced` e nasce um novo.

## skills / trainings — módulo 13
`skills`: `name`, `category`, `ministry_id`, `levels[]`, `requires_certification`,
`validity_months`.

`trainings`: `skill_ids[]`, `starts_at`, `instructor`, `participants[]`. Concluir
credita as habilidades no perfil de quem completou — é o que faz o módulo 13
conversar com a elegibilidade da escala.

## settings — módulo 16
Uma chave por documento (`key`, `value`, `group`). Padrões em
`App\Http\Controllers\Api\SettingController::DEFAULTS`.

## audit_logs
`action`, `user_id`, `user_name`, `subject_type`, `subject_id`, `description`, `ip`.
Gravado nas ações sensíveis: publicação de escala, troca aprovada, exclusões.

---

## Elegibilidade (o núcleo da regra)

`App\Services\VolunteerEligibilityService` separa **impedimentos** de **alertas**:

| Código | Tipo | Quando |
|---|---|---|
| `inactive` | impedimento | voluntário inativo ou afastado |
| `absence` | impedimento | ausência aprovada cobrindo a data |
| `unavailable` | impedimento | indisponível naquele dia da semana |
| `conflict` | impedimento | já escalado no mesmo evento |
| `rest` | alerta | escalado há menos que a folga mínima |
| `overload` | alerta | atingiu o teto de escalas no mês |
| `skill` | alerta | não tem todas as habilidades exigidas pela função |
| `weekday` | alerta | fora dos dias que a pessoa prefere servir |

O líder continua podendo escalar alguém com alerta, mas nunca por engano. O
preenchimento automático (`autofill`) só usa candidatos sem impedimento; por padrão,
também evita os que têm alerta.

A ordenação sugere primeiro quem está há mais tempo sem servir e tem menos carga no
mês, o que distribui a escala sem precisar de configuração.
