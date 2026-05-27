<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Country;
use App\Models\District;
use App\Models\Region;
use App\Models\Ward;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GeographyController extends Controller
{
    public function countries(Request $request): JsonResponse
    {
        return response()->json(Country::orderBy('name')->get());
    }

    public function regions(Request $request): JsonResponse
    {
        $query = Region::with('country')
            ->when($request->country_id, fn($q, $c) => $q->where('country_id', $c));

        return response()->json($query->orderBy('name')->get());
    }

    public function districts(Request $request): JsonResponse
    {
        $query = District::with('region')
            ->when($request->region_id, fn($q, $r) => $q->where('region_id', $r))
            ->when($request->active !== null, fn($q) => $q->where('is_active', filter_var($request->active, FILTER_VALIDATE_BOOLEAN)));

        return response()->json($query->orderBy('name')->get());
    }

    public function wards(Request $request): JsonResponse
    {
        $query = Ward::with('district')
            ->when($request->district_id, fn($q, $d) => $q->where('district_id', $d));

        return response()->json($query->orderBy('name')->get());
    }
}
