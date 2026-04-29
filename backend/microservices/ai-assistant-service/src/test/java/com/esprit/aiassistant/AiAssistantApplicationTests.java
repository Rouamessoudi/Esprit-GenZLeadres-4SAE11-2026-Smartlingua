package com.esprit.aiassistant;

import com.esprit.aiassistant.support.MysqlTestContainerBase;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("ci")
class AiAssistantApplicationTests extends MysqlTestContainerBase {

    @Test
    void contextLoads() {
    }
}
