-- Drop existing tables if they exist
DROP TABLE IF EXISTS Customers;
DROP TABLE IF EXISTS SubscriptionPlan;

-- Create SubscriptionPlan table
CREATE TABLE IF NOT EXISTS SubscriptionPlan (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    billing_cycle TEXT CHECK(billing_cycle IN ('monthly', 'yearly')) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    status TEXT CHECK(status IN ('active', 'inactive')) NOT NULL
);

-- Create Customers table
CREATE TABLE IF NOT EXISTS Customers (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    subscription_plan_id INTEGER,
    subscription_status TEXT CHECK(subscription_status IN ('active', 'cancelled', 'paused')) NOT NULL,
    FOREIGN KEY (subscription_plan_id) REFERENCES SubscriptionPlan(id)
);

-- Insert specified subscription plans
INSERT INTO SubscriptionPlan (id, name, billing_cycle, price, status)
VALUES 
    (1, 'Basic', 'monthly', 9.99, 'active'),
    (2, 'Pro', 'monthly', 14.99, 'active'),
    (3, 'Enterprise', 'monthly', 29.99, 'active'),
    (4, 'Basic', 'yearly', 99.99, 'active'),
    (5, 'Pro', 'yearly', 149.99, 'active'),
    (6, 'Enterprise', 'yearly', 299.99, 'active');

-- Insert sample data for Customers
INSERT INTO Customers (id, name, email, subscription_plan_id, subscription_status)
VALUES 
    (1, 'Maria Anders', 'maria@example.com', 1, 'active'),           -- Basic Monthly
    (2, 'Thomas Hardy', 'thomas@example.com', 2, 'active'),          -- Pro Monthly
    (3, 'Victoria Ashworth', 'victoria@example.com', 5, 'cancelled'), -- Pro Yearly
    (4, 'Random Name', 'random@example.com', NULL, 'paused'),        -- No subscription, paused status
    (5, 'John Doe', 'john.doe@example.com', 3, 'active'),            -- Enterprise Monthly
    (6, 'Jane Smith', 'jane.smith@example.com', 4, 'active'),        -- Basic Yearly
    (7, 'Michael Brown', 'michael.brown@example.com', 6, 'active');  -- Enterprise Yearly
