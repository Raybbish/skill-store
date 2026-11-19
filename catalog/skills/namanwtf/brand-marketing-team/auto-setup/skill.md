---
name: auto-setup
description: Universal brand setup that auto-discovers brand details from website/socials
author: @namanwtf
version: 3.0.0
category: core
---

# 🤖 Auto-Setup Agent

**Purpose:** Automatically configure your entire marketing team by analyzing your brand's website and social media. Zero manual input required.

---

## When to Use

```bash
@auto-setup init
@auto-setup analyze https://yourbrand.com
@auto-setup validate
```

Use this skill when:
- Setting up Brand Marketing Team for the first time
- Adding a new brand to your workspace
- Updating brand details after website redesign
- Migrating from another marketing tool

---

## Auto-Discovery Features

### 1. Website Analysis
- Brand name detection
- Product/service identification
- Price range extraction
- Target audience inference
- Competitor identification
- Brand voice analysis

### 2. Social Media Scanning
- Instagram/Twitter analysis
- Post frequency and engagement
- Content themes detection
- Hashtag patterns
- Follower demographics

### 3. Competitor Detection
- Auto-identifies top 5 competitors
- Analyzes their positioning
- Pricing comparison
- Marketing channel detection

---

## Setup Process (60 Seconds)

```
$ npm run setup

🚀 Brand Marketing Team - Auto Setup

? Enter your website URL: https://yourbrand.com
🔍 Analyzing website...
✓ Brand name detected: YourBrand
✓ Industry detected: Fashion/Apparel
✓ Products detected: 47 items
✓ Price range: $45-250
✓ Target audience: Millennials, Gen Z

? Social media handles (optional):
  Instagram: @yourbrand ✓
  Twitter: @yourbrand ✓
  
🔍 Analyzing social presence...
✓ Posting frequency: 2x/day
✓ Top hashtags: #sustainablefashion #ootd
✓ Engagement rate: 4.2%

? Detected competitors:
  ✓ Competitor A (similar pricing)
  ✓ Competitor B (higher end)
  ✓ Competitor C (fast fashion)
  
  Add more? (comma-separated): 

🤖 Generating your AI marketing team...
✓ Competitive Intelligence Agent
✓ Pricing Optimizer Agent
✓ Copywriting Agent
✓ Meta Ads Optimizer
✓ Analytics Dashboard
✓ Email Marketing Agent
✓ Social Media Agent

⚡ Setup complete! Your marketing team is ready.

Next steps:
  1. Review brand-context.md
  2. Set up API keys in .env
  3. Run: npm run team:start
```

---

## Generated Configuration

The auto-setup creates:

### brand-context.md
```yaml
brand:
  name: "YourBrand"
  industry: "Fashion/Apparel"
  tagline: "Sustainable fashion for everyone"
  
audience:
  demographics:
    age: "18-34"
    gender: "60% female, 40% male"
    location: "US, UK, Canada"
  psychographics:
    values: ["sustainability", "quality", "style"]
    interests: ["fashion", "lifestyle", "environment"]

products:
  categories:
    - name: "Dresses"
      price_range: "$45-120"
    - name: "Tops"
      price_range: "$25-65"
    - name: "Bottoms"
      price_range: "$35-95"

positioning:
  tier: "mid-market"
  differentiator: "Sustainable materials at accessible prices"
  brand_voice: "friendly, conscious, trendy"

competitors:
  - name: "CompetitorA"
    positioning: "Premium sustainable"
    threat_level: "medium"
  - name: "CompetitorB"
    positioning: "Fast fashion"
    threat_level: "high"

marketing:
  channels:
    primary: ["instagram", "meta_ads", "email"]
    secondary: ["tiktok", "pinterest"]
  content_themes:
    - "sustainability education"
    - "styling tips"
    - "customer stories"
```

---

## Universal Compatibility

Works with any brand type:

**E-commerce:**
- Auto-detects product catalog
- Extracts pricing tiers
- Identifies shipping policies

**SaaS:**
- Detects pricing plans
- Identifies feature sets
- Analyzes target users

**Services:**
- Extracts service offerings
- Detects pricing models
- Identifies service areas

**Local Business:**
- Detects location/services
- Analyzes local competitors
- Identifies customer base

---

## Technical Implementation

### Website Scraping
```javascript
// Extracts structured data from any website
const brandData = await autoSetup.analyzeWebsite('https://brand.com');

// Returns:
{
  name: "BrandName",
  industry: "detected_from_content",
  products: [...],
  pricing: { min: 45, max: 250 },
  competitors: [...],
  brandVoice: "detected_from_copy"
}
```

### Social Analysis
```javascript
// Analyzes social media presence
const socialData = await autoSetup.analyzeSocial({
  instagram: '@brand',
  twitter: '@brand'
});

// Returns:
{
  postingFrequency: "2x daily",
  topHashtags: [...],
  engagementRate: 4.2,
  audienceDemographics: {...},
  contentThemes: [...]
}
```

---

## Zero-Config Mode

For fully automated setup:

```bash
# One command - everything auto-configured
npx brand-marketing-team init my-brand --auto

# This will:
# 1. Scrape website from package.json or .env
# 2. Auto-detect all brand details
# 3. Generate complete marketing team
# 4. Start all agents immediately
```

---

## Customization After Auto-Setup

Even though it's automated, you can customize:

```bash
# Edit brand context
vim brand-context.md

# Add manual competitors
@auto-setup add-competitor "NewCompetitor"

# Adjust detected settings
@auto-setup adjust --price-range "$50-300"
```

---

## Credits

Built by @namanwtf (https://twitter.com/namanwtf)

Auto-discovery powered by:
- Website scraping (Puppeteer)
- NLP analysis (Gemini)
- Social APIs (Instagram Basic Display, Twitter API)

---

*Part of the Brand Marketing Team framework.*
