package com.trackr.config;

import com.trackr.repository.ProjectRepository;
import com.trackr.repository.TaskRepository;
import com.trackr.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class DataSeederTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private TaskRepository taskRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @InjectMocks
    private DataSeeder dataSeeder;

    @Test
    void run_dataAlreadyExists_skipsSeeding() throws Exception {
        when(userRepository.count()).thenReturn(5L);

        dataSeeder.run();

        verify(userRepository, never()).save(any());
        verify(projectRepository, never()).save(any());
        verify(taskRepository, never()).save(any());
    }

    @Test
    void run_emptyDatabase_seedsData() throws Exception {
        when(userRepository.count()).thenReturn(0L);
        when(passwordEncoder.encode(anyString())).thenReturn("encoded");
        when(userRepository.save(any())).thenAnswer(inv -> {
            var user = inv.getArgument(0, com.trackr.model.User.class);
            user.setId((long) (Math.random() * 1000));
            return user;
        });
        when(projectRepository.save(any())).thenAnswer(inv -> {
            var project = inv.getArgument(0, com.trackr.model.Project.class);
            project.setId((long) (Math.random() * 1000));
            return project;
        });
        when(taskRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        dataSeeder.run();

        verify(userRepository, times(6)).save(any());
        verify(projectRepository, times(5)).save(any());
        verify(taskRepository, times(47)).save(any());
        verify(passwordEncoder, times(6)).encode("password123");
    }
}
