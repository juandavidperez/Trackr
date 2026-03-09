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

        // ── Users ──────────────────────────────────────────────
        User admin = createUser("Admin User", "admin@trackr.dev", UserRole.ADMIN);
        User alice = createUser("Alice Developer", "alice@trackr.dev", UserRole.MEMBER);
        User bob = createUser("Bob Designer", "bob@trackr.dev", UserRole.MEMBER);
        User carol = createUser("Carol Martinez", "carol@trackr.dev", UserRole.MEMBER);
        User david = createUser("David Chen", "david@trackr.dev", UserRole.MEMBER);
        User emma = createUser("Emma Wilson", "emma@trackr.dev", UserRole.MEMBER);

        // ── Project 1: Website Redesign (owner: admin) ────────
        Project website = createProject("Website Redesign",
                "Redesign the company website with modern UI/UX. Includes homepage, about page, pricing, and blog.",
                admin, admin, alice, bob, carol);

        createTask(website, "Design homepage mockup", "Create wireframes and high-fidelity mockups for the new homepage",
                TaskStatus.DONE, TaskPriority.HIGH, bob, LocalDate.now().minusDays(5));
        createTask(website, "Design about page", "Create mockups for the about/team page",
                TaskStatus.DONE, TaskPriority.MEDIUM, bob, LocalDate.now().minusDays(2));
        createTask(website, "Implement responsive navbar", "Build a mobile-first responsive navigation bar with Tailwind CSS",
                TaskStatus.IN_PROGRESS, TaskPriority.HIGH, alice, LocalDate.now().plusDays(2));
        createTask(website, "Build hero section", "Implement animated hero section with CTA buttons",
                TaskStatus.IN_PROGRESS, TaskPriority.HIGH, carol, LocalDate.now().plusDays(3));
        createTask(website, "Set up CI/CD pipeline", "Configure GitHub Actions for automated builds and deployments",
                TaskStatus.TODO, TaskPriority.MEDIUM, admin, LocalDate.now().plusDays(7));
        createTask(website, "Write landing page copy", "Draft marketing copy for the hero section and features",
                TaskStatus.TODO, TaskPriority.LOW, null, LocalDate.now().plusDays(14));
        createTask(website, "Implement dark mode toggle", "Add theme switcher with system preference detection",
                TaskStatus.TODO, TaskPriority.LOW, alice, LocalDate.now().plusDays(10));
        createTask(website, "Optimize images and assets", "Compress images, add lazy loading, serve WebP format",
                TaskStatus.TODO, TaskPriority.MEDIUM, carol, LocalDate.now().plusDays(8));
        createTask(website, "SEO audit and meta tags", "Add proper meta tags, Open Graph, structured data",
                TaskStatus.DONE, TaskPriority.MEDIUM, admin, LocalDate.now().minusDays(1));
        createTask(website, "Footer and sitemap", "Design and implement footer with links and auto-generated sitemap",
                TaskStatus.IN_PROGRESS, TaskPriority.LOW, bob, LocalDate.now().plusDays(5));
        // Overdue tasks
        createTask(website, "Fix contact form validation", "Form allows empty submissions, needs client + server validation",
                TaskStatus.TODO, TaskPriority.HIGH, alice, LocalDate.now().minusDays(2));
        createTask(website, "Update privacy policy page", "Legal team provided new text, needs to be formatted and deployed",
                TaskStatus.TODO, TaskPriority.MEDIUM, null, LocalDate.now().minusDays(4));

        // ── Project 2: Mobile App v2 (owner: alice) ───────────
        Project mobile = createProject("Mobile App v2",
                "Build version 2 of the mobile application with new features including offline mode, push notifications, and redesigned UI.",
                alice, alice, bob, david, emma);

        createTask(mobile, "User authentication flow", "Implement login, register, and password reset screens with biometric support",
                TaskStatus.IN_PROGRESS, TaskPriority.HIGH, alice, LocalDate.now().plusDays(5));
        createTask(mobile, "Push notification service", "Integrate Firebase Cloud Messaging for push notifications",
                TaskStatus.TODO, TaskPriority.MEDIUM, bob, LocalDate.now().plusDays(10));
        createTask(mobile, "Offline mode support", "Add local caching with SQLite and background sync",
                TaskStatus.TODO, TaskPriority.LOW, david, LocalDate.now().plusDays(21));
        createTask(mobile, "Redesign settings screen", "New settings UI with grouped sections and search",
                TaskStatus.DONE, TaskPriority.MEDIUM, emma, LocalDate.now().minusDays(3));
        createTask(mobile, "Implement pull-to-refresh", "Add pull-to-refresh gesture on all list views",
                TaskStatus.DONE, TaskPriority.LOW, david, LocalDate.now().minusDays(6));
        createTask(mobile, "App performance profiling", "Profile startup time, memory usage, and optimize bottlenecks",
                TaskStatus.IN_PROGRESS, TaskPriority.HIGH, david, LocalDate.now().plusDays(4));
        createTask(mobile, "Migrate to Material 3", "Update UI components to Material Design 3 guidelines",
                TaskStatus.TODO, TaskPriority.MEDIUM, emma, LocalDate.now().plusDays(12));
        createTask(mobile, "Add dark theme", "Implement dark/light theme with system detection",
                TaskStatus.TODO, TaskPriority.LOW, bob, LocalDate.now().plusDays(15));
        createTask(mobile, "Write unit tests for auth", "Cover login, register, token refresh, and logout flows",
                TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM, alice, LocalDate.now().plusDays(6));
        // Overdue
        createTask(mobile, "Fix crash on Android 12", "App crashes on launch for some Android 12 devices due to splash screen API",
                TaskStatus.TODO, TaskPriority.HIGH, david, LocalDate.now().minusDays(3));

        // ── Project 3: API Platform (owner: admin) ────────────
        Project api = createProject("API Platform",
                "Build a developer-facing REST API platform with documentation, rate limiting, API keys, and usage analytics.",
                admin, admin, alice, david);

        createTask(api, "Design API schema", "Define OpenAPI 3.0 spec for all endpoints",
                TaskStatus.DONE, TaskPriority.HIGH, admin, LocalDate.now().minusDays(10));
        createTask(api, "Implement rate limiting", "Add token bucket rate limiter with Redis backend",
                TaskStatus.DONE, TaskPriority.HIGH, david, LocalDate.now().minusDays(4));
        createTask(api, "API key management", "CRUD for API keys with scopes and expiration",
                TaskStatus.IN_PROGRESS, TaskPriority.HIGH, alice, LocalDate.now().plusDays(3));
        createTask(api, "Usage analytics dashboard", "Track API calls per key, endpoint, and time period",
                TaskStatus.TODO, TaskPriority.MEDIUM, david, LocalDate.now().plusDays(14));
        createTask(api, "Generate SDK (TypeScript)", "Auto-generate TypeScript client from OpenAPI spec",
                TaskStatus.TODO, TaskPriority.LOW, alice, LocalDate.now().plusDays(20));
        createTask(api, "Webhook delivery system", "Implement reliable webhook delivery with retries and logging",
                TaskStatus.TODO, TaskPriority.MEDIUM, admin, LocalDate.now().plusDays(18));
        createTask(api, "Write API documentation", "Create developer guides with examples for each endpoint",
                TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM, admin, LocalDate.now().plusDays(7));
        createTask(api, "Set up staging environment", "Deploy staging instance with separate database",
                TaskStatus.DONE, TaskPriority.MEDIUM, david, LocalDate.now().minusDays(7));

        // ── Project 4: Internal Tools (owner: carol) ──────────
        Project tools = createProject("Internal Tools",
                "Suite of internal tools for the team: admin panel, deployment scripts, monitoring dashboards.",
                carol, carol, emma, bob);

        createTask(tools, "Admin panel - user management", "CRUD interface for managing users, roles, and permissions",
                TaskStatus.IN_PROGRESS, TaskPriority.HIGH, carol, LocalDate.now().plusDays(5));
        createTask(tools, "Deployment automation scripts", "Shell scripts for one-click deploy to staging and production",
                TaskStatus.DONE, TaskPriority.HIGH, carol, LocalDate.now().minusDays(8));
        createTask(tools, "Monitoring dashboard", "Grafana dashboards for server metrics, error rates, and uptime",
                TaskStatus.TODO, TaskPriority.MEDIUM, emma, LocalDate.now().plusDays(10));
        createTask(tools, "Slack bot for alerts", "Bot that sends alerts on deployment failures and high error rates",
                TaskStatus.TODO, TaskPriority.LOW, bob, LocalDate.now().plusDays(16));
        createTask(tools, "Database backup automation", "Scheduled backups with S3 upload and retention policy",
                TaskStatus.DONE, TaskPriority.HIGH, emma, LocalDate.now().minusDays(12));
        createTask(tools, "Log aggregation setup", "Set up ELK stack for centralized logging",
                TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM, emma, LocalDate.now().plusDays(8));
        // Overdue
        createTask(tools, "Fix broken deploy script", "Production deploy script fails on new server config",
                TaskStatus.TODO, TaskPriority.HIGH, carol, LocalDate.now().minusDays(1));

        // ── Project 5: Design System (owner: bob) ─────────────
        Project design = createProject("Design System",
                "Unified component library and design tokens for consistent UI across all products.",
                bob, bob, alice, emma, carol);

        createTask(design, "Define color tokens", "Create semantic color palette with light/dark variants",
                TaskStatus.DONE, TaskPriority.HIGH, bob, LocalDate.now().minusDays(15));
        createTask(design, "Typography scale", "Define type scale, font families, and line heights",
                TaskStatus.DONE, TaskPriority.HIGH, bob, LocalDate.now().minusDays(12));
        createTask(design, "Button component", "Build button variants: primary, secondary, ghost, destructive, sizes",
                TaskStatus.DONE, TaskPriority.HIGH, alice, LocalDate.now().minusDays(8));
        createTask(design, "Input components", "Text input, textarea, select, checkbox, radio, switch",
                TaskStatus.IN_PROGRESS, TaskPriority.HIGH, alice, LocalDate.now().plusDays(4));
        createTask(design, "Modal component", "Reusable modal with configurable header, body, footer",
                TaskStatus.IN_PROGRESS, TaskPriority.MEDIUM, emma, LocalDate.now().plusDays(6));
        createTask(design, "Toast/notification component", "Stackable toast notifications with auto-dismiss",
                TaskStatus.TODO, TaskPriority.MEDIUM, carol, LocalDate.now().plusDays(9));
        createTask(design, "Data table component", "Sortable, filterable table with pagination and row selection",
                TaskStatus.TODO, TaskPriority.MEDIUM, alice, LocalDate.now().plusDays(15));
        createTask(design, "Icon library", "Curate and export icon set as SVG sprites and React components",
                TaskStatus.TODO, TaskPriority.LOW, bob, LocalDate.now().plusDays(20));
        createTask(design, "Storybook setup", "Configure Storybook with all components documented",
                TaskStatus.TODO, TaskPriority.LOW, emma, LocalDate.now().plusDays(25));
        createTask(design, "Accessibility audit", "WCAG 2.1 AA compliance check on all components",
                TaskStatus.TODO, TaskPriority.HIGH, carol, LocalDate.now().plusDays(12));

        log.info("Seed data created: 6 users, 5 projects, 47 tasks");
    }

    private User createUser(String name, String email, UserRole role) {
        User user = new User();
        user.setName(name);
        user.setEmail(email);
        user.setPassword(passwordEncoder.encode("password123"));
        user.setRole(role);
        return userRepository.save(user);
    }

    private Project createProject(String name, String description, User owner, User... members) {
        Project project = new Project();
        project.setName(name);
        project.setDescription(description);
        project.setOwner(owner);
        for (User member : members) {
            project.getMembers().add(member);
        }
        return projectRepository.save(project);
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
