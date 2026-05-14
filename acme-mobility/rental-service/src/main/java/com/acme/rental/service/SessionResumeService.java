package com.acme.rental.service;

import com.acme.rental.bpmn.BpmnPropertiesExtractor;
import com.acme.rental.bpmn.BpmnPropertiesExtractor.RouteProperties;
import com.acme.rental.integration.camunda.OperateGateway;
import com.acme.rental.repository.SessionRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.web.util.UriComponentsBuilder;

import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class SessionResumeService {

    private final SessionRepository sessionRepository;
    private final OperateGateway operateGateway;
    private final BpmnPropertiesExtractor bpmnRoutePropertiesExtractor;

    public String determineTargetRoute(String userId) {
        return sessionRepository.findByUserId(userId)
                .map(session -> determineTargetRoute(userId, session.getProcessInstanceKey()))
                .orElse("/map");
    }

    private String determineTargetRoute(String userId, Long processInstanceKey) {
        try {
            String activeFlowNodeId = operateGateway.getActiveFlowNodeId(processInstanceKey);
            Optional<RouteProperties> routeProperties = bpmnRoutePropertiesExtractor
                    .extractPropertiesForNode(activeFlowNodeId);
            if (routeProperties.isEmpty()) {
                return "/map";
            }

            Map<String, Object> processVariables = operateGateway.getProcessVariables(processInstanceKey);
            return buildRoute(routeProperties.get(), processVariables);
        } catch (Exception e) {
            log.warn("[SessionResume] Unable to resolve route for userId={}, processInstanceKey={}",
                    userId, processInstanceKey, e);
            sessionRepository.deleteByUserId(userId);
            return "/map";
        }
    }

    private String buildRoute(RouteProperties props, Map<String, Object> processVariables) {
        UriComponentsBuilder builder = UriComponentsBuilder.fromPath(normalizeRoute(props.route()));

        if (props.params() != null && !props.params().isBlank()) {
            for (String param : props.params().split(",")) {
                String variableName = param.trim();
                if (variableName.isBlank()) {
                    continue;
                }

                Object variableValue = processVariables.get(variableName);
                if (variableValue != null) {
                    builder.queryParam(variableName, variableValue);
                }
            }
        }

        return builder.build().toUriString();
    }

    private String normalizeRoute(String route) {
        String trimmedRoute = route.trim();
        return trimmedRoute.startsWith("/") ? trimmedRoute : "/" + trimmedRoute;
    }
}
