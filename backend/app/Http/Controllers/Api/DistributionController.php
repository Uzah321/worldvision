<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Distribution;
use App\Models\DistributionItem;
use App\Models\DistributionRecord;
use App\Models\Inventory;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class DistributionController extends Controller
{
    public function __construct(private AuditService $audit) {}

    public function index(Request $request): JsonResponse
    {
        $query = Distribution::with(['project', 'programme', 'site', 'createdBy'])
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->when($request->project_id, fn($q, $p) => $q->where('project_id', $p))
            ->when($request->programme_id, fn($q, $p) => $q->where('programme_id', $p))
            ->when($request->from, fn($q, $d) => $q->whereDate('distribution_date', '>=', $d))
            ->when($request->to, fn($q, $d) => $q->whereDate('distribution_date', '<=', $d));

        return response()->json($query->orderByDesc('distribution_date')->paginate(25));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'project_id'            => 'required|exists:projects,id',
            'programme_id'          => 'required|exists:programmes,id',
            'distribution_site_id'  => 'required|exists:distribution_sites,id',
            'warehouse_id'          => 'required|exists:warehouses,id',
            'name'                  => 'required|string|max:200',
            'distribution_date'     => 'required|date',
            'mode'                  => 'required|in:in_kind,cash,voucher',
            'planned_beneficiaries' => 'required|integer|min:1',
            'planned_households'    => 'required|integer|min:1',
            'notes'                 => 'nullable|string',
            'items'                 => 'required|array|min:1',
            'items.*.commodity_id'  => 'required|exists:commodities,id',
            'items.*.planned_qty'   => 'required|numeric|min:0.01',
            'items.*.unit'          => 'required|string',
        ]);

        $data['distribution_number'] = 'DIST-' . strtoupper(Str::random(8));
        $data['status']   = 'planned';
        $data['created_by'] = $request->user()->id;

        $items = $data['items'];
        unset($data['items']);

        $distribution = Distribution::create($data);

        foreach ($items as $item) {
            $item['distribution_id'] = $distribution->id;
            DistributionItem::create($item);
        }

        $this->audit->log('distribution_created', 'Distribution', $distribution->id, $data, $request);

        return response()->json($distribution->load('items'), 201);
    }

    public function show(Distribution $distribution): JsonResponse
    {
        return response()->json($distribution->load([
            'project', 'programme', 'site', 'warehouse',
            'items.commodity', 'createdBy', 'approvedBy',
        ]));
    }

    public function update(Request $request, Distribution $distribution): JsonResponse
    {
        if (! in_array($distribution->status, ['planned', 'approved'])) {
            return response()->json(['message' => 'Cannot edit a distribution that is in progress or completed.'], 422);
        }

        $data = $request->validate([
            'name'                  => 'sometimes|string|max:200',
            'distribution_date'     => 'sometimes|date',
            'planned_beneficiaries' => 'sometimes|integer|min:1',
            'planned_households'    => 'sometimes|integer|min:1',
            'notes'                 => 'nullable|string',
        ]);

        $distribution->update($data);
        $this->audit->log('distribution_updated', 'Distribution', $distribution->id, $data, $request);

        return response()->json($distribution->fresh());
    }

    public function destroy(Request $request, Distribution $distribution): JsonResponse
    {
        if ($distribution->status !== 'planned') {
            return response()->json(['message' => 'Only planned distributions can be deleted.'], 422);
        }

        $this->audit->log('distribution_deleted', 'Distribution', $distribution->id, null, $request);
        $distribution->delete();

        return response()->json(['message' => 'Distribution deleted.']);
    }

    public function approve(Request $request, Distribution $distribution): JsonResponse
    {
        if ($distribution->status !== 'planned') {
            return response()->json(['message' => 'Only planned distributions can be approved.'], 422);
        }

        $distribution->update([
            'status'      => 'approved',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        $this->audit->log('distribution_approved', 'Distribution', $distribution->id, null, $request);

        return response()->json($distribution->fresh());
    }

    public function start(Request $request, Distribution $distribution): JsonResponse
    {
        if ($distribution->status !== 'approved') {
            return response()->json(['message' => 'Only approved distributions can be started.'], 422);
        }

        $distribution->update(['status' => 'in_progress', 'start_time' => now()]);
        $this->audit->log('distribution_started', 'Distribution', $distribution->id, null, $request);

        return response()->json($distribution->fresh());
    }

    public function complete(Request $request, Distribution $distribution): JsonResponse
    {
        if ($distribution->status !== 'in_progress') {
            return response()->json(['message' => 'Distribution is not in progress.'], 422);
        }

        $actual = $distribution->records()->count();
        $distribution->update([
            'status'               => 'completed',
            'end_time'             => now(),
            'actual_beneficiaries' => $actual,
        ]);

        $this->audit->log('distribution_completed', 'Distribution', $distribution->id, null, $request);

        return response()->json($distribution->fresh());
    }

    public function recordDistribution(Request $request, Distribution $distribution): JsonResponse
    {
        if ($distribution->status !== 'in_progress') {
            return response()->json(['message' => 'Distribution is not active.'], 422);
        }

        $data = $request->validate([
            'beneficiary_id'      => 'required|exists:beneficiaries,id',
            'household_id'        => 'required|exists:households,id',
            'verification_method' => 'required|in:qr_code,biometric,manual,id_card',
            'collected_by_proxy'  => 'boolean',
            'proxy_name'          => 'nullable|required_if:collected_by_proxy,true|string',
            'proxy_id'            => 'nullable|string',
            'proxy_relationship'  => 'nullable|string',
            'rations_received'    => 'required|array',
            'latitude'            => 'nullable|numeric',
            'longitude'           => 'nullable|numeric',
        ]);

        // Prevent duplicate collection in this distribution
        $existing = DistributionRecord::where('distribution_id', $distribution->id)
            ->where('beneficiary_id', $data['beneficiary_id'])
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Beneficiary has already collected from this distribution.'], 409);
        }

        $data['distribution_id'] = $distribution->id;
        $data['collected_at']    = now();
        $data['is_verified']     = true;
        $data['recorded_by']     = $request->user()->id;

        $record = DistributionRecord::create($data);
        $this->audit->log('distribution_record_created', 'DistributionRecord', $record->id, $data, $request);

        return response()->json($record->load('beneficiary'), 201);
    }

    public function records(Request $request, Distribution $distribution): JsonResponse
    {
        $records = $distribution->records()
            ->with(['beneficiary', 'household', 'recordedBy'])
            ->when($request->is_flagged, fn($q) => $q->where('is_flagged', true))
            ->orderByDesc('collected_at')
            ->paginate(50);

        return response()->json($records);
    }
}
