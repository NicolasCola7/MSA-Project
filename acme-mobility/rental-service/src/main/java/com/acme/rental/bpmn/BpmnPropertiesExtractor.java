package com.acme.rental.bpmn;

import io.camunda.zeebe.model.bpmn.Bpmn;
import io.camunda.zeebe.model.bpmn.BpmnModelInstance;
import io.camunda.zeebe.model.bpmn.instance.BpmnModelElementInstance;
import io.camunda.zeebe.model.bpmn.instance.ExtensionElements;
import io.camunda.zeebe.model.bpmn.instance.zeebe.ZeebeProperties;
import io.camunda.zeebe.model.bpmn.instance.zeebe.ZeebeProperty;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.io.InputStream;
import java.util.Optional;

@Component
public class BpmnPropertiesExtractor {

    private static final String BPMN_RESOURCE = "bpmn/rental_process.bpmn";
    private static final String FRONTEND_ROUTE = "frontendRoute";
    private static final String ROUTE_PARAMS = "routeParams";

    public Optional<RouteProperties> extractPropertiesForNode(String flowNodeId) {
        ClassPathResource resource = new ClassPathResource(BPMN_RESOURCE);
        try (InputStream inputStream = resource.getInputStream()) {
            BpmnModelInstance modelInstance = Bpmn.readModelFromStream(inputStream);
            BpmnModelElementInstance element = modelInstance.getModelElementById(flowNodeId);
            if (element == null) {
                return Optional.empty();
            }

            String route = null;
            String params = null;
            for (ExtensionElements extensionElements : element.getChildElementsByType(ExtensionElements.class)) {
                for (ZeebeProperties zeebeProperties : extensionElements
                        .getChildElementsByType(ZeebeProperties.class)) {
                    for (ZeebeProperty property : zeebeProperties.getProperties()) {
                        if (FRONTEND_ROUTE.equals(property.getName())) {
                            route = property.getValue();
                        } else if (ROUTE_PARAMS.equals(property.getName())) {
                            params = property.getValue();
                        }
                    }
                }
            }

            if (route == null || route.isBlank()) {
                return Optional.empty();
            }
            return Optional.of(new RouteProperties(route, params));
        } catch (IOException e) {
            throw new IllegalStateException("Unable to parse BPMN resource " + BPMN_RESOURCE, e);
        }
    }

    public record RouteProperties(String route, String params) {
    }
}
