

type CreateAccountRequest: void {
    .accountId: string
    .amount: double
}

type CreateAccountResponse: void {
    .success: bool
    .message: string
}

interface AccountRegistrationInterface {
    RequestResponse:
        createAccount ( CreateAccountRequest ) ( CreateAccountResponse )
}