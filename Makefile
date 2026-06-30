#!/usr/bin/env bash
ifneq (,$(wildcard .env))
    include .env
    export
endif

.PHONY: help
help: ## Display this help screen
	@echo "Available commands:"
	@awk 'BEGIN {FS = ":.*?## "}; /^[a-zA-Z_-]+:.*?## / {printf "  \033[32m%-20s\033[0m %s\n", $$1, $$2}' $(MAKEFILE_LIST)

# ==============================================================================
# Application Tasks
# ==============================================================================
#
#

build: ## Build with TSC
	@npm install
	@npx tsc
	@mkdir -p temp && npx cdk synth >> temp/synth-output.yaml 2>&1

deploy: build ## Deploy the CDK stack to AWS
	@npx cdk deploy --require-approval never

bootstrap: ## Bootstrap the CDK environment in AWS
	@npx cdk bootstrap

lint: ## Lint TypeScript (no‑emit check)
	@npx tsc --noEmit

test: ## Run unit tests (jest)
	@npm test

send: ## Send a test notification. Usage: make send MSG="My message" SUBJ="My subject"
	@TOPIC_ARN=$$(aws sns list-topics --query "Topics[?ends_with(TopicArn, ':CentralTechSupportNotifications')].TopicArn" --output text); \
	if [ -z "$$TOPIC_ARN" ]; then \
		echo "Error: CentralTechSupportNotifications topic not found."; \
		exit 1; \
	fi; \
	MSG_VAL="$(MSG)"; \
	SUBJ_VAL="$(SUBJ)"; \
	if [ -z "$$MSG_VAL" ]; then MSG_VAL="This is a test notification from the AWS Notification Hub! 🚀"; fi; \
	if [ -z "$$SUBJ_VAL" ]; then SUBJ_VAL="CRITICAL: Test Notification"; fi; \
	echo "Publishing to $$TOPIC_ARN (Subject: $$SUBJ_VAL)..."; \
	aws sns publish --topic-arn "$$TOPIC_ARN" --subject "$$SUBJ_VAL" --message "$$MSG_VAL"

test-pushover: ## Test Pushover Emergency Priority alert.
	@node scripts/test-pushover.js

debug-env: ## Debug Makefile environment variables
	@echo "--- Shell Info ---"
	@echo "Shell: $$SHELL"
	@echo "op path: $$(which op)"
	@echo "--- Environment Variables ---"
	@env | grep -E "OP_|SSH_|PUSHOVER|WSL" || true

