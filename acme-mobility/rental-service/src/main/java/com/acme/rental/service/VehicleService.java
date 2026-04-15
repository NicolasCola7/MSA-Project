package com.acme.rental.service;

import io.camunda.zeebe.client.ZeebeClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Map;
import java.util.UUID;

/**
 * Service per le operazioni sui veicoli.
 *
 * RESPONSABILITÀ UNICA: pubblicare il messaggio Zeebe corretto.
 *
 * Il Service NON legge dal database.
 * Il Service NON costruisce la lista dei veicoli.
 * Il Service NON vede mai i dati di ritorno.
 *
 * È il confine tra il mondo HTTP (sincrono) e il mondo Zeebe (asincrono).
 * Dopo aver pubblicato il messaggio, il suo lavoro è finito.
 * I dati reali verranno gestiti dai Worker e inviati al browser via WebSocket.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VehicleService {

    private final ZeebeClient zeebeClient;

    /**
     * Pubblica il messaggio "Message_openingMap" a Zeebe.
     *
     * Questo messaggio fa scattare il Message Start Event nel BPMN,
     * avviando una nuova Process Instance per questo userId.
     *
     * La correlationKey (userId) lega il messaggio alla specifica istanza:
     * se l'utente apre la mappa una seconda volta, Zeebe crea una nuova
     * istanza separata per la stessa correlationKey (perché non c'è ancora
     * un'istanza in attesa su un Catch Event per quell'utente).
     */
    public void requestAvailableVehicles(String userId) {
        log.info("[Service] Pubblicazione messaggio 'Message_openingMap' per userId={}", userId);

        zeebeClient.newPublishMessageCommand()
            .messageName("Message_openingMap")
            .correlationKey(userId)
            .timeToLive(Duration.ofMinutes(5))
            .variables(Map.of(
                "userId",    userId,
                "requestId", UUID.randomUUID().toString()
            ))
            .send()  // NON bloccante: non aspetta risposta da Zeebe
            .exceptionally(ex -> {
                log.error("[Service] Errore pubblicazione messaggio per userId={}: {}", userId, ex.getMessage());
                return null;
            });

        // il metodo termina qui — nessun dato di ritorno
        log.debug("[Service] Messaggio pubblicato, controllo passato a Zeebe");
    }
}
