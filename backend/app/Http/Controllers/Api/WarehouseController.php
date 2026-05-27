<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Warehouse;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class WarehouseController extends Controller
{
    public function __construct(private AuditService $audit) {}

    public function index(Request $request): JsonResponse
    {
        $query = Warehouse::with(['district', 'manager'])
            ->when($request->district_id, fn($q, $d) => $q->where('district_id', $d))
            ->when($request->active !== null, fn($q) => $q->where('is_active', filter_var($request->active, FILTER_VALIDATE_BOOLEAN)));

        return response()->json($query->orderBy('name')->get());
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'         => 'required|string|max:200',
            'code'         => 'required|string|max:20|unique:warehouses,code',
            'district_id'  => 'required|exists:districts,id',
            'address'      => 'nullable|string',
            'latitude'     => 'nullable|numeric',
            'longitude'    => 'nullable|numeric',
            'capacity_cbm' => 'nullable|numeric|min:0',
            'managed_by'   => 'nullable|exists:users,id',
        ]);

        $warehouse = Warehouse::create($data);
        $this->audit->log('warehouse_created', 'Warehouse', $warehouse->id, $data, $request);

        return response()->json($warehouse->load('district', 'manager'), 201);
    }

    public function show(Warehouse $warehouse): JsonResponse
    {
        return response()->json($warehouse->load([
            'district', 'manager',
            'inventory.commodity',
        ]));
    }

    public function update(Request $request, Warehouse $warehouse): JsonResponse
    {
        $data = $request->validate([
            'name'         => 'sometimes|string|max:200',
            'address'      => 'nullable|string',
            'capacity_cbm' => 'nullable|numeric|min:0',
            'managed_by'   => 'nullable|exists:users,id',
            'is_active'    => 'sometimes|boolean',
        ]);

        $warehouse->update($data);
        $this->audit->log('warehouse_updated', 'Warehouse', $warehouse->id, $data, $request);

        return response()->json($warehouse->fresh());
    }

    public function destroy(Request $request, Warehouse $warehouse): JsonResponse
    {
        if ($warehouse->inventory()->where('quantity_available', '>', 0)->exists()) {
            return response()->json(['message' => 'Cannot delete a warehouse with available stock.'], 422);
        }

        $this->audit->log('warehouse_deleted', 'Warehouse', $warehouse->id, null, $request);
        $warehouse->delete();

        return response()->json(['message' => 'Warehouse deleted.']);
    }

    public function stockSummary(Warehouse $warehouse): JsonResponse
    {
        $summary = $warehouse->inventory()
            ->with('commodity')
            ->get()
            ->map(fn($inv) => [
                'commodity'          => $inv->commodity?->name,
                'quantity_available' => $inv->quantity_available,
                'quantity_reserved'  => $inv->quantity_reserved,
                'near_expiry'        => $inv->isNearExpiry(),
                'below_reorder'      => $inv->isBelowReorderLevel(),
            ]);

        return response()->json($summary);
    }
}
