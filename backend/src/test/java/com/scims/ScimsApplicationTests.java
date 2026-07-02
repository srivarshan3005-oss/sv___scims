package com.scims;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

/**
 * Spring context load test.
 *
 * Uses an in-memory H2 database so no MySQL instance is required for CI/CD.
 * Hibernate auto-creates the schema via ddl-auto=create-drop.
 *
 * NOTE: The H2 dialect does not support MySQL ENUM columns.
 * Entities using @Enumerated(EnumType.STRING) map fine to VARCHAR in H2.
 * The schema used here is Hibernate-generated (ddl-auto=create-drop),
 * NOT the MySQL-specific schema.sql.
 */
@SpringBootTest
@TestPropertySource(properties = {
    "spring.datasource.url=jdbc:h2:mem:testdb;DB_CLOSE_DELAY=-1;NON_KEYWORDS=VALUE",
    "spring.datasource.driver-class-name=org.h2.Driver",
    "spring.datasource.username=sa",
    "spring.datasource.password=",
    "spring.jpa.hibernate.ddl-auto=create-drop",
    "spring.jpa.database-platform=org.hibernate.dialect.H2Dialect",
    "spring.sql.init.mode=never",
    "app.jwt.secret=TestSecretKeyForUnitTests1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefg",
    "app.jwt.expiration=3600000",
    "app.cors.allowed-origins=http://localhost:3000",
    "app.upload.dir=uploads"
})
class ScimsApplicationTests {

    @Test
    void contextLoads() {
        // Verifies Spring context starts without errors against H2 in-memory DB
    }
}
