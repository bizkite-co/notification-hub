# Cross-Account Client Configuration Guide

Follow these steps to grant permission and configure your client AWS accounts to publish to the central notification hub in your main account.

---

## Central SNS Topic Details
* **Main Account ID:** `318364255844`
* **Topic ARN:** `arn:aws:sns:us-east-1:318364255844:CentralTechSupportNotifications`

---

## Step 1: Add Permissions in the Client Account

To allow services in the client account (e.g. `193481341784`) to publish alerts, attach the following IAM policy to the IAM Roles or Users associated with those client-side services (e.g., Lambda functions, ECS tasks, EC2 instances):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublishToCentralHub",
      "Effect": "Allow",
      "Action": "sns:Publish",
      "Resource": "arn:aws:sns:us-east-1:318364255844:CentralTechSupportNotifications"
    }
  ]
}
```

---

## Step 2: Testing cross-account publishing

To test that everything is working, switch your terminal credentials to the **client account** and execute the AWS CLI publish command.

### Option A: Trigger using keywords (e.g. Critical, Error, Alarm)
If your subject or message contains the words `critical`, `error`, or `alarm`, the router automatically promotes it to an Emergency alert (repeats every 30 seconds):

```bash
aws sns publish \
  --topic-arn "arn:aws:sns:us-east-1:318364255844:CentralTechSupportNotifications" \
  --subject "CRITICAL: Client Database Low Disk Space" \
  --message "Database disk space is at 98% in client account 193481341784."
```

### Option B: Trigger using explicit Message Attributes (Recommended)
You can explicitly set the priority using SNS **Message Attributes** without changing the text of your subject or message. Set the attribute `priority` to `critical` or `emergency` to trigger the repeating alarm:

```bash
aws sns publish \
  --topic-arn "arn:aws:sns:us-east-1:318364255844:CentralTechSupportNotifications" \
  --subject "Shipping Problem - Order #1990" \
  --message "Shipping issue detected on Order #1990." \
  --message-attributes '{"priority": {"DataType": "String", "StringValue": "critical"}}'
```

Supported `priority` values:
* `critical` or `emergency` -> Triggers repeating Pushover Emergency Priority (2).
* `high` -> Triggers Pushover High Priority (1) (sound, bypass DND, no repeats).
* `resolved` -> Normal priority (0).
