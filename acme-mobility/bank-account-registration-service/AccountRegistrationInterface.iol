

type CreateAccountRequest: void {
    .accountId: string
    .balance: double
}

type CreateAccountResponse: void {
    .success: bool
    .message: string
}

interface AccountRegistrationInterface {
    RequestResponse:
        createAccount ( CreateAccountRequest ) ( CreateAccountResponse )
}