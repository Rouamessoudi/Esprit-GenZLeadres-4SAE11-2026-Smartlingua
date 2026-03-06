package com.esprit.messaging;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

@SpringBootTest(properties = {
    "spring.datasource.url=jdbc:mysql://localhost:3306/smartlingua_messaging_test?useSSL=false&serverTimezone=Europe/Paris&allowPublicKeyRetrieval=true&createDatabaseIfNotExist=true",
    "spring.datasource.driver-class-name=com.mysql.cj.jdbc.Driver",
    "spring.datasource.username=root",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.jpa.properties.hibernate.dialect=org.hibernate.dialect.MySQLDialect",
    "eureka.client.enabled=false"
})
class MessagingApplicationTests {

    @Test
    void contextLoads() {
    }
}
