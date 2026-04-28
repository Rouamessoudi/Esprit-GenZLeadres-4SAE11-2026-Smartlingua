package com.esprit.adaptivelearning.adaptive.controller;

import com.esprit.adaptivelearning.dto.external.CourseExternalDto;
import com.esprit.adaptivelearning.entities.enums.CourseLevel;
import com.esprit.adaptivelearning.feign.CoursesClient;
import com.esprit.adaptivelearning.feign.QuizClient;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Collections;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class AdaptiveLearningControllerIT {

    @Autowired MockMvc mockMvc;
    @Autowired ObjectMapper objectMapper;

    @MockitoBean CoursesClient coursesClient;
    @MockitoBean QuizClient quizClient;

    @Test
    void placementSubmit_returnsInsightAndPersists() throws Exception {
        when(coursesClient.getAllCourses(anyString())).thenReturn(Collections.emptyList());

        String body = mockMvc.perform(post("/api/adaptive/placement-test/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"studentId\":101,\"score\":72,\"weakAreas\":\"listening\"}")
                        .with(jwtStudent()))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode json = objectMapper.readTree(body);
        assertThat(json.path("studentId").asLong()).isEqualTo(101);
        assertThat(json.path("assignedLevel").asText()).isNotBlank();
        assertThat(json.has("pedagogicalInsight")).isTrue();
        assertThat(json.path("recommendations").isArray()).isTrue();
    }

    @Test
    void learningPathGenerate_usesFeignCourses() throws Exception {
        CourseExternalDto c = new CourseExternalDto();
        c.setId(1L);
        c.setTitle("Cours démo");
        c.setLevel(CourseLevel.B1);
        when(coursesClient.getAllCourses(eq("B1"))).thenReturn(List.of(c));
        when(coursesClient.getResourcesByCourse(1L)).thenReturn(Collections.emptyList());
        when(coursesClient.getSeancesByCourse(1L)).thenReturn(Collections.emptyList());

        mockMvc.perform(post("/api/adaptive/placement-test/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"studentId\":202,\"score\":65,\"weakAreas\":null}")
                        .with(jwtStudent()))
                .andExpect(status().isOk());

        String pathJson = mockMvc.perform(post("/api/adaptive/learning-path/generate")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"studentId\":202}")
                        .with(jwtStudent()))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();

        JsonNode tree = objectMapper.readTree(pathJson);
        assertThat(tree.path("items").isArray()).isTrue();
        assertThat(tree.path("items")).isNotEmpty();
        assertThat(tree.path("items").get(0).path("itemType").asText()).isEqualTo("COURSE");
    }

    @Test
    void meProfile_isMapped_notNoStaticResource() throws Exception {
        when(coursesClient.getAllCourses(anyString())).thenReturn(Collections.emptyList());
        mockMvc.perform(post("/api/adaptive/placement-test/submit")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"studentId\":303,\"score\":55,\"weakAreas\":null}")
                        .with(jwtStudent()))
                .andExpect(status().isOk());

        String body = mockMvc.perform(get("/api/adaptive/me/profile").with(jwtStudent()))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        JsonNode json = objectMapper.readTree(body);
        assertThat(json.path("studentId").asLong()).isEqualTo(303);
    }

    private static SecurityMockMvcRequestPostProcessors.JwtRequestPostProcessor jwtStudent() {
        return jwt().jwt(j -> j.claim("realm_access", Map.of("roles", List.of("student"))));
    }
}
