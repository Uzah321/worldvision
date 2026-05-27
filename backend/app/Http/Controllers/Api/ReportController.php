<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use App\Models\Beneficiary;
use App\Models\Distribution;
use App\Models\DistributionRecord;
use App\Models\Inventory;
use App\Models\KpiTarget;
use App\Models\ProcurementOrder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ReportController extends Controller
{
    public function dashboard(Request $request): JsonResponse
    {
        return response()->json([
            'beneficiaries' => [
                'total'      => Beneficiary::count(),
                'active'     => Beneficiary::where('status', 'active')->count(),
                'this_month' => Beneficiary::whereMonth('registered_at', now()->month)
                                           ->whereYear('registered_at', now()->year)->count(),
            ],
            'distributions' => [
                'planned'     => Distribution::where('status', 'planned')->count(),
                'in_progress' => Distribution::where('status', 'in_progress')->count(),
                'completed'   => Distribution::where('status', 'completed')->count(),
                'this_month'  => Distribution::whereMonth('distribution_date', now()->month)
                                             ->whereYear('distribution_date', now()->year)->count(),
            ],
            'inventory' => [
                'near_expiry' => Inventory::whereNotNull('expiry_date')
                                    ->where('quantity_available', '>', 0)
                                    ->whereDate('expiry_date', '<=', now()->addDays(30))->count(),
                'below_reorder' => Inventory::whereColumn('quantity_available', '<=', 'reorder_level')
                                            ->where('status', 'available')->count(),
            ],
            'procurement' => [
                'pending_approval' => ProcurementOrder::where('status', 'submitted')->count(),
                'this_month'       => ProcurementOrder::whereMonth('created_at', now()->month)
                                                      ->whereYear('created_at', now()->year)->count(),
            ],
        ]);
    }

    public function distributions(Request $request): JsonResponse
    {
        $from = $request->from ?? now()->startOfMonth()->toDateString();
        $to   = $request->to ?? now()->endOfMonth()->toDateString();

        $distributions = Distribution::with(['project', 'programme', 'site'])
            ->whereBetween('distribution_date', [$from, $to])
            ->when($request->programme_id, fn($q, $p) => $q->where('programme_id', $p))
            ->when($request->project_id, fn($q, $p) => $q->where('project_id', $p))
            ->orderBy('distribution_date')
            ->get();

        $summary = [
            'total_distributions'   => $distributions->count(),
            'total_planned_bens'    => $distributions->sum('planned_beneficiaries'),
            'total_actual_bens'     => $distributions->sum('actual_beneficiaries'),
            'completion_rate'       => $distributions->count()
                ? round(($distributions->where('status', 'completed')->count() / $distributions->count()) * 100, 1)
                : 0,
        ];

        return response()->json(['summary' => $summary, 'data' => $distributions]);
    }

    public function beneficiaries(Request $request): JsonResponse
    {
        $byGender = Beneficiary::select('gender', DB::raw('count(*) as total'))
            ->groupBy('gender')->get();

        $byStatus = Beneficiary::select('status', DB::raw('count(*) as total'))
            ->groupBy('status')->get();

        $byDistrict = Beneficiary::join('households', 'beneficiaries.household_id', '=', 'households.id')
            ->join('districts', 'households.district_id', '=', 'districts.id')
            ->select('districts.name as district', DB::raw('count(*) as total'))
            ->groupBy('districts.name')
            ->orderByDesc('total')
            ->limit(10)
            ->get();

        $vulnerability = [
            'disabled'    => Beneficiary::where('is_disabled', true)->count(),
            'pregnant'    => Beneficiary::where('is_pregnant', true)->count(),
            'lactating'   => Beneficiary::where('is_lactating', true)->count(),
            'malnourished'=> Beneficiary::where('is_malnourished', true)->count(),
        ];

        return response()->json(compact('byGender', 'byStatus', 'byDistrict', 'vulnerability'));
    }

    public function inventory(Request $request): JsonResponse
    {
        $stockByWarehouse = Inventory::join('warehouses', 'inventories.warehouse_id', '=', 'warehouses.id')
            ->join('commodities', 'inventories.commodity_id', '=', 'commodities.id')
            ->select(
                'warehouses.name as warehouse',
                'commodities.name as commodity',
                DB::raw('SUM(quantity_available) as available'),
                DB::raw('SUM(quantity_distributed) as distributed'),
                DB::raw('SUM(quantity_damaged) as damaged')
            )
            ->groupBy('warehouses.name', 'commodities.name')
            ->orderBy('warehouses.name')
            ->get();

        return response()->json($stockByWarehouse);
    }

    public function kpis(Request $request): JsonResponse
    {
        $query = KpiTarget::with('project')
            ->when($request->project_id, fn($q, $p) => $q->where('project_id', $p));

        $kpis = $query->get()->map(fn($k) => array_merge($k->toArray(), [
            'progress_percentage' => $k->progress_percentage,
        ]));

        return response()->json($kpis);
    }

    public function auditLog(Request $request): JsonResponse
    {
        $query = AuditLog::with('user')
            ->when($request->user_id, fn($q, $u) => $q->where('user_id', $u))
            ->when($request->event, fn($q, $e) => $q->where('event', $e))
            ->when($request->module, fn($q, $m) => $q->where('module', $m))
            ->when($request->from, fn($q, $d) => $q->whereDate('created_at', '>=', $d))
            ->when($request->to, fn($q, $d) => $q->whereDate('created_at', '<=', $d));

        return response()->json($query->orderByDesc('created_at')->paginate(50));
    }
}
