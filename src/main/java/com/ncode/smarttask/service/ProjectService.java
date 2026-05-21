package com.ncode.smarttask.service;

import com.ncode.smarttask.dto.CreateProjectRequest;
import com.ncode.smarttask.dto.UpdateProjectRequest;
import com.ncode.smarttask.entity.Project;
import com.ncode.smarttask.entity.User;
import com.ncode.smarttask.enums.ProjectStatus;
import com.ncode.smarttask.repository.ProjectRepository;
import com.ncode.smarttask.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ProjectService {

    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;

    public Project createProject(CreateProjectRequest request) {
        // Validate manager exists
        User manager = userRepository.findById(request.getManagerId())
                .orElseThrow(() -> new RuntimeException("Manager not found with id: " + request.getManagerId()));

        Project project = Project.builder()
                .name(request.getName())
                .description(request.getDescription())
                .manager(manager)
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .status(ProjectStatus.PLANNING)
                .build();

        return projectRepository.save(project);
    }

    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    public Project getProjectById(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));
    }

    public List<Project> getProjectsByManager(Long managerId) {
        return projectRepository.findByManagerId(managerId);
    }

    public Project updateProject(Long id, UpdateProjectRequest request) {
        Project project = getProjectById(id);

        if (request.getName() != null) {
            project.setName(request.getName());
        }
        if (request.getDescription() != null) {
            project.setDescription(request.getDescription());
        }
        if (request.getStatus() != null) {
            project.setStatus(request.getStatus());
        }
        if (request.getEndDate() != null) {
            project.setEndDate(request.getEndDate());
        }

        return projectRepository.save(project);
    }

    public void deleteProject(Long id) {
        Project project = getProjectById(id);
        projectRepository.delete(project);
    }
}

