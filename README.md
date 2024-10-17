# QueryQuotient Backend

Welcome to the **QueryQuotient Backend**, the core API that powers the survey creation, voting, and result analysis features for the QueryQuotient platform. This backend is built using **Node.js**, **Express.js**, and **MongoDB** and includes secure **JWT-based authentication** and role-based access control.

## Frontend Repository
[Click Here to Visit Frontend Code](https://github.com/dear-mahmud-bd/survey-web-client)

## Features
- **JWT Authentication**: Secure access to private routes using JSON Web Tokens.
- **Role Management**: Users are assigned roles such as Admin, Surveyor, User, or Pro-User.
- **Survey Management**: Full CRUD functionality for surveys, including question options and voting systems.
- **Pro User Subscription**: Stripe integration for handling pro-user membership subscriptions.
- **Survey Feedback**: Admin can leave feedback on unpublished surveys.
- **Voting System**: Users can cast votes on surveys (Yes/No options).
- **Dynamic Survey Status**: Admins can publish/unpublish surveys.

## Technologies Used
- **Node.js**: Backend JavaScript runtime environment.
- **Express.js**: Web framework used to build the API.
- **MongoDB**: NoSQL database for storing surveys, users, votes, and feedback.
- **JWT (JSON Web Token)**: For secure user authentication and session management.
- **Stripe**: Used for payment processing and pro-user subscriptions.
- **CORS**: Handles cross-origin requests to allow the frontend to interact with the backend.
- **dotenv**: Manage environment variables securely.
 