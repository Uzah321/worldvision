<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Inventory;
use App\Models\InventoryMovement;
use App\Models\ProcurementItem;
use App\Models\ProcurementOrder;
use App\Models\Supplier;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class ProcurementController extends Controller
{
    public function __construct(private AuditService $audit) {}

    // ── Procurement Orders ────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $query = ProcurementOrder::with(['supplier', 'programme', 'project', 'createdBy'])
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->when($request->supplier_id, fn($q, $s) => $q->where('supplier_id', $s))
            ->when($request->programme_id, fn($q, $p) => $q->where('programme_id', $p))
            ->when($request->from, fn($q, $d) => $q->whereDate('required_date', '>=', $d))
            ->when($request->to, fn($q, $d) => $q->whereDate('required_date', '<=', $d));

        return response()->json($query->orderByDesc('created_at')->paginate(25));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'programme_id'       => 'required|exists:programmes,id',
            'project_id'         => 'required|exists:projects,id',
            'supplier_id'        => 'required|exists:suppliers,id',
            'warehouse_id'       => 'required|exists:warehouses,id',
            'title'              => 'required|string|max:200',
            'description'        => 'nullable|string',
            'required_date'      => 'required|date|after:today',
            'priority'           => 'required|in:low,medium,high,urgent',
            'currency'           => 'required|string|size:3',
            'items'              => 'required|array|min:1',
            'items.*.commodity_id'    => 'required|exists:commodities,id',
            'items.*.quantity_ordered'=> 'required|numeric|min:0.01',
            'items.*.unit_price'      => 'required|numeric|min:0',
            'items.*.unit_of_measure' => 'required|string',
        ]);

        $items = $data['items'];
        unset($data['items']);

        $data['po_number']   = 'PO-' . strtoupper(Str::random(8));
        $data['status']      = 'draft';
        $data['created_by']  = $request->user()->id;
        $data['total_amount'] = collect($items)->sum(fn($i) => $i['quantity_ordered'] * $i['unit_price']);

        $order = ProcurementOrder::create($data);

        foreach ($items as $item) {
            $item['procurement_order_id'] = $order->id;
            $item['total_price'] = $item['quantity_ordered'] * $item['unit_price'];
            ProcurementItem::create($item);
        }

        $this->audit->log('procurement_order_created', 'ProcurementOrder', $order->id, $data, $request);

        return response()->json($order->load('items.commodity', 'supplier'), 201);
    }

    public function show(ProcurementOrder $procurement): JsonResponse
    {
        return response()->json($procurement->load([
            'items.commodity', 'supplier', 'programme',
            'project', 'warehouse', 'createdBy', 'approvedBy',
        ]));
    }

    public function update(Request $request, ProcurementOrder $procurement): JsonResponse
    {
        if (! in_array($procurement->status, ['draft', 'submitted'])) {
            return response()->json(['message' => 'Cannot edit an approved or received order.'], 422);
        }

        $data = $request->validate([
            'title'         => 'sometimes|string|max:200',
            'description'   => 'nullable|string',
            'required_date' => 'sometimes|date',
            'priority'      => 'sometimes|in:low,medium,high,urgent',
            'notes'         => 'nullable|string',
        ]);

        $procurement->update($data);
        $this->audit->log('procurement_order_updated', 'ProcurementOrder', $procurement->id, $data, $request);

        return response()->json($procurement->fresh());
    }

    public function destroy(Request $request, ProcurementOrder $procurement): JsonResponse
    {
        if ($procurement->status !== 'draft') {
            return response()->json(['message' => 'Only draft orders can be deleted.'], 422);
        }

        $this->audit->log('procurement_order_deleted', 'ProcurementOrder', $procurement->id, null, $request);
        $procurement->delete();

        return response()->json(['message' => 'Procurement order deleted.']);
    }

    public function approve(Request $request, ProcurementOrder $procurement): JsonResponse
    {
        if ($procurement->status !== 'submitted') {
            return response()->json(['message' => 'Order must be submitted before approval.'], 422);
        }

        $procurement->update([
            'status'      => 'approved',
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
        ]);

        $this->audit->log('procurement_order_approved', 'ProcurementOrder', $procurement->id, null, $request);

        return response()->json($procurement->fresh());
    }

    public function reject(Request $request, ProcurementOrder $procurement): JsonResponse
    {
        $data = $request->validate(['rejection_reason' => 'required|string']);

        if (! in_array($procurement->status, ['submitted', 'approved'])) {
            return response()->json(['message' => 'Order cannot be rejected at this stage.'], 422);
        }

        $procurement->update([
            'status'           => 'rejected',
            'rejection_reason' => $data['rejection_reason'],
        ]);

        $this->audit->log('procurement_order_rejected', 'ProcurementOrder', $procurement->id, $data, $request);

        return response()->json($procurement->fresh());
    }

    public function receive(Request $request, ProcurementOrder $procurement): JsonResponse
    {
        if (!in_array($procurement->status, ['approved', 'partially_received'])) {
            return response()->json(['message' => 'Only approved or partially-received orders can be received.'], 422);
        }

        $data = $request->validate([
            'delivery_date'              => 'nullable|date',
            'notes'                      => 'nullable|string|max:1000',
            'items'                      => 'required|array|min:1',
            'items.*.id'                 => 'required|exists:procurement_items,id',
            'items.*.quantity_received'  => 'required|numeric|min:0',
            'items.*.batch_number'       => 'nullable|string|max:100',
            'items.*.lot_number'         => 'nullable|string|max:100',
            'items.*.expiry_date'        => 'nullable|date',
        ]);

        foreach ($data['items'] as $itemData) {
            if ($itemData['quantity_received'] <= 0) continue;

            $item = ProcurementItem::findOrFail($itemData['id']);
            $item->update(['quantity_received' => $item->quantity_received + $itemData['quantity_received']]);

            // Determine inventory status from expiry date
            $expiryDate  = isset($itemData['expiry_date']) ? \Carbon\Carbon::parse($itemData['expiry_date']) : null;
            $invStatus   = 'good';
            if ($expiryDate) {
                if ($expiryDate->isPast())                          $invStatus = 'expired';
                elseif ($expiryDate->diffInDays(now()) <= 90)      $invStatus = 'near_expiry';
            }

            // Each unique batch gets its own inventory row
            $matchKey = [
                'warehouse_id' => $procurement->warehouse_id,
                'commodity_id' => $item->commodity_id,
                'batch_number' => $itemData['batch_number'] ?? null,
            ];
            $inventory = Inventory::firstOrCreate($matchKey, [
                'lot_number'           => $itemData['lot_number'] ?? null,
                'expiry_date'          => $itemData['expiry_date'] ?? null,
                'status'               => $invStatus,
                'quantity_received'    => 0,
                'quantity_available'   => 0,
                'quantity_reserved'    => 0,
                'quantity_distributed' => 0,
                'quantity_damaged'     => 0,
                'quantity_expired'     => 0,
                'quantity_lost'        => 0,
                'programme_id'         => $procurement->programme_id,
            ]);

            // Update expiry/status if provided and record is fresh
            if ($expiryDate && !$inventory->wasRecentlyCreated) {
                $inventory->update(['expiry_date' => $itemData['expiry_date'], 'status' => $invStatus]);
            }

            $inventory->increment('quantity_received',  $itemData['quantity_received']);
            $inventory->increment('quantity_available', $itemData['quantity_received']);

            $noteText = "Received from PO: {$procurement->po_number}";
            if (!empty($itemData['batch_number'])) $noteText .= " | Batch: {$itemData['batch_number']}";
            if (!empty($data['notes']))             $noteText .= " | {$data['notes']}";

            InventoryMovement::create([
                'inventory_id'     => $inventory->id,
                'warehouse_id'     => $procurement->warehouse_id,
                'commodity_id'     => $item->commodity_id,
                'movement_type'    => 'receipt',
                'quantity'         => $itemData['quantity_received'],
                'balance_after'    => $inventory->fresh()->quantity_available,
                'reference_number' => $procurement->po_number,
                'notes'            => $noteText,
                'performed_by'     => $request->user()->id,
            ]);
        }

        // Determine whether fully or partially received
        $procurement->refresh();
        $allReceived = $procurement->items->every(
            fn($i) => $i->quantity_received >= $i->quantity_ordered
        );
        $newStatus   = $allReceived ? 'received' : 'partially_received';
        $procurement->update([
            'status'        => $newStatus,
            'delivery_date' => $data['delivery_date'] ?? now()->toDateString(),
        ]);

        $this->audit->log('procurement_order_received', 'ProcurementOrder', $procurement->id, $data, $request);

        return response()->json($procurement->fresh()->load('items.commodity'));
    }

    // ── Suppliers ─────────────────────────────────────────────────────────────

    public function suppliers(Request $request): JsonResponse
    {
        $query = Supplier::when($request->search, fn($q, $s) => $q->where('name', 'like', "%$s%")
            ->orWhere('code', 'like', "%$s%"));

        return response()->json($query->where('status', 'active')->orderBy('name')->get());
    }
}
