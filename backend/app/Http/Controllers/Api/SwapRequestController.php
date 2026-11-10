<?php

namespace App\Http\Controllers\Api;

use App\Enums\AssignmentStatus;
use App\Enums\SwapStatus;
use App\Enums\SwapType;
use App\Models\Assignment;
use App\Models\AuditLog;
use App\Models\Event;
use App\Models\Ministry;
use App\Models\SwapRequest;
use App\Models\Volunteer;
use App\Services\VolunteerEligibilityService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/** Módulo 09 — Trocas e substituições. */
class SwapRequestController extends ApiController
{
    public function __construct(private VolunteerEligibilityService $eligibility)
    {
    }

    public function index(Request $request): JsonResponse
    {
        $query = SwapRequest::query()->orderBy('created_at', 'desc');

        foreach (['status', 'type', 'ministry_id', 'event_id', 'requester_volunteer_id'] as $filter) {
            if ($value = $request->input($filter)) {
                $query->where($filter, $value);
            }
        }

        if ($request->boolean('mine') && $request->user()->volunteer_id) {
            $query->where('requester_volunteer_id', (string) $request->user()->volunteer_id);
        }

        // "Abertas para mim": pedidos sem destinatário, nos ministérios em que sirvo.
        if ($request->boolean('open_to_me') && $request->user()->volunteer_id) {
            $volunteer = Volunteer::find($request->user()->volunteer_id);

            $query->where('status', SwapStatus::Open->value)
                ->whereNull('target_volunteer_id')
                ->whereIn('ministry_id', $volunteer?->ministryIds() ?? [])
                ->where('requester_volunteer_id', '!=', (string) $request->user()->volunteer_id);
        }

        $perPage = max(1, min((int) ($request->input('itemsPerPage') ?? 10), 200));
        $paginator = $query->paginate($perPage, ['*'], 'page', max(1, (int) ($request->input('page') ?? 1)));

        $rows = collect($paginator->items());

        $volunteerIds = $rows->pluck('requester_volunteer_id')
            ->merge($rows->pluck('accepted_volunteer_id'))
            ->filter()->unique()->all();

        $volunteers = Volunteer::whereIn('_id', $volunteerIds)->get()->keyBy(fn ($v) => (string) $v->getKey());
        $events = Event::whereIn('_id', $rows->pluck('event_id')->filter()->all())
            ->get()->keyBy(fn ($e) => (string) $e->getKey());
        $ministries = Ministry::whereIn('_id', $rows->pluck('ministry_id')->filter()->all())
            ->get()->keyBy(fn ($m) => (string) $m->getKey());

        $paginator->through(function (SwapRequest $swap) use ($volunteers, $events, $ministries) {
            $event = $events[(string) $swap->event_id] ?? null;

            return $swap->toArray() + [
                'requester_name' => $volunteers[(string) $swap->requester_volunteer_id]->name ?? null,
                'accepted_name' => $swap->accepted_volunteer_id
                    ? ($volunteers[(string) $swap->accepted_volunteer_id]->name ?? null)
                    : null,
                'event_title' => $event?->title,
                'event_starts_at' => $event?->starts_at?->toIso8601String(),
                'ministry_name' => $ministries[(string) $swap->ministry_id]->name ?? null,
                'ministry_color' => $ministries[(string) $swap->ministry_id]->color ?? null,
            ];
        });

        return response()->json($paginator);
    }

    public function show(string $id): JsonResponse
    {
        $swap = SwapRequest::findOrFail($id);
        $assignment = Assignment::find($swap->assignment_id);

        return response()->json([
            'item' => $swap,
            'assignment' => $assignment,
            'event' => Event::find($swap->event_id),
            'requester' => Volunteer::find($swap->requester_volunteer_id),
            'target' => $swap->target_volunteer_id ? Volunteer::find($swap->target_volunteer_id) : null,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'assignment_id' => ['required', 'string'],
            'type' => ['sometimes', 'in:'.implode(',', SwapType::values())],
            'target_volunteer_id' => ['sometimes', 'nullable', 'string'],
            'target_assignment_id' => ['sometimes', 'nullable', 'string'],
            'reason' => ['required', 'string', 'max:500'],
        ]);

        $assignment = Assignment::findOrFail($data['assignment_id']);
        $user = $request->user();

        if (! $user->isGlobal()
            && (string) $user->volunteer_id !== (string) $assignment->volunteer_id
            && ! in_array((string) $assignment->ministry_id, $user->ledMinistryIds(), true)) {
            abort(403, 'Você só pode pedir troca da própria escalação.');
        }

        if ($assignment->status === AssignmentStatus::Cancelled) {
            return response()->json(['message' => 'Esta escalação foi cancelada.'], 422);
        }

        $open = SwapRequest::where('assignment_id', $data['assignment_id'])
            ->whereIn('status', [SwapStatus::Open->value, SwapStatus::Accepted->value])
            ->exists();

        if ($open) {
            return response()->json(['message' => 'Já existe um pedido em aberto para esta escalação.'], 422);
        }

        $event = Event::find($assignment->event_id);

        $swap = SwapRequest::create([
            'assignment_id' => (string) $assignment->getKey(),
            'event_id' => (string) $assignment->event_id,
            'ministry_id' => (string) $assignment->ministry_id,
            'requester_volunteer_id' => (string) $assignment->volunteer_id,
            'target_volunteer_id' => $data['target_volunteer_id'] ?? null,
            'target_assignment_id' => $data['target_assignment_id'] ?? null,
            'type' => $data['type'] ?? SwapType::Replacement->value,
            'reason' => $data['reason'],
            'responses' => [],
            'expires_at' => $event?->starts_at?->copy()->subHours(12),
        ]);

        AuditLog::record('swap.created', $swap, 'Pedido de troca aberto');

        return $this->created($swap, 'Pedido enviado. Assim que alguém aceitar, a liderança aprova a troca.');
    }

    /** Quem pode cobrir a vaga, com os mesmos critérios usados na escalação. */
    public function candidates(string $id): JsonResponse
    {
        $swap = SwapRequest::findOrFail($id);
        $assignment = Assignment::findOrFail($swap->assignment_id);
        $event = Event::findOrFail($swap->event_id);

        $candidates = $this->eligibility->candidatesFor(
            (string) $assignment->ministry_id,
            (string) $assignment->function_id,
            $event->starts_at->toImmutable(),
            (string) $event->getKey(),
        )->reject(fn ($c) => $c['volunteer']['id'] === (string) $swap->requester_volunteer_id);

        return response()->json(['data' => $candidates->values()]);
    }

    /** Um voluntário se oferece para cobrir. */
    public function accept(Request $request, string $id): JsonResponse
    {
        $swap = SwapRequest::findOrFail($id);

        if ($swap->status !== SwapStatus::Open) {
            return response()->json(['message' => 'Este pedido não está mais aberto.'], 422);
        }

        $volunteerId = (string) ($request->input('volunteer_id') ?: $request->user()->volunteer_id);

        if (! $volunteerId) {
            return response()->json(['message' => 'Informe o voluntário que vai cobrir a vaga.'], 422);
        }

        if (! $request->user()->isGlobal()
            && $volunteerId !== (string) $request->user()->volunteer_id) {
            abort(403, 'Você só pode se oferecer por você mesmo.');
        }

        $responses = collect($swap->responses ?? [])
            ->reject(fn ($r) => ($r['volunteer_id'] ?? null) === $volunteerId)
            ->push(['volunteer_id' => $volunteerId, 'answer' => 'accepted', 'at' => now()->toIso8601String()])
            ->values()->all();

        $swap->update([
            'responses' => $responses,
            'status' => SwapStatus::Accepted->value,
            'accepted_volunteer_id' => $volunteerId,
            'accepted_at' => now(),
        ]);

        $volunteer = Volunteer::find($volunteerId);

        AuditLog::record('swap.accepted', $swap, "{$volunteer?->name} se ofereceu para cobrir a vaga");

        return $this->updated($swap->fresh(), 'Oferta registrada. Aguardando aprovação da liderança.');
    }

    public function decline(Request $request, string $id): JsonResponse
    {
        $swap = SwapRequest::findOrFail($id);
        $volunteerId = (string) ($request->input('volunteer_id') ?: $request->user()->volunteer_id);

        $responses = collect($swap->responses ?? [])
            ->reject(fn ($r) => ($r['volunteer_id'] ?? null) === $volunteerId)
            ->push(['volunteer_id' => $volunteerId, 'answer' => 'declined', 'at' => now()->toIso8601String()])
            ->values()->all();

        $swap->update(['responses' => $responses]);

        return $this->updated($swap->fresh(), 'Resposta registrada.');
    }

    /** A liderança aprova e a troca é efetivada de fato. */
    public function review(Request $request, string $id): JsonResponse
    {
        $data = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
            'review_note' => ['sometimes', 'nullable', 'string', 'max:500'],
            'volunteer_id' => ['sometimes', 'nullable', 'string'],
        ]);

        $swap = SwapRequest::findOrFail($id);

        if (in_array($swap->status, [SwapStatus::Approved, SwapStatus::Rejected, SwapStatus::Cancelled], true)) {
            return response()->json(['message' => 'Este pedido já foi finalizado.'], 422);
        }

        if ($data['status'] === 'rejected') {
            $swap->update([
                'status' => SwapStatus::Rejected->value,
                'review_note' => $data['review_note'] ?? null,
                'reviewed_by' => $request->user()->getKey(),
                'reviewed_at' => now(),
            ]);

            return $this->updated($swap->fresh(), 'Pedido recusado.');
        }

        $incomingId = $data['volunteer_id'] ?? $swap->accepted_volunteer_id;

        if (! $incomingId) {
            return response()->json(['message' => 'Ninguém aceitou cobrir esta vaga ainda.'], 422);
        }

        $assignment = Assignment::findOrFail($swap->assignment_id);
        $incoming = Volunteer::findOrFail($incomingId);

        if ($swap->type === SwapType::Swap && $swap->target_assignment_id) {
            // Troca: as duas pessoas invertem as escalações.
            $other = Assignment::findOrFail($swap->target_assignment_id);
            $originalVolunteer = (string) $assignment->volunteer_id;

            $assignment->update([
                'volunteer_id' => (string) $other->volunteer_id,
                'status' => AssignmentStatus::Pending->value,
                'confirmed_at' => null,
                'swap_request_id' => (string) $swap->getKey(),
            ]);

            $other->update([
                'volunteer_id' => $originalVolunteer,
                'status' => AssignmentStatus::Pending->value,
                'confirmed_at' => null,
                'swap_request_id' => (string) $swap->getKey(),
            ]);

            $resultingId = (string) $assignment->getKey();
        } else {
            // Substituição: a vaga original é encerrada e nasce uma nova.
            $replacement = Assignment::create([
                'schedule_id' => (string) $assignment->schedule_id,
                'event_id' => (string) $assignment->event_id,
                'ministry_id' => (string) $assignment->ministry_id,
                'function_id' => (string) $assignment->function_id,
                'volunteer_id' => (string) $incoming->getKey(),
                'starts_at' => $assignment->starts_at,
                'assigned_by' => $request->user()->getKey(),
                'assigned_at' => now(),
                'swap_request_id' => (string) $swap->getKey(),
                'replaced_assignment_id' => (string) $assignment->getKey(),
                'notes' => 'Substituição aprovada',
            ]);

            $assignment->update([
                'status' => AssignmentStatus::Replaced->value,
                'swap_request_id' => (string) $swap->getKey(),
            ]);

            $resultingId = (string) $replacement->getKey();
        }

        $swap->update([
            'status' => SwapStatus::Approved->value,
            'accepted_volunteer_id' => (string) $incoming->getKey(),
            'review_note' => $data['review_note'] ?? null,
            'reviewed_by' => $request->user()->getKey(),
            'reviewed_at' => now(),
            'resulting_assignment_id' => $resultingId,
        ]);

        AuditLog::record('swap.approved', $swap, "Troca aprovada em favor de {$incoming->name}");

        return $this->updated($swap->fresh(), "Troca aprovada. {$incoming->name} assumiu a vaga.");
    }

    public function cancel(Request $request, string $id): JsonResponse
    {
        $swap = SwapRequest::findOrFail($id);

        if (! $request->user()->isGlobal()
            && (string) $request->user()->volunteer_id !== (string) $swap->requester_volunteer_id) {
            abort(403, 'Você só pode cancelar o próprio pedido.');
        }

        $swap->update(['status' => SwapStatus::Cancelled->value]);

        return $this->updated($swap->fresh(), 'Pedido cancelado.');
    }
}
