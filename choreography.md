# Coreografia del Sistema ACMEMobility
## Versione Aggiornata - Allineata al Diagramma BPMN

---

## Partecipanti

- **RS**: Rental Service (Orchestratore BPMS ACME Mobility)
- **User**: Cliente (App Mobile)
- **B**: Bank (Servizio di Pagamento - Jolie/SOAP)
- **S**: Station (Gestione Fisica Veicoli)
- **FM**: Fleet Management (Coordinamento Fleet - API REST)
- **TS**: Tracking Service (Tracciamento Posizione - Microservizio)
- **BMS**: Battery Monitoring Service (Monitoraggio Batteria - Microservizio)
- **LS**: Logistic Service (Gestione Manutenzione e Ricarica)

---

## Specifica Formale della Coreografia

```java
// FASE INIZIALE: Visualizzazione veicoli disponibili
show_available_vehicles: User -> RS;
return_vehicles: RS -> User;

(  
  // ========================================================================
  // SCENARIO A: NOLEGGIO IMMEDIATO (Scan QR Code)
  // ========================================================================
  (
    scan_qr: User -> RS;
    
    // --- PRE-AUTORIZZAZIONE BANCARIA ---
    block_money: RS -> B;
    send_token: B -> RS;
    
    // --- AVVIO MONITORAGGIO FLEET MANAGEMENT ---
    start_monitoring: RS -> FM;
    (
      start_tracking: FM -> TS 
      | 
      start_battery_monitoring: FM -> BMS
    );
    (
      ack_tracking: TS -> FM 
      | 
      ack_battery_monitoring: BMS -> FM
    );
    ack_monitoring: FM -> RS;
    
    // --- SBLOCCO FISICO VEICOLO ---
    unlock_vehicle: RS -> S;
    vehicle_unlocked: S -> RS;
    
    // --- CONFERMA INIZIO NOLEGGIO ---
    ack_rental_started: RS -> User;
    
    // --- LOOP MONITORAGGIO DURANTE IL NOLEGGIO ---
    (
      request_update: User -> RS;
      trigger_read: RS -> FM;
      (
        (
          ask_position: FM -> TS;
          send_position: TS -> FM
        )
        |
        (
          ask_battery: FM -> BMS;
          send_battery: BMS -> FM
        )
      );
      send_vehicle_status: FM -> RS;
      display_update: RS -> User
    )*;
    
    // --- FINE NOLEGGIO ---
    end_ride: User -> RS;
    
    // --- BLOCCO VEICOLO ---
    lock_vehicle: RS -> S;
    vehicle_locked: S -> RS;
    
    // --- STOP MONITORAGGIO ---
    stop_monitoring: RS -> FM;
    (
      stop_tracking: FM -> TS 
      | 
      stop_battery_monitoring: FM -> BMS
    );
    (
      ack_stop_tracking: TS -> FM 
      | 
      ack_stop_battery_monitoring: BMS -> FM
    );
    ack_stop_monitoring: FM -> RS;
    
    // --- GESTIONE RICARICA (Scelta basata su livello batteria) ---
    (
      (
        recharge_request: RS -> S;
        ack_recharge_request: S -> RS;
        notify_recharge_to_logistic: RS -> LS;
        ack_notify_recharge: LS -> RS
      )
      +
      (
        no_recharge_needed: RS -> S;
        ack_no_recharge: S -> RS
      )
    );
    
    // --- PAGAMENTO FINALE (Parallelo: sblocco cauzione e addebito costo) ---
    (
      (
        unlock_money: RS -> B;
        ack_money_unlocked: B -> RS
      )
      |
      (
        send_charge: RS -> B;
        ack_charge_sent: B -> RS
      )
    );
    
    // --- INVIO RIEPILOGO ---
    rental_summary: RS -> User;
    
    // --- GESTIONE SEGNALAZIONE DANNI (Opzionale) ---
    (
      (
        report_damage: User -> RS;
        ack_report_damage: RS -> User;
        vehicle_in_maintenance_queue: RS -> LS;
        ack_vehicle_queued: LS -> RS
      )
      +
      (
        no_report: User -> RS
      )
    )
  )
  
  + 
  
  // ========================================================================
  // SCENARIO B: PRENOTAZIONE BREVE (Booking con anticipo max 30 min)
  // ========================================================================
  (
    short_reservation: User -> RS;
    
    // --- PRE-AUTORIZZAZIONE BANCARIA ---
    block_money: RS -> B;
    send_token: B -> RS;
    
    // --- CONFERMA PRENOTAZIONE ---
    ack_reservation: RS -> User;
    
    (
      // --------------------------------------------------------------------
      // SCENARIO B1: ANNULLAMENTO ESPLICITO (> 5 min prima)
      // --------------------------------------------------------------------
      (
        cancel_reservation: User -> RS;
        
        // Verifica tempistica annullamento
        (
          // Annullamento in tempo (> 5 min): Rimborso totale
          (
            unlock_money: RS -> B;
            ack_money_unlocked: B -> RS
          )
          +
          // Annullamento tardivo (< 5 min): Addebito penale
          (
            charge_money_block: RS -> B;
            ack_charge_money_block: B -> RS
          )
        );
        
        reservation_cancelled: RS -> User
      )
      
      +
      
      // --------------------------------------------------------------------
      // SCENARIO B2: TIMEOUT - NO SHOW (Scadenza 30 minuti)
      // --------------------------------------------------------------------
      (
        timeout_notification: RS -> User;
        
        // Addebito automatico penale
        charge_money_block: RS -> B;
        ack_charge_money_block: B -> RS;
        
        reservation_cancelled: RS -> User
      )
      
      +
      
      // --------------------------------------------------------------------
      // SCENARIO B3: RITIRO VEICOLO (Happy Path)
      // --------------------------------------------------------------------
      (
        scan_qr: User -> RS;
        
        // --- AVVIO MONITORAGGIO FLEET MANAGEMENT ---
        start_monitoring: RS -> FM;
        (
          start_tracking: FM -> TS 
          | 
          start_battery_monitoring: FM -> BMS
        );
        (
          ack_tracking: TS -> FM 
          | 
          ack_battery_monitoring: BMS -> FM
        );
        ack_monitoring: FM -> RS;
        
        // --- SBLOCCO FISICO VEICOLO ---
        unlock_vehicle: RS -> S;
        vehicle_unlocked: S -> RS;
        
        // --- CONFERMA INIZIO NOLEGGIO ---
        ack_rental_started: RS -> User;
        
        // --- LOOP MONITORAGGIO DURANTE IL NOLEGGIO ---
        (
          request_update: User -> RS;
          trigger_read: RS -> FM;
          (
            (
              ask_position: FM -> TS;
              send_position: TS -> FM
            )
            |
            (
              ask_battery: FM -> BMS;
              send_battery: BMS -> FM
            )
          );
          send_vehicle_status: FM -> RS;
          display_update: RS -> User
        )*;
        
        // --- FINE NOLEGGIO ---
        end_ride: User -> RS;
        
        // --- BLOCCO VEICOLO ---
        lock_vehicle: RS -> S;
        vehicle_locked: S -> RS;
        
        // --- STOP MONITORAGGIO ---
        stop_monitoring: RS -> FM;
        (
          stop_tracking: FM -> TS 
          | 
          stop_battery_monitoring: FM -> BMS
        );
        (
          ack_stop_tracking: TS -> FM 
          | 
          ack_stop_battery_monitoring: BMS -> FM
        );
        ack_stop_monitoring: FM -> RS;
        
        // --- GESTIONE RICARICA ---
        (
          (
            recharge_request: RS -> S;
            ack_recharge_request: S -> RS;
            notify_recharge_to_logistic: RS -> LS;
            ack_notify_recharge: LS -> RS
          )
          +
          (
            no_recharge_needed: RS -> S;
            ack_no_recharge: S -> RS
          )
        );
        
        // --- PAGAMENTO FINALE ---
        (
          (
            unlock_money: RS -> B;
            ack_money_unlocked: B -> RS
          )
          |
          (
            send_charge: RS -> B;
            ack_charge_sent: B -> RS
          )
        );
        
        // --- INVIO RIEPILOGO ---
        rental_summary: RS -> User;
        
        // --- GESTIONE SEGNALAZIONE DANNI ---
        (
          (
            report_damage: User -> RS;
            ack_report_damage: RS -> User;
            vehicle_in_maintenance_queue: RS -> LS;
            ack_vehicle_queued: LS -> RS
          )
          +
          (
            no_report: User -> RS
          )
        )
      )
    )
  )
)
```

---

## Proiezioni in Ruoli (Sistema di Ruoli)

Legenda: 
- **!** = **Invio messaggio**
- **?** = **Ricezione messaggio**
- **1** = **Skip** (nessuna azione per questo partecipante)

---

### 1) Rental Service (RS) - Orchestratore BPMS

```java
// FASE INIZIALE
show_available_vehicles?User;
return_vehicles!User;

(
  // ====== SCENARIO A: NOLEGGIO IMMEDIATO ======
  (
    scan_qr?User;
    
    // Pre-autorizzazione
    block_money!B; 
    send_token?B;
    
    // Avvio monitoraggio
    start_monitoring!FM;
    1; 1;  // Skip interazioni FM-TS/BMS
    ack_monitoring?FM;
    
    // Sblocco veicolo
    unlock_vehicle!S; 
    vehicle_unlocked?S;
    
    ack_rental_started!User;
    
    // Loop monitoraggio
    (
      request_update?User;
      trigger_read!FM;
      1;  // Skip interazioni FM-TS/BMS
      send_vehicle_status?FM;
      display_update!User
    )*;
    
    // Fine noleggio
    end_ride?User;
    
    lock_vehicle!S; 
    vehicle_locked?S;
    
    // Stop monitoraggio
    stop_monitoring!FM;
    1; 1;  // Skip interazioni FM-TS/BMS
    ack_stop_monitoring?FM;
    
    // Gestione ricarica
    (
      (
        recharge_request!S; 
        ack_recharge_request?S;
        notify_recharge_to_logistic!LS;
        ack_notify_recharge?LS
      )
      +
      (
        no_recharge_needed!S; 
        ack_no_recharge?S
      )
    );
    
    // Pagamento finale
    (
      (unlock_money!B; ack_money_unlocked?B)
      |
      (send_charge!B; ack_charge_sent?B)
    );
    
    rental_summary!User;
    
    // Gestione danni
    (
      (
        report_damage?User; 
        ack_report_damage!User;
        vehicle_in_maintenance_queue!LS;
        ack_vehicle_queued?LS
      )
      +
      (no_report?User)
    )
  )
  
  +
  
  // ====== SCENARIO B: PRENOTAZIONE BREVE ======
  (
    short_reservation?User;
    
    block_money!B; 
    send_token?B;
    
    ack_reservation!User;
    
    (
      // B1: Annullamento
      (
        cancel_reservation?User;
        (
          (unlock_money!B; ack_money_unlocked?B)
          +
          (charge_money_block!B; ack_charge_money_block?B)
        );
        reservation_cancelled!User
      )
      
      +
      
      // B2: Timeout
      (
        timeout_notification!User;
        charge_money_block!B; 
        ack_charge_money_block?B;
        reservation_cancelled!User
      )
      
      +
      
      // B3: Ritiro (identico a Scenario A dal scan_qr in poi)
      (
        scan_qr?User;
        start_monitoring!FM; 1; 1; ack_monitoring?FM;
        unlock_vehicle!S; vehicle_unlocked?S;
        ack_rental_started!User;
        
        (request_update?User; trigger_read!FM; 1; send_vehicle_status?FM; display_update!User)*;
        
        end_ride?User;
        lock_vehicle!S; vehicle_locked?S;
        stop_monitoring!FM; 1; 1; ack_stop_monitoring?FM;
        
        (
          (recharge_request!S; ack_recharge_request?S; notify_recharge_to_logistic!LS; ack_notify_recharge?LS)
          +
          (no_recharge_needed!S; ack_no_recharge?S)
        );
        
        ((unlock_money!B; ack_money_unlocked?B) | (send_charge!B; ack_charge_sent?B));
        
        rental_summary!User;
        
        (
          (report_damage?User; ack_report_damage!User; vehicle_in_maintenance_queue!LS; ack_vehicle_queued?LS)
          +
          (no_report?User)
        )
      )
    )
  )
)
```

---

### 2) User (Cliente - App Mobile)

```java
// FASE INIZIALE
show_available_vehicles!RS;
return_vehicles?RS;

(
  // ====== SCENARIO A: NOLEGGIO IMMEDIATO ======
  (
    scan_qr!RS;
    
    1; 1;  // Skip pre-autorizzazione (RS-B)
    1; 1; 1; 1;  // Skip avvio monitoraggio (RS-FM-TS/BMS)
    1; 1;  // Skip sblocco (RS-S)
    
    ack_rental_started?RS;
    
    // Loop monitoraggio
    (
      request_update!RS;
      1;  // Skip trigger_read (RS-FM)
      1;  // Skip interazioni FM-TS/BMS
      1;  // Skip send_vehicle_status (FM-RS)
      display_update?RS
    )*;
    
    end_ride!RS;
    
    1; 1;  // Skip lock (RS-S)
    1; 1; 1; 1;  // Skip stop monitoraggio (RS-FM-TS/BMS)
    
    // Skip gestione ricarica
    (
      (1; 1; 1; 1)
      +
      (1; 1)
    );
    
    // Skip pagamento
    ((1; 1) | (1; 1));
    
    rental_summary?RS;
    
    // Gestione danni
    (
      (report_damage!RS; ack_report_damage?RS; 1; 1)
      +
      (no_report!RS)
    )
  )
  
  +
  
  // ====== SCENARIO B: PRENOTAZIONE BREVE ======
  (
    short_reservation!RS;
    
    1; 1;  // Skip pre-autorizzazione
    
    ack_reservation?RS;
    
    (
      // B1: Annullamento
      (
        cancel_reservation!RS;
        ((1; 1) + (1; 1));
        reservation_cancelled?RS
      )
      
      +
      
      // B2: Timeout
      (
        timeout_notification?RS;
        1; 1;
        reservation_cancelled?RS
      )
      
      +
      
      // B3: Ritiro
      (
        scan_qr!RS;
        1; 1; 1; 1;  // Skip monitoraggio
        1; 1;  // Skip unlock
        ack_rental_started?RS;
        
        (request_update!RS; 1; 1; 1; display_update?RS)*;
        
        end_ride!RS;
        1; 1;  // Skip lock
        1; 1; 1; 1;  // Skip stop monitoraggio
        
        ((1; 1; 1; 1) + (1; 1));  // Skip ricarica
        ((1; 1) | (1; 1));  // Skip pagamento
        
        rental_summary?RS;
        
        ((report_damage!RS; ack_report_damage?RS; 1; 1) + (no_report!RS))
      )
    )
  )
)
```

---

### 3) Bank (B) - Servizio Bancario (Jolie/SOAP)

```java
// FASE INIZIALE
1; 1;  // Skip visualizzazione veicoli

(
  // ====== SCENARIO A: NOLEGGIO IMMEDIATO ======
  (
    1;  // Skip scan_qr
    
    // Pre-autorizzazione
    block_money?RS;
    send_token!RS;
    
    // Skip tutto fino al pagamento finale
    1; 1; 1; 1;  // Skip monitoraggio
    1; 1;  // Skip unlock
    1;  // Skip ack rental
    (1; 1; 1; 1; 1)*;  // Skip loop monitoraggio
    1;  // Skip end_ride
    1; 1;  // Skip lock
    1; 1; 1; 1;  // Skip stop monitoraggio
    
    // Skip ricarica
    ((1; 1; 1; 1) + (1; 1));
    
    // Pagamento finale
    (
      (unlock_money?RS; ack_money_unlocked!RS)
      |
      (send_charge?RS; ack_charge_sent!RS)
    );
    
    1;  // Skip rental_summary
    
    // Skip gestione danni
    ((1; 1; 1; 1) + 1)
  )
  
  +
  
  // ====== SCENARIO B: PRENOTAZIONE BREVE ======
  (
    1;  // Skip short_reservation
    
    // Pre-autorizzazione
    block_money?RS;
    send_token!RS;
    
    1;  // Skip ack_reservation
    
    (
      // B1: Annullamento
      (
        1;  // Skip cancel_reservation
        (
          (unlock_money?RS; ack_money_unlocked!RS)
          +
          (charge_money_block?RS; ack_charge_money_block!RS)
        );
        1  // Skip reservation_cancelled
      )
      
      +
      
      // B2: Timeout
      (
        1;  // Skip timeout_notification
        charge_money_block?RS;
        ack_charge_money_block!RS;
        1  // Skip reservation_cancelled
      )
      
      +
      
      // B3: Ritiro
      (
        1;  // Skip scan_qr
        1; 1; 1; 1;  // Skip monitoraggio
        1; 1;  // Skip unlock
        1;  // Skip ack rental
        (1; 1; 1; 1; 1)*;  // Skip loop
        1;  // Skip end_ride
        1; 1;  // Skip lock
        1; 1; 1; 1;  // Skip stop monitoraggio
        ((1; 1; 1; 1) + (1; 1));  // Skip ricarica
        
        // Pagamento finale
        ((unlock_money?RS; ack_money_unlocked!RS) | (send_charge?RS; ack_charge_sent!RS));
        
        1;  // Skip rental_summary
        ((1; 1; 1; 1) + 1)  // Skip danni
      )
    )
  )
)
```

---

### 4) Station (S) - Gestione Fisica Veicoli

```java
// FASE INIZIALE
1; 1;  // Skip visualizzazione veicoli

(
  // ====== SCENARIO A: NOLEGGIO IMMEDIATO ======
  (
    1;  // Skip scan_qr
    1; 1;  // Skip pre-autorizzazione
    1; 1; 1; 1;  // Skip avvio monitoraggio
    
    // Sblocco veicolo
    unlock_vehicle?RS;
    vehicle_unlocked!RS;
    
    1;  // Skip ack_rental_started
    (1; 1; 1; 1; 1)*;  // Skip loop monitoraggio
    1;  // Skip end_ride
    
    // Blocco veicolo
    lock_vehicle?RS;
    vehicle_locked!RS;
    
    1; 1; 1; 1;  // Skip stop monitoraggio
    
    // Gestione ricarica
    (
      (
        recharge_request?RS;
        ack_recharge_request!RS;
        1; 1  // Skip notifica logistica
      )
      +
      (
        no_recharge_needed?RS;
        ack_no_recharge!RS
      )
    );
    
    ((1; 1) | (1; 1));  // Skip pagamento
    1;  // Skip rental_summary
    ((1; 1; 1; 1) + 1)  // Skip gestione danni
  )
  
  +
  
  // ====== SCENARIO B: PRENOTAZIONE BREVE ======
  (
    1;  // Skip short_reservation
    1; 1;  // Skip pre-autorizzazione
    1;  // Skip ack_reservation
    
    (
      // B1 & B2: Station non coinvolta
      (1; ((1; 1) + (1; 1)); 1)
      +
      (1; 1; 1; 1)
      
      +
      
      // B3: Ritiro
      (
        1;  // Skip scan_qr
        1; 1; 1; 1;  // Skip avvio monitoraggio
        
        unlock_vehicle?RS;
        vehicle_unlocked!RS;
        
        1;  // Skip ack_rental_started
        (1; 1; 1; 1; 1)*;  // Skip loop
        1;  // Skip end_ride
        
        lock_vehicle?RS;
        vehicle_locked!RS;
        
        1; 1; 1; 1;  // Skip stop monitoraggio
        
        (
          (recharge_request?RS; ack_recharge_request!RS; 1; 1)
          +
          (no_recharge_needed?RS; ack_no_recharge!RS)
        );
        
        ((1; 1) | (1; 1));  // Skip pagamento
        1;  // Skip rental_summary
        ((1; 1; 1; 1) + 1)  // Skip danni
      )
    )
  )
)
```

---

### 5) Fleet Management (FM) - Coordinamento Fleet (API REST)

```java
// FASE INIZIALE
1; 1;  // Skip visualizzazione veicoli

(
  // ====== SCENARIO A: NOLEGGIO IMMEDIATO ======
  (
    1;  // Skip scan_qr
    1; 1;  // Skip pre-autorizzazione
    
    // Avvio monitoraggio
    start_monitoring?RS;
    (
      start_tracking!TS 
      | 
      start_battery_monitoring!BMS
    );
    (
      ack_tracking?TS 
      | 
      ack_battery_monitoring?BMS
    );
    ack_monitoring!RS;
    
    1; 1;  // Skip unlock
    1;  // Skip ack_rental_started
    
    // Loop monitoraggio
    (
      1;  // Skip request_update
      trigger_read?RS;
      (
        (ask_position!TS; send_position?TS)
        |
        (ask_battery!BMS; send_battery?BMS)
      );
      send_vehicle_status!RS;
      1  // Skip display_update
    )*;
    
    1;  // Skip end_ride
    1; 1;  // Skip lock
    
    // Stop monitoraggio
    stop_monitoring?RS;
    (
      stop_tracking!TS 
      | 
      stop_battery_monitoring!BMS
    );
    (
      ack_stop_tracking?TS 
      | 
      ack_stop_battery_monitoring?BMS
    );
    ack_stop_monitoring!RS;
    
    // Skip resto
    ((1; 1; 1; 1) + (1; 1));  // Skip ricarica
    ((1; 1) | (1; 1));  // Skip pagamento
    1;  // Skip rental_summary
    ((1; 1; 1; 1) + 1)  // Skip danni
  )
  
  +
  
  // ====== SCENARIO B: PRENOTAZIONE BREVE ======
  (
    1;  // Skip short_reservation
    1; 1;  // Skip pre-autorizzazione
    1;  // Skip ack_reservation
    
    (
      // B1 & B2: FM non coinvolta
      (1; ((1; 1) + (1; 1)); 1)
      +
      (1; 1; 1; 1)
      
      +
      
      // B3: Ritiro
      (
        1;  // Skip scan_qr
        
        start_monitoring?RS;
        (start_tracking!TS | start_battery_monitoring!BMS);
        (ack_tracking?TS | ack_battery_monitoring?BMS);
        ack_monitoring!RS;
        
        1; 1; 1;  // Skip unlock e ack
        
        (
          1; trigger_read?RS;
          ((ask_position!TS; send_position?TS) | (ask_battery!BMS; send_battery?BMS));
          send_vehicle_status!RS; 1
        )*;
        
        1; 1; 1;  // Skip end_ride e lock
        
        stop_monitoring?RS;
        (stop_tracking!TS | stop_battery_monitoring!BMS);
        (ack_stop_tracking?TS | ack_stop_battery_monitoring?BMS);
        ack_stop_monitoring!RS;
        
        ((1; 1; 1; 1) + (1; 1));
        ((1; 1) | (1; 1));
        1;
        ((1; 1; 1; 1) + 1)
      )
    )
  )
)
```

---

### 6) Tracking Service (TS) - Tracciamento Posizione (Microservizio)

```java
// FASE INIZIALE
1; 1;  // Skip visualizzazione veicoli

(
  // ====== SCENARIO A: NOLEGGIO IMMEDIATO ======
  (
    1;  // Skip scan_qr
    1; 1;  // Skip pre-autorizzazione
    1;  // Skip start_monitoring
    
    // Ricezione start tracking (parallelo con BMS)
    (start_tracking?FM | 1);
    (ack_tracking!FM | 1);
    
    1;  // Skip ack_monitoring
    1; 1;  // Skip unlock
    1;  // Skip ack_rental_started
    
    // Loop monitoraggio
    (
      1; 1;  // Skip request_update e trigger_read
      (
        (ask_position?FM; send_position!FM)
        |
        (1; 1)  // BMS branch
      );
      1; 1  // Skip send_vehicle_status e display_update
    )*;
    
    1;  // Skip end_ride
    1; 1;  // Skip lock
    1;  // Skip stop_monitoring
    
    // Ricezione stop tracking
    (stop_tracking?FM | 1);
    (ack_stop_tracking!FM | 1);
    
    1;  // Skip ack_stop_monitoring
    
    // Skip resto
    ((1; 1; 1; 1) + (1; 1));
    ((1; 1) | (1; 1));
    1;
    ((1; 1; 1; 1) + 1)
  )
  
  +
  
  // ====== SCENARIO B: PRENOTAZIONE BREVE ======
  (
    1; 1; 1; 1;  // Skip fino a scelta
    
    (
      // B1 & B2: TS non coinvolta
      (1; ((1; 1) + (1; 1)); 1)
      +
      (1; 1; 1; 1)
      
      +
      
      // B3: Ritiro (identico a A)
      (
        1; 1;
        (start_tracking?FM | 1); 
        (ack_tracking!FM | 1);
        1; 1; 1; 1;
        
        (1; 1; ((ask_position?FM; send_position!FM) | (1; 1)); 1; 1)*;
        
        1; 1; 1; 1;
        (stop_tracking?FM | 1); 
        (ack_stop_tracking!FM | 1);
        1;
        
        ((1; 1; 1; 1) + (1; 1));
        ((1; 1) | (1; 1));
        1;
        ((1; 1; 1; 1) + 1)
      )
    )
  )
)
```

---

### 7) Battery Monitoring Service (BMS) - Monitoraggio Batteria (Microservizio)

```java
// FASE INIZIALE
1; 1;  // Skip visualizzazione veicoli

(
  // ====== SCENARIO A: NOLEGGIO IMMEDIATO ======
  (
    1;  // Skip scan_qr
    1; 1;  // Skip pre-autorizzazione
    1;  // Skip start_monitoring
    
    // Ricezione start battery monitoring (parallelo con TS)
    (1 | start_battery_monitoring?FM);
    (1 | ack_battery_monitoring!FM);
    
    1;  // Skip ack_monitoring
    1; 1;  // Skip unlock
    1;  // Skip ack_rental_started
    
    // Loop monitoraggio
    (
      1; 1;  // Skip request_update e trigger_read
      (
        (1; 1)  // TS branch
        |
        (ask_battery?FM; send_battery!FM)
      );
      1; 1  // Skip send_vehicle_status e display_update
    )*;
    
    1;  // Skip end_ride
    1; 1;  // Skip lock
    1;  // Skip stop_monitoring
    
    // Ricezione stop battery monitoring
    (1 | stop_battery_monitoring?FM);
    (1 | ack_stop_battery_monitoring!FM);
    
    1;  // Skip ack_stop_monitoring
    
    // Skip resto
    ((1; 1; 1; 1) + (1; 1));
    ((1; 1) | (1; 1));
    1;
    ((1; 1; 1; 1) + 1)
  )
  
  +
  
  // ====== SCENARIO B: PRENOTAZIONE BREVE ======
  (
    1; 1; 1; 1;  // Skip fino a scelta
    
    (
      // B1 & B2: BMS non coinvolta
      (1; ((1; 1) + (1; 1)); 1)
      +
      (1; 1; 1; 1)
      
      +
      
      // B3: Ritiro (identico a A)
      (
        1; 1;
        (1 | start_battery_monitoring?FM);
        (1 | ack_battery_monitoring!FM);
        1; 1; 1; 1;
        
        (1; 1; ((1; 1) | (ask_battery?FM; send_battery!FM)); 1; 1)*;
        
        1; 1; 1; 1;
        (1 | stop_battery_monitoring?FM);
        (1 | ack_stop_battery_monitoring!FM);
        1;
        
        ((1; 1; 1; 1) + (1; 1));
        ((1; 1) | (1; 1));
        1;
        ((1; 1; 1; 1) + 1)
      )
    )
  )
)
```

---

### 8) Logistic Service (LS) - Gestione Manutenzione e Ricarica

```java
// FASE INIZIALE
1; 1;  // Skip visualizzazione veicoli

(
  // ====== SCENARIO A: NOLEGGIO IMMEDIATO ======
  (
    // Skip tutto fino alla gestione ricarica/danni
    1;  // Skip scan_qr
    1; 1;  // Skip pre-autorizzazione
    1; 1; 1; 1;  // Skip avvio monitoraggio
    1; 1;  // Skip unlock
    1;  // Skip ack_rental_started
    (1; 1; 1; 1; 1)*;  // Skip loop monitoraggio
    1;  // Skip end_ride
    1; 1;  // Skip lock
    1; 1; 1; 1;  // Skip stop monitoraggio
    
    // Gestione ricarica
    (
      (
        1; 1;  // Skip recharge_request/ack (RS-S)
        notify_recharge_to_logistic?RS;
        ack_notify_recharge!RS
      )
      +
      (1; 1)  // Skip no_recharge
    );
    
    ((1; 1) | (1; 1));  // Skip pagamento
    1;  // Skip rental_summary
    
    // Gestione danni
    (
      (
        1; 1;  // Skip report_damage/ack (User-RS)
        vehicle_in_maintenance_queue?RS;
        ack_vehicle_queued!RS
      )
      +
      1  // Skip no_report
    )
  )
  
  +
  
  // ====== SCENARIO B: PRENOTAZIONE BREVE ======
  (
    1; 1; 1; 1;  // Skip fino a scelta
    
    (
      // B1 & B2: LS non coinvolta
      (1; ((1; 1) + (1; 1)); 1)
      +
      (1; 1; 1; 1)
      
      +
      
      // B3: Ritiro (identico a A nella parte finale)
      (
        1;  // Skip scan_qr
        1; 1; 1; 1;  // Skip monitoraggio
        1; 1; 1;  // Skip unlock e ack
        (1; 1; 1; 1; 1)*;  // Skip loop
        1; 1; 1;  // Skip end_ride e lock
        1; 1; 1; 1;  // Skip stop monitoraggio
        
        // Gestione ricarica
        (
          (1; 1; notify_recharge_to_logistic?RS; ack_notify_recharge!RS)
          +
          (1; 1)
        );
        
        ((1; 1) | (1; 1));  // Skip pagamento
        1;  // Skip rental_summary
        
        // Gestione danni
        (
          (1; 1; vehicle_in_maintenance_queue?RS; ack_vehicle_queued!RS)
          +
          1
        )
      )
    )
  )
)
```
