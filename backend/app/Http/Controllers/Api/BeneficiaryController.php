<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Beneficiary;
use App\Models\FraudAlert;
use App\Models\Programme;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BeneficiaryController extends Controller
{
    public function __construct(private AuditService $audit) {}

    public function index(Request $request): JsonResponse
    {
        $query = Beneficiary::with(['household', 'household.district'])
            ->when($request->search, fn($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('first_name', 'like', "%$s%")
                  ->orWhere('last_name', 'like', "%$s%")
                  ->orWhere('national_id', 'like', "%$s%")
                  ->orWhere('beneficiary_number', 'like', "%$s%")
                  ->orWhere('qr_code', $s);
            }))
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->when($request->district_id, fn($q, $d) => $q->whereHas('household', fn($h) => $h->where('district_id', $d)))
            ->when($request->programme_id, fn($q, $p) => $q->whereHas('programmes', fn($h) => $h->where('programmes.id', $p)))
            ->when($request->gender, fn($q, $g) => $q->where('gender', $g));

        return response()->json($query->orderBy('first_name')->paginate(25));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'household_id'         => 'required|exists:households,id',
            'first_name'           => 'required|string|max:100',
            'last_name'            => 'required|string|max:100',
            'national_id'          => 'nullable|string|max:50',
            'date_of_birth'        => 'nullable|date',
            'gender'               => 'required|in:male,female,other',
            'phone'                => 'nullable|string|max:20',
            'is_household_head'    => 'boolean',
            'relationship_to_head' => 'nullable|string',
            'is_disabled'          => 'boolean',
            'disability_type'      => 'nullable|string',
            'is_pregnant'          => 'boolean',
            'is_lactating'         => 'boolean',
            'is_malnourished'      => 'boolean',
            'muac_measurement'     => 'nullable|string',
            'notes'                => 'nullable|string',
        ]);

        // Check for duplicate national ID
        if (! empty($data['national_id'])) {
            $existing = Beneficiary::where('national_id', $data['national_id'])->first();
            if ($existing) {
                FraudAlert::create([
                    'beneficiary_id' => $existing->id,
                    'alert_type'     => 'suspicious_registration',
                    'description'    => "Duplicate national ID attempted: {$data['national_id']}",
                    'severity'       => 'high',
                    'evidence'       => ['national_id' => $data['national_id'], 'attempted_by' => $request->user()->id],
                ]);
                return response()->json(['message' => 'Duplicate national ID detected. Alert raised.'], 409);
            }
        }

        $data['registered_by']   = $request->user()->id;
        $data['registered_at']   = now();
        $data['beneficiary_number'] = 'BEN-' . strtoupper(Str::random(8));

        $beneficiary = Beneficiary::create($data);
        $this->audit->log('beneficiary_registered', 'Beneficiary', $beneficiary->id, $data, $request);

        return response()->json($beneficiary->load('household'), 201);
    }

    public function show(Beneficiary $beneficiary): JsonResponse
    {
        return response()->json($beneficiary->load([
            'household', 'household.district', 'household.ward',
            'programmes', 'distributionRecords.distribution',
        ]));
    }

    public function update(Request $request, Beneficiary $beneficiary): JsonResponse
    {
        $data = $request->validate([
            'first_name'       => 'sometimes|string|max:100',
            'last_name'        => 'sometimes|string|max:100',
            'phone'            => 'nullable|string|max:20',
            'status'           => 'sometimes|in:active,graduated,suspended,deceased,transferred',
            'is_disabled'      => 'boolean',
            'disability_type'  => 'nullable|string',
            'is_pregnant'      => 'boolean',
            'is_lactating'     => 'boolean',
            'is_malnourished'  => 'boolean',
            'muac_measurement' => 'nullable|string',
            'notes'            => 'nullable|string',
        ]);

        $old = $beneficiary->only(array_keys($data));
        $beneficiary->update($data);
        $this->audit->log('beneficiary_updated', 'Beneficiary', $beneficiary->id, ['old' => $old, 'new' => $data], $request);

        return response()->json($beneficiary->fresh());
    }

    public function destroy(Request $request, Beneficiary $beneficiary): JsonResponse
    {
        $this->audit->log('beneficiary_deleted', 'Beneficiary', $beneficiary->id, null, $request);
        $beneficiary->delete();
        return response()->json(['message' => 'Beneficiary deleted.']);
    }

    public function verifyQr(Request $request): JsonResponse
    {
        $request->validate(['qr_code' => 'required|string']);
        $beneficiary = Beneficiary::where('qr_code', $request->qr_code)
            ->with('household')
            ->first();

        if (! $beneficiary) {
            return response()->json(['message' => 'Beneficiary not found.'], 404);
        }

        return response()->json([
            'beneficiary' => $beneficiary,
            'eligible'    => $beneficiary->status === 'active',
        ]);
    }

    public function history(Beneficiary $beneficiary): JsonResponse
    {
        return response()->json([
            'distributions' => $beneficiary->distributionRecords()->with('distribution')->orderByDesc('collected_at')->get(),
            'programmes'    => $beneficiary->programmes,
        ]);
    }

    public function enroll(Request $request, Beneficiary $beneficiary): JsonResponse
    {
        $data = $request->validate([
            'programme_id'    => 'required|exists:programmes,id',
            'project_id'      => 'nullable|exists:projects,id',
            'enrollment_date' => 'required|date',
        ]);

        $already = $beneficiary->programmes()
            ->where('programme_id', $data['programme_id'])
            ->where('beneficiary_programme.status', 'active')
            ->exists();

        if ($already) {
            return response()->json(['message' => 'Beneficiary is already enrolled in this programme.'], 409);
        }

        $beneficiary->programmes()->attach($data['programme_id'], [
            'project_id'      => $data['project_id'] ?? null,
            'enrollment_date' => $data['enrollment_date'],
            'status'          => 'active',
        ]);

        $this->audit->log('beneficiary_enrolled', 'Beneficiary', $beneficiary->id, $data, $request);

        return response()->json($beneficiary->load('programmes'), 201);
    }

    public function unenroll(Request $request, Beneficiary $beneficiary, Programme $programme): JsonResponse
    {
        $data = $request->validate([
            'exit_reason' => 'nullable|string|max:200',
        ]);

        $beneficiary->programmes()->updateExistingPivot($programme->id, [
            'status'      => 'exited',
            'exit_date'   => now()->toDateString(),
            'exit_reason' => $data['exit_reason'] ?? null,
        ]);

        $this->audit->log('beneficiary_unenrolled', 'Beneficiary', $beneficiary->id, ['programme_id' => $programme->id], $request);

        return response()->json(['message' => 'Beneficiary unenrolled.']);
    }
}
