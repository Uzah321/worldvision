<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Commodity;
use App\Models\CommodityCategory;
use App\Models\DistributionSite;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CommodityController extends Controller
{
    public function __construct(private AuditService $audit) {}

    // ── Commodity Categories ──────────────────────────────────────────────────

    public function categories(): JsonResponse
    {
        return response()->json(CommodityCategory::orderBy('name')->get());
    }

    public function storeCategory(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|max:100|unique:commodity_categories',
            'code'        => 'required|string|max:50|unique:commodity_categories,code',
            'description' => 'nullable|string',
            'type'        => 'required|in:food,non_food,medical,shelter,wash,other',
        ]);

        $category = CommodityCategory::create($data);
        return response()->json($category, 201);
    }

    public function updateCategory(Request $request, CommodityCategory $category): JsonResponse
    {
        $data = $request->validate([
            'name'        => 'sometimes|string|max:100',
            'description' => 'nullable|string',
            'type'        => 'sometimes|in:food,non_food,medical,other',
        ]);

        $category->update($data);
        return response()->json($category->fresh());
    }

    public function destroyCategory(CommodityCategory $category): JsonResponse
    {
        if ($category->commodities()->count() > 0) {
            return response()->json(['message' => 'Cannot delete a category that has commodities.'], 422);
        }
        $category->delete();
        return response()->json(['message' => 'Category deleted.']);
    }

    // ── Commodities ───────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $commodities = Commodity::with('category')
            ->when($request->category_id, fn($q, $c) => $q->where('category_id', $c))
            ->when($request->search, fn($q, $s) => $q->where('name', 'like', "%$s%")
                ->orWhere('code', 'like', "%$s%"))
            ->orderBy('name')
            ->get();

        return response()->json($commodities);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|max:200',
            'code'        => 'required|string|max:50|unique:commodities',
            'category_id' => 'required|exists:commodity_categories,id',
            'unit'        => 'required|string|max:50',
            'description' => 'nullable|string',
            'is_active'   => 'boolean',
        ]);

        $commodity = Commodity::create($data);
        $this->audit->log('commodity_created', 'Commodity', $commodity->id, $data, $request);

        return response()->json($commodity->load('category'), 201);
    }

    public function update(Request $request, Commodity $commodity): JsonResponse
    {
        $data = $request->validate([
            'name'        => 'sometimes|string|max:200',
            'category_id' => 'sometimes|exists:commodity_categories,id',
            'unit'        => 'sometimes|string|max:50',
            'description' => 'nullable|string',
            'is_active'   => 'boolean',
        ]);

        $commodity->update($data);
        $this->audit->log('commodity_updated', 'Commodity', $commodity->id, $data, $request);

        return response()->json($commodity->fresh()->load('category'));
    }

    public function destroy(Request $request, Commodity $commodity): JsonResponse
    {
        if ($commodity->inventory()->count() > 0) {
            return response()->json(['message' => 'Cannot delete a commodity with inventory records.'], 422);
        }
        $this->audit->log('commodity_deleted', 'Commodity', $commodity->id, null, $request);
        $commodity->delete();
        return response()->json(['message' => 'Commodity deleted.']);
    }

    // ── Distribution Sites ────────────────────────────────────────────────────

    public function sites(Request $request): JsonResponse
    {
        $sites = DistributionSite::with(['district', 'ward'])
            ->when($request->district_id, fn($q, $d) => $q->where('district_id', $d))
            ->orderBy('name')
            ->paginate(25);

        return response()->json($sites);
    }

    public function storeSite(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'        => 'required|string|max:200',
            'code'        => 'required|string|max:50|unique:distribution_sites',
            'district_id' => 'required|exists:districts,id',
            'ward_id'     => 'nullable|exists:wards,id',
            'address'     => 'nullable|string',
            'latitude'    => 'nullable|numeric',
            'longitude'   => 'nullable|numeric',
            'capacity'    => 'nullable|integer|min:1',
            'is_active'   => 'boolean',
        ]);

        $site = DistributionSite::create($data);
        $this->audit->log('distribution_site_created', 'DistributionSite', $site->id, $data, $request);

        return response()->json($site->load('district', 'ward'), 201);
    }

    public function updateSite(Request $request, DistributionSite $site): JsonResponse
    {
        $data = $request->validate([
            'name'        => 'sometimes|string|max:200',
            'district_id' => 'sometimes|exists:districts,id',
            'ward_id'     => 'nullable|exists:wards,id',
            'address'     => 'nullable|string',
            'capacity'    => 'nullable|integer|min:1',
            'is_active'   => 'boolean',
        ]);

        $site->update($data);
        $this->audit->log('distribution_site_updated', 'DistributionSite', $site->id, $data, $request);

        return response()->json($site->fresh()->load('district', 'ward'));
    }

    public function destroySite(Request $request, DistributionSite $site): JsonResponse
    {
        if ($site->distributions()->count() > 0) {
            return response()->json(['message' => 'Cannot delete a site with existing distributions.'], 422);
        }
        $this->audit->log('distribution_site_deleted', 'DistributionSite', $site->id, null, $request);
        $site->delete();
        return response()->json(['message' => 'Distribution site deleted.']);
    }
}
