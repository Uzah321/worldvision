<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\InventoryMovement;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class InventoryController extends Controller
{
    public function __construct(private AuditService $audit) {}

    public function index(Request $request): JsonResponse
    {
        $query = Inventory::with(['warehouse', 'commodity', 'programme'])
            ->when($request->warehouse_id, fn($q, $w) => $q->where('warehouse_id', $w))
            ->when($request->commodity_id, fn($q, $c) => $q->where('commodity_id', $c))
            ->when($request->programme_id, fn($q, $p) => $q->where('programme_id', $p))
            ->when($request->status, fn($q, $s) => $q->where('status', $s));

        return response()->json($query->orderBy('warehouse_id')->paginate(25));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'warehouse_id'       => 'required|exists:warehouses,id',
            'commodity_id'       => 'required|exists:commodities,id',
            'programme_id'       => 'nullable|exists:programmes,id',
            'batch_number'       => 'nullable|string|max:100',
            'lot_number'         => 'nullable|string|max:100',
            'manufacture_date'   => 'nullable|date',
            'expiry_date'        => 'nullable|date|after:today',
            'quantity_received'  => 'required|numeric|min:0.01',
            'reorder_level'      => 'nullable|numeric|min:0',
        ]);

        $data['quantity_available'] = $data['quantity_received'];
        $data['status'] = 'available';

        $inventory = Inventory::create($data);

        // Record inbound movement
        InventoryMovement::create([
            'inventory_id'     => $inventory->id,
            'warehouse_id'     => $inventory->warehouse_id,
            'commodity_id'     => $inventory->commodity_id,
            'movement_type'    => 'receipt',
            'quantity'         => $data['quantity_received'],
            'balance_after'    => $data['quantity_received'],
            'reference_number' => $data['batch_number'] ?? null,
            'notes'            => 'Initial stock receipt',
            'performed_by'     => $request->user()->id,
        ]);

        $this->audit->log('inventory_received', 'Inventory', $inventory->id, $data, $request);

        return response()->json($inventory->load('warehouse', 'commodity'), 201);
    }

    public function show(Inventory $inventory): JsonResponse
    {
        return response()->json($inventory->load([
            'warehouse', 'commodity', 'programme',
        ]));
    }

    public function update(Request $request, Inventory $inventory): JsonResponse
    {
        $data = $request->validate([
            'reorder_level' => 'sometimes|numeric|min:0',
            'status'        => 'sometimes|in:available,reserved,damaged,expired',
            'expiry_date'   => 'sometimes|date',
            'notes'         => 'nullable|string',
        ]);

        $inventory->update($data);
        $this->audit->log('inventory_updated', 'Inventory', $inventory->id, $data, $request);

        return response()->json($inventory->fresh());
    }

    public function adjust(Request $request, Inventory $inventory): JsonResponse
    {
        $data = $request->validate([
            'adjustment_type' => 'required|in:damage,loss,expiry,correction,transfer_out',
            'quantity'        => 'required|numeric|min:0.01',
            'notes'           => 'required|string',
        ]);

        if ($data['quantity'] > $inventory->quantity_available) {
            return response()->json(['message' => 'Adjustment quantity exceeds available stock.'], 422);
        }

        $field = match ($data['adjustment_type']) {
            'damage'       => 'quantity_damaged',
            'loss'         => 'quantity_lost',
            'expiry'       => 'quantity_expired',
            'correction',
            'transfer_out' => 'quantity_available',
            default        => 'quantity_available',
        };

        $inventory->decrement('quantity_available', $data['quantity']);
        if ($field !== 'quantity_available') {
            $inventory->increment($field, $data['quantity']);
        }

        $balanceAfter = $inventory->fresh()->quantity_available;

        InventoryMovement::create([
            'inventory_id'  => $inventory->id,
            'warehouse_id'  => $inventory->warehouse_id,
            'commodity_id'  => $inventory->commodity_id,
            'movement_type' => $data['adjustment_type'],
            'quantity'      => -$data['quantity'],
            'balance_after' => $balanceAfter,
            'notes'         => $data['notes'],
            'performed_by'  => $request->user()->id,
        ]);

        $this->audit->log('inventory_adjusted', 'Inventory', $inventory->id, $data, $request);

        return response()->json($inventory->fresh());
    }

    public function movements(Request $request, Inventory $inventory): JsonResponse
    {
        $movements = $inventory->movements()
            ->with('performedBy')
            ->orderByDesc('created_at')
            ->paginate(50);

        return response()->json($movements);
    }

    public function expiryAlerts(Request $request): JsonResponse
    {
        $days = (int) ($request->days ?? 30);

        $items = Inventory::with(['warehouse', 'commodity'])
            ->whereNotNull('expiry_date')
            ->where('quantity_available', '>', 0)
            ->whereDate('expiry_date', '<=', now()->addDays($days))
            ->orderBy('expiry_date')
            ->get();

        return response()->json($items);
    }

    public function reorderAlerts(Request $request): JsonResponse
    {
        $items = Inventory::with(['warehouse', 'commodity'])
            ->whereColumn('quantity_available', '<=', 'reorder_level')
            ->where('status', 'available')
            ->get();

        return response()->json($items);
    }
}
