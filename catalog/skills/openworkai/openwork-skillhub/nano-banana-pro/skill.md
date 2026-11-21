---
name: nano-banana-pro
description: Generate and edit images through the Gemini image model. Text-to-image and image-to-image, up to 4K. Edit by passing an input image plus editing instructions.
description_en: "AI image generation & editing (up to 4K)"
version: 1.0.1
display_name: "nano-banana-pro"
tags:
  - image-generation
  - image-editing
  - ai-art
visibility: public
---

# nano-banana-pro — Image Generation & Editing

Create new images or modify existing ones using Google's Gemini image model.

## Usage
Run the bundled script with `uv run`, using the **absolute skill path** (don't `cd` into the skill folder first):

**Generate:**
```bash
uv run {baseDir}/scripts/generate_image.py --prompt "your description" --filename "output.png" [--resolution 1K|2K|4K] [--api-key KEY]
```

**Edit an existing image:**
```bash
uv run {baseDir}/scripts/generate_image.py --prompt "editing instructions" --filename "output.png" --input-image "path/to/source.png" [--resolution 1K|2K|4K] [--api-key KEY]
```

Always run from the user's current working directory so outputs land where they're working.

## Workflow: draft → iterate → final
- **Draft (1K):** fast loop to validate the concept.
- **Iterate:** change the prompt in small diffs; use a new filename each run so you keep history.
- **Final (4K):** only once the prompt is locked.

## Resolutions
- `1K` (default) ≈ 1024px
- `2K` ≈ 2048px
- `4K` ≈ 4096px

## API key
Supplied via `--api-key`, or the `GEMINI_API_KEY` environment variable.

## Editing
Pass `--input-image` with the source path; the `--prompt` should describe the edit.

## Output
- PNG saved to the current directory; the script prints the full path.
- Don't read the image back — just tell the user where it was saved.
