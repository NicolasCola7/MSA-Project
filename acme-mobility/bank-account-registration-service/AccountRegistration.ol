include "database.iol"
include "console.iol"
include "AccountRegistrationInterface.iol"

inputPort AccountRegistration {
    Location: "socket://localhost:8080"
    Protocol: http {
        format = "json"
        osc << {
            createAccount << {
                template = "/createAccount"
                method = "post"
                statusCodes = 201 // Created
                statusCodes.TypeMismatch = 400
                statusCodes.InternalError = 500
                allowCORS = true
                response.headers -> responseHeaders
            }
        }
    }
    Interfaces: AccountRegistrationInterface
}

execution { concurrent }

init {
    
    with( connectionInfo ) {
        .driver = "postgresql";
        .host = "bank-service-db";
        .port = 5432;
        .database = "bank";
        .username = "user";
        .password = "password"
    };

    println@Console( "Connecting to PostgreSQL..." )();
    connect@Database( connectionInfo )();
    println@Console( "Database connection established!" )()
}

main {

    [ createAccount( request )( response ) {
        println@Console( "[createAccount] Incoming REST request. Account ID: " + request.accountId + " | Initial deposit: " + request.balance )();

        checkQuery = "SELECT id FROM accounts WHERE id = :id";
        checkQuery.id = request.accountId;
        query@Database( checkQuery )( checkResult );

        if ( #checkResult.row > 0 ) {
            response.success = false;
            response.message = "Creation failed: Account ID '" + request.accountId + "' already exists.";
            println@Console( "[createAccount] REJECTED: Account already exists." )()
            
        } else {
            
            insertQuery = "INSERT INTO accounts (id, balance, blocked_amount) VALUES (:id, :balance, 0.00)";
            insertQuery.id = request.accountId;
            insertQuery.balance = request.balance;
            
            update@Database( insertQuery )( rowsAffected );

            if ( rowsAffected > 0 ) {
                response.success = true;
                response.message = "Account created successfully!";
                println@Console( "[createAccount] SUCCESS: Account created in database." )()
            } else {
                response.success = false;
                response.message = "Creation failed: Internal database error.";
                println@Console( "[createAccount] FAILED: Insert affected 0 rows." )()
            }
        }
    } ]
}