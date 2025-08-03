#!/bin/bash

# SynapPay Cloudflare Deployment Script
set -e

echo "🚀 SynapPay Deployment Script"
echo "=============================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    print_error "Wrangler CLI is not installed. Please install it first:"
    echo "npm install -g wrangler"
    exit 1
fi

# Function to deploy to specific environment
deploy_environment() {
    local env=$1
    local env_name=$2
    
    print_status "Deploying to $env_name environment..."
    
    # Navigate to API directory
    cd apps/api
    
    # Install dependencies
    print_status "Installing dependencies..."
    npm install
    
    # Deploy to Cloudflare
    print_status "Deploying to Cloudflare Workers..."
    wrangler deploy --env $env
    
    print_status "✅ Successfully deployed to $env_name environment"
    
    # Return to root
    cd ../..
}

# Function to set secrets
set_secrets() {
    local env=$1
    
    print_status "Setting secrets for $env environment..."
    
    cd apps/api
    
    # Set required secrets (user will be prompted for values)
    echo "Please enter the following secrets for $env environment:"
    
    read -p "1inch API Key: " oneinch_key
    read -p "Relayer Ethereum Private Key: " relayer_eth_key
    read -p "Relayer Stellar Secret Key: " relayer_stellar_key
    read -p "Ethereum RPC URL: " ethereum_rpc
    read -p "Stellar Horizon URL: " stellar_horizon
    
    # Set secrets
    echo "$oneinch_key" | wrangler secret put ONEINCH_API_KEY --env $env
    echo "$relayer_eth_key" | wrangler secret put RELAYER_PRIVATE_KEY --env $env
    echo "$relayer_stellar_key" | wrangler secret put RELAYER_STELLAR_SECRET --env $env
    echo "$ethereum_rpc" | wrangler secret put ETHEREUM_RPC_URL --env $env
    echo "$stellar_horizon" | wrangler secret put STELLAR_HORIZON_URL --env $env
    
    print_status "✅ Secrets set for $env environment"
    
    cd ../..
}

# Function to run database migrations
run_migrations() {
    local env=$1
    
    print_status "Running database migrations for $env environment..."
    
    cd apps/api
    
    if [ "$env" = "development" ]; then
        wrangler d1 execute synappay-swaps --local --file=schema.sql
    else
        wrangler d1 execute synappay-swaps --file=schema.sql --env $env
    fi
    
    print_status "✅ Database migrations completed for $env environment"
    
    cd ../..
}

# Main deployment logic
main() {
    local target_env=${1:-"development"}
    
    case $target_env in
        "development")
            print_status "Starting development deployment..."
            deploy_environment "development" "Development"
            set_secrets "development"
            run_migrations "development"
            ;;
        "staging")
            print_status "Starting staging deployment..."
            deploy_environment "staging" "Staging"
            set_secrets "staging"
            run_migrations "staging"
            ;;
        "production")
            print_warning "You are about to deploy to PRODUCTION!"
            read -p "Are you sure? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                print_status "Starting production deployment..."
                deploy_environment "production" "Production"
                set_secrets "production"
                run_migrations "production"
            else
                print_status "Production deployment cancelled"
                exit 0
            fi
            ;;
        "all")
            print_status "Deploying to all environments..."
            deploy_environment "development" "Development"
            deploy_environment "staging" "Staging"
            
            print_warning "You are about to deploy to PRODUCTION!"
            read -p "Deploy to production as well? (y/N): " -n 1 -r
            echo
            if [[ $REPLY =~ ^[Yy]$ ]]; then
                deploy_environment "production" "Production"
            fi
            ;;
        *)
            print_error "Invalid environment: $target_env"
            echo "Usage: $0 [development|staging|production|all]"
            exit 1
            ;;
    esac
    
    print_status "🎉 Deployment completed successfully!"
    print_status "API endpoints:"
    echo "  - Development: https://synappay-api-dev.your-subdomain.workers.dev"
    echo "  - Staging: https://synappay-api-staging.your-subdomain.workers.dev"
    echo "  - Production: https://synappay-api-prod.your-subdomain.workers.dev"
    echo ""
    print_status "Health check: /health"
    print_status "Monitoring: /api/v1/monitoring/status"
}

# Run main function with arguments
main "$@"