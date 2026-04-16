package com.esprit.messaging;

import com.esprit.messaging.support.MysqlTestContainerBase;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

@SpringBootTest
@ActiveProfiles("test")
class MessagingApplicationTests extends MysqlTestContainerBase {

    @Test
    void contextLoads() {
    }
}
