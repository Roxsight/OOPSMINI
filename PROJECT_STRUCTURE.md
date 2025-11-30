# Blockchain Payment System - Project Structure

## 📁 Folder Organization

```
OOPSMINI/
│
├── 📂 core/                          [Entry points & main logic]
│   ├── Start.java                    Main entry point - launches GUI
│   ├── BlockchainService.java        Core blockchain engine (Singleton)
│   └── BlockchainPaymentApp.java     Alternative console application
│
├── 📂 models/                        [Data models & entities]
│   ├── User.java                     Base user class
│   ├── BasicUser.java                Basic user (1% fee, $500 limit)
│   ├── Guardian.java                 Guardian for vaults
│   ├── Transaction.java              Transaction records
│   ├── SavingsPlan.java              Savings plan model
│   ├── FamilyVault.java              Family vault (multi-sig escrow)
│   └── WithdrawalRequest.java        Withdrawal request tracking
│
├── 📂 ui/                            [User interface]
│   ├── BlockchainPaymentGUI.java     Main Swing GUI (7 tabs)
│   └── ConsoleUI.java                Terminal-based interface
│
├── 📂 services/                      [Business logic services]
│   ├── ExchangeRateService.java      Currency exchange rates
│   ├── VaultService.java             Vault operations
│   ├── EmailNotifier.java            Email notifications (Observer)
│   ├── TransactionObserver.java      Observer interface for transactions
│   └── SavingsPlansFactory.java      Factory for creating savings plans
│
├── 📂 exceptions/                    [Custom exceptions]
│   └── CustomExceptions.java         All exception classes
│
├── 📂 utils/                         [Utilities & documentation]
│   └── QUICKSTART.java               Quick reference guide
│
├── 📄 README.md                      Complete project documentation
├── 📄 FIXES_APPLIED.md              Recent bug fixes and improvements
├── 📄 PROJECT_SUMMARY.md            Project overview and features
├── 📄 SAVINGS_PLANS_FEATURE.md      Savings plans feature details
└── 📄 PROJECT_STRUCTURE.md          This file
```

## 📊 File Statistics

**Total Java Files: 19**
- Core: 3 files
- Models: 7 files
- UI: 2 files
- Services: 5 files
- Exceptions: 1 file
- Utils: 1 file

**Total Lines of Code: 3000+**
- BlockchainPaymentGUI: 650+ lines
- BlockchainService: 150+ lines
- Other services: 200+ lines each

## 🚀 How to Run

### Option 1: Swing GUI (RECOMMENDED)
```bash
javac core/*.java models/*.java ui/*.java services/*.java exceptions/*.java
java -cp . core.Start
```

### Option 2: Console Interface
```bash
javac core/*.java models/*.java ui/*.java services/*.java exceptions/*.java
java -cp . ui.ConsoleUI
```

### Option 3: Simple App
```bash
javac core/*.java models/*.java services/*.java exceptions/*.java
java -cp . core.BlockchainPaymentApp
```

## 🗂️ Design Patterns Used

| Pattern | Implementation | File |
|---------|-----------------|------|
| **Singleton** | BlockchainService | `core/BlockchainService.java` |
| **Singleton** | ExchangeRateService | `services/ExchangeRateService.java` |
| **Observer** | EmailNotifier | `services/EmailNotifier.java` |
| **Factory** | SavingsPlansFactory | `services/SavingsPlansFactory.java` |
| **Strategy** | BasicUser vs PremiumUser | `models/User.java` |
| **MVC** | GUI + Service + Models | All three layers |

## 🔄 Class Dependencies

```
Start.java
  └── BlockchainPaymentGUI.java
       ├── BlockchainService (Singleton)
       ├── BasicUser, PremiumUser
       ├── EmailNotifier
       ├── Transaction
       ├── FamilyVault
       ├── ExchangeRateService
       └── Custom Exceptions

BlockchainService
  ├── User
  ├── Transaction
  ├── TransactionObserver
  └── Custom Exceptions

Models
  ├── User (Base)
  ├── Guardian
  ├── FamilyVault
  ├── WithdrawalRequest
  └── SavingsPlan
```

## 🎯 Features by Module

### Core Module (`core/`)
- Entry point configuration
- Main blockchain service
- Transaction processing
- User management

### Models Module (`models/`)
- User entity types
- Transaction tracking
- Vault management
- Withdrawal system

### UI Module (`ui/`)
- **7 Tabbed Panels:**
  1. Users - View all registered users
  2. Register - Add new users
  3. Send Money - Transfer between users
  4. Exchange Rates - View 6 currencies
  5. Vault - Create family vaults
  6. Analytics - Transaction statistics
  7. History - Transaction log table

### Services Module (`services/`)
- Currency conversion
- Email notifications
- Observer pattern implementation
- Savings plan creation
- Vault operations

### Exceptions Module (`exceptions/`)
- InsufficientBalanceException
- InvalidAddressException
- TransactionLimitExceededException

## 📋 Key Features

✅ **User Management**
- Basic Users (1% fee, $500 limit)
- Premium Users (0.5% fee, $10,000 limit)
- Guardian system

✅ **Transactions**
- Send money with fee calculation
- Transaction history tracking
- Real-time notifications

✅ **Analytics**
- Total transactions count
- Total volume calculation
- Average transaction amount
- Total fees collected

✅ **Family Vault**
- Multi-signature escrow
- Withdrawal requests
- Guardian approval

✅ **Exchange Rates**
- 6 currency support (AED, SAR, INR, PHP, PKR, EUR)
- Real-time conversion

✅ **Savings Plans**
- Multiple plan types
- Factory pattern creation
- User-specific plans

## 🔍 File Descriptions

### Core Files
- **Start.java** - Main entry point, launches GUI
- **BlockchainService.java** - Singleton managing all blockchain operations
- **BlockchainPaymentApp.java** - Text-based alternative interface

### Model Files
- **User.java** - Base user class with balance and wallet
- **BasicUser.java** - Extends User with 1% fee
- **Guardian.java** - Guards family vaults
- **Transaction.java** - Immutable transaction record
- **SavingsPlan.java** - Savings product
- **FamilyVault.java** - Multi-sig vault with status
- **WithdrawalRequest.java** - Withdrawal tracking

### UI Files
- **BlockchainPaymentGUI.java** - Main Swing application (650+ lines)
- **ConsoleUI.java** - Terminal menu interface

### Service Files
- **ExchangeRateService.java** - Currency rates (Singleton)
- **VaultService.java** - Vault operations
- **EmailNotifier.java** - Sends notifications on transactions
- **TransactionObserver.java** - Observer interface
- **SavingsPlansFactory.java** - Creates savings plans

### Exception Files
- **CustomExceptions.java** - All custom exception classes

### Utility Files
- **QUICKSTART.java** - Quick reference guide

## 🧪 Testing

All files compile successfully with no errors:
```bash
javac **/*.java 2>&1
```

Run the main application:
```bash
java -cp . core.Start
```

## 📚 Documentation Files

- **README.md** - Complete user guide and features
- **QUICKSTART.java** - Quick reference for running the app
- **PROJECT_SUMMARY.md** - High-level project overview
- **SAVINGS_PLANS_FEATURE.md** - Savings plans documentation
- **FIXES_APPLIED.md** - Recent bug fixes and improvements
- **PROJECT_STRUCTURE.md** - This file

## ✨ What Makes This Structure Clean

1. **Clear Separation of Concerns**
   - Core logic separated from UI
   - Models isolated from services
   - Exceptions in dedicated folder

2. **Easy Navigation**
   - Folder names clearly indicate purpose
   - Related files grouped together
   - Documentation at root level

3. **Scalable**
   - Easy to add new services
   - New models can be added without affecting existing code
   - UI and business logic are decoupled

4. **College-Level Code**
   - Clear naming conventions
   - Organized structure
   - Well-commented code
   - Design patterns properly implemented

## 🎓 For Submission

This project is ready for academic submission with:
- ✅ 19 organized Java files
- ✅ 3000+ lines of clean code
- ✅ 5 design patterns implemented
- ✅ Professional folder structure
- ✅ Complete documentation
- ✅ 100% Java (no mixed languages)
- ✅ Beautiful Swing GUI

All files are properly organized, unused files have been deleted, and the project is clean and ready for review!
