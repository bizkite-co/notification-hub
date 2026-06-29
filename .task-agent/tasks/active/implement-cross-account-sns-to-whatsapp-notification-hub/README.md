---
created_at: 2026-06-26T23:21:48.926036-07:00
---

# Implement Cross-Account SNS to WhatsApp Notification Hub

Create a centralized WhatsApp/SMS messaging hub in the parent AWS account that client AWS accounts can publish to via a cross-account Amazon SNS Topic.

### Architecture & Steps:
1. **Central SNS Topic & Access Policy**:
   - Create an Amazon SNS Topic named `CentralWhatsAppNotifications` in the central AWS account.
   - Configure the Access Policy to permit `sns:Publish` from whitelisted client account IDs.
2. **Central Router Lambda**:
   - Create a router Lambda function in the central account.
   - Subscribe it to the `CentralWhatsAppNotifications` SNS Topic.
   - When triggered, it will extract the message payload (order number, customer name, description) and use `@aws-sdk/client-socialmessaging` to send a WhatsApp notification via the verified WABA.
3. **Client Configuration**:
   - In each client's AWS account, attach an IAM policy to allow their services to publish to `arn:aws:sns:us-east-1:PARENT_ACCOUNT_ID:CentralWhatsAppNotifications`.
   - Publish JSON events from client services directly to the central SNS Topic.

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
      "Resource": "arn:aws:sns:us-east-1:PARENT_ACCOUNT_ID:CentralWhatsAppNotifications"
    }
  ]
}
```

## Completion Criteria

- Central SNS Topic created with custom cross-account publish policy.
- Router Lambda created, subscribed to the SNS Topic, and successfully calling SocialMessagingClient (WABA).
- Verified client AWS account can publish an event to the SNS Topic and trigger a WhatsApp message.
