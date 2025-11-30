# Blockchain Payment System - 100% Java (Swing GUI)

## Overview
Your Blockchain Payment System now uses **100% Java** with a professional **Swing GUI** desktop application. The entire project is pure Java - no HTML, CSS, or JavaScript.

## What's New

### ✅ Replaced Web Interface with Java Swing GUI
- **Before**: Web interface (HTML/CSS/JavaScript) + Java backend
- **Now**: Java Swing desktop application + Java backend
- **Result**: 100% Java from top to bottom

### Deleted Files
- `index.html` - No longer needed
- `style.css` - No longer needed
- `app.js` - No longer needed
- `WebFrontendGenerator.java` - No longer needed
- `BlockchainAPI.java` - No longer needed (HTTP server not needed)

### New Files
- `BlockchainPaymentGUI.java` - Main Swing GUI application (1000+ lines)

## Architecture

### Java Files (19 total)
"# Blockchain Payment System (Java Swing)\n\nThis project is a desktop Blockchain Payment System built entirely in Java. It provides a friendly Swing-based GUI for user management, sending payments, viewing exchange rates, creating family vaults, and inspecting analytics and transaction history.\n\nThis README explains what the app does, how it works internally, and how to run and test it.\n\n---\n\n## Quick Summary\n\n- Purpose: Demo a simplified blockchain-style payment flow and wallet management using Java.\n- Interface: Java Swing desktop application (no web frontend required).\n- Data: In-memory models (ArrayList / HashMap) — suitable for demonstration and academic submission.\n\n---\n\n## Main Features\n\n- Register and manage users (Basic / Premium types with different fee rules).\n- Send payments between users with automatic fee calculation and validation.\n- View exchange rates for common currencies (AED, SAR, INR, PHP, PKR, EUR).\n- Create family vaults (multi-signature / escrow style objects).\n- View analytics: total transactions, total volume, average transaction, and total fees.\n- Browse a complete transaction history with timestamps and statuses.\n\n---\n\n## Project Layout (high level)\n\n- `core/` — entry point and core service (`Start.java`, `BlockchainService.java`).\n- `models/` — data models (User, Transaction, FamilyVault, SavingsPlan, etc.).\n- `ui/` — Swing GUI and console UI (`BlockchainPaymentGUI.java`, `ConsoleUI.java`).\n- `services/` — helper services (ExchangeRateService, VaultService, notifiers).\n- `exceptions/` — custom exception classes.\n- `utils/` — quickstart and utilities.\n\nFiles are grouped by responsibility to keep the project clean and easy to follow.\n\n---\n\n## How It Works (internals)\n\n1. Start-up\n   - `Start` launches the Swing GUI (`BlockchainPaymentGUI`).\n   - The GUI initializes a singleton `BlockchainService` which acts as the in-memory backend.\n\n2. Users\n   - `User` is the base model. `BasicUser` and `PremiumUser` implement different fee strategies and transaction limits.\n   - Users are managed by `BlockchainService` and stored in a HashMap keyed by wallet address.\n\n3. Transactions\n   - `BlockchainService.sendMoney(sender, recipientAddress, amount)` validates the amount, checks limits and balances, computes fees, and records a `Transaction` object.\n   - Transactions are kept in an in-memory list and exposed to the UI for history and analytics.\n   - Observers (e.g., `EmailNotifier`) are notified on transaction completion.\n\n4. Vaults & Savings Plans\n   - `FamilyVault` represents a multi-signature vault tied to user addresses.\n   - `SavingsPlansFactory` provides simple savings plan objects users can opt into.\n\n5. Exchange Rates\n   - `ExchangeRateService` is a simple singleton that stores and provides currency rates for display (demo data).\n\n---\n\n## Run Instructions (PowerShell / Windows)\n\nOpen PowerShell in the project root (`C:\\Users\\visva\\Documents\\oopsmini\\OOPSMINI`) and run:\n\n```powershell\n# Compile everything (run from project root)\njavac core\\*.java models\\*.java ui\\*.java services\\*.java exceptions\\*.java utils\\*.java\n\n# Run the Swing GUI (recommended)\njava -cp ".;core;models;ui;services;exceptions;utils" Start\n```\n\nAlternative: run the console UI instead of the GUI:\n\n```powershell\njava -cp ".;core;models;ui;services;exceptions;utils" ui.ConsoleUI\n```\n\nNotes:\n- Run the `javac` command from the project root so the compiler finds all folders.\n- If you prefer to run from a folder, update the `-cp` (classpath) accordingly.\n\n---\n\n## Design Patterns & Architecture Notes\n\n- Singleton: `BlockchainService` and `ExchangeRateService` ensure a single source of truth.\n- Observer: `TransactionObserver` / `EmailNotifier` demonstrate event notifications.\n- Factory: `SavingsPlansFactory` creates different savings plan objects.\n- Strategy: Fee calculation differs by user type (Basic vs Premium).\n\nThe code is deliberately simple and readable for educational use.\n\n---\n\n## Troubleshooting\n\n- "Invalid filename: core\\*.java" — ensure you run `javac` from project root, not from a subfolder. Use the commands above.\n- "NoClassDefFoundError" — the JVM needs the folders on the classpath; use the `-cp` example above when running `java`.\n- GUI not appearing — verify `java -version` (JRE/JDK 8+ recommended) and that the compile step completed without errors.\n\n---\n\n## For Submission\n\n- Include the `models/`, `core/`, `ui/`, `services/`, `exceptions/`, and `utils/` folders with the `.java` files and the documentation in the repo root.\n- The project is self-contained and uses only the Java standard library.\n\n---\n\nIf you want, I can also:\n\n- Add brief inline run instructions at the top of `Start.java`.\n- Generate a ZIP of the source-only tree ready for submission.\n- Add unit tests for key `BlockchainService` behaviors.\n\nTell me which of those you'd like next.\n
#### Core System & GUI

- **Start.java** - Entry point (launches the Swing GUI)

- **BlockchainPaymentGUI.java** - Main Swing GUI application (NEW!)
