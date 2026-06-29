---
created_at: 2026-06-26T23:21:48.926036-07:00
---

# Implement Cross-Account SNS to ntfy Notification Hub

Create a centralized ntfy messaging hub in the parent AWS account that client AWS accounts can publish to via a cross-account Amazon SNS Topic.

### Architecture & Steps:
1. **Central SNS Topic & Access Policy**:
   - Create an Amazon SNS Topic named `CentralTechSupportNotifications` in the central AWS account using AWS CDK.
   - Configure the Access Policy to permit `sns:Publish` from whitelisted client account IDs.
2. **Central Router Lambda**:
   - Create a router Lambda function in the central account using AWS CDK.
   - Subscribe it to the `CentralTechSupportNotifications` SNS Topic.
   - When triggered, it will extract the message payload and send an HTTPS POST request to `https://ntfy.sh/bizkite-tech-support-92821`.
3. **Client Configuration**:
   - In each client's AWS account, attach an IAM policy to allow their services to publish to `arn:aws:sns:us-east-1:PARENT_ACCOUNT_ID:CentralTechSupportNotifications`.
   - Publish text or JSON events from client services directly to the central SNS Topic.

### Central SNS Topic Policy Template:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "AllowClientAccountsToPublish",
      "Effect": "Allow",
      "Principal": {
        "AWS": [
          "arn:aws:iam::CLIENT_ACCOUNT_A_ID:root"
        ]
      },
      "Action": "sns:Publish",
      "Resource": "arn:aws:sns:us-east-1:PARENT_ACCOUNT_ID:CentralTechSupportNotifications"
    }
  ]
}
```

## Completion Criteria

- central SNS Topic created with custom cross-account publish policy using CDK.
- router Lambda created, subscribed to the SNS Topic, and successfully posting messages to the ntfy topic `bizkite-tech-support-92821`.
- Verified client AWS account can publish an event to the SNS Topic and trigger an ntfy notification.

## Solution

Replaced WhatsApp/Twilio with ntfy.sh messaging using topic bizkite-tech-support-92821. Created an AWS CDK application in TypeScript containing:
1. A central SNS topic 'CentralTechSupportNotifications' with a cross-account IAM publish policy.
2. A config file 'config.json' to whitelist client accounts and configure ntfy.
3. A router Lambda function in Node.js subscribing to SNS and posting notifications to ntfy.sh with context-aware priority and tag parsing.
4. Comprehensive deployment documentation in README.md.

---
**Completed in commit:** `unknown`
