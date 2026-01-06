# Coreografia del Sistema ACMEMobility

Legenda Partecipanti:
- **RS**: Rental Service (Orchestratore BPMS ACME Mobility)
- **User**: Cliente (App)
- **B**: Bank (Servizio di Pagamento)
- **S**: Station (Gestione Fisica Veicoli)
- **FM**: Fleet Management (Coordinamento Fleet)
- **TS**: Tracking Service (Tracciamento Posizione)
- **BMS**: Battery Monitoring Service (Monitoraggio Batteria)
- **LS**: Logistic Service

---

## Specifica Formale

```java
(
  // Visualizzazione veicoli disponibili
  show_available_vehicles: user -> RS;
  return_vehicles: RS -> user;
  
  (  
    // Scenario A: Noleggio Immediato (Scan QR diretto)
    (
      scan_qr: user -> RS;
      
      block_money: RS -> B;
      send_token: B -> RS;
      
      start_monitoring: RS -> FM;
      (start_tracking: FM -> TS | start_battery_monitoring: FM -> BMS);
      (ack_tracking: TS -> FM | ack_battery_monitoring: BMS -> FM);
      ack_monitoring: FM -> RS;
      
      unlock_vehicle: RS -> S; 
      vehicle_unlocked: S -> RS;
      
      ack_rental_started: RS -> user;
      
      // Monitoraggio continuo durante il noleggio
      (             
        request_update: user --> RS;             
        trigger_read: RS --> FM;             
        (                 
          (ask_pos: FM --> TS; send_position_update: TS --> FM)
          |                 
          (ask_batt: FM --> BMS; send_battery_update: BMS --> FM)             
        );
        send_vehicle_status_update: FM --> RS;             
        update_display: RS --> user         
      )*;
      
      end_ride: user -> RS;
      
      lock_vehicle: RS -> S;
      vehicle_locked: S -> RS;
      
      stop_monitoring: RS -> FM;
      (stop_tracking: FM -> TS | stop_battery_monitoring: FM -> BMS);
      (ack_stop_tracking: TS -> FM | ack_stop_battery_monitoring: BMS -> FM);
      ack_stop_monitoring: FM -> RS;
      
      // Gestione della ricarica
      (
        (recharge_request: RS -> S; ack_recharge_request: S -> RS)
        +
        (no_recharge: RS -> S; ack_no_recharge: S -> RS)
      );

      // Gestione pagamento finale
      (
        (unlock_money: RS -> B; ack_money_unlocked: B -> RS)
        | 
        (send_charge: RS -> B; ack_charge_sent: B -> RS)
      );

      rental_summary: RS -> user;
      
      // Segnalazione danni
      (
        (
          report_damage: user -> RS; 
          ack_report_damage: RS -> user;
          vehicle_in_queue: RS --> LS;
          ack_vehicle_in_queue: LS --> RS;
        )
        +
        no_report_written: user -> RS;
      )
    )
    
    + 
    
    // Scenario B: Prenotazione Breve con gestione Timeout/Annullamento
    (
      short_reservation: user -> RS; 
      
      block_money: RS -> B; 
      send_token: B -> RS;
      
      ack_short_reservation: RS -> user;
      
      (
        // Sotto-scenario B1: Annullamento esplicito da parte dell'utente
        (
          cancel_reservation: user -> RS;
          (
            (charge_money_block: RS -> B; ack_charge_money_block: B -> RS)
            +
            (unlock_money: RS -> B; ack_unlock_money: B -> RS)
          );
          reservation_canceled: RS -> user
        )
        
        +  
        
        // Sotto-scenario B2: Timeout (No Show - 30 min scaduti)
        (
          timeout_notify: RS -> user;
          charge_money_block: RS -> B;
          ack_charge_money_block: B -> RS;
          reservation_canceled: RS -> user
        )
        
        +
        
        // Sotto-scenario B3: Happy Path - Ritiro del veicolo prenotato
        (
          scan_qr: user -> RS;
        
          start_monitoring: RS -> FM;
          (start_tracking: FM -> TS | start_battery_monitoring: FM -> BMS);
          (ack_tracking: TS -> FM | ack_battery_monitoring: BMS -> FM);
          ack_monitoring: FM -> RS;
          
          unlock_vehicle: RS -> S; 
          vehicle_unlocked: S -> RS;
          
          ack_rental_started: RS -> user;
          
          // Monitoraggio continuo durante il noleggio
          (             
            request_update: user --> RS;             
            trigger_read: RS --> FM;             
            (                 
              (ask_pos: FM --> TS; send_position_update: TS --> FM)
              |                 
              (ask_batt: FM --> BMS; send_battery_update: BMS --> FM)             
            );
            send_vehicle_status_update: FM --> RS;             
            update_display: RS --> user         
          )*;
          
          end_ride: user -> RS;
          
          lock_vehicle: RS -> S;
          vehicle_locked: S -> RS;
          
          stop_monitoring: RS -> FM;
          (stop_tracking: FM -> TS | stop_battery_monitoring: FM -> BMS);
          (ack_stop_tracking: TS -> FM | ack_stop_battery_monitoring: BMS -> FM);
          ack_stop_monitoring: FM -> RS;
          
          // Gestione della ricarica
          (
            (recharge_request: RS -> S; ack_recharge_request: S -> RS)
            +
            (no_recharge: RS -> S; ack_no_recharge: S -> RS)
          );

          // Gestione pagamento finale
          (
            (unlock_money: RS -> B; ack_money_unlocked: B -> RS)
            |
            (send_charge: RS -> B; ack_charge_sent: B -> RS)
          );
          
          rental_summary: RS -> user;
          
          // Segnalazione danni
          (
            (
              report_damage: user -> RS; 
              ack_report_damage: RS -> user;
              vehicle_in_queue: RS --> LS;
              ack_vehicle_in_queue: LS --> RS;
            )
            +
            no_report_written: user -> RS;
          )
        )
      )
    )
  )      
);
```

---

## Proiezioni in Ruoli

Legenda: **!** = **Invio**, **?** = **Ricezione**, **1** = **skip**

### 1) Rental Service (RS)

```java
// FASE 0: RICERCA
show_available_vehicles?user; 
// (Qui RS interroga internamente il DB o i veicoli, assumiamo sia interno o sincrono)
return_vehicles!user;

(  
  // RAMO A: Noleggio Immediato (Scan QR)
  (
    scan_qr?user;
    
    // Pagamento: Pre-autorizzazione
    block_money!B; send_token?B;
    
    // Avvio Monitoraggio (Interazione con FM)
    start_monitoring!FM;
    // (RS non vede le chiamate interne di FM verso TS/BMS, quindi per lui sono skip)
    (1 | 1); 
    (1 | 1); 
    ack_monitoring?FM;
    
    // Sblocco Fisico
    unlock_vehicle!S; vehicle_unlocked?S;
    
    ack_rental_started!user;
    
    // Loop di Monitoraggio durante la corsa
    (
      request_update?user;
      trigger_read!FM;
      // Ricezione parallela dati (posizione e batteria aggregati da FM)
      send_vehicle_status_update?FM;
      update_display!user
    )*;
    
    // Fine Corsa
    end_ride?user;
    
    lock_vehicle!S; vehicle_locked?S;
    
    // Stop Monitoraggio
    stop_monitoring!FM;
    (1 | 1);
    (1 | 1);
    ack_stop_monitoring?FM;
    
    // Gestione Ricarica (Scelta basata su logica interna RS dopo check batteria)
    ( (recharge_request!S; ack_recharge_request?S) + (no_recharge!S; ack_no_recharge?S) );

    // Pagamento Finale
    ( (unlock_money!B; ack_money_unlocked?B) | (send_charge!B; ack_charge_sent?B) );
    
    rental_summary!user;
    
    // Gestione Danni
    (
      (report_damage?user; ack_report_damage!user; vehicle_in_queue!LS; ack_vehicle_in_queue?LS)
      +
      (no_report_written?user)
    )
  )
  
  + 
  
  // RAMO B: Prenotazione Breve
  (
    short_reservation?user; 
    
    block_money!B; send_token?B;
    
    ack_short_reservation!user;
    
    (
      // B1: Annullamento Esplicito Utente
      (
        cancel_reservation?user;
        ( (charge_money_block!B; ack_charge_money_block?B) + (unlock_money!B; ack_unlock_money?B) );
        reservation_canceled!user
      )
      
      +  
      
      // B2: Timeout (Evento generato internamente da RS)
      (
        timeout_notify!user; 
        charge_money_block!B; ack_charge_money_block?B;
        reservation_canceled!user
      )
      
      +
      
      // B3: Ritiro Veicolo (Happy Path - Identico alla parte centrale di A)
      (
        scan_qr?user;
      
        start_monitoring!FM; (1 | 1); (1 | 1); ack_monitoring?FM;
        
        unlock_vehicle!S; vehicle_unlocked?S;
        
        ack_rental_started!user;
        
        ( request_update?user; trigger_read!FM; send_vehicle_status_update?FM; update_display!user )*;
        
        end_ride?user;
        
        lock_vehicle!S; vehicle_locked?S;
        
        stop_monitoring!FM; (1 | 1); (1 | 1); ack_stop_monitoring?FM;
        
        ( (recharge_request!S; ack_recharge_request?S) + (no_recharge!S; ack_no_recharge?S) );

        ( (unlock_money!B; ack_money_unlocked?B) | (send_charge!B; ack_charge_sent?B) );
        
        rental_summary!user;
        
        ( (report_damage?user; ack_report_damage!user; vehicle_in_queue!LS; ack_vehicle_in_queue?LS) + (no_report_written?user) )
      )
    )
  )
)
```

---

### 2) User (Cliente - App)

```java
show_available_vehicles!RS; 
return_vehicles?RS;

(  
  // Scelta A: Noleggio Immediato
  (
    scan_qr!RS;
    
    // Skip fasi interne (Banca, FM, Stazione)
    1; 1; 
    1; (1 | 1); (1 | 1); 1;
    1; 1;
    
    ack_rental_started?RS;
    
    // Loop Monitoraggio
    ( request_update!RS; 1; 1; update_display?RS )*;
    
    end_ride!RS;
    
    1; 1; // Lock
    1; (1 | 1); (1 | 1); 1; // Stop FM
    ( (1; 1) + (1; 1) ); // Recharge
    ( (1; 1) | (1; 1) ); // Payment
    
    rental_summary?RS;
    
    ( (report_damage!RS; ack_report_damage?RS; 1; 1) + (no_report_written!RS) )
  )
  
  + 
  
  // Scelta B: Prenotazione Breve
  (
    short_reservation!RS; 
    
    1; 1; // Bank block
    
    ack_short_reservation?RS;
    
    (
      // B1: Decido di annullare
      (
        cancel_reservation!RS;
        ( (1; 1) + (1; 1) ); // Bank adjustment (invisibile a user)
        reservation_canceled?RS
      )
      
      +  
      
      // B2: Ricevo Timeout (Passivo)
      (
        timeout_notify?RS; 
        1; 1; // Bank charge
        reservation_canceled?RS
      )
      
      +
      
      // B3: Decido di ritirare (Scan QR)
      (
        scan_qr!RS;
      
        1; (1 | 1); (1 | 1); 1; // FM start
        1; 1; // Unlock
        
        ack_rental_started?RS;
        
        ( request_update!RS; 1; 1; update_display?RS )*;
        
        end_ride!RS;
        
        1; 1; // Lock
        1; (1 | 1); (1 | 1); 1; // FM stop
        ( (1; 1) + (1; 1) ); // Recharge
        ( (1; 1) | (1; 1) ); // Payment
        
        rental_summary?RS;
        
        ( (report_damage!RS; ack_report_damage?RS; 1; 1) + (no_report_written!RS) )
      )
    )
  )
)
```

---

### 3) Bank (B)

```java
1; 1; // Fase Ricerca

(  
  // RAMO A
  (
    1; // scan
    block_money?RS; send_token!RS;
    
    // Tutto il noleggio è SKIP per la banca
    1; (1 | 1); (1 | 1); 1;
    1; 1; 1;
    (1; 1; 1; 1)*;
    1; 1; 1;
    1; (1 | 1); (1 | 1); 1;
    ( (1; 1) + (1; 1) );

    // Pagamento Finale
    ( (unlock_money?RS; ack_money_unlocked!RS) | (send_charge?RS; ack_charge_sent!RS) );
    
    1; ( (1; 1; 1; 1) + 1 ) // Summary & Damage
  )
  
  + 
  
  // RAMO B
  (
    1; // short_res
    block_money?RS; send_token!RS;
    1; // ack_short
    
    (
      // B1: Annullamento
      (
        1; // cancel msg
        ( (charge_money_block?RS; ack_charge_money_block!RS) + (unlock_money?RS; ack_unlock_money!RS) );
        1 // canceled msg
      )
      +  
      // B2: Timeout
      (
        1; // timeout notify
        charge_money_block?RS; ack_charge_money_block!RS;
        1 // canceled msg
      )
      +
      // B3: Ritiro (Happy Path)
      (
        1; // scan
        1; (1 | 1); (1 | 1); 1; 
        1; 1; 1;
        (1; 1; 1; 1)*;
        1; 1; 1; 1; (1 | 1); (1 | 1); 1; ( (1; 1) + (1; 1) );
        
        // Pagamento Finale
        ( (unlock_money?RS; ack_money_unlocked!RS) | (send_charge?RS; ack_charge_sent!RS) );
        
        1; ( (1; 1; 1; 1) + 1 )
      )
    )
  )
)
```

---

### 4) Station (S)

```java
// Init: 1

(  
  // RAMO A
  (
    1; 1; 1; 1; (1 | 1); (1 | 1); 1; // Skip fase avvio fino a unlock
    
    unlock_vehicle?RS; vehicle_unlocked!RS;
    1; // Ack rental
    
    (1; 1; ( (1; 1) | (1; 1) ); 1; 1)*; // Loop monitoraggio (S non fa nulla)
    
    1; // End ride
    
    lock_vehicle?RS; vehicle_locked!RS;
    
    1; (1 | 1); (1 | 1); 1; // Stop FM
    
    // Ricarica (S è coinvolta)
    ( (recharge_request?RS; ack_recharge_request!RS) + (no_recharge?RS; ack_no_recharge!RS) );

    // Pagamento & Resto
    ( (1; 1) | (1; 1) ); 1; ( (1; 1; 1; 1) + 1 )
  )
  
  + 
  
  // RAMO B
  (
    1; 1; 1; 1;
    
    (
      // B1 & B2: S non fa nulla
      (1; ( (1; 1) + (1; 1) ); 1) + (1; 1; 1; 1)
      
      +
      
      // B3: Ritiro (Identico a A)
      (
        1; 1; (1 | 1); (1 | 1); 1;
        
        unlock_vehicle?RS; vehicle_unlocked!RS;
        1;
        (1; 1; ( (1; 1) | (1; 1) ); 1; 1)*;
        1;
        
        lock_vehicle?RS; vehicle_locked!RS;
        
        1; (1 | 1); (1 | 1); 1;
        
        ( (recharge_request?RS; ack_recharge_request!RS) + (no_recharge?RS; ack_no_recharge!RS) );

        ( (1; 1) | (1; 1) ); 1; ( (1; 1; 1; 1) + 1 )
      )
    )
  )
)
```

---

### 5) Fleet Management (FM)

```java
// Init: 1

(  
  // RAMO A
  (
    1; 1; 1; // Scan & Bank
    
    start_monitoring?RS;
    (start_tracking!TS | start_battery_monitoring!BMS);
    (ack_tracking?TS | ack_battery_monitoring?BMS);
    ack_monitoring!RS;
    
    1; 1; 1; // Unlock & Ack rental
    
    // Loop
    (
      1; // User request
      trigger_read?RS;
      ( (ask_pos!TS; send_position_update?TS) | (ask_batt!BMS; send_battery_update?BMS) );
      send_vehicle_status_update!RS;
      1 // User update
    )*;
    
    1; 1; 1; // End & Lock
    
    stop_monitoring?RS;
    (stop_tracking!TS | stop_battery_monitoring!BMS);
    (ack_stop_tracking?TS | ack_stop_battery_monitoring?BMS);
    ack_stop_monitoring!RS;
    
    // Resto è skip
    ( (1; 1) + (1; 1) );
    ( (1; 1) | (1; 1) );
    1;
    ( (1; 1; 1; 1) + 1 )
  )
  
  + 
  
  // RAMO B
  (
    1; 1; 1; 1; // Reservation phase
    
    (
      // B1 & B2: FM non fa nulla
      (1; ( (1; 1) + (1; 1) ); 1) + (1; 1; 1; 1)
      
      +
      
      // B3: Ritiro (Identico a A)
      (
        1; // Scan
        
        start_monitoring?RS;
        (start_tracking!TS | start_battery_monitoring!BMS);
        (ack_tracking?TS | ack_battery_monitoring?BMS);
        ack_monitoring!RS;
        
        1; 1; 1;
        
        (
          1; trigger_read?RS;
          ( (ask_pos!TS; send_position_update?TS) | (ask_batt!BMS; send_battery_update?BMS) );
          send_vehicle_status_update!RS; 1
        )*;
        
        1; 1; 1;
        
        stop_monitoring?RS;
        (stop_tracking!TS | stop_battery_monitoring!BMS);
        (ack_stop_tracking?TS | ack_stop_battery_monitoring?BMS);
        ack_stop_monitoring!RS;
        
        // Resto è skip
        ( (1; 1) + (1; 1) ); ( (1; 1) | (1; 1) ); 1; ( (1; 1; 1; 1) + 1 )
      )
    )
  )
)
```

---

### 6) Tracking Service (TS)

```java
// Init: 1

(  
  // RAMO A
  (
    1; 1; 1; // Start fase RS
    
    1; // Start mon (RS->FM)
    (start_tracking?FM | 1); // Riceve parallelo
    (ack_tracking!FM | 1);   // Risponde parallelo
    1; // Ack mon (FM->RS)
    
    1; 1; 1; 
    
    // Loop
    (
      1; 1; 
      ( (ask_pos?FM; send_position_update!FM) | (1; 1) );
      1; 1
    )*;
    
    1; 1; 1; 
    
    1;
    (stop_tracking?FM | 1);
    (ack_stop_tracking!FM | 1);
    1;
    
    // Resto skip
    ( (1; 1) + (1; 1) ); ( (1; 1) | (1; 1) ); 1; ( (1; 1; 1; 1) + 1 )
  )
  
  + 
  
  // RAMO B
  (
    1; 1; 1; 1;
    
    (
      (1; ( (1; 1) + (1; 1) ); 1) + (1; 1; 1; 1)
      +
      // B3: Identico a A
      (
        1; 1; 
        (start_tracking?FM | 1); (ack_tracking!FM | 1); 
        1; 1; 1; 1;
        
        ( 1; 1; ( (ask_pos?FM; send_position_update!FM) | (1; 1) ); 1; 1 )*;
        
        1; 1; 1; 1;
        (stop_tracking?FM | 1); (ack_stop_tracking!FM | 1);
        1;
        ( (1; 1) + (1; 1) ); ( (1; 1) | (1; 1) ); 1; ( (1; 1; 1; 1) + 1 )
      )
    )
  )
)
```

---

### 7) Battery Monitoring Service (BMS)

```java
// Init: 1

(  
  // RAMO A
  (
    1; 1; 1; 
    
    1;
    (1 | start_battery_monitoring?FM); 
    (1 | ack_battery_monitoring!FM);
    1;
    
    1; 1; 1;
    
    // Loop
    (
      1; 1; 
      ( (1; 1) | (ask_batt?FM; send_battery_update!FM) );
      1; 1
    )*;
    
    1; 1; 1;
    
    1;
    (1 | stop_battery_monitoring?FM);
    (1 | ack_stop_battery_monitoring!FM);
    1;
    
    ( (1; 1) + (1; 1) ); ( (1; 1) | (1; 1) ); 1; ( (1; 1; 1; 1) + 1 )
  )
  
  + 
  
  // RAMO B
  (
    1; 1; 1; 1;
    
    (
      (1; ( (1; 1) + (1; 1) ); 1) + (1; 1; 1; 1)
      +
      // B3: Identico a A
      (
        1; 1; 
        (1 | start_battery_monitoring?FM); (1 | ack_battery_monitoring!FM);
        1; 1; 1; 1;
        
        ( 1; 1; ( (1; 1) | (ask_batt?FM; send_battery_update!FM) ); 1; 1 )*;
        
        1; 1; 1; 1;
        (1 | stop_battery_monitoring?FM); (1 | ack_stop_battery_monitoring!FM);
        1;
        ( (1; 1) + (1; 1) ); ( (1; 1) | (1; 1) ); 1; ( (1; 1; 1; 1) + 1 )
      )
    )
  )
)
```

---

### 8) Logistic Service (LS)

```java
// Init: 1

(
  // RAMO A
  (
    // Skip totale fino alla scelta finale
    1; 1; 1; 1; (1 | 1); (1 | 1); 1; 
    1; 1; 1;
    (1; 1; ( (1; 1) | (1; 1) ); 1; 1)*;
    1; 1; 1;
    1; (1 | 1); (1 | 1); 1;
    ( (1; 1) + (1; 1) );
    ( (1; 1) | (1; 1) );
    1;
    
    // Gestione Danni
    (
      (1; 1; vehicle_in_queue?RS; ack_vehicle_in_queue!RS) // Report Damage (User->RS->User->RS->LS)
      +
      (1) // No Report (LS non coinvolto)
    )
  )
  
  +
  
  // RAMO B
  (
    1; 1; 1; 1;
    
    (
      // B1 & B2: LS non fa nulla
      (1; ( (1; 1) + (1; 1) ); 1) + (1; 1; 1; 1)
      +
      // B3: Ritiro (Identico a A)
      (
        // ... (Tutto skip) ...
        // Fino alla fine:
        ( (1; 1; vehicle_in_queue?RS; ack_vehicle_in_queue!RS) + (1) )
      )
    )
  )
)
```