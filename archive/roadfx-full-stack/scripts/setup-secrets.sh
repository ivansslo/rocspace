#!/bin/bash
# ROADFX Full Stack - Setup Secrets Script
# Run this on your local machine with wrangler installed

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║       🔐 ROADFX Setup Secrets & Routes                   ║"
echo "╚════════════════════════════════════════════════════════════╝"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ============================================
# SECRETS - roadfx-gateway
# ============================================
echo -e "\n${YELLOW}Setting secrets for roadfx-gateway...${NC}"

echo "Enter secrets when prompted:"

# TOKEN
echo -e "${GREEN}1. TOKEN${NC}"
echo -n "TOKEN: "
read -s TOKEN
echo ""

# GROQ_KEY
echo -e "${GREEN}2. GROQ_KEY${NC}"
echo -n "GROQ_KEY: "
read -s GROQ_KEY
echo ""

# GEMINI_KEY
echo -e "${GREEN}3. GEMINI_KEY${NC}"
echo -n "GEMINI_KEY: "
read -s GEMINI_KEY
echo ""

# OR_KEY
echo -e "${GREEN}4. OR_KEY${NC}"
echo -n "OR_KEY: "
read -s OR_KEY
echo ""

# CLAWLINK_KEY
echo -e "${GREEN}5. CLAWLINK_KEY${NC}"
echo -n "CLAWLINK_KEY: "
read -s CLAWLINK_KEY
echo ""

# Set secrets
echo -e "\n${YELLOW}Setting secrets via wrangler...${NC}"

echo "$TOKEN" | wrangler secret put TOKEN --name roadfx-gateway
echo "$GROQ_KEY" | wrangler secret put GROQ_KEY --name roadfx-gateway
echo "$GEMINI_KEY" | wrangler secret put GEMINI_KEY --name roadfx-gateway
echo "$OR_KEY" | wrangler secret put OR_KEY --name roadfx-gateway
echo "$CLAWLINK_KEY" | wrangler secret put CLAWLINK_KEY --name roadfx-gateway

# ============================================
# SECRETS - cf-ai-factory
# ============================================
echo -e "\n${YELLOW}Setting secrets for cf-ai-factory...${NC}"

echo -e "${GREEN}6. CF_AI_TOKEN${NC}"
echo -n "CF_AI_TOKEN: "
read -s CF_AI_TOKEN
echo ""

echo "$TOKEN" | wrangler secret put TOKEN --name cf-ai-factory
echo "$CF_AI_TOKEN" | wrangler secret put CF_AI_TOKEN --name cf-ai-factory

echo -e "\n${GREEN}✅ All secrets set successfully!${NC}"

# ============================================
# VERIFY
# ============================================
echo -e "\n${YELLOW}Verifying deployment...${NC}"

echo "Testing hermes-cloudflare:"
curl -s https://hermes-cloudflare.certveis.workers.dev/health

echo -e "\n${GREEN}✅ Setup complete!${NC}"
echo -e "📋 Workers deployed:"
echo "   - roadfx-gateway"
echo "   - cf-ai-factory"
echo -e "\n🌐 Add custom routes via Cloudflare Dashboard:"
echo "   Dashboard → Workers → roadfx-gateway → Triggers → Routes"
