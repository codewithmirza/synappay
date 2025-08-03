#!/bin/bash

# SynapPay Cloudflare Deployment Script
echo "🚀 Deploying SynapPay API to Cloudflare Workers..."

# Install dependencies
cd apps/api
npm install

# Deploy to Cloudflare
npx wrangler deploy

echo "✅ API deployed to Cloudflare Workers"
echo "🌐 URL: https://synappay-api.your-subdomain.workers.dev"