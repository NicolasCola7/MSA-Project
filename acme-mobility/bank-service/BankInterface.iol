// Block money
type BlockMoneyRequest: void {
    .accountId: string
}

/*
type BlockMoneyResponse: void {
    .token?: string
    .success: bool
    .message: string
} */

// Unlock Money
type UnlockMoneyRequest: void {
    .accountId: string
    .token: string
}

/*
type UnlockMoneyResponse: void {
    .success: bool
    .message: string
}*/

// Charge money block
type ChargeMoneyBlockRequest: void {
    .accountId: string
    .token: string
}

/*
type ChargeMoneyBlockResponse: void {
    .success: bool
    .message: string
} */

// Charge money
type ChargeMoneyRequest: void {
    .accountId: string
    .token: string
    .amount: double
}

/*
type ChargeMoneyResponse: void {
    .success: bool
    .message: string
    .token: string
} */

type BankResponse: void {
    .success: bool
    .message: string
    .token?: string
}


interface BankInterface {
    
    RequestResponse:
        blockMoney ( BlockMoneyRequest ) ( BankResponse ),
        unlockMoney ( UnlockMoneyRequest ) ( BankResponse ),
        chargeMoneyBlock ( ChargeMoneyBlockRequest ) ( BankResponse ),
        chargeMoney ( ChargeMoneyRequest ) ( BankResponse )

}
