# Content Multiplier Skill

## Overview
The Content Multiplier skill is designed to effortlessly adapt your core content into various formats tailored for different social media platforms and communication channels. This enables consistent brand messaging and maximizes reach with minimal manual effort.

## Capabilities
- **Multi-platform adaptation**: Generate content variations for Twitter/X, LinkedIn, Instagram, TikTok scripts, and Email Newsletters from a single input.
- **Brand voice configuration**: Customize the output tone and style using `config.yaml` to match your brand's unique voice.
- **Image prompt generation**: Automatically suggest image prompts appropriate for each platform's content, aiding visual content creation.
- **Example usage and test cases**: Includes examples and tests to ensure proper functionality and demonstrate capabilities.

## When to use this skill
- When you have a core message, blog post, article, or video script and need to repurpose it across multiple digital channels.
- To maintain consistency in your brand's communication style across different platforms.
- To save time and resources in content creation, allowing your marketing team to focus on strategy rather than repetitive formatting.
- For A/B testing different content variations on specific platforms.

## Configuration (config.yaml)

The `config.yaml` file allows you to define your brand's voice and guidelines, ensuring all generated content aligns with your marketing strategy.

```yaml
brand_name: "Your Brand Name"
brand_voice: "professional, engaging, innovative" # e.g., "friendly, informative, witty"
platforms:
  twitter:
    max_length: 280
    hashtags: ["#YourBrand", "#Marketing", "#Innovation"]
    tone_modifier: "concise, attention-grabbing"
  linkedin:
    max_length: 1200
    hashtags: ["#Professional", "#IndustryInsights"]
    tone_modifier: "authoritative, insightful, professional"
  instagram:
    max_length: 2200
    hashtags: ["#VisualStorytelling", "#Creativity"]
    tone_modifier: "inspirational, visually descriptive, community-focused"
  tiktok:
    max_length: 150 # Script length in words, approximate
    tone_modifier: "energetic, ট্রেন্ডি, direct, short-form video focused"
  email_newsletter:
    max_length: 5000 # Words, approximate
    tone_modifier: "informative, personal, direct to audience"
```

## Usage Examples

### Example 1: Basic content adaptation

To generate content for all configured platforms using a simple input:

```bash
python agent.py "Our new product launch redefines connectivity with cutting-edge AI and seamless integration."
```

### Example 2: Specifying target platforms

To generate content only for Twitter and LinkedIn:

```bash
python agent.py "Our new product launch redefines connectivity with cutting-edge AI and seamless integration." --platforms twitter,linkedin
```

### Example 3: Overriding brand voice (for a specific campaign)

To temporarily change the tone for a specific message:

```bash
python agent.py "Our new product launch redefines connectivity with cutting-edge AI and seamless integration." --voice "exciting, revolutionary"
```

## How it works (agent.py)

The `agent.py` script takes a core content piece, applies brand voice settings from `config.yaml`, and generates tailored output for each specified platform. It leverages a templating approach combined with dynamic adjustments for length, tone, and visual suggestions.

## Test Cases

To run the integrated test suite and verify the skill's functionality:

```bash
python test_agent.py
```
