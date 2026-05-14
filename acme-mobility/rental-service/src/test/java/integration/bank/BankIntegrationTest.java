package integration.bank;

import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit4.SpringJUnit4ClassRunner;
import org.springframework.test.context.support.AnnotationConfigContextLoader;

import com.acme.rental.config.BankClientConfig;
import com.acme.rental.integration.bank.BankClient;
import com.acme.rental.integration.bank.generated.BlockMoneyResponse;
import com.acme.rental.integration.bank.generated.ChargeMoneyBlockResponse;
import com.acme.rental.integration.bank.generated.ChargeMoneyResponse;
import com.acme.rental.integration.bank.generated.UnlockMoneyResponse;

@RunWith(SpringJUnit4ClassRunner.class)
@ContextConfiguration(classes = BankClientConfig.class, loader = AnnotationConfigContextLoader.class)
public class BankIntegrationTest {

    @Autowired
    private BankClient bankClient;

    private final String accountId = "TEST";


    @Test
    public void testBlockMoney() {
        BlockMoneyResponse blockResponse = bankClient.blockMoney(accountId);
        assert blockResponse.isSuccess();
        assert blockResponse.getToken() != null;
    }

    @Test
    public void testUnlockMoney() {
        BlockMoneyResponse blockResponse = bankClient.blockMoney(accountId);
        assert blockResponse.isSuccess();
        assert blockResponse.getToken() != null;
        String token = blockResponse.getToken();


        UnlockMoneyResponse unlockResponse = bankClient.unlockMoney(accountId, token);
        assert unlockResponse.isSuccess();
    }

    @Test
    public void testChargeMoney() {
        BlockMoneyResponse blockResponse = bankClient.blockMoney(accountId);
        assert blockResponse.isSuccess();
        assert blockResponse.getToken() != null;
        String token = blockResponse.getToken();

        ChargeMoneyResponse chargeResponse = bankClient.chargeMoney(accountId, token);
        assert chargeResponse.isSuccess();
    }

    @Test
    public void testChargeMoneyBlock() {
        BlockMoneyResponse blockResponse = bankClient.blockMoney(accountId);
        assert blockResponse.isSuccess();
        assert blockResponse.getToken() != null;
        String token = blockResponse.getToken();

        ChargeMoneyBlockResponse chargeResponse = bankClient.chargeMoneyBlock(accountId, token);
        assert chargeResponse.isSuccess();
    }
}
