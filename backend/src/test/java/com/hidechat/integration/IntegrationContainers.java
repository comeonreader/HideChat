package com.hidechat.integration;

import org.testcontainers.containers.GenericContainer;
import org.testcontainers.containers.PostgreSQLContainer;

final class IntegrationContainers {

    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine")
        .withDatabaseName("hidechat")
        .withUsername("hidechat")
        .withPassword("hidechat");

    static final GenericContainer<?> REDIS = new GenericContainer<>("redis:7-alpine")
        .withExposedPorts(6379);

    static {
        POSTGRES.start();
        REDIS.start();
    }

    private IntegrationContainers() {
    }
}
