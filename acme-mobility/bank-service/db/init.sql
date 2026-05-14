CREATE TABLE IF NOT EXISTS accounts (
    id VARCHAR(255) PRIMARY KEY,
    balance DOUBLE PRECISION,
    blocked_amount DOUBLE PRECISION
);

INSERT INTO accounts (id, balance, blocked_amount) VALUES ('TEST', 100.00, 0.00), ('TEST2', 1000.00, 0.00);