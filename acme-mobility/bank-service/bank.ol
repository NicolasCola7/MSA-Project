include "BankInterface.iol"
include "database.iol"
include "console.iol"

inputPort BankPort {
    Location: "socket://localhost:8000"
    Protocol: soap {
        .wsdl = "./BankWsdl.wsdl";
        .wsdl.port = "BankPortServicePort";
        .dropRootValue = true;
        .namespace = "bank.xsd"
    }
    Interfaces: BankInterface
}

execution { concurrent }

cset {
    token: 
        ChargeMoneyBlockRequest.token
        UnlockMoneyRequest.token
        ChargeMoneyRequest.token
        ChargeMoneyBlockResponse.token
        BlockMoneyResponse.token
        UnlockMoneyResponse.token
        ChargeMoneyResponse.token
            
}

init {
    println@Console( "Starting Bank Service..." )();
    
    with( connectionInfo ) {
        .driver = "postgresql";
        .host = "bank-service-db";
        .port = 5432;
        .database = "bank";
        .username = "user";
        .password = "password"
    };

    println@Console( "Connecting to PostgreSQL at " + connectionInfo.host + ":" + connectionInfo.port + "..." )();
    connect@Database( connectionInfo )();
    println@Console( "Database connection established successfully!" )();
    
    keepRunning = true
}

main {
    
    blockMoney ( request ) ( response ) {
        println@Console( "[blockMoney] Request received for account ID: " + request.accountId )();
        
        query = "select balance, blocked_amount from accounts where id = :id";
        query.id = request.accountId;
        query@Database( query )( queryResult );
        
        if ( #queryResult.row > 0 ) {
            balance = queryResult.row[0].balance;
            blockedAmount = queryResult.row[0].blocked_amount;
            
            println@Console( "[blockMoney] Account found. Current balance: " + balance + " | Blocked amount: " + blockedAmount )();
            
            if ( balance >= 10.00  && blockedAmount == 0.00) { // Assuming a minimum block amount of 10.00
                println@Console( "[blockMoney] Funds available. Executing block..." )();
                
                updateQuery = "update accounts set blocked_amount = blocked_amount + 10.0 where id = :id";
                updateQuery.id = request.accountId;
                update@Database( updateQuery )( rowsAffected );

                response.success = true;
                response.token = csets.token = new;
                response.message = "Money blocked successfully";
                
                println@Console( "[blockMoney] SUCCESS: Block applied. Session token generated: " + response.token )()
                
            } else if ( balance >= 10.00 && blockedAmount > 0.00) {
                response.success = false;
                response.message = "Money already blocked";
                
                println@Console( "[blockMoney] REJECTED: Money already blocked.")()
            } else {
                response.success = false;
                response.message = "Insufficient funds";
                
                println@Console( "[blockMoney] REJECTED: Insufficient funds." )()
            }
            
        } else {
            response.success = false;
            response.message = "Account not found";
            println@Console( "[blockMoney] REJECTED: Account not found." )()
        }
    }

    while (keepRunning) {
        [ chargeMoneyBlock ( request ) ( response ) {
            println@Console( "[chargeMoneyBlock] Request received for token: " + request.token )();
            
            updateQuery = "update accounts set balance = balance - 10.0, blocked_amount = 0.00 where id = :id";
            updateQuery.id = request.accountId;
            update@Database( updateQuery )( rowsAffected );

            if ( rowsAffected > 0 ) {
                response.success = true;
                response.message = "Money block charged successfully";
                keepRunning = false;
                println@Console( "[chargeMoneyBlock] SUCCESS: Block charged and cleared. Closing session." )()
            } else {
                response.success = false;
                response.message = "Charge failed: Insufficient funds or invalid account ID";
                println@Console( "[chargeMoneyBlock] FAILED: Update affected 0 rows." )()
            }
        }]


        [ unlockMoney ( request ) ( response ) {
            println@Console( "[unlockMoney] Request received for token: " + request.token )();
            
            updateQuery = "update accounts set blocked_amount = 0.00 where id = :id";
            updateQuery.id = request.accountId;
            update@Database( updateQuery )( rowsAffected );

            if ( rowsAffected > 0 ) {
                response.success = true;
                response.message = "Money unlocked successfully";
                keepRunning = false;
                println@Console( "[unlockMoney] SUCCESS: Money unlocked. Closing session." )()
            } else {
                response.success = false;
                response.message = "Unlock failed: Invalid account ID";
                println@Console( "[unlockMoney] FAILED: Update affected 0 rows." )()
            }
        }]

        [ chargeMoney ( request ) ( response ) {
            println@Console( "[chargeMoney] Request received for token: " + request.token + " | Amount: " + request.amount )();
            
            updateQuery = "update accounts set balance = balance - :amount, blocked_amount = 0.00 where id = :id";
            updateQuery.id = request.accountId;
            updateQuery.amount = double(request.amount);
            update@Database( updateQuery )( rowsAffected );

            if ( rowsAffected > 0 ) {
                response.success = true;
                response.message = "Money charged successfully";
                keepRunning = false;
                println@Console( "[chargeMoney] SUCCESS: Money charged directly. Closing session." )()
            } else {
                response.success = false;
                response.message = "Charge failed: Insufficient funds or invalid account ID";
                println@Console( "[chargeMoney] FAILED: Update affected 0 rows." )()
            }
        }]
    }
}