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

    // ── Auth (self) ───────────────────────────────────────────────────────────
    Route::post('/logout',          [AuthController::class, 'logout']);
    Route::get('/me',               [AuthController::class, 'me']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);

    // ── Geography (read-only, all roles) ──────────────────────────────────────
    Route::get('/countries',          [GeographyController::class, 'countries']);
    Route::get('/regions',            [GeographyController::class, 'regions']);
    Route::get('/districts',          [GeographyController::class, 'districts']);
    Route::get('/wards',              [GeographyController::class, 'wards']);

    // ── Lookup dropdowns (read-only, all roles) ───────────────────────────────
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

    Route::get('/suppliers', [ProcurementController::class, 'suppliers']);

    // ── Programmes & Projects (read: all; write: super_admin|programme_manager) ─
    Route::get('/programmes',                          [ProgrammeController::class, 'index']);
    Route::get('/programmes/{programme}',              [ProgrammeController::class, 'show']);
    Route::get('/programmes/{programme}/projects',     [ProgrammeController::class, 'projects']);
    Route::get('/projects/{project}',                  [ProgrammeController::class, 'showProject']);

    Route::middleware('role:super_admin|programme_manager')->group(function () {
        Route::post('/programmes',                     [ProgrammeController::class, 'store']);
        Route::put('/programmes/{programme}',          [ProgrammeController::class, 'update']);
        Route::delete('/programmes/{programme}',       [ProgrammeController::class, 'destroy']);
        Route::post('/projects',                       [ProgrammeController::class, 'storeProject']);
        Route::put('/projects/{project}',              [ProgrammeController::class, 'updateProject']);
        Route::delete('/projects/{project}',           [ProgrammeController::class, 'destroyProject']);
    });

    // ── Households (read: most roles; write: super_admin|data_officer|field_officer) ─
    Route::get('/households/{household}',              [HouseholdController::class, 'show']);
    Route::get('/households',                          [HouseholdController::class, 'index']);

    Route::middleware('role:super_admin|data_officer|field_officer')->group(function () {
        Route::post('/households',                     [HouseholdController::class, 'store']);
        Route::put('/households/{household}',          [HouseholdController::class, 'update']);
        Route::delete('/households/{household}',       [HouseholdController::class, 'destroy']);
    });

    // ── Beneficiaries (read: most roles; write: super_admin|data_officer|field_officer) ─
    Route::post('/beneficiaries/verify-qr',            [BeneficiaryController::class, 'verifyQr']);
    Route::get('/beneficiaries',                       [BeneficiaryController::class, 'index']);
    Route::get('/beneficiaries/{beneficiary}',         [BeneficiaryController::class, 'show']);

    Route::middleware('role:super_admin|data_officer|field_officer')->group(function () {
        Route::post('/beneficiaries',                                          [BeneficiaryController::class, 'store']);
        Route::put('/beneficiaries/{beneficiary}',                             [BeneficiaryController::class, 'update']);
        Route::delete('/beneficiaries/{beneficiary}',                          [BeneficiaryController::class, 'destroy']);
        Route::post('/beneficiaries/{beneficiary}/enroll',                     [BeneficiaryController::class, 'enroll']);
        Route::delete('/beneficiaries/{beneficiary}/enroll/{programme}',       [BeneficiaryController::class, 'unenroll']);
    });

    // ── Warehouses (read: super_admin|programme_manager|warehouse_officer|procurement_officer|auditor; write: super_admin|warehouse_officer) ─
    Route::get('/warehouses',                          [WarehouseController::class, 'index']);
    Route::get('/warehouses/{warehouse}',              [WarehouseController::class, 'show']);

    Route::middleware('role:super_admin|warehouse_officer')->group(function () {
        Route::post('/warehouses',                     [WarehouseController::class, 'store']);
        Route::put('/warehouses/{warehouse}',          [WarehouseController::class, 'update']);
        Route::delete('/warehouses/{warehouse}',       [WarehouseController::class, 'destroy']);
    });

    // ── Inventory (read: super_admin|programme_manager|warehouse_officer|procurement_officer|auditor; write: super_admin|warehouse_officer) ─
    Route::get('/inventory',                           [InventoryController::class, 'index']);
    Route::get('/inventory/{inventory}',               [InventoryController::class, 'show']);
    Route::get('/inventory/{inventory}/movements',     [InventoryController::class, 'movements']);
    Route::get('/inventory/alerts/expiry',             [InventoryController::class, 'expiryAlerts']);
    Route::get('/inventory/alerts/reorder',            [InventoryController::class, 'reorderAlerts']);

    Route::middleware('role:super_admin|warehouse_officer')->group(function () {
        Route::post('/inventory',                      [InventoryController::class, 'store']);
        Route::put('/inventory/{inventory}',           [InventoryController::class, 'update']);
        Route::post('/inventory/{inventory}/adjust',   [InventoryController::class, 'adjust']);
    });

    // ── Distributions ─────────────────────────────────────────────────────────
    Route::get('/distributions',                       [DistributionController::class, 'index']);
    Route::get('/distributions/{distribution}',        [DistributionController::class, 'show']);
    Route::get('/distributions/{distribution}/records',[DistributionController::class, 'records']);

    // Create/edit: distribution_officer and above
    Route::middleware('role:super_admin|programme_manager|distribution_officer')->group(function () {
        Route::post('/distributions',                  [DistributionController::class, 'store']);
        Route::put('/distributions/{distribution}',    [DistributionController::class, 'update']);
        Route::delete('/distributions/{distribution}', [DistributionController::class, 'destroy']);
    });

    // Approve: programme_manager and above
    Route::middleware('role:super_admin|programme_manager')->group(function () {
        Route::post('/distributions/{distribution}/approve', [DistributionController::class, 'approve']);
    });

    // Start/complete/record: distribution_officer and field_officer
    Route::middleware('role:super_admin|distribution_officer|field_officer')->group(function () {
        Route::post('/distributions/{distribution}/start',    [DistributionController::class, 'start']);
        Route::post('/distributions/{distribution}/complete', [DistributionController::class, 'complete']);
        Route::post('/distributions/{distribution}/record',   [DistributionController::class, 'recordDistribution']);
    });

    // ── Procurement ───────────────────────────────────────────────────────────
    Route::get('/procurement',                         [ProcurementController::class, 'index']);
    Route::get('/procurement/{procurement}',           [ProcurementController::class, 'show']);

    // Create/edit: procurement_officer
    Route::middleware('role:super_admin|procurement_officer')->group(function () {
        Route::post('/procurement',                    [ProcurementController::class, 'store']);
        Route::put('/procurement/{procurement}',       [ProcurementController::class, 'update']);
        Route::delete('/procurement/{procurement}',    [ProcurementController::class, 'destroy']);
    });

    // Approve/reject: programme_manager
    Route::middleware('role:super_admin|programme_manager')->group(function () {
        Route::post('/procurement/{procurement}/approve', [ProcurementController::class, 'approve']);
        Route::post('/procurement/{procurement}/reject',  [ProcurementController::class, 'reject']);
    });

    // Receive goods: warehouse_officer or procurement_officer
    Route::middleware('role:super_admin|warehouse_officer|procurement_officer')->group(function () {
        Route::post('/procurement/{procurement}/receive', [ProcurementController::class, 'receive']);
    });

    // ── Users & Roles (super_admin only) ─────────────────────────────────────
    Route::middleware('role:super_admin')->group(function () {
        Route::apiResource('/users', UserController::class);
        Route::post('/users/{user}/activate',    [UserController::class, 'activate']);
        Route::post('/users/{user}/deactivate',  [UserController::class, 'deactivate']);
        Route::post('/users/{user}/assign-role', [UserController::class, 'assignRole']);
        Route::get('/roles',                     [UserController::class, 'roles']);
    });

    // ── Commodities & Catalog (read: all; write: super_admin|data_officer) ───
    Route::get('/commodity-categories',          [CommodityController::class, 'categories']);
    Route::get('/commodities/list',              [CommodityController::class, 'index']);
    Route::get('/sites',                         [CommodityController::class, 'sites']);

    Route::middleware('role:super_admin|data_officer')->group(function () {
        Route::post('/commodity-categories',                    [CommodityController::class, 'storeCategory']);
        Route::put('/commodity-categories/{category}',         [CommodityController::class, 'updateCategory']);
        Route::delete('/commodity-categories/{category}',      [CommodityController::class, 'destroyCategory']);
        Route::post('/commodities/list',                        [CommodityController::class, 'store']);
        Route::put('/commodities/list/{commodity}',             [CommodityController::class, 'update']);
        Route::delete('/commodities/list/{commodity}',          [CommodityController::class, 'destroy']);
        Route::post('/sites',                                   [CommodityController::class, 'storeSite']);
        Route::put('/sites/{site}',                             [CommodityController::class, 'updateSite']);
        Route::delete('/sites/{site}',                          [CommodityController::class, 'destroySite']);
    });

    // ── Reports (all roles, read-only) ────────────────────────────────────────
    Route::get('/reports/dashboard',      [ReportController::class, 'dashboard']);
    Route::get('/reports/distributions',  [ReportController::class, 'distributions']);
    Route::get('/reports/beneficiaries',  [ReportController::class, 'beneficiaries']);
    Route::get('/reports/inventory',      [ReportController::class, 'inventory']);
    Route::get('/reports/kpis',           [ReportController::class, 'kpis']);
    Route::get('/reports/audit-log',      [ReportController::class, 'auditLog']);
});
