package com.acme.rental.config;

import io.camunda.zeebe.client.ZeebeClient;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.ClassPathResource;

/**
 * Deploys the BPMN process definition to Zeebe at application startup.
 *
 * spring-boot-starter-camunda also supports @Deployment annotation but
 * explicit programmatic deployment gives us better control and logging.
 *
 * The ZeebeClient bean is auto-created by the spring-zeebe starter
 * using the zeebe.client.broker.gateway-address in application.yml.
 */
@Slf4j
@Configuration
@RequiredArgsConstructor
public class ZeebeDeploymentConfig {

    private final ZeebeClient zeebeClient;

    @PostConstruct
    public void deployProcessDefinitions() {
        try {
            log.info("[Zeebe] Deploying BPMN process definition...");

            var resource = new ClassPathResource("bpmn/rental_process.bpmn");

            var result = zeebeClient.newDeployResourceCommand()
                .addResourceStream(resource.getInputStream(), "rental_process.bpmn")
                .send()
                .join();

            result.getProcesses().forEach(p ->
                log.info("[Zeebe] Deployed: processId='{}' version={} key={}",
                    p.getBpmnProcessId(), p.getVersion(), p.getProcessDefinitionKey())
            );

        } catch (Exception e) {
            // Non-fatal at startup — Zeebe might still be warming up.
            // The spring-zeebe starter also supports auto-deploy via
            // zeebe.deployment.resources; this is a belt-and-suspenders approach.
            log.warn("[Zeebe] BPMN deployment at startup failed (will retry via auto-deploy): {}", e.getMessage());
        }
    }
}
