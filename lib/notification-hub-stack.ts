import * as cdk from 'aws-cdk-lib';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';
import * as fs from 'fs';

export class NotificationHubStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1. Load Configuration
    const configPath = path.join(__dirname, '../config/config.json');
    let config: any = {
      ntfyTopic: 'bizkite-tech-support-92821',
      clientAccountIds: [] as string[],
      clientAccounts: [] as any[],
      pushoverUserKey: '',
      pushoverApiToken: ''
    };
    
    if (fs.existsSync(configPath)) {
      try {
        config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      } catch (err) {
        console.error('Error reading config file:', err);
      }
    }

    const ntfyTopic = (process.env.NTFY_TOPIC !== undefined ? process.env.NTFY_TOPIC : (config.ntfyTopic || '')).replace(/^"|"/g, '');
    const clientAccountIds = (config.clientAccounts || []).map((c: any) => c.id);
// Validate no duplicate IDs in clientAccounts
if (config.clientAccounts) {
  const ids = config.clientAccounts.map((c: any) => c.id);
  const duplicateIds = ids.filter((id: string, idx: number) => ids.indexOf(id) !== idx);
  if (duplicateIds.length) {
    const uniqDupes = [...new Set(duplicateIds)];
    throw new Error(`Duplicate clientAccount id(s) detected in config.json: ${uniqDupes.join(', ')}`);
  }
}
    const pushoverUserKey = (process.env.PUSHOVER_USER_KEY || config.pushoverUserKey || '').replace(/^"|"/g, '');
    const pushoverApiToken = (process.env.PUSHOVER_API_TOKEN || config.pushoverApiToken || '').replace(/^"|"/g, '');

    // 2. Create the Central SNS Topic
    const snsTopic = new sns.Topic(this, 'CentralTechSupportNotifications', {
      topicName: 'CentralTechSupportNotifications',
      displayName: 'Central Tech Support Notifications'
    });

    // 3. Attach SNS Topic Access Policy for Cross-Account publishing
    if (clientAccountIds.length > 0) {
      snsTopic.addToResourcePolicy(new iam.PolicyStatement({
        sid: 'AllowClientAccountsToPublish',
        effect: iam.Effect.ALLOW,
        principals: clientAccountIds.map((accountId: string) => new iam.AccountPrincipal(accountId)),
        actions: ['sns:Publish'],
        resources: [snsTopic.topicArn],
      }));
      console.log(`Configured cross-account SNS Topic policy for client accounts: ${clientAccountIds.join(', ')}`);
    } else {
      console.log('No client account IDs specified in config.json. The topic will only accept local publications.');
    }

    // 4. Create the Central Router Lambda
    const routerLambda = new lambda.Function(this, 'TechSupportNotificationRouter', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../lambda')),
      environment: {
        NTFY_TOPIC: ntfyTopic,
        PUSHOVER_USER_KEY: pushoverUserKey,
        PUSHOVER_API_TOKEN: pushoverApiToken,
      },
      description: 'Receives messages from SNS and forwards them to ntfy.sh or Pushover',
    });

    // 5. Subscribe Lambda to SNS Topic
    snsTopic.addSubscription(new subs.LambdaSubscription(routerLambda));

    // 6. Outputs
    new cdk.CfnOutput(this, 'CentralSNSTopicArn', {
      value: snsTopic.topicArn,
      description: 'ARN of the Central SNS Topic to be shared with client accounts.',
      exportName: 'CentralSNSTopicArn',
    });
  }
}
