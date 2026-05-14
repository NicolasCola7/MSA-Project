package com.acme.rental.repository;

import com.acme.rental.model.Session;
import com.acme.rental.model.SessionKey;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.transaction.annotation.Transactional;

import java.util.Optional;

public interface SessionRepository extends JpaRepository<Session, SessionKey> {
    Optional<Session> findByUserId(String userId);

    @Transactional
    void deleteByUserId(String userId);
}
