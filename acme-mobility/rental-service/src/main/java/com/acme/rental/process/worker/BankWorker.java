package com.acme.rental.process.worker;

import java.util.Map;

import org.springframework.stereotype.Component;

import com.acme.rental.integration.bank.BankClient;
import com.acme.rental.integration.bank.generated.BlockMoneyResponse;
import com.acme.rental.integration.bank.generated.UnlockMoneyResponse;

import io.camunda.zeebe.client.ZeebeClient;
import io.camunda.zeebe.client.api.response.ActivatedJob;
import io.camunda.zeebe.spring.client.annotation.JobWorker;
import io.camunda.zeebe.spring.client.annotation.Variable;
import io.camunda.zeebe.spring.client.exception.ZeebeBpmnError;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RequiredArgsConstructor
@Component
public class BankWorker {

    private final BankClient bankClient;
    private final ZeebeClient zeebeClient;


    @JobWorker(type = "blockMoney", fetchVariables = {"accountId", "bankToken"})
    public void blockMoney(ActivatedJob job, @Variable String accountId, @Variable String bankToken) {
        
        // check if token already exists in Zeebe state (e.g. if user had to retry after a failure, we don't want to call the bank again)
        if (bankToken != null && !bankToken.isEmpty()) {
            log.info("Token already exists in Zeebe state. Skipping bank call.");
            return;
        }

        log.info("Blocking money for rental...");
        
        BlockMoneyResponse response = bankClient.blockMoney(accountId);

        if (!response.isSuccess()) {
            log.error("Failed to block money for accountId: {}. Error: {}", accountId, response.getMessage());
            throw new ZeebeBpmnError(response.getErrorStatus(), response.getMessage()); // triggers BPMN error handling in the error boundary event
        } 

        String token = response.getToken();

        // save token in Zeebe state for later use in the process
        zeebeClient.newSetVariablesCommand(job.getProcessInstanceKey())
                .variables(Map.of("bankToken", response.getToken()))
                .send()
                .join(); 

        log.info("Money blocked successfully for accountId: {}. Token: {}", accountId, token);
    }



        
}
