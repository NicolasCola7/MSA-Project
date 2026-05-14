package com.acme.rental.integration.camunda;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.camunda.operate.CamundaOperateClient;
import io.camunda.operate.model.FlowNodeInstance;
import io.camunda.operate.model.FlowNodeInstanceState;
import io.camunda.operate.model.Variable;
import io.camunda.operate.search.FlowNodeInstanceFilter;
import io.camunda.operate.search.SearchQuery;
import io.camunda.operate.search.VariableFilter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Component
@RequiredArgsConstructor
public class OperateGateway {

    private final CamundaOperateClient operateClient;
    private final ObjectMapper objectMapper;

    public String getActiveFlowNodeId(Long processInstanceKey) throws Exception {
        SearchQuery query = new SearchQuery.Builder()
                .filter(FlowNodeInstanceFilter.builder()
                        .processInstanceKey(processInstanceKey)
                        .state(FlowNodeInstanceState.ACTIVE)
                        .build())
                .size(1)
                .build();

        List<FlowNodeInstance> activeNodes = operateClient.searchFlowNodeInstances(query);
        if (activeNodes.isEmpty()) {
            throw new IllegalStateException("No active flow node found for processInstanceKey=" + processInstanceKey);
        }

        return activeNodes.getFirst().getFlowNodeId();
    }

    public Map<String, Object> getProcessVariables(Long processInstanceKey) throws Exception {
        SearchQuery query = new SearchQuery.Builder()
                .filter(VariableFilter.builder()
                        .processInstanceKey(processInstanceKey)
                        .build())
                .size(100)
                .build();

        return operateClient.searchVariables(query).stream()
                .collect(Collectors.toMap(
                        Variable::getName,
                        variable -> deserializeVariableValue(variable.getValue()),
                        (existing, replacement) -> replacement));
    }

    private Object deserializeVariableValue(String value) {
        if (value == null) {
            return null;
        }

        try {
            return objectMapper.readValue(value, Object.class);
        } catch (JsonProcessingException e) {
            return value;
        }
    }
}
