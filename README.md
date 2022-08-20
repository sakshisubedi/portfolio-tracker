# Portfolio Tracking API
A portfolio tracking API is implemented which does CRUD operations on trades. It also provide an aggragate view of all securities in the portfolio and calculate returns on them.

## Setup
Step by step guide to setup the application

```bash
git clone git@github.com:sakshisubedi/portfolio-tracker
```

Install dependencies

```
npm install
```

Along with code snippets that needs to be run

```bash
npm start
```

And necessary configurations to be changed for different environments

```yaml
ENVIRONMENT
  - PORT: <PORT-NO>
  - DB_URL: <MONGO-URL>
  - DB_NAME: <DATABASE-NAME>
  - NODE_ENV: <NODE-ENVIRONMENT>
```
