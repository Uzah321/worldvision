<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\BeneficiaryController;
use App\Http\Controllers\Api\CommodityController;
use App\Http\Controllers\Api\DistributionController;
use App\Http\Controllers\Api\GeographyController;
use App\Http\Controllers\Api\HouseholdController;
use App\Http\Controllers\Api\InventoryController;
use App\Http\Controllers\Api\ProcurementController;
use App\Http\Controllers\Api\ProgrammeController;
use App\Http\Controllers\Api\ReportController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\WarehouseController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// ── Public: Auth ─────────────────────────────────────────────────────────────
Route::post('/login', [AuthController::class, 'login']);

// ── Authenticated ─────────────────────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout',          [AuthController::class, 'logout']);
    Route::get('/me',               [AuthController::class, 'me']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);

    // Geography (read-only lookups used across many modules)
    Route::get('/countries',               [GeographyController::class, 'countries']);
    Route::get('/regions',                 [GeographyController::class, 'regions']);
    Route::get('/districts',               [GeographyController::class, 'districts']);
    Route::get('/wards',                   [GeographyController::class, 'wards']);

    // Lookup endpoints for form dropdowns
    Route::get('/commodities', function () {
        return response()->json(\App\Models\Commodity::orderBy('name')->selectRaw('id, name, unit_of_measure as unit')->get());
    });

    Route::get('/households', function (Request $request) {
        return response()->json(
            \App\Models\Household::with('district')
                ->when($request->search, fn($q, $s) => $q->where('household_number', 'like', "%$s%")
                    ->orWhere('head_name', 'like', "%$s%"))
                ->orderBy('head_name')
                ->limit(50)
                ->get(['id', 'household_number', 'head_name', 'district_id'])
        );
    });

    Route::get('/distribution-sites', function (Request $request) {
        return response()->json(
            \App\Models\DistributionSite::with('district')
                ->when($request->district_id, fn($q, $d) => $q->where('district_id', $d))
                ->orderBy('name')
                ->get(['id', 'name', 'district_id'])
        );
    });

    // Programmes & Projects
    Route::apiResource('/programmes', ProgrammeController::class);
    Route::get('/programmes/{programme}/projects', [ProgrammeController::class, 'projects']);
    Route::post('/projects',           [ProgrammeController::class, 'storeProject']);
    Route::get('/projects/{project}',  [ProgrammeController::class, 'showProject']);
    Route::put('/projects/{project}',  [ProgrammeController::class, 'updateProject']);
    Route::delete('/projects/{project}', [ProgrammeController::class, 'destroyProject']);

    // Suppliers (read-only listing for forms)
    Route::get('/suppliers', [ProcurementController::class, 'suppliers']);

    // Households
    Route::apiResource('/households', HouseholdController::class);

    // Beneficiaries
    Route::post('/beneficiaries/verify-qr', [BeneficiaryController::class, 'verifyQr']);
    Route::apiResource('/beneficiaries', BeneficiaryController::class);
    Route::post('/beneficiaries/{beneficiary}/enroll',              [BeneficiaryController::class, 'enroll']);
    Route::delete('/beneficiaries/{beneficiary}/enroll/{programme}',[BeneficiaryController::class, 'unenroll']);

    // Warehouses
    Route::apiResource('/warehouses', WarehouseController::class);

    // Inventory
    Route::get('/inventory',                         [InventoryController::class, 'index']);
    Route::post('/inventory',                        [InventoryController::class, 'store']);
    Route::get('/inventory/{inventory}',             [InventoryController::class, 'show']);
    Route::put('/inventory/{inventory}',             [InventoryController::class, 'update']);
    Route::post('/inventory/{inventory}/adjust',     [InventoryController::class, 'adjust']);
    Route::get('/inventory/{inventory}/movements',   [InventoryController::class, 'movements']);
    Route::get('/inventory/alerts/expiry',           [InventoryController::class, 'expiryAlerts']);
    Route::get('/inventory/alerts/reorder',          [InventoryController::class, 'reorderAlerts']);

    // Distributions
    Route::apiResource('/distributions', DistributionController::class);
    Route::post('/distributions/{distribution}/approve',     [DistributionController::class, 'approve']);
    Route::post('/distributions/{distribution}/start',       [DistributionController::class, 'start']);
    Route::post('/distributions/{distribution}/complete',    [DistributionController::class, 'complete']);
    Route::post('/distributions/{distribution}/record',      [DistributionController::class, 'recordDistribution']);
    Route::get('/distributions/{distribution}/records',      [DistributionController::class, 'records']);

    // Procurement
    Route::apiResource('/procurement', ProcurementController::class);
    Route::post('/procurement/{procurement}/approve',  [ProcurementController::class, 'approve']);
    Route::post('/procurement/{procurement}/reject',   [ProcurementController::class, 'reject']);
    Route::post('/procurement/{procurement}/receive',  [ProcurementController::class, 'receive']);

    // Users & Roles (admin)
    Route::apiResource('/users', UserController::class);
    Route::post('/users/{user}/activate',      [UserController::class, 'activate']);
    Route::post('/users/{user}/deactivate',    [UserController::class, 'deactivate']);
    Route::post('/users/{user}/assign-role',   [UserController::class, 'assignRole']);
    Route::get('/roles',                       [UserController::class, 'roles']);

    // Commodities & categories
    Route::get('/commodity-categories',                          [CommodityController::class, 'categories']);
    Route::post('/commodity-categories',                         [CommodityController::class, 'storeCategory']);
    Route::put('/commodity-categories/{category}',              [CommodityController::class, 'updateCategory']);
    Route::delete('/commodity-categories/{category}',           [CommodityController::class, 'destroyCategory']);
    Route::get('/commodities/list',                              [CommodityController::class, 'index']);
    Route::post('/commodities/list',                             [CommodityController::class, 'store']);
    Route::put('/commodities/list/{commodity}',                  [CommodityController::class, 'update']);
    Route::delete('/commodities/list/{commodity}',               [CommodityController::class, 'destroy']);

    // Distribution sites (management)
    Route::get('/sites',                    [CommodityController::class, 'sites']);
    Route::post('/sites',                   [CommodityController::class, 'storeSite']);
    Route::put('/sites/{site}',             [CommodityController::class, 'updateSite']);
    Route::delete('/sites/{site}',          [CommodityController::class, 'destroySite']);

    // Reports & KPIs
    Route::get('/reports/dashboard',         [ReportController::class, 'dashboard']);
    Route::get('/reports/distributions',     [ReportController::class, 'distributions']);
    Route::get('/reports/beneficiaries',     [ReportController::class, 'beneficiaries']);
    Route::get('/reports/inventory',         [ReportController::class, 'inventory']);
    Route::get('/reports/kpis',              [ReportController::class, 'kpis']);
    Route::get('/reports/audit-log',         [ReportController::class, 'auditLog']);
});
