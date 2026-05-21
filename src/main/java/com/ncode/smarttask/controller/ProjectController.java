package com.ncode.smarttask.controller;

import com.ncode.smarttask.dto.CreateProjectRequest;
import com.ncode.smarttask.dto.UpdateProjectRequest;
import com.ncode.smarttask.entity.Project;
import com.ncode.smarttask.service.ProjectService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    // POST /api/projects
    // Creates a new project and assigns it to a manager
    @PostMapping
    public ResponseEntity<Project> createProject(@RequestBody CreateProjectRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(projectService.createProject(request));
    }

    // GET /api/projects
    // Returns all projects
    @GetMapping
    public ResponseEntity<List<Project>> getAllProjects() {
        return ResponseEntity.ok(projectService.getAllProjects());
    }

    // GET /api/projects/{id}
    // Returns a single project by ID
    @GetMapping("/{id}")
    public ResponseEntity<Project> getProjectById(@PathVariable Long id) {
        return ResponseEntity.ok(projectService.getProjectById(id));
    }

    // GET /api/projects/manager/{managerId}
    // Returns all projects owned by a specific manager
    @GetMapping("/manager/{managerId}")
    public ResponseEntity<List<Project>> getProjectsByManager(@PathVariable Long managerId) {
        return ResponseEntity.ok(projectService.getProjectsByManager(managerId));
    }

    // PUT /api/projects/{id}
    // Updates project details — only non-null fields are changed
    @PutMapping("/{id}")
    public ResponseEntity<Project> updateProject(@PathVariable Long id,
                                                  @RequestBody UpdateProjectRequest request) {
        return ResponseEntity.ok(projectService.updateProject(id, request));
    }

    // DELETE /api/projects/{id}
    // Hard deletes a project (cascades to tasks per entity config)
    @DeleteMapping("/{id}")
    public ResponseEntity<String> deleteProject(@PathVariable Long id) {
        projectService.deleteProject(id);
        return ResponseEntity.ok("Project deleted successfully");
    }
}
