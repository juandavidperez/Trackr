package com.trackr.config;

import com.trackr.model.Project;
import com.trackr.model.Task;
import com.trackr.model.User;
import com.trackr.model.enums.TaskPriority;
import com.trackr.model.enums.TaskStatus;
import com.trackr.model.enums.UserRole;
import com.trackr.repository.ProjectRepository;
import com.trackr.repository.TaskRepository;
import com.trackr.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;

@Component
@Profile("dev")
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepository.count() > 0) {
            log.info("Database already has data, skipping seed");
            return;
        }

        log.info("Seeding development data...");

        // Users
        User admin = new User();
        admin.setName("Admin User");
        admin.setEmail("admin@trackr.dev");
        admin.setPassword(passwordEncoder.encode("password123"));
        admin.setRole(UserRole.ADMIN);
        admin = userRepository.save(admin);

        User alice = new User();
        alice.setName("Alice Developer");
        alice.setEmail("alice@trackr.dev");
        alice.setPassword(passwordEncoder.encode("password123"));
        alice.setRole(UserRole.MEMBER);
        alice = userRepository.save(alice);

        User bob = new User();
        bob.setName("Bob Designer");
        bob.setEmail("bob@trackr.dev");
        bob.setPassword(passwordEncoder.encode("password123"));
        bob.setRole(UserRole.MEMBER);
        bob = userRepository.save(bob);

        // Project 1: Website Redesign
        Project website = new Project();
        website.setName("Website Redesign");
        website.setDescription("Redesign the company website with modern UI/UX");
        website.setOwner(admin);
        website.getMembers().add(admin);
        website.getMembers().add(alice);
        website.getMembers().add(bob);
        website = projectRepository.save(website);

        createTask(website, "Design homepage mockup", "Create wireframes and high-fidelity mockups for the new homepage",
                TaskStatus.DONE, TaskPriority.HIGH, bob, LocalDate.now().minusDays(3));
        createTask(website, "Implement responsive navbar", "Build a mobile-first responsive navigation bar with Tailwind CSS",
                TaskStatus.IN_PROGRESS, TaskPriority.HIGH, alice, LocalDate.now().plusDays(2));
        createTask(website, "Set up CI/CD pipeline", "Configure GitHub Actions for automated builds and deployments",
                TaskStatus.TODO, TaskPriority.MEDIUM, admin, LocalDate.now().plusDays(7));
        createTask(website, "Write landing page copy", "Draft marketing copy for the hero section and features",
                TaskStatus.TODO, TaskPriority.LOW, null, LocalDate.now().plusDays(14));

        // Project 2: Mobile App
        Project mobile = new Project();
        mobile.setName("Mobile App v2");
        mobile.setDescription("Build version 2 of the mobile application with new features");
        mobile.setOwner(alice);
        mobile.getMembers().add(alice);
        mobile.getMembers().add(bob);
        mobile = projectRepository.save(mobile);

        createTask(mobile, "User authentication flow", "Implement login, register, and password reset screens",
                TaskStatus.IN_PROGRESS, TaskPriority.HIGH, alice, LocalDate.now().plusDays(5));
        createTask(mobile, "Push notification service", "Integrate Firebase Cloud Messaging for push notifications",
                TaskStatus.TODO, TaskPriority.MEDIUM, bob, LocalDate.now().plusDays(10));
        createTask(mobile, "Offline mode support", "Add local caching and sync for offline usage",
                TaskStatus.TODO, TaskPriority.LOW, null, LocalDate.now().plusDays(21));

        log.info("Seed data created: 3 users, 2 projects, 7 tasks");
    }

    private void createTask(Project project, String title, String description,
                            TaskStatus status, TaskPriority priority, User assignee, LocalDate dueDate) {
        Task task = new Task();
        task.setTitle(title);
        task.setDescription(description);
        task.setStatus(status);
        task.setPriority(priority);
        task.setAssignee(assignee);
        task.setDueDate(dueDate);
        task.setProject(project);
        taskRepository.save(task);
    }
}
