import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpExchange;
import java.io.*;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.ArrayList;

public class BlockchainAPI {
    
    private static BlockchainService blockchain;
    private static ArrayList<User> allUsers = new ArrayList<>(); // CHANGED: Use ArrayList instead
    
    public static void main(String[] args) throws IOException {
        System.out.println("🚀 Starting Blockchain Payment API Server...\n");
        
        blockchain = BlockchainService.getInstance();
        
        EmailNotifier emailNotifier = new EmailNotifier();
        blockchain.addObserver(emailNotifier);
        
        // Create initial users
        User user1 = new BasicUser("Ahmed", "0x1234567890abcdef", "encryptedKey1");
        User user2 = new PremiumUser("Fatima", "0xfedcba0987654321", "encryptedKey2");
        
        user1.setBalance(600.0);
        user2.setBalance(5000.0);
        
        blockchain.registerUser(user1);
        blockchain.registerUser(user2);
        
        allUsers.add(user1);
        allUsers.add(user2);
        
        HttpServer server = HttpServer.create(new InetSocketAddress(8000), 0);
        
        server.createContext("/api/users", new GetUsersHandler());
        server.createContext("/api/send", new SendMoneyHandler());
        server.createContext("/api/transactions", new GetTransactionsHandler());
        server.createContext("/api/receipt", new GetReceiptHandler());
        server.createContext("/api/rates", new GetRatesHandler());
        server.createContext("/api/convert", new ConvertHandler());
        server.createContext("/api/register", new RegisterUserHandler()); // NEW
        server.createContext("/api/plans", new GetPlansHandler()); // NEW - Savings Plans
        server.createContext("/", new StaticFileHandler());
        // Add these lines in main() with other endpoints
        server.createContext("/api/vaults", new GetVaultsHandler());
        server.createContext("/api/vault/create", new CreateVaultHandler());
        server.createContext("/api/vault/request", new CreateRequestHandler());
        server.createContext("/api/vault/approve", new ApproveRequestHandler());

        server.setExecutor(null);
        server.start();
        
        System.out.println("✅ Server running at http://localhost:8000");
        System.out.println("📱 Open http://localhost:8000/index.html in your browser\n");
    }
    
    static class StaticFileHandler implements HttpHandler {
        public void handle(HttpExchange exchange) throws IOException {
            String path = exchange.getRequestURI().getPath();
            if (path.equals("/")) path = "/index.html";
            
            File file = new File("." + path);
            if (file.exists()) {
                byte[] bytes = java.nio.file.Files.readAllBytes(file.toPath());
                
                String contentType = "text/html";
                if (path.endsWith(".css")) contentType = "text/css";
                if (path.endsWith(".js")) contentType = "application/javascript";
                
                exchange.getResponseHeaders().set("Content-Type", contentType);
                exchange.sendResponseHeaders(200, bytes.length);
                OutputStream os = exchange.getResponseBody();
                os.write(bytes);
                os.close();
            } else {
                String response = "404 Not Found";
                exchange.sendResponseHeaders(404, response.length());
                OutputStream os = exchange.getResponseBody();
                os.write(response.getBytes());
                os.close();
            }
        }
    }
    
    static class GetUsersHandler implements HttpHandler {
        public void handle(HttpExchange exchange) throws IOException {
            StringBuilder json = new StringBuilder("{\"users\": [");
            
            for (int i = 0; i < allUsers.size(); i++) {
                User user = allUsers.get(i);
                String type = user instanceof PremiumUser ? "Premium" : "Basic";
                
                json.append(String.format(
                    "{\"name\":\"%s\",\"address\":\"%s\",\"balance\":%.2f,\"type\":\"%s\"}",
                    user.getName(), user.getWalletAddress(), user.getBalance(), type
                ));
                
                if (i < allUsers.size() - 1) json.append(",");
            }
            
            json.append("]}");
            sendJsonResponse(exchange, json.toString());
        }
    }
    
    static class SendMoneyHandler implements HttpHandler {
        public void handle(HttpExchange exchange) throws IOException {
            if ("POST".equals(exchange.getRequestMethod())) {
                InputStreamReader isr = new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8);
                BufferedReader br = new BufferedReader(isr);
                String body = br.readLine();
                
                String senderAddr = extractValue(body, "sender");
                String recipientAddr = extractValue(body, "recipient");
                double amount = Double.parseDouble(extractValue(body, "amount"));
                
                User sender = blockchain.getUserByAddress(senderAddr);
                
                try {
                    blockchain.sendMoney(sender, recipientAddr, amount);
                    String response = "{\"success\":true,\"message\":\"Transaction successful!\"}";
                    sendJsonResponse(exchange, response);
                } catch (Exception e) {
                    String response = "{\"success\":false,\"message\":\"" + e.getMessage() + "\"}";
                    sendJsonResponse(exchange, response);
                }
            }
        }
    }
    
    static class GetTransactionsHandler implements HttpHandler {
        public void handle(HttpExchange exchange) throws IOException {
            ArrayList<Transaction> transactions = blockchain.getTransactionHistory();
            
            StringBuilder json = new StringBuilder("{\"transactions\":[");
            for (int i = 0; i < transactions.size(); i++) {
                Transaction tx = transactions.get(i);
                
                User sender = blockchain.getUserByAddress(tx.getSenderAddress());
                User recipient = blockchain.getUserByAddress(tx.getRecipientAddress());
                
                String senderName = sender != null ? sender.getName() : "External";
                String recipientName = recipient != null ? recipient.getName() : "External";
                
                json.append(String.format(
                    "{\"id\":\"%s\",\"amount\":%.2f,\"fee\":%.2f,\"status\":\"%s\",\"timestamp\":\"%s\",\"sender\":\"%s\",\"recipient\":\"%s\"}",
                    tx.getTransactionId(), tx.getAmount(), tx.getFee(), 
                    tx.getStatus(), tx.getFormattedTimestamp(),
                    senderName, recipientName
                ));
                if (i < transactions.size() - 1) json.append(",");
            }
            json.append("]}");
            
            sendJsonResponse(exchange, json.toString());
        }
    }
    
    static class GetReceiptHandler implements HttpHandler {
        public void handle(HttpExchange exchange) throws IOException {
            String query = exchange.getRequestURI().getQuery();
            String txId = null;
            
            if (query != null && query.startsWith("id=")) {
                txId = query.substring(3);
            }
            
            if (txId == null) {
                String response = "<h1>Invalid Transaction ID</h1>";
                exchange.getResponseHeaders().set("Content-Type", "text/html");
                exchange.sendResponseHeaders(400, response.length());
                OutputStream os = exchange.getResponseBody();
                os.write(response.getBytes());
                os.close();
                return;
            }
            
            ArrayList<Transaction> transactions = blockchain.getTransactionHistory();
            Transaction found = null;
            
            for (Transaction tx : transactions) {
                if (tx.getTransactionId().equals(txId)) {
                    found = tx;
                    break;
                }
            }
            
            if (found == null) {
                String response = "<h1>Transaction Not Found</h1>";
                exchange.getResponseHeaders().set("Content-Type", "text/html");
                exchange.sendResponseHeaders(404, response.length());
                OutputStream os = exchange.getResponseBody();
                os.write(response.getBytes());
                os.close();
                return;
            }
            
            User sender = blockchain.getUserByAddress(found.getSenderAddress());
            User recipient = blockchain.getUserByAddress(found.getRecipientAddress());
            
            String senderName = sender != null ? sender.getName() : "External Wallet";
            String recipientName = recipient != null ? recipient.getName() : "External Wallet";
            
            String receipt = found.generateHTMLReceipt(senderName, recipientName);
            
            exchange.getResponseHeaders().set("Content-Type", "text/html");
            exchange.sendResponseHeaders(200, receipt.getBytes().length);
            OutputStream os = exchange.getResponseBody();
            os.write(receipt.getBytes());
            os.close();
        }
    }
    
    static class GetRatesHandler implements HttpHandler {
        public void handle(HttpExchange exchange) throws IOException {
            ExchangeRateService rateService = ExchangeRateService.getInstance();
            rateService.updateRates();
            
            java.util.HashMap<String, Double> rates = rateService.getAllRates();
            
            StringBuilder json = new StringBuilder("{\"rates\":{");
            int count = 0;
            for (String currency : rates.keySet()) {
                double rate = rates.get(currency);
                String recommendation = rateService.getRateRecommendation(currency);
                double savings = rateService.getPotentialSavings(currency, 100);
                
                json.append(String.format(
                    "\"%s\":{\"rate\":%.4f,\"recommendation\":\"%s\",\"savings\":%.2f}",
                    currency, rate, recommendation, savings
                ));
                
                count++;
                if (count < rates.size()) json.append(",");
            }
            json.append("},\"lastUpdate\":\"").append(rateService.getLastUpdateTime()).append("\"}");
            
            sendJsonResponse(exchange, json.toString());
        }
    }
    
    static class ConvertHandler implements HttpHandler {
        public void handle(HttpExchange exchange) throws IOException {
            String query = exchange.getRequestURI().getQuery();
            
            if (query == null) {
                String response = "{\"error\":\"Missing parameters\"}";
                sendJsonResponse(exchange, response);
                return;
            }
            
            String[] params = query.split("&");
            double amount = 0;
            String currency = "AED";
            
            for (String param : params) {
                String[] pair = param.split("=");
                if (pair[0].equals("amount")) {
                    amount = Double.parseDouble(pair[1]);
                } else if (pair[0].equals("currency")) {
                    currency = pair[1];
                }
            }
            
            ExchangeRateService rateService = ExchangeRateService.getInstance();
            double converted = rateService.convert(amount, currency);
            double rate = rateService.getRate(currency);
            
            String response = String.format(
                "{\"amount\":%.2f,\"currency\":\"%s\",\"converted\":%.2f,\"rate\":%.4f}",
                amount, currency, converted, rate
            );
            
            sendJsonResponse(exchange, response);
        }
    }
    
    // NEW: Register User Handler
    static class RegisterUserHandler implements HttpHandler {
        public void handle(HttpExchange exchange) throws IOException {
            if ("POST".equals(exchange.getRequestMethod())) {
                try {
                    InputStreamReader isr = new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8);
                    BufferedReader br = new BufferedReader(isr);
                    String body = br.readLine();
                    
                    System.out.println("Registration request: " + body); // Debug log
                    
                    String name = extractValue(body, "name");
                    double initialBalance = 0.0;
                    String balStr = extractValue(body, "balance");
                    if (!balStr.isEmpty()) {
                        try {
                            initialBalance = Double.parseDouble(balStr);
                        } catch (NumberFormatException nfe) {
                            initialBalance = 0.0;
                        }
                    }

                    // Generate unique wallet address
                    String walletAddress = "0x" + generateRandomHex(40);
                    String encryptedKey = "encKey_" + System.currentTimeMillis();

                    // Create user as BasicUser by default (no user-type selection during registration)
                    User newUser = new BasicUser(name, walletAddress, encryptedKey);
                    newUser.setBalance(initialBalance);

                    // Register user (no plans or type assignment at registration)
                    blockchain.registerUser(newUser);
                    allUsers.add(newUser);

                    System.out.println("✅ User registered: " + name);
                    
                    String response = String.format(
                        "{\"success\":true,\"message\":\"User registered successfully!\",\"address\":\"%s\",\"name\":\"%s\"}",
                        walletAddress, name
                    );
                    sendJsonResponse(exchange, response);
                    
                } catch (Exception e) {
                    System.err.println("❌ Registration error: " + e.getMessage());
                    e.printStackTrace();
                    String response = "{\"success\":false,\"message\":\"" + e.getMessage().replace("\"", "'") + "\"}";
                    sendJsonResponse(exchange, response);
                }
            }
        }
        
        private String generateRandomHex(int length) {
            String chars = "0123456789abcdef";
            StringBuilder sb = new StringBuilder();
            for (int i = 0; i < length; i++) {
                sb.append(chars.charAt((int)(Math.random() * chars.length())));
            }
            return sb.toString();
        }
    }
    
    private static void sendJsonResponse(HttpExchange exchange, String response) throws IOException {
        exchange.getResponseHeaders().set("Content-Type", "application/json");
        exchange.getResponseHeaders().set("Access-Control-Allow-Origin", "*");
        exchange.sendResponseHeaders(200, response.getBytes().length);
        OutputStream os = exchange.getResponseBody();
        os.write(response.getBytes());
        os.close();
    }
    
    private static String extractValue(String json, String key) {
        String search = "\"" + key + "\":\"";
        int start = json.indexOf(search);
        if (start == -1) return "";
        start += search.length();
        int end = json.indexOf("\"", start);
        if (end == -1) return "";
        return json.substring(start, end);
    }
    // Get all vaults for a user
static class GetVaultsHandler implements HttpHandler {
    public void handle(HttpExchange exchange) throws IOException {
        String query = exchange.getRequestURI().getQuery();
        String userAddress = null;
        
        if (query != null && query.startsWith("user=")) {
            userAddress = query.substring(5);
        }
        
        VaultService vaultService = VaultService.getInstance();
        ArrayList<FamilyVault> vaults;
        
        if (userAddress != null) {
            vaults = vaultService.getUserVaults(userAddress);
        } else {
            vaults = vaultService.getAllVaults();
        }
        
        StringBuilder json = new StringBuilder("{\"vaults\":[");
        
        for (int i = 0; i < vaults.size(); i++) {
            FamilyVault vault = vaults.get(i);
            json.append(String.format(
                "{\"id\":\"%s\",\"name\":\"%s\",\"purpose\":\"%s\",\"total\":%.2f,\"released\":%.2f,\"remaining\":%.2f,\"progress\":%.1f,\"guardians\":%d,\"pending\":%d,\"status\":\"%s\",\"created\":\"%s\"}",
                vault.getVaultId(),
                vault.getVaultName(),
                vault.getPurpose(),
                vault.getTotalAmount(),
                vault.getReleasedAmount(),
                vault.getRemainingBalance(),
                vault.getProgressPercentage(),
                vault.getGuardians().size(),
                vault.getPendingRequests().size(),
                vault.getStatus(),
                vault.getCreatedDate()
            ));
            if (i < vaults.size() - 1) json.append(",");
        }
        
        json.append("]}");
        sendJsonResponse(exchange, json.toString());
    }
}

// Create new vault
static class CreateVaultHandler implements HttpHandler {
    public void handle(HttpExchange exchange) throws IOException {
        if ("POST".equals(exchange.getRequestMethod())) {
            try {
                InputStreamReader isr = new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8);
                BufferedReader br = new BufferedReader(isr);
                String body = br.readLine();
                
                String vaultName = extractValue(body, "name");
                String purpose = extractValue(body, "purpose");
                double amount = Double.parseDouble(extractValue(body, "amount"));
                String creator = extractValue(body, "creator");
                
                VaultService vaultService = VaultService.getInstance();
                FamilyVault vault = vaultService.createVault(vaultName, purpose, amount, creator);
                
                // Parse and add guardians
                String guardiansJson = body.substring(body.indexOf("\"guardians\":[") + 13);
                guardiansJson = guardiansJson.substring(0, guardiansJson.indexOf("]"));
                
                if (!guardiansJson.isEmpty()) {
                    String[] guardianData = guardiansJson.split("},\\{");
                    for (String gData : guardianData) {
                        gData = gData.replace("{", "").replace("}", "");
                        String[] parts = gData.split(",");
                        String gName = parts[0].split(":")[1].replace("\"", "");
                        String gAddress = parts[1].split(":")[1].replace("\"", "");
                        String gRole = parts[2].split(":")[1].replace("\"", "");
                        
                        Guardian guardian = new Guardian(gName, gAddress, gRole);
                        vault.addGuardian(guardian);
                    }
                }
                
                String response = String.format(
                    "{\"success\":true,\"message\":\"Vault created successfully!\",\"vaultId\":\"%s\"}",
                    vault.getVaultId()
                );
                sendJsonResponse(exchange, response);
                
            } catch (Exception e) {
                e.printStackTrace();
                String response = "{\"success\":false,\"message\":\"" + e.getMessage().replace("\"", "'") + "\"}";
                sendJsonResponse(exchange, response);
            }
        }
    }
}

// Create withdrawal request
static class CreateRequestHandler implements HttpHandler {
    public void handle(HttpExchange exchange) throws IOException {
        if ("POST".equals(exchange.getRequestMethod())) {
            try {
                InputStreamReader isr = new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8);
                BufferedReader br = new BufferedReader(isr);
                String body = br.readLine();
                
                String vaultId = extractValue(body, "vaultId");
                String requester = extractValue(body, "requester");
                double amount = Double.parseDouble(extractValue(body, "amount"));
                String purpose = extractValue(body, "purpose");
                String proof = extractValue(body, "proof");
                
                VaultService vaultService = VaultService.getInstance();
                FamilyVault vault = vaultService.getVault(vaultId);
                
                if (vault != null) {
                    vault.createWithdrawalRequest(requester, amount, purpose, proof);
                    String response = "{\"success\":true,\"message\":\"Request created. Waiting for approvals.\"}";
                    sendJsonResponse(exchange, response);
                } else {
                    String response = "{\"success\":false,\"message\":\"Vault not found\"}";
                    sendJsonResponse(exchange, response);
                }
                
            } catch (Exception e) {
                String response = "{\"success\":false,\"message\":\"" + e.getMessage().replace("\"", "'") + "\"}";
                sendJsonResponse(exchange, response);
            }
        }
    }
}

// Approve/Reject request
static class ApproveRequestHandler implements HttpHandler {
    public void handle(HttpExchange exchange) throws IOException {
        if ("POST".equals(exchange.getRequestMethod())) {
            try {
                InputStreamReader isr = new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8);
                BufferedReader br = new BufferedReader(isr);
                String body = br.readLine();
                
                String vaultId = extractValue(body, "vaultId");
                String requestId = extractValue(body, "requestId");
                String guardian = extractValue(body, "guardian");
                boolean approve = extractValue(body, "approve").equals("true");
                
                VaultService vaultService = VaultService.getInstance();
                FamilyVault vault = vaultService.getVault(vaultId);
                
                if (vault != null) {
                    boolean processed = vault.processApproval(requestId, guardian, approve);
                    String message = processed ? "Decision recorded successfully" : "Waiting for more approvals";
                    String response = String.format("{\"success\":true,\"message\":\"%s\"}", message);
                    sendJsonResponse(exchange, response);
                } else {
                    String response = "{\"success\":false,\"message\":\"Vault not found\"}";
                    sendJsonResponse(exchange, response);
                }
                
            } catch (Exception e) {
                String response = "{\"success\":false,\"message\":\"" + e.getMessage().replace("\"", "'") + "\"}";
                sendJsonResponse(exchange, response);
            }
        }
    }
}

    static class GetPlansHandler implements HttpHandler {
        public void handle(HttpExchange exchange) throws IOException {
            String query = exchange.getRequestURI().getQuery();
            String userAddress = extractValue(query != null ? query : "", "address");
            
            User user = null;
            if (!userAddress.isEmpty()) {
                user = blockchain.getUserByAddress(userAddress);
            }
            
            if (user == null || user.getSavingsPlans().isEmpty()) {
                // Return default plans from factory if user not found
                ArrayList<SavingsPlan> availablePlans = SavingsPlansFactory.createDefaultPlans();
                StringBuilder json = new StringBuilder("{\"plans\": [");
                
                for (int i = 0; i < availablePlans.size(); i++) {
                    SavingsPlan plan = availablePlans.get(i);
                    json.append(String.format(
                        "{\"name\":\"%s\",\"description\":\"%s\",\"interestRate\":%.1f,\"minimumAmount\":%.2f,\"lockingPeriod\":\"%s\"}",
                        plan.getPlanName(), plan.getDescription(), plan.getInterestRate(), 
                        plan.getMinimumAmount(), plan.getLockingPeriod()
                    ));
                    if (i < availablePlans.size() - 1) json.append(",");
                }
                json.append("]}");
                sendJsonResponse(exchange, json.toString());
            } else {
                // Return user's specific plans based on their type
                ArrayList<SavingsPlan> userPlans = user.getSavingsPlans();
                String userType = user instanceof PremiumUser ? "Premium" : "Basic";
                StringBuilder json = new StringBuilder("{\"userName\":\"" + user.getName() + "\",\"userType\":\"" + userType + "\",\"plans\": [");
                
                for (int i = 0; i < userPlans.size(); i++) {
                    SavingsPlan plan = userPlans.get(i);
                    json.append(String.format(
                        "{\"name\":\"%s\",\"description\":\"%s\",\"interestRate\":%.1f,\"minimumAmount\":%.2f,\"lockingPeriod\":\"%s\",\"currentAmount\":%.2f,\"expectedReturn\":%.2f}",
                        plan.getPlanName(), plan.getDescription(), plan.getInterestRate(), 
                        plan.getMinimumAmount(), plan.getLockingPeriod(), 
                        plan.getCurrentAmount(), plan.getTotalAmount()
                    ));
                    if (i < userPlans.size() - 1) json.append(",");
                }
                json.append("]}");
                sendJsonResponse(exchange, json.toString());
            }
        }
    }
}
