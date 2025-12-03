public class VaultDemo {
    public static void main(String[] args) {
        VaultService vs = VaultService.getInstance();
        FamilyVault vault = vs.createVault("Demo Vault", "Medical Emergency", 2000.0, "0xCREATOR");

        // Add guardians
        vault.addGuardian(new Guardian("Alice", "0xALICE", "Parent"));
        vault.addGuardian(new Guardian("Bob", "0xBOB", "Sibling"));

        // Create withdrawal request
        vault.createWithdrawalRequest("0xREQUESTER", 300.0, "Emergency medicine", "receipt.jpg");

        // Show pending requests
        System.out.println("\nPending requests:");
        for (WithdrawalRequest r : vault.getPendingRequests()) {
            System.out.println(r);
        }

        // Approve by one guardian
        if (!vault.getPendingRequests().isEmpty()) {
            String reqId = vault.getPendingRequests().get(0).getRequestId();
            System.out.println("\nApproving request " + reqId + " by 0xALICE");
            vault.processApproval(reqId, "0xALICE", true);
        }

        System.out.println("\nFinal vault state:");
        System.out.println(vault);
    }
}