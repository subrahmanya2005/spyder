SaveMate
Project Overview
SaveMate is a web-based fintech application designed to assist users with irregular income streams in building consistent and sustainable savings habits. By combining an intuitive interface with behavioral nudges and secure financial tracking, SaveMate enables users to manage their finances in a structured and disciplined manner.
________________________________________
Problem Statement
Smart Savings for Irregular Income
Problem
Gig workers and daily wage earners have unpredictable income, making consistent saving difficult.
Challenge
Create a tool that:
•	Suggests micro-savings dynamically
•	Adapts based on income patterns
•	Nudges users using behavioral insights
Goal
Help users build financial discipline despite irregular income streams.
________________________________________
Solution
SaveMate provides a flexible and goal-oriented savings platform tailored for irregular income users. It focuses on micro-savings, structured financial behavior, and controlled withdrawals. By integrating behavioral nudges and goal tracking, the system encourages users to build consistent saving habits over time.
________________________________________
Core Features
•	Savings Wallet System
Centralized wallet to manage deposits from bank and cash sources
•	Goal-Based Savings
Create goals, track progress, and restrict withdrawals until completion
•	Emergency Withdrawal
OTP-based verification to ensure controlled access to funds
•	Behavioral Email Nudging
Automated emails (welcome, inactivity, first save) using Resend API
•	Investment Module (Demo)
Simulated partner-based investment system using internal wallet
•	Passbook System
Download transaction history (last 10, last 50, full history)
•	Multi-Language Support
English, Hindi, Kannada
•	Real-Time Updates
Socket-based live data synchronization
•	Profile Management
Secure profile handling with Cloudinary-based image uploads
________________________________________
Tech Stack
Frontend
•	Next.js (App Router)
•	JavaScript
•	Tailwind CSS
Backend
•	Next.js API Routes
•	Node.js
Database
•	MongoDB (Mongoose)
Authentication
•	JWT
•	HTTP-only Cookies
Payments
•	Razorpay
•	Internal Wallet System
Email
•	Resend API
Storage
•	Cloudinary
________________________________________
System Architecture
SaveMate follows a full-stack Next.js architecture:
•	Frontend interacts with API routes
•	Backend handles authentication, transactions, and business logic
•	MongoDB stores structured financial data
•	Socket.io enables real-time updates
•	External services (Resend, Cloudinary, Razorpay) are securely integrated
________________________________________
Folder Structure
•	/app — Frontend routes, layouts, and pages (App Router with locale support)
•	/app/api — Backend API routes for authentication, savings, and transactions
•	/components — Reusable UI components
•	/models — Mongoose schemas (User, Account, Goal, Transaction)
•	/lib — Utilities (DB connection, auth, email, validations)
________________________________________
Setup Instructions
Prerequisites
•	Node.js (v18 or higher)
•	MongoDB database
Installation
git clone <repository-url>
cd savemate
npm install
npm run dev
Application runs at:
http://localhost:3000
________________________________________
Environment Variables
Create .env.local:
MONGODB_URI=
JWT_SECRET=
RESEND_API_KEY=
RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
________________________________________
Security Considerations
•	Passwords are hashed using bcrypt
•	JWT stored in secure HTTP-only cookies
•	OTP verification for sensitive actions
•	Input validation for all transactions
•	Environment variables secured on server-side
________________________________________
Future Improvements
•	Live Razorpay payment integration
•	AI-based savings prediction
•	Expense tracking system
•	Advanced analytics dashboard
________________________________________
Team Details
Team Name: Spyder
•	Sachin Upparna
•	Subrahmanya P
•	Shreyas KR
•	Vighnesh N
________________________________________
Summary
SaveMate delivers a structured and behavior-driven approach to savings, enabling users with irregular income to build financial discipline through guided actions, goal tracking, and controlled transactions.
