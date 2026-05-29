<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Spatie\Permission\Models\Role;
use App\Models\User;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        // ── Roles ──────────────────────────────────────────────────────────────
        $roleNames = [
            'super_admin', 'programme_manager', 'distribution_officer',
            'warehouse_officer', 'procurement_officer', 'data_officer',
            'field_officer', 'auditor',
        ];
        foreach ($roleNames as $name) {
            Role::firstOrCreate(['name' => $name, 'guard_name' => 'web']);
        }

        // ── Users ──────────────────────────────────────────────────────────────
        $admin = User::firstOrCreate(['email' => 'admin@worldvision.org'], [
            'name' => 'System Administrator', 'password' => Hash::make('Admin@1234!'),
            'employee_id' => 'WV-ADMIN-001', 'job_title' => 'System Administrator', 'is_active' => true,
        ]);
        $admin->syncRoles(['super_admin']);

        $pm = User::firstOrCreate(['email' => 'pm@worldvision.org'], [
            'name' => 'Sarah Moyo', 'password' => Hash::make('Demo@1234!'),
            'employee_id' => 'WV-PM-001', 'job_title' => 'Programme Manager', 'is_active' => true,
        ]);
        $pm->syncRoles(['programme_manager']);

        $dist = User::firstOrCreate(['email' => 'dist@worldvision.org'], [
            'name' => 'Takudzwa Banda', 'password' => Hash::make('Demo@1234!'),
            'employee_id' => 'WV-DO-001', 'job_title' => 'Distribution Officer', 'is_active' => true,
        ]);
        $dist->syncRoles(['distribution_officer']);

        $wh = User::firstOrCreate(['email' => 'warehouse@worldvision.org'], [
            'name' => 'Chiedza Nyathi', 'password' => Hash::make('Demo@1234!'),
            'employee_id' => 'WV-WH-001', 'job_title' => 'Warehouse Officer', 'is_active' => true,
        ]);
        $wh->syncRoles(['warehouse_officer']);

        $po = User::firstOrCreate(['email' => 'proc@worldvision.org'], [
            'name' => 'Emmanuel Dube', 'password' => Hash::make('Demo@1234!'),
            'employee_id' => 'WV-PO-001', 'job_title' => 'Procurement Officer', 'is_active' => true,
        ]);
        $po->syncRoles(['procurement_officer']);

        $do = User::firstOrCreate(['email' => 'data@worldvision.org'], [
            'name' => 'Rudo Chikwanda', 'password' => Hash::make('Demo@1234!'),
            'employee_id' => 'WV-DA-001', 'job_title' => 'Data Officer', 'is_active' => true,
        ]);
        $do->syncRoles(['data_officer']);

        $fo = User::firstOrCreate(['email' => 'field@worldvision.org'], [
            'name' => 'Moses Phiri', 'password' => Hash::make('Demo@1234!'),
            'employee_id' => 'WV-FO-001', 'job_title' => 'Field Officer', 'is_active' => true,
        ]);
        $fo->syncRoles(['field_officer']);

        $au = User::firstOrCreate(['email' => 'auditor@worldvision.org'], [
            'name' => 'Grace Sibanda', 'password' => Hash::make('Demo@1234!'),
            'employee_id' => 'WV-AU-001', 'job_title' => 'Internal Auditor', 'is_active' => true,
        ]);
        $au->syncRoles(['auditor']);

        // ── Geography ──────────────────────────────────────────────────────────
        $zimbabwe = DB::table('countries')->insertGetId([
            'name' => 'Zimbabwe', 'code' => 'ZWE', 'currency' => 'USD', 'is_active' => true,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $regionData = [
            ['name' => 'Harare Metropolitan',  'code' => 'HAR', 'lat' => -17.8252, 'lng' => 31.0335],
            ['name' => 'Manicaland',            'code' => 'MAN', 'lat' => -19.0000, 'lng' => 32.6500],
            ['name' => 'Matabeleland South',    'code' => 'MAS', 'lat' => -20.8000, 'lng' => 29.0000],
            ['name' => 'Midlands',              'code' => 'MID', 'lat' => -19.4500, 'lng' => 29.8167],
            ['name' => 'Mashonaland East',      'code' => 'MSE', 'lat' => -18.1700, 'lng' => 32.0500],
        ];
        $regions = [];
        foreach ($regionData as $r) {
            $regions[$r['code']] = DB::table('regions')->insertGetId([
                'country_id' => $zimbabwe, 'name' => $r['name'], 'code' => $r['code'],
                'latitude' => $r['lat'], 'longitude' => $r['lng'], 'is_active' => true,
                'created_at' => now(), 'updated_at' => now(),
            ]);
        }

        $districtData = [
            ['name' => 'Harare Urban',   'code' => 'HAR-01', 'region' => 'HAR', 'lat' => -17.8252, 'lng' => 31.0335],
            ['name' => 'Chitungwiza',    'code' => 'HAR-02', 'region' => 'HAR', 'lat' => -18.0127, 'lng' => 31.0756],
            ['name' => 'Mutare',         'code' => 'MAN-01', 'region' => 'MAN', 'lat' => -18.9706, 'lng' => 32.6500],
            ['name' => 'Chipinge',       'code' => 'MAN-02', 'region' => 'MAN', 'lat' => -20.1970, 'lng' => 32.6270],
            ['name' => 'Bulawayo',       'code' => 'MAS-01', 'region' => 'MAS', 'lat' => -20.1500, 'lng' => 28.5833],
            ['name' => 'Beitbridge',     'code' => 'MAS-02', 'region' => 'MAS', 'lat' => -22.2167, 'lng' => 30.0000],
            ['name' => 'Gweru',          'code' => 'MID-01', 'region' => 'MID', 'lat' => -19.4500, 'lng' => 29.8167],
            ['name' => 'Kwekwe',         'code' => 'MID-02', 'region' => 'MID', 'lat' => -18.9281, 'lng' => 29.8135],
            ['name' => 'Marondera',      'code' => 'MSE-01', 'region' => 'MSE', 'lat' => -18.1874, 'lng' => 31.5518],
            ['name' => 'Murehwa',        'code' => 'MSE-02', 'region' => 'MSE', 'lat' => -17.6505, 'lng' => 31.7812],
        ];
        $districts = [];
        foreach ($districtData as $d) {
            $districts[$d['code']] = DB::table('districts')->insertGetId([
                'region_id' => $regions[$d['region']], 'name' => $d['name'], 'code' => $d['code'],
                'latitude' => $d['lat'], 'longitude' => $d['lng'], 'is_active' => true,
                'created_at' => now(), 'updated_at' => now(),
            ]);
        }

        // Wards
        $wardData = [
            ['name' => 'Ward 1 - Mbare',       'district' => 'HAR-01'],
            ['name' => 'Ward 2 - Glen Norah',   'district' => 'HAR-01'],
            ['name' => 'Ward 3 - Highfield',    'district' => 'HAR-01'],
            ['name' => 'Ward 1 - Zengeza',      'district' => 'HAR-02'],
            ['name' => 'Ward 2 - St Mary\'s',   'district' => 'HAR-02'],
            ['name' => 'Ward 1 - Sakubva',      'district' => 'MAN-01'],
            ['name' => 'Ward 2 - Dangamvura',   'district' => 'MAN-01'],
            ['name' => 'Ward 1 - Chipinge Town','district' => 'MAN-02'],
            ['name' => 'Ward 1 - Makokoba',     'district' => 'MAS-01'],
            ['name' => 'Ward 2 - Nkulumane',    'district' => 'MAS-01'],
            ['name' => 'Ward 1 - Gweru CBD',    'district' => 'MID-01'],
            ['name' => 'Ward 1 - Marondera',    'district' => 'MSE-01'],
        ];
        $wards = [];
        foreach ($wardData as $w) {
            $wards[$w['name']] = DB::table('wards')->insertGetId([
                'district_id' => $districts[$w['district']], 'name' => $w['name'],
                'created_at' => now(), 'updated_at' => now(),
            ]);
        }

        // Update users with districts
        User::where('email', 'dist@worldvision.org')->update(['district_id' => $districts['HAR-01']]);
        User::where('email', 'warehouse@worldvision.org')->update(['district_id' => $districts['HAR-01']]);

        // ── Programmes & Projects ──────────────────────────────────────────────
        $prog1 = DB::table('programmes')->insertGetId([
            'name' => 'Emergency Food Security Programme', 'code' => 'EFSP-2024',
            'description' => 'Providing emergency food assistance to vulnerable households affected by drought.',
            'donor' => 'USAID', 'start_date' => '2024-01-01', 'end_date' => '2025-12-31',
            'budget' => 2500000.00, 'currency' => 'USD', 'status' => 'active',
            'country_id' => $zimbabwe, 'created_by' => $pm->id,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $prog2 = DB::table('programmes')->insertGetId([
            'name' => 'WASH & Nutrition Programme', 'code' => 'WNP-2024',
            'description' => 'Improving water, sanitation, hygiene and nutrition outcomes for children under 5.',
            'donor' => 'UNICEF', 'start_date' => '2024-03-01', 'end_date' => '2026-02-28',
            'budget' => 1800000.00, 'currency' => 'USD', 'status' => 'active',
            'country_id' => $zimbabwe, 'created_by' => $pm->id,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $prog3 = DB::table('programmes')->insertGetId([
            'name' => 'Livelihoods Recovery Programme', 'code' => 'LRP-2025',
            'description' => 'Rebuilding livelihoods and economic resilience for drought-affected communities.',
            'donor' => 'EU Humanitarian Aid', 'start_date' => '2025-01-01', 'end_date' => '2026-12-31',
            'budget' => 3200000.00, 'currency' => 'USD', 'status' => 'planning',
            'country_id' => $zimbabwe, 'created_by' => $pm->id,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $proj1 = DB::table('projects')->insertGetId([
            'programme_id' => $prog1, 'name' => 'Harare Urban Food Distribution', 'code' => 'EFSP-HAR-01',
            'description' => 'Monthly food ration distribution in Harare high-density suburbs.',
            'start_date' => '2024-01-15', 'end_date' => '2025-12-31', 'budget' => 800000.00,
            'status' => 'active', 'region_id' => $regions['HAR'], 'district_id' => $districts['HAR-01'],
            'created_by' => $pm->id, 'created_at' => now(), 'updated_at' => now(),
        ]);

        $proj2 = DB::table('projects')->insertGetId([
            'programme_id' => $prog1, 'name' => 'Manicaland Emergency Response', 'code' => 'EFSP-MAN-01',
            'description' => 'Emergency food distribution in drought-affected Manicaland villages.',
            'start_date' => '2024-02-01', 'end_date' => '2025-06-30', 'budget' => 650000.00,
            'status' => 'active', 'region_id' => $regions['MAN'], 'district_id' => $districts['MAN-01'],
            'created_by' => $pm->id, 'created_at' => now(), 'updated_at' => now(),
        ]);

        $proj3 = DB::table('projects')->insertGetId([
            'programme_id' => $prog2, 'name' => 'Child Nutrition Harare', 'code' => 'WNP-HAR-01',
            'description' => 'Supplementary feeding for malnourished children in Harare.',
            'start_date' => '2024-03-15', 'end_date' => '2026-02-28', 'budget' => 600000.00,
            'status' => 'active', 'region_id' => $regions['HAR'], 'district_id' => $districts['HAR-02'],
            'created_by' => $pm->id, 'created_at' => now(), 'updated_at' => now(),
        ]);

        $proj4 = DB::table('projects')->insertGetId([
            'programme_id' => $prog2, 'name' => 'Bulawayo WASH Project', 'code' => 'WNP-BUL-01',
            'description' => 'WASH infrastructure and hygiene promotion in Bulawayo.',
            'start_date' => '2024-04-01', 'end_date' => '2025-12-31', 'budget' => 450000.00,
            'status' => 'active', 'region_id' => $regions['MAS'], 'district_id' => $districts['MAS-01'],
            'created_by' => $pm->id, 'created_at' => now(), 'updated_at' => now(),
        ]);

        // Distribution Sites
        $site1 = DB::table('distribution_sites')->insertGetId([
            'name' => 'Mbare Community Centre', 'code' => 'DS-HAR-01',
            'district_id' => $districts['HAR-01'], 'ward_id' => $wards['Ward 1 - Mbare'],
            'address' => 'Corner Remembrance Drive, Mbare, Harare', 'capacity' => 500, 'is_active' => true,
            'latitude' => -17.8610, 'longitude' => 31.0253, 'created_at' => now(), 'updated_at' => now(),
        ]);

        $site2 = DB::table('distribution_sites')->insertGetId([
            'name' => 'Zengeza Stadium', 'code' => 'DS-CHI-01',
            'district_id' => $districts['HAR-02'], 'ward_id' => $wards['Ward 1 - Zengeza'],
            'address' => 'Zengeza 1, Chitungwiza', 'capacity' => 800, 'is_active' => true,
            'latitude' => -18.0127, 'longitude' => 31.0756, 'created_at' => now(), 'updated_at' => now(),
        ]);

        $site3 = DB::table('distribution_sites')->insertGetId([
            'name' => 'Sakubva Open Ground', 'code' => 'DS-MUT-01',
            'district_id' => $districts['MAN-01'], 'ward_id' => $wards['Ward 1 - Sakubva'],
            'address' => 'Sakubva, Mutare', 'capacity' => 600, 'is_active' => true,
            'latitude' => -18.9706, 'longitude' => 32.6500, 'created_at' => now(), 'updated_at' => now(),
        ]);

        $site4 = DB::table('distribution_sites')->insertGetId([
            'name' => 'Nkulumane Clinic Grounds', 'code' => 'DS-BUL-01',
            'district_id' => $districts['MAS-01'], 'ward_id' => $wards['Ward 2 - Nkulumane'],
            'address' => 'Nkulumane, Bulawayo', 'capacity' => 400, 'is_active' => true,
            'latitude' => -20.1500, 'longitude' => 28.5833, 'created_at' => now(), 'updated_at' => now(),
        ]);

        // ── Commodity Categories & Commodities ─────────────────────────────────
        $catFood = DB::table('commodity_categories')->insertGetId([
            'name' => 'Food Commodities', 'code' => 'FOOD', 'type' => 'food',
            'description' => 'Core food aid commodities', 'created_at' => now(), 'updated_at' => now(),
        ]);
        $catNFI = DB::table('commodity_categories')->insertGetId([
            'name' => 'Non-Food Items', 'code' => 'NFI', 'type' => 'non_food',
            'description' => 'Hygiene and household items', 'created_at' => now(), 'updated_at' => now(),
        ]);
        $catMed = DB::table('commodity_categories')->insertGetId([
            'name' => 'Medical Supplies', 'code' => 'MED', 'type' => 'medical',
            'description' => 'Basic medical and nutrition supplements', 'created_at' => now(), 'updated_at' => now(),
        ]);

        $commodities = [];
        $commodityData = [
            ['cat' => $catFood, 'name' => 'Maize Meal',            'code' => 'MM-01',  'unit' => 'kg',   'cost' => 0.45, 'ration' => 15.0],
            ['cat' => $catFood, 'name' => 'Cooking Oil',           'code' => 'CO-01',  'unit' => 'litre','cost' => 1.80, 'ration' => 0.9],
            ['cat' => $catFood, 'name' => 'Dried Beans',           'code' => 'DB-01',  'unit' => 'kg',   'cost' => 1.20, 'ration' => 3.0],
            ['cat' => $catFood, 'name' => 'Sugar',                 'code' => 'SU-01',  'unit' => 'kg',   'cost' => 0.90, 'ration' => 1.5],
            ['cat' => $catFood, 'name' => 'Salt',                  'code' => 'SA-01',  'unit' => 'kg',   'cost' => 0.25, 'ration' => 0.5],
            ['cat' => $catFood, 'name' => 'Fortified Blended Food','code' => 'FBF-01', 'unit' => 'kg',   'cost' => 1.10, 'ration' => 5.0],
            ['cat' => $catNFI,  'name' => 'Laundry Soap',          'code' => 'LS-01',  'unit' => 'bar',  'cost' => 0.35, 'ration' => 4.0],
            ['cat' => $catNFI,  'name' => 'Blanket',               'code' => 'BL-01',  'unit' => 'piece','cost' => 8.50, 'ration' => 2.0],
            ['cat' => $catMed,  'name' => 'ORS Sachets',           'code' => 'ORS-01', 'unit' => 'sachet','cost' => 0.15,'ration' => 10.0],
            ['cat' => $catMed,  'name' => 'Plumpy\'Nut',           'code' => 'PN-01',  'unit' => 'sachet','cost' => 0.55,'ration' => 14.0],
        ];
        foreach ($commodityData as $c) {
            $commodities[$c['code']] = DB::table('commodities')->insertGetId([
                'category_id' => $c['cat'], 'name' => $c['name'], 'code' => $c['code'],
                'unit_of_measure' => $c['unit'], 'unit_cost' => $c['cost'],
                'unit_ration_per_person' => $c['ration'], 'monthly_ration_per_person' => $c['ration'],
                'currency' => 'USD', 'is_active' => true,
                'created_at' => now(), 'updated_at' => now(),
            ]);
        }

        // ── Warehouses ─────────────────────────────────────────────────────────
        $wh1 = DB::table('warehouses')->insertGetId([
            'name' => 'Harare Central Warehouse', 'code' => 'WH-HAR-01',
            'district_id' => $districts['HAR-01'], 'managed_by' => $wh->id,
            'address' => '15 Industrial Road, Workington, Harare',
            'capacity_cbm' => 8000.00, 'is_active' => true,
            'latitude' => -17.8500, 'longitude' => 30.9833,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $wh2 = DB::table('warehouses')->insertGetId([
            'name' => 'Mutare Regional Depot', 'code' => 'WH-MUT-01',
            'district_id' => $districts['MAN-01'], 'managed_by' => $wh->id,
            'address' => '8 Border Road, Mutare', 'capacity_cbm' => 3500.00, 'is_active' => true,
            'latitude' => -18.9706, 'longitude' => 32.6500,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $wh3 = DB::table('warehouses')->insertGetId([
            'name' => 'Bulawayo South Store', 'code' => 'WH-BUL-01',
            'district_id' => $districts['MAS-01'],
            'address' => '22 Lobengula Street, Bulawayo', 'capacity_cbm' => 4500.00, 'is_active' => true,
            'latitude' => -20.1500, 'longitude' => 28.5833,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        // ── Inventory ──────────────────────────────────────────────────────────
        $inventoryMap = [];
        $stockData = [
            // [warehouse, commodity_code, received, available, distributed, damaged, reorder, batch, expiry, status]
            [$wh1, 'MM-01',  45000, 38000, 6500, 500,  5000, 'BTH-MM-2401', '2025-12-31', 'good'],
            [$wh1, 'CO-01',   8000,  6200, 1700, 100,   800, 'BTH-CO-2401', '2025-09-30', 'good'],
            [$wh1, 'DB-01',  12000,  9500, 2300, 200,  1200, 'BTH-DB-2401', '2025-11-30', 'good'],
            [$wh1, 'SU-01',   5000,  3800, 1100, 100,   500, 'BTH-SU-2401', '2026-06-30', 'good'],
            [$wh1, 'SA-01',   2000,  1600,  380,  20,   200, 'BTH-SA-2401', '2027-01-01', 'good'],
            [$wh1, 'LS-01',   6000,  4200, 1700, 100,   600, 'BTH-LS-2401', '2026-03-31', 'good'],
            [$wh1, 'BL-01',   1500,   800,  680,  20,   150, 'BTH-BL-2401', null,         'good'],
            [$wh1, 'FBF-01',  3000,  2100,  850,  50,   300, 'BTH-FBF-2401','2025-05-15', 'near_expiry'],
            [$wh1, 'PN-01',   2000,   350, 1600,  50,   400, 'BTH-PN-2401', '2025-03-01', 'near_expiry'],
            [$wh2, 'MM-01',  20000, 16000, 3800, 200,  2000, 'BTH-MM-2402', '2025-12-31', 'good'],
            [$wh2, 'CO-01',   3500,  2700,  780,  20,   350, 'BTH-CO-2402', '2025-08-31', 'good'],
            [$wh2, 'DB-01',   5000,  3900, 1050,  50,   500, 'BTH-DB-2402', '2025-10-31', 'good'],
            [$wh2, 'LS-01',   2000,  1300,  680,  20,   200, 'BTH-LS-2402', '2026-01-31', 'good'],
            [$wh3, 'MM-01',  15000,  9800, 4900, 300,  1500, 'BTH-MM-2403', '2025-12-31', 'good'],
            [$wh3, 'CO-01',   2500,  1600,  860,  40,   250, 'BTH-CO-2403', '2025-07-31', 'good'],
            [$wh3, 'BL-01',    800,   380,  400,  20,    80, 'BTH-BL-2403', null,         'good'],
            [$wh3, 'SA-01',    800,   120,  670,  10,   100, 'BTH-SA-2403', '2027-01-01', 'good'],
        ];
        foreach ($stockData as $s) {
            $id = DB::table('inventory')->insertGetId([
                'warehouse_id' => $s[0], 'commodity_id' => $commodities[$s[1]],
                'batch_number' => $s[7], 'expiry_date' => $s[8],
                'quantity_received' => $s[2], 'quantity_available' => $s[3],
                'quantity_distributed' => $s[4], 'quantity_damaged' => $s[5],
                'quantity_reserved' => 0, 'quantity_expired' => 0, 'quantity_lost' => 0,
                'reorder_level' => $s[6], 'status' => $s[9],
                'created_at' => now(), 'updated_at' => now(),
            ]);
            $inventoryMap[$s[0] . '-' . $s[1]] = $id;
        }

        // ── Suppliers ──────────────────────────────────────────────────────────
        $sup1 = DB::table('suppliers')->insertGetId([
            'name' => 'AgriSupply Zimbabwe Ltd', 'code' => 'SUP-001',
            'contact_person' => 'James Chikowore', 'phone' => '+263-4-700-234',
            'email' => 'sales@agrisupply.co.zw', 'address' => '45 Borrowdale Road, Harare',
            'tax_number' => 'ZW-TAX-123456', 'status' => 'active',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $sup2 = DB::table('suppliers')->insertGetId([
            'name' => 'Grain Marketing Board', 'code' => 'SUP-002',
            'contact_person' => 'Patricia Mhundwa', 'phone' => '+263-4-890-456',
            'email' => 'procurement@gmb.co.zw', 'address' => '1 Borrowdale Road, Harare',
            'tax_number' => 'ZW-TAX-789012', 'status' => 'active',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        $sup3 = DB::table('suppliers')->insertGetId([
            'name' => 'Southern Cross Trading', 'code' => 'SUP-003',
            'contact_person' => 'Michael Ncube', 'phone' => '+263-9-654-321',
            'email' => 'info@southerncross.co.zw', 'address' => '12 Fort Street, Bulawayo',
            'tax_number' => 'ZW-TAX-345678', 'status' => 'active',
            'created_at' => now(), 'updated_at' => now(),
        ]);

        // ── Households & Beneficiaries ─────────────────────────────────────────
        $householdData = [
            ['num' => 'HH-00001', 'head' => 'Tendai Moyo',       'gender' => 'male',   'members' => 6, 'district' => 'HAR-01', 'ward' => 'Ward 1 - Mbare',      'vuln' => 7.5],
            ['num' => 'HH-00002', 'head' => 'Chipo Zimba',       'gender' => 'female', 'members' => 4, 'district' => 'HAR-01', 'ward' => 'Ward 2 - Glen Norah',  'vuln' => 8.2],
            ['num' => 'HH-00003', 'head' => 'Farai Mutasa',      'gender' => 'male',   'members' => 7, 'district' => 'HAR-01', 'ward' => 'Ward 3 - Highfield',   'vuln' => 6.1],
            ['num' => 'HH-00004', 'head' => 'Grace Ncube',       'gender' => 'female', 'members' => 5, 'district' => 'HAR-01', 'ward' => 'Ward 1 - Mbare',      'vuln' => 9.0],
            ['num' => 'HH-00005', 'head' => 'Solomon Dube',      'gender' => 'male',   'members' => 8, 'district' => 'HAR-02', 'ward' => 'Ward 1 - Zengeza',    'vuln' => 5.5],
            ['num' => 'HH-00006', 'head' => 'Rudo Chirwa',       'gender' => 'female', 'members' => 3, 'district' => 'HAR-02', 'ward' => 'Ward 2 - St Mary\'s', 'vuln' => 7.8],
            ['num' => 'HH-00007', 'head' => 'Patrick Zvobgo',    'gender' => 'male',   'members' => 6, 'district' => 'MAN-01', 'ward' => 'Ward 1 - Sakubva',    'vuln' => 8.5],
            ['num' => 'HH-00008', 'head' => 'Mercy Maposa',      'gender' => 'female', 'members' => 5, 'district' => 'MAN-01', 'ward' => 'Ward 2 - Dangamvura', 'vuln' => 7.2],
            ['num' => 'HH-00009', 'head' => 'Innocent Banda',    'gender' => 'male',   'members' => 9, 'district' => 'MAN-02', 'ward' => 'Ward 1 - Chipinge Town','vuln' => 9.3],
            ['num' => 'HH-00010', 'head' => 'Florence Ndlovu',   'gender' => 'female', 'members' => 4, 'district' => 'MAS-01', 'ward' => 'Ward 1 - Makokoba',   'vuln' => 6.8],
            ['num' => 'HH-00011', 'head' => 'Abraham Sibanda',   'gender' => 'male',   'members' => 7, 'district' => 'MAS-01', 'ward' => 'Ward 2 - Nkulumane',  'vuln' => 7.0],
            ['num' => 'HH-00012', 'head' => 'Nomsa Mthembu',     'gender' => 'female', 'members' => 5, 'district' => 'MAS-01', 'ward' => 'Ward 1 - Makokoba',   'vuln' => 8.8],
            ['num' => 'HH-00013', 'head' => 'Charles Mwenye',    'gender' => 'male',   'members' => 6, 'district' => 'MID-01', 'ward' => 'Ward 1 - Gweru CBD',  'vuln' => 5.9],
            ['num' => 'HH-00014', 'head' => 'Beatrice Chikwanda', 'gender' => 'female','members' => 4, 'district' => 'MSE-01', 'ward' => 'Ward 1 - Marondera',  'vuln' => 7.4],
            ['num' => 'HH-00015', 'head' => 'Elias Sithole',     'gender' => 'male',   'members' => 10,'district' => 'MAS-02', 'ward' => 'Ward 1 - Gweru CBD',  'vuln' => 9.8],
        ];

        $households = [];
        foreach ($householdData as $h) {
            $wardKey = $h['ward'];
            $wardId = $wards[$wardKey] ?? null;
            $households[$h['num']] = DB::table('households')->insertGetId([
                'household_number' => $h['num'], 'head_name' => $h['head'],
                'head_gender' => $h['gender'], 'total_members' => $h['members'],
                'male_members' => (int)floor($h['members'] / 2),
                'female_members' => (int)ceil($h['members'] / 2),
                'children_under5' => rand(0, 2), 'children_5_17' => rand(0, 3),
                'elderly_60plus' => rand(0, 1), 'disabled_members' => rand(0, 1),
                'pregnant_lactating' => rand(0, 1),
                'vulnerability_score' => $h['vuln'],
                'district_id' => $districts[$h['district']], 'ward_id' => $wardId,
                'status' => 'active', 'registered_by' => $admin->id,
                'created_at' => now(), 'updated_at' => now(),
            ]);
        }

        $beneficiaryData = [
            ['hh' => 'HH-00001', 'first' => 'Tendai',    'last' => 'Moyo',     'gender' => 'male',   'dob' => '1985-03-15', 'head' => true,  'preg' => false, 'maln' => false, 'dis' => false],
            ['hh' => 'HH-00001', 'first' => 'Sekai',     'last' => 'Moyo',     'gender' => 'female', 'dob' => '1988-07-22', 'head' => false, 'preg' => true,  'maln' => false, 'dis' => false],
            ['hh' => 'HH-00001', 'first' => 'Tinashe',   'last' => 'Moyo',     'gender' => 'male',   'dob' => '2010-01-05', 'head' => false, 'preg' => false, 'maln' => true,  'dis' => false],
            ['hh' => 'HH-00002', 'first' => 'Chipo',     'last' => 'Zimba',    'gender' => 'female', 'dob' => '1979-11-30', 'head' => true,  'preg' => false, 'maln' => false, 'dis' => true],
            ['hh' => 'HH-00002', 'first' => 'Taurai',    'last' => 'Zimba',    'gender' => 'male',   'dob' => '2015-06-18', 'head' => false, 'preg' => false, 'maln' => true,  'dis' => false],
            ['hh' => 'HH-00003', 'first' => 'Farai',     'last' => 'Mutasa',   'gender' => 'male',   'dob' => '1972-08-10', 'head' => true,  'preg' => false, 'maln' => false, 'dis' => false],
            ['hh' => 'HH-00003', 'first' => 'Rutendo',   'last' => 'Mutasa',   'gender' => 'female', 'dob' => '1994-04-25', 'head' => false, 'preg' => false, 'maln' => false, 'dis' => false],
            ['hh' => 'HH-00004', 'first' => 'Grace',     'last' => 'Ncube',    'gender' => 'female', 'dob' => '1965-12-02', 'head' => true,  'preg' => false, 'maln' => false, 'dis' => false],
            ['hh' => 'HH-00005', 'first' => 'Solomon',   'last' => 'Dube',     'gender' => 'male',   'dob' => '1980-02-14', 'head' => true,  'preg' => false, 'maln' => false, 'dis' => false],
            ['hh' => 'HH-00005', 'first' => 'Ndaizivei', 'last' => 'Dube',     'gender' => 'female', 'dob' => '1983-09-07', 'head' => false, 'preg' => true,  'maln' => false, 'dis' => false],
            ['hh' => 'HH-00006', 'first' => 'Rudo',      'last' => 'Chirwa',   'gender' => 'female', 'dob' => '1991-05-19', 'head' => true,  'preg' => false, 'maln' => false, 'dis' => false],
            ['hh' => 'HH-00007', 'first' => 'Patrick',   'last' => 'Zvobgo',   'gender' => 'male',   'dob' => '1968-07-04', 'head' => true,  'preg' => false, 'maln' => false, 'dis' => true],
            ['hh' => 'HH-00007', 'first' => 'Nyaradzo',  'last' => 'Zvobgo',   'gender' => 'female', 'dob' => '1973-11-15', 'head' => false, 'preg' => false, 'maln' => false, 'dis' => false],
            ['hh' => 'HH-00008', 'first' => 'Mercy',     'last' => 'Maposa',   'gender' => 'female', 'dob' => '1977-03-28', 'head' => true,  'preg' => true,  'maln' => false, 'dis' => false],
            ['hh' => 'HH-00009', 'first' => 'Innocent',  'last' => 'Banda',    'gender' => 'male',   'dob' => '1960-06-11', 'head' => true,  'preg' => false, 'maln' => false, 'dis' => false],
            ['hh' => 'HH-00009', 'first' => 'Tsitsi',    'last' => 'Banda',    'gender' => 'female', 'dob' => '1964-10-23', 'head' => false, 'preg' => false, 'maln' => false, 'dis' => false],
            ['hh' => 'HH-00009', 'first' => 'Takunda',   'last' => 'Banda',    'gender' => 'male',   'dob' => '2018-02-07', 'head' => false, 'preg' => false, 'maln' => true,  'dis' => false],
            ['hh' => 'HH-00010', 'first' => 'Florence',  'last' => 'Ndlovu',   'gender' => 'female', 'dob' => '1975-08-30', 'head' => true,  'preg' => false, 'maln' => false, 'dis' => false],
            ['hh' => 'HH-00011', 'first' => 'Abraham',   'last' => 'Sibanda',  'gender' => 'male',   'dob' => '1969-04-17', 'head' => true,  'preg' => false, 'maln' => false, 'dis' => false],
            ['hh' => 'HH-00011', 'first' => 'Siphiwe',   'last' => 'Sibanda',  'gender' => 'female', 'dob' => '2000-12-01', 'head' => false, 'preg' => false, 'maln' => false, 'dis' => false],
            ['hh' => 'HH-00012', 'first' => 'Nomsa',     'last' => 'Mthembu',  'gender' => 'female', 'dob' => '1982-07-14', 'head' => true,  'preg' => false, 'maln' => false, 'dis' => false],
            ['hh' => 'HH-00013', 'first' => 'Charles',   'last' => 'Mwenye',   'gender' => 'male',   'dob' => '1974-09-05', 'head' => true,  'preg' => false, 'maln' => false, 'dis' => false],
            ['hh' => 'HH-00014', 'first' => 'Beatrice',  'last' => 'Chikwanda','gender' => 'female', 'dob' => '1987-01-20', 'head' => true,  'preg' => true,  'maln' => false, 'dis' => false],
            ['hh' => 'HH-00015', 'first' => 'Elias',     'last' => 'Sithole',  'gender' => 'male',   'dob' => '1955-03-08', 'head' => true,  'preg' => false, 'maln' => false, 'dis' => true],
            ['hh' => 'HH-00015', 'first' => 'Lindiwe',   'last' => 'Sithole',  'gender' => 'female', 'dob' => '1960-11-25', 'head' => false, 'preg' => false, 'maln' => false, 'dis' => false],
        ];

        $beneficiaries = [];
        foreach ($beneficiaryData as $i => $b) {
            $num = 'BEN-' . str_pad($i + 1, 6, '0', STR_PAD_LEFT);
            $id = DB::table('beneficiaries')->insertGetId([
                'beneficiary_number' => $num, 'household_id' => $households[$b['hh']],
                'first_name' => $b['first'], 'last_name' => $b['last'],
                'gender' => $b['gender'], 'date_of_birth' => $b['dob'],
                'is_household_head' => $b['head'], 'is_pregnant' => $b['preg'],
                'is_malnourished' => $b['maln'], 'is_disabled' => $b['dis'],
                'status' => 'active', 'qr_code' => 'QR-' . strtoupper(Str::random(10)),
                'registered_by' => $admin->id, 'registered_at' => now(),
                'created_at' => now(), 'updated_at' => now(),
            ]);
            $beneficiaries[$num] = ['id' => $id, 'hh' => $b['hh']];
        }

        // ── Distributions ──────────────────────────────────────────────────────
        $invHar_MM  = $inventoryMap[$wh1 . '-MM-01'];
        $invHar_CO  = $inventoryMap[$wh1 . '-CO-01'];
        $invHar_DB  = $inventoryMap[$wh1 . '-DB-01'];
        $invHar_LS  = $inventoryMap[$wh1 . '-LS-01'];
        $invMut_MM  = $inventoryMap[$wh2 . '-MM-01'];
        $invMut_CO  = $inventoryMap[$wh2 . '-CO-01'];
        $invBul_MM  = $inventoryMap[$wh3 . '-MM-01'];
        $invBul_CO  = $inventoryMap[$wh3 . '-CO-01'];

        $dist1 = DB::table('distributions')->insertGetId([
            'distribution_number' => 'DIST-2024-001', 'project_id' => $proj1,
            'programme_id' => $prog1, 'distribution_site_id' => $site1,
            'warehouse_id' => $wh1, 'name' => 'Mbare January Food Ration',
            'distribution_date' => '2024-01-20', 'status' => 'completed',
            'mode' => 'standard', 'planned_beneficiaries' => 480, 'actual_beneficiaries' => 462,
            'planned_households' => 96, 'actual_households' => 90,
            'created_by' => $dist->id, 'approved_by' => $pm->id, 'approved_at' => '2024-01-15 10:00:00',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('distribution_items')->insert([
            ['distribution_id' => $dist1, 'commodity_id' => $commodities['MM-01'], 'inventory_id' => $invHar_MM, 'planned_quantity' => 7200, 'actual_quantity' => 6930, 'unit_ration' => 15, 'unit_of_measure' => 'kg', 'created_at' => now(), 'updated_at' => now()],
            ['distribution_id' => $dist1, 'commodity_id' => $commodities['CO-01'], 'inventory_id' => $invHar_CO, 'planned_quantity' => 432,  'actual_quantity' => 416,  'unit_ration' => 0.9,'unit_of_measure' => 'litre','created_at' => now(), 'updated_at' => now()],
            ['distribution_id' => $dist1, 'commodity_id' => $commodities['DB-01'], 'inventory_id' => $invHar_DB, 'planned_quantity' => 1440, 'actual_quantity' => 1386, 'unit_ration' => 3,  'unit_of_measure' => 'kg', 'created_at' => now(), 'updated_at' => now()],
        ]);

        $dist2 = DB::table('distributions')->insertGetId([
            'distribution_number' => 'DIST-2024-002', 'project_id' => $proj2,
            'programme_id' => $prog1, 'distribution_site_id' => $site3,
            'warehouse_id' => $wh2, 'name' => 'Sakubva Emergency Food Response',
            'distribution_date' => '2024-02-10', 'status' => 'completed',
            'mode' => 'standard', 'planned_beneficiaries' => 600, 'actual_beneficiaries' => 591,
            'planned_households' => 120, 'actual_households' => 118,
            'created_by' => $dist->id, 'approved_by' => $pm->id, 'approved_at' => '2024-02-05 09:00:00',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('distribution_items')->insert([
            ['distribution_id' => $dist2, 'commodity_id' => $commodities['MM-01'], 'inventory_id' => $invMut_MM, 'planned_quantity' => 9000, 'actual_quantity' => 8865, 'unit_ration' => 15, 'unit_of_measure' => 'kg', 'created_at' => now(), 'updated_at' => now()],
            ['distribution_id' => $dist2, 'commodity_id' => $commodities['CO-01'], 'inventory_id' => $invMut_CO, 'planned_quantity' => 540,  'actual_quantity' => 532,  'unit_ration' => 0.9,'unit_of_measure' => 'litre','created_at' => now(), 'updated_at' => now()],
        ]);

        $dist3 = DB::table('distributions')->insertGetId([
            'distribution_number' => 'DIST-2024-003', 'project_id' => $proj4,
            'programme_id' => $prog2, 'distribution_site_id' => $site4,
            'warehouse_id' => $wh3, 'name' => 'Bulawayo NFI Distribution',
            'distribution_date' => '2024-03-05', 'status' => 'approved',
            'mode' => 'standard', 'planned_beneficiaries' => 350, 'actual_beneficiaries' => 0,
            'planned_households' => 70, 'actual_households' => 0,
            'created_by' => $dist->id, 'approved_by' => $pm->id, 'approved_at' => '2024-02-28 14:00:00',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('distribution_items')->insert([
            ['distribution_id' => $dist3, 'commodity_id' => $commodities['BL-01'], 'inventory_id' => $inventoryMap[$wh3 . '-BL-01'], 'planned_quantity' => 140, 'actual_quantity' => 0, 'unit_ration' => 2, 'unit_of_measure' => 'piece', 'created_at' => now(), 'updated_at' => now()],
            ['distribution_id' => $dist3, 'commodity_id' => $commodities['LS-01'], 'inventory_id' => $inventoryMap[$wh1 . '-LS-01'], 'planned_quantity' => 280, 'actual_quantity' => 0, 'unit_ration' => 4, 'unit_of_measure' => 'bar',   'created_at' => now(), 'updated_at' => now()],
        ]);

        $dist4 = DB::table('distributions')->insertGetId([
            'distribution_number' => 'DIST-2024-004', 'project_id' => $proj1,
            'programme_id' => $prog1, 'distribution_site_id' => $site2,
            'warehouse_id' => $wh1, 'name' => 'Zengeza March Food Ration',
            'distribution_date' => '2024-03-22', 'status' => 'draft',
            'mode' => 'standard', 'planned_beneficiaries' => 420, 'actual_beneficiaries' => 0,
            'planned_households' => 84, 'actual_households' => 0,
            'created_by' => $dist->id,
            'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('distribution_items')->insert([
            ['distribution_id' => $dist4, 'commodity_id' => $commodities['MM-01'], 'inventory_id' => $invHar_MM, 'planned_quantity' => 6300, 'actual_quantity' => 0, 'unit_ration' => 15, 'unit_of_measure' => 'kg',    'created_at' => now(), 'updated_at' => now()],
            ['distribution_id' => $dist4, 'commodity_id' => $commodities['CO-01'], 'inventory_id' => $invHar_CO, 'planned_quantity' => 378,  'actual_quantity' => 0, 'unit_ration' => 0.9,'unit_of_measure' => 'litre', 'created_at' => now(), 'updated_at' => now()],
            ['distribution_id' => $dist4, 'commodity_id' => $commodities['DB-01'], 'inventory_id' => $invHar_DB, 'planned_quantity' => 1260, 'actual_quantity' => 0, 'unit_ration' => 3,  'unit_of_measure' => 'kg',    'created_at' => now(), 'updated_at' => now()],
        ]);

        $dist5 = DB::table('distributions')->insertGetId([
            'distribution_number' => 'DIST-2024-005', 'project_id' => $proj3,
            'programme_id' => $prog2, 'distribution_site_id' => $site2,
            'warehouse_id' => $wh1, 'name' => 'Chitungwiza Nutrition Supplementation',
            'distribution_date' => '2024-03-28', 'status' => 'in_progress',
            'mode' => 'standard', 'planned_beneficiaries' => 200, 'actual_beneficiaries' => 87,
            'planned_households' => 60, 'actual_households' => 28,
            'created_by' => $dist->id, 'approved_by' => $pm->id, 'approved_at' => '2024-03-20 11:00:00',
            'created_at' => now(), 'updated_at' => now(),
        ]);
        DB::table('distribution_items')->insert([
            ['distribution_id' => $dist5, 'commodity_id' => $commodities['FBF-01'], 'inventory_id' => $inventoryMap[$wh1 . '-FBF-01'], 'planned_quantity' => 1000, 'actual_quantity' => 435, 'unit_ration' => 5, 'unit_of_measure' => 'kg', 'created_at' => now(), 'updated_at' => now()],
            ['distribution_id' => $dist5, 'commodity_id' => $commodities['PN-01'],  'inventory_id' => $inventoryMap[$wh1 . '-PN-01'],  'planned_quantity' => 2800, 'actual_quantity' => 1218,'unit_ration' =>14, 'unit_of_measure' => 'sachet','created_at' => now(), 'updated_at' => now()],
        ]);

        // Some distribution records for the completed distributions
        $benList = array_values($beneficiaries);
        foreach (array_slice($benList, 0, 8) as $i => $ben) {
            DB::table('distribution_records')->insert([
                'distribution_id' => $dist1, 'beneficiary_id' => $ben['id'],
                'household_id' => $households[$ben['hh']],
                'collected_at' => '2024-01-20 0' . ($i + 8) . ':30:00',
                'verification_method' => 'manual', 'is_verified' => true,
                'rations_received' => json_encode(['maize_meal' => 15, 'cooking_oil' => 0.9, 'beans' => 3]),
                'recorded_by' => $dist->id,
                'created_at' => now(), 'updated_at' => now(),
            ]);
        }

        // ── Procurement Orders ─────────────────────────────────────────────────
        $po1 = DB::table('procurement_orders')->insertGetId([
            'po_number' => 'PO-2024-001', 'programme_id' => $prog1, 'project_id' => $proj1,
            'supplier_id' => $sup2, 'warehouse_id' => $wh1,
            'title' => 'Q2 Maize Meal Procurement', 'currency' => 'USD',
            'description' => '50,000 kg of maize meal for Q2 distributions in Harare.',
            'total_amount' => 22500.00, 'required_date' => '2024-04-01',
            'status' => 'approved', 'priority' => 'high',
            'created_by' => $po->id, 'approved_by' => $pm->id, 'approved_at' => now()->subDays(5),
            'created_at' => now()->subDays(10), 'updated_at' => now(),
        ]);
        $po2 = DB::table('procurement_orders')->insertGetId([
            'po_number' => 'PO-2024-002', 'programme_id' => $prog1, 'project_id' => $proj2,
            'supplier_id' => $sup1, 'warehouse_id' => $wh2,
            'title' => 'Cooking Oil Supply – Manicaland', 'currency' => 'USD',
            'description' => '3,000 litres of cooking oil for Manicaland emergency response.',
            'total_amount' => 5400.00, 'required_date' => '2024-04-15',
            'status' => 'submitted', 'priority' => 'normal',
            'created_by' => $po->id,
            'created_at' => now()->subDays(4), 'updated_at' => now(),
        ]);
        DB::table('procurement_orders')->insertGetId([
            'po_number' => 'PO-2024-003', 'programme_id' => $prog2, 'project_id' => $proj4,
            'supplier_id' => $sup3, 'warehouse_id' => $wh3,
            'title' => 'Blankets & NFI – Bulawayo Winter', 'currency' => 'USD',
            'description' => '500 blankets and hygiene kits for Bulawayo winter distribution.',
            'total_amount' => 4250.00, 'required_date' => '2024-05-01',
            'status' => 'draft', 'priority' => 'normal',
            'created_by' => $po->id,
            'created_at' => now()->subDays(2), 'updated_at' => now(),
        ]);
        $po4 = DB::table('procurement_orders')->insertGetId([
            'po_number' => 'PO-2024-004', 'programme_id' => $prog1, 'project_id' => $proj1,
            'supplier_id' => $sup2, 'warehouse_id' => $wh1,
            'title' => 'Salt & Sugar Restock – Harare', 'currency' => 'USD',
            'description' => 'Restocking salt and sugar at the Harare Central Warehouse.',
            'total_amount' => 3375.00, 'required_date' => '2024-04-20',
            'status' => 'received', 'priority' => 'low',
            'created_by' => $po->id, 'approved_by' => $pm->id,
            'approved_at' => now()->subDays(15), 'delivery_date' => now()->subDays(3),
            'created_at' => now()->subDays(20), 'updated_at' => now(),
        ]);
        $po5 = DB::table('procurement_orders')->insertGetId([
            'po_number' => 'PO-2024-005', 'programme_id' => $prog2, 'project_id' => $proj3,
            'supplier_id' => $sup1, 'warehouse_id' => $wh1,
            'title' => 'Fortified Blended Food – Nutrition Programme', 'currency' => 'USD',
            'description' => "Plumpy'Nut and fortified blended food for child nutrition programme.",
            'total_amount' => 8470.00, 'required_date' => '2024-03-30',
            'status' => 'submitted', 'priority' => 'emergency',
            'created_by' => $po->id,
            'created_at' => now()->subDays(1), 'updated_at' => now(),
        ]);

        DB::table('procurement_items')->insert([
            ['procurement_order_id' => $po1, 'commodity_id' => $commodities['MM-01'], 'quantity_ordered' => 50000, 'quantity_received' => 0, 'unit_price' => 0.45, 'total_price' => 22500, 'unit_of_measure' => 'kg', 'created_at' => now(), 'updated_at' => now()],
            ['procurement_order_id' => $po2, 'commodity_id' => $commodities['CO-01'], 'quantity_ordered' => 3000,  'quantity_received' => 0, 'unit_price' => 1.80, 'total_price' => 5400,  'unit_of_measure' => 'litre','created_at' => now(), 'updated_at' => now()],
            ['procurement_order_id' => $po4, 'commodity_id' => $commodities['SA-01'], 'quantity_ordered' => 3000,  'quantity_received' => 3000, 'unit_price' => 0.25, 'total_price' => 750, 'unit_of_measure' => 'kg', 'created_at' => now(), 'updated_at' => now()],
            ['procurement_order_id' => $po4, 'commodity_id' => $commodities['SU-01'], 'quantity_ordered' => 3000,  'quantity_received' => 3000, 'unit_price' => 0.875,'total_price' => 2625,'unit_of_measure' => 'kg', 'created_at' => now(), 'updated_at' => now()],
            ['procurement_order_id' => $po5, 'commodity_id' => $commodities['FBF-01'],'quantity_ordered' => 4000,  'quantity_received' => 0, 'unit_price' => 1.10, 'total_price' => 4400, 'unit_of_measure' => 'kg', 'created_at' => now(), 'updated_at' => now()],
            ['procurement_order_id' => $po5, 'commodity_id' => $commodities['PN-01'], 'quantity_ordered' => 7400,  'quantity_received' => 0, 'unit_price' => 0.55, 'total_price' => 4070, 'unit_of_measure' => 'sachet','created_at' => now(), 'updated_at' => now()],
        ]);

        // ── Beneficiary–Programme enrolments ──────────────────────────────────
        foreach (array_slice(array_values($beneficiaries), 0, 15) as $ben) {
            DB::table('beneficiary_programme')->insert([
                'beneficiary_id' => $ben['id'], 'programme_id' => $prog1, 'project_id' => $proj1,
                'enrollment_date' => '2024-01-10', 'status' => 'active',
                'created_at' => now(), 'updated_at' => now(),
            ]);
        }
        foreach (array_slice(array_values($beneficiaries), 5, 10) as $ben) {
            DB::table('beneficiary_programme')->insert([
                'beneficiary_id' => $ben['id'], 'programme_id' => $prog2, 'project_id' => $proj3,
                'enrollment_date' => '2024-03-01', 'status' => 'active',
                'created_at' => now(), 'updated_at' => now(),
            ]);
        }
    }
}
