#!/bin/bash
set -e

# This script is a guide for manual DNS configuration in CloudFlare
# You will need to perform these steps in the CloudFlare dashboard

echo "Manual CloudFlare DNS Configuration Instructions:"
echo "------------------------------------------------"
echo "1. Log in to your CloudFlare account"
echo "2. Select your domain (e.g., familycabin.io)"
echo "3. Go to the DNS management section"
echo "4. Add an A record:"
echo "   - Name: app (or your configured subdomain)"
echo "   - IPv4 address: <Your MetalLB Load Balancer IP>"
echo "   - Proxy status: Proxied (recommended)"
echo "   - TTL: Auto"
echo "5. Save the record"
echo ""
echo "Make sure your MetalLB load balancer IP is correctly configured for external access"