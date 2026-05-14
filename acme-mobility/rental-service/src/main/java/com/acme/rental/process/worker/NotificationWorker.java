package com.acme.rental.process.worker;

import io.camunda.zeebe.spring.client.annotation.JobWorker;
import io.camunda.zeebe.spring.client.annotation.Variable;
import org.springframework.stereotype.Component;

@Component
public class NotificationWorker {

    // The fetchVariables array must match the "Target" you defined in the Modeler
    @JobWorker(type = "notifyUser", fetchVariables = {"userId", "notificationPayload"})
    public void notifyUser(@Variable Long userId, @Variable String notificationPayload) {
        
        // TODO: Execute WebSocket logic...
    }
}