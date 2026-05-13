package com.acme.rental.integration.bank;


import org.springframework.ws.client.core.support.WebServiceGatewaySupport;

import com.acme.rental.integration.bank.generated.BlockMoney;
import com.acme.rental.integration.bank.generated.BlockMoneyResponse;
import com.acme.rental.integration.bank.generated.ChargeMoney;
import com.acme.rental.integration.bank.generated.ChargeMoneyBlock;
import com.acme.rental.integration.bank.generated.ChargeMoneyBlockResponse;
import com.acme.rental.integration.bank.generated.ChargeMoneyResponse;
import com.acme.rental.integration.bank.generated.UnlockMoney;
import com.acme.rental.integration.bank.generated.UnlockMoneyResponse;


public class BankClient extends WebServiceGatewaySupport {

    public BlockMoneyResponse blockMoney(String accountId) {
        BlockMoney request = new BlockMoney();
        request.setAccountId(accountId);
        return (BlockMoneyResponse) getWebServiceTemplate().marshalSendAndReceive(request);
    }

    public ChargeMoneyBlockResponse chargeMoneyBlock(String accountId, String token) {
        ChargeMoneyBlock request = new ChargeMoneyBlock();
        request.setAccountId(accountId);
        request.setToken(token);
        return (ChargeMoneyBlockResponse) getWebServiceTemplate().marshalSendAndReceive(request);
    }

    public UnlockMoneyResponse unlockMoney(String accountId, String token) {
        UnlockMoney request = new UnlockMoney();
        request.setAccountId(accountId);
        request.setToken(token);
        return (UnlockMoneyResponse) getWebServiceTemplate().marshalSendAndReceive(request);
    }

    public ChargeMoneyResponse chargeMoney(String accountId, String token) {
        ChargeMoney request = new ChargeMoney();
        request.setAccountId(accountId);
        request.setToken(token);
        return (ChargeMoneyResponse) getWebServiceTemplate().marshalSendAndReceive(request);
    }
}
