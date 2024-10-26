# Project Setup

This project consists of four worker services:

* **Billing**
* **Notifications**
* **Payments**
* **Subscriptions**

## Prerequisites

1. Node.js is required.
2. Before you can start publishing your service to cloudflare worker, you must sign up for a Cloudflare Workers account first, you can check out this [document](https://developers.cloudflare.com/workers/get-started/guide).

## Getting Started

1. **Clone the Repository:**
   ```bash
   git clone [https://github.com/your-username/your-project-name.git](https://github.com/your-username/your-project-name.git)
   cd your-project-name
   ```
2. **Install Dependencies:**
   ```bash
   npm install
   ```

## Building the Project and Installing Dependencies
To install all dependencies and build all workers:
   ```bash
   npm run build
   ```
This will also substitute the configuration files examples like `worker.toml.example` and `dev.vars.example` to `worker.toml` and `dev.vars`

## Running Tests
To run tests for all workers:
   ```bash
   npm run test
   ```

## Deploying the Project
To deploy all workers:
   ```bash
   npm run deploy

   ```
## Running the Project Locally
To start all workers in development mode:
   ```bash
   npm run dev
   ```


## Additional Notes
- Worker-Specific Configuration: Each worker directory contains its own worker.toml and dev.vars files for configuration.
- Deployment Instructions: Specific deployment instructions will vary depending on your deployment environment.

For more detailed instructions and configuration options, please refer to the individual worker directories.