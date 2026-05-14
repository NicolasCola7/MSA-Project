package com.acme.rental.model;

import java.io.Serializable;
import java.util.Objects;

public class SessionKey implements Serializable {

    private String userId;
    private Long processInstanceKey;

    public SessionKey() {
    }

    public SessionKey(String userId, Long processInstanceKey) {
        this.userId = userId;
        this.processInstanceKey = processInstanceKey;
    }

    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public Long getProcessInstanceKey() {
        return processInstanceKey;
    }

    public void setProcessInstanceKey(Long processInstanceKey) {
        this.processInstanceKey = processInstanceKey;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) {
            return true;
        }
        if (!(o instanceof SessionKey sessionId)) {
            return false;
        }
        return Objects.equals(userId, sessionId.userId)
                && Objects.equals(processInstanceKey, sessionId.processInstanceKey);
    }

    @Override
    public int hashCode() {
        return Objects.hash(userId, processInstanceKey);
    }
}
