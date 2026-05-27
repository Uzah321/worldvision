<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Household;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HouseholdController extends Controller
{
    public function __construct(private AuditService $audit) {}

    public function index(Request $request): JsonResponse
    {
        $query = Household::with(['district', 'ward'])
            ->when($request->search, fn($q, $s) => $q->where('household_number', 'like', "%$s%")
                ->orWhere('head_name', 'like', "%$s%")
                ->orWhere('head_national_id', 'like', "%$s%"))
            ->when($request->district_id, fn($q, $d) => $q->where('district_id', $d))
            ->when($request->status, fn($q, $s) => $q->where('status', $s));

        return response()->json($query->orderBy('household_number')->paginate(25));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'household_number'   => 'required|string|unique:households',
            'head_name'          => 'required|string|max:200',
            'head_national_id'   => 'nullable|string|max:50',
            'head_phone'         => 'nullable|string|max:20',
            'head_gender'        => 'required|in:male,female,other',
            'head_dob'           => 'nullable|date',
            'total_members'      => 'required|integer|min:1',
            'male_members'       => 'nullable|integer|min:0',
            'female_members'     => 'nullable|integer|min:0',
            'children_under5'    => 'nullable|integer|min:0',
            'children_5_17'      => 'nullable|integer|min:0',
            'elderly_60plus'     => 'nullable|integer|min:0',
            'disabled_members'   => 'nullable|integer|min:0',
            'pregnant_lactating' => 'nullable|integer|min:0',
            'vulnerability_score'=> 'nullable|numeric|min:0|max:10',
            'district_id'        => 'required|exists:districts,id',
            'ward_id'            => 'nullable|exists:wards,id',
            'address'            => 'nullable|string',
            'notes'              => 'nullable|string',
        ]);

        $data['registered_by'] = $request->user()->id;
        $household = Household::create($data);
        $this->audit->log('household_created', 'Household', $household->id, $data, $request);

        return response()->json($household->load('district', 'ward'), 201);
    }

    public function show(Household $household): JsonResponse
    {
        return response()->json($household->load(['district', 'ward', 'beneficiaries']));
    }

    public function update(Request $request, Household $household): JsonResponse
    {
        $data = $request->validate([
            'head_name'          => 'sometimes|string|max:200',
            'head_national_id'   => 'nullable|string|max:50',
            'head_phone'         => 'nullable|string|max:20',
            'head_gender'        => 'sometimes|in:male,female,other',
            'head_dob'           => 'nullable|date',
            'total_members'      => 'sometimes|integer|min:1',
            'male_members'       => 'nullable|integer|min:0',
            'female_members'     => 'nullable|integer|min:0',
            'children_under5'    => 'nullable|integer|min:0',
            'children_5_17'      => 'nullable|integer|min:0',
            'elderly_60plus'     => 'nullable|integer|min:0',
            'disabled_members'   => 'nullable|integer|min:0',
            'pregnant_lactating' => 'nullable|integer|min:0',
            'vulnerability_score'=> 'nullable|numeric|min:0|max:10',
            'district_id'        => 'sometimes|exists:districts,id',
            'ward_id'            => 'nullable|exists:wards,id',
            'address'            => 'nullable|string',
            'status'             => 'sometimes|in:active,graduated,suspended,deceased',
            'notes'              => 'nullable|string',
        ]);

        $household->update($data);
        $this->audit->log('household_updated', 'Household', $household->id, $data, $request);

        return response()->json($household->fresh()->load('district', 'ward'));
    }

    public function destroy(Request $request, Household $household): JsonResponse
    {
        if ($household->beneficiaries()->count() > 0) {
            return response()->json(['message' => 'Cannot delete a household with registered beneficiaries.'], 422);
        }

        $this->audit->log('household_deleted', 'Household', $household->id, null, $request);
        $household->delete();

        return response()->json(['message' => 'Household deleted.']);
    }
}
