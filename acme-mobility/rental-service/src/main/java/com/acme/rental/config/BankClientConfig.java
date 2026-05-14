package com.acme.rental.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.oxm.jaxb.Jaxb2Marshaller;

import com.acme.rental.integration.bank.BankClient;

import org.springframework.context.annotation.Configuration;


@Configuration
public class BankClientConfig {

    @Value("${bank.service.soap.url:http://localhost:8000}")
    private String bankServiceUrl;

    @Bean
    public Jaxb2Marshaller marshaller() {
        Jaxb2Marshaller marshaller = new Jaxb2Marshaller();
        marshaller.setContextPath("com.acme.rental.integration.bank.generated");
        return marshaller;
    }

    @Bean
    public BankClient bankClient(Jaxb2Marshaller marshaller) {
        BankClient client = new BankClient();
        client.setDefaultUri(bankServiceUrl);
        client.setMarshaller(marshaller);
        client.setUnmarshaller(marshaller);
        return client;
    }
}

