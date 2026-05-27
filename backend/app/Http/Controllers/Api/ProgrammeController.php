<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Programme;
use App\Models\Project;
use App\Services\AuditService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProgrammeController extends Controller
{
    public function __construct(private AuditService $audit) {}

    // ── Programmes ────────────────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $query = Programme::with(['country', 'createdBy'])
            ->when($request->status, fn($q, $s) => $q->where('status', $s))
            ->when($request->country_id, fn($q, $c) => $q->where('country_id', $c))
            ->when($request->search, fn($q, $s) => $q->where(function ($q) use ($s) {
                $q->where('name', 'like', "%$s%")->orWhere('code', 'like', "%$s%");
            }));

        return response()->json($query->orderBy('name')->paginate(25));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'       => 'required|string|max:200',
            'code'       => 'required|string|max:50|unique:programmes,code',
            'description'=> 'nullable|string',
            'donor'      => 'nullable|string|max:200',
            'start_date' => 'required|date',
            'end_date'   => 'required|date|after:start_date',
            'budget'     => 'nullable|numeric|min:0',
            'currency'   => 'required|string|size:3',
            'status'     => 'required|in:active,inactive,completed,suspended',
            'country_id' => 'required|exists:countries,id',
        ]);

        $data['created_by'] = $request->user()->id;
        $programme = Programme::create($data);
        $this->audit->log('programme_created', 'Programme', $programme->id, $data, $request);

        return response()->json($programme->load('country'), 201);
    }

    public function show(Programme $programme): JsonResponse
    {
        return response()->json($programme->load(['country', 'projects', 'createdBy']));
    }

    public function update(Request $request, Programme $programme): JsonResponse
    {
        $data = $request->validate([
            'name'       => 'sometimes|string|max:200',
            'description'=> 'nullable|string',
            'donor'      => 'nullable|string|max:200',
            'end_date'   => 'sometimes|date',
            'budget'     => 'nullable|numeric|min:0',
            'status'     => 'sometimes|in:active,inactive,completed,suspended',
        ]);

        $programme->update($data);
        $this->audit->log('programme_updated', 'Programme', $programme->id, $data, $request);

        return response()->json($programme->fresh());
    }

    public function destroy(Request $request, Programme $programme): JsonResponse
    {
        if ($programme->projects()->exists()) {
            return response()->json(['message' => 'Cannot delete a programme with active projects.'], 422);
        }

        $this->audit->log('programme_deleted', 'Programme', $programme->id, null, $request);
        $programme->delete();

        return response()->json(['message' => 'Programme deleted.']);
    }

    public function projects(Programme $programme): JsonResponse
    {
        return response()->json($programme->projects()->with(['district', 'region'])->get());
    }

    // ── Projects ──────────────────────────────────────────────────────────────

    public function showProject(Project $project): JsonResponse
    {
        return response()->json($project->load(['programme', 'district', 'region', 'createdBy']));
    }

    public function storeProject(Request $request): JsonResponse
    {
        $data = $request->validate([
            'programme_id' => 'required|exists:programmes,id',
            'name'         => 'required|string|max:200',
            'code'         => 'required|string|max:50|unique:projects,code',
            'description'  => 'nullable|string',
            'start_date'   => 'required|date',
            'end_date'     => 'required|date|after:start_date',
            'budget'       => 'nullable|numeric|min:0',
            'status'       => 'required|in:active,inactive,completed,suspended',
            'region_id'    => 'nullable|exists:regions,id',
            'district_id'  => 'nullable|exists:districts,id',
        ]);

        $data['created_by'] = $request->user()->id;
        $project = Project::create($data);
        $this->audit->log('project_created', 'Project', $project->id, $data, $request);

        return response()->json($project->load('programme'), 201);
    }

    public function updateProject(Request $request, Project $project): JsonResponse
    {
        $data = $request->validate([
            'name'        => 'sometimes|string|max:200',
            'description' => 'nullable|string',
            'end_date'    => 'sometimes|date',
            'budget'      => 'nullable|numeric|min:0',
            'status'      => 'sometimes|in:active,inactive,completed,suspended',
        ]);

        $project->update($data);
        $this->audit->log('project_updated', 'Project', $project->id, $data, $request);

        return response()->json($project->fresh());
    }

    public function destroyProject(Request $request, Project $project): JsonResponse
    {
        $this->audit->log('project_deleted', 'Project', $project->id, null, $request);
        $project->delete();

        return response()->json(['message' => 'Project deleted.']);
    }
}
