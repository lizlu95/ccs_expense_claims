[![pipeline status](https://gitlab.com/cpsc3192017w2/coast-capital/Dining-Philosophers/ccs-expense-claims/badges/master/pipeline.svg)](https://gitlab.com/cpsc3192017w2/coast-capital/Dining-Philosophers/ccs-expense-claims/commits/master) [![coverage report](https://gitlab.com/cpsc3192017w2/coast-capital/Dining-Philosophers/ccs-expense-claims/badges/master/coverage.svg)](https://gitlab.com/cpsc3192017w2/coast-capital/Dining-Philosophers/ccs-expense-claims/commits/master)

# ccs-expense-claims

A web application to track internal expense claims for Coast Capital Savings Credit Union.

# Requirements

* Node.js >= 9.2.0
* npm >= 5.5.1

# Getting Started

1. Ensure requirements are installed and working.
2. Ensure your MySQL database is installed and running.
3. Set your environment variables.

    ```
    $ export ECA_DATABASE_HOST_TEST=localhost
    $ export ECA_DATABASE_USERNAME_TEST=username
    $ export ECA_DATABASE_PASSWORD_TEST=password
    $ export ECA_DATABASE_NAME_TEST=name
    $ export ECA_DATABASE_HOST_DEVELOPMENT=localhost
    $ export ECA_DATABASE_USERNAME_DEVELOPMENT=username
    $ export ECA_DATABASE_PASSWORD_DEVELOPMENT=password
    $ export ECA_DATABASE_NAME_DEVELOPMENT=name
    $ export ECA_DATABASE_HOST_PRODUCTION=localhost
    $ export ECA_DATABASE_USERNAME_PRODUCTION=username
    $ export ECA_DATABASE_PASSWORD_PRODUCTION=password
    $ export ECA_DATABASE_NAME_PRODUCTION=name
    ```

4. Navigate to cloned directory.

    ```$ cd ccs-expense-claims```

5. Install required dependencies.

    ```$ npm install```

5. Run migrations.

    ```$ npm run db:migrate```

6. Seed your environment.

    ```$ npm run db:seed```

6. Start server.

    ```$ npm start```

7. Access server via browser on `PORT` or 3000.

# Contributing

1. Fork.
2. Create feature branch.

    ```$ git checkout -b my-new-feature```

3. Commit changes.

    ```
    $ git add .
    $ git commit -m 'My new feature'
    ```

4. Verify tests.

    ```$ npm test```

5. Push to branch.

    ```$ git push origin my-new-feature```

6. Create new pull request.
