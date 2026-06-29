#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { NotificationHubStack } from '../lib/notification-hub-stack';

const app = new cdk.App();
new NotificationHubStack(app, 'NotificationHubStack', {
  synthesizer: new cdk.DefaultStackSynthesizer({
    qualifier: 'hbt',
  }),
});

