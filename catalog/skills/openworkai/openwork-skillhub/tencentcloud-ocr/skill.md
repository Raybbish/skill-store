---
name: tencentcloud-ocr
description: High-accuracy OCR via Tencent Cloud GeneralAccurateOCR. Triggers when the user sends, pastes, or links an image (or PDF) and wants the text extracted. Supports image URL, Base64, and PDF input, with optional per-character positions and a resume-structured-parsing guide.
description_en: "High-accuracy OCR powered by Tencent Cloud GeneralAccurateOCR API. Recognizes Chinese, English, numbers and special characters from images. Supports image URL, Base64, and PDF input with optional per-character positioning."
version: 1.0.4
display_name: "腾讯云通用文字识别（高精度版）"
tags:
  - ocr
  - tencent-cloud
  - text-recognition
visibility: public
---

# Tencent Cloud General OCR (High Accuracy)

Extract text from images with Tencent Cloud's `GeneralAccurateOCR` API.

## When to use
Trigger whenever the user wants text out of an image or PDF:
- They paste/upload/screenshot an image.
- They give an image URL (`https://…jpg`, or a `cos.`/`cdn.`/`oss.`/`imgur.com` host).
- They say "识别", "OCR", "提取文字", "看看写了什么", etc.
- They need structured parsing of a résumé (see `references/resume-parsing.md`).

You may call this automatically when those signals appear — no need for the user to type "OCR".

Input forms: image URL, Base64 (≤10MB), or a single PDF page.

## Requirements
- Python 3.6+
- `pip install tencentcloud-sdk-python`
- Env vars: `TENCENTCLOUD_SECRET_ID`, `TENCENTCLOUD_SECRET_KEY`

## Run it
The skill calls `client.GeneralAccurateOCR(req)` through `scripts/main.py`:

```bash
# Image URL (most common)
python scripts/main.py --image-url "https://example.com/document.jpg"

# Uploaded/local image as Base64
python scripts/main.py --image-base64 "/path/to/document.jpg"

# PDF page
python scripts/main.py --image-url "https://example.com/doc.pdf" --is-pdf true --pdf-page-number 1

# Per-character positions
python scripts/main.py --image-url "https://example.com/document.jpg" --is-words true
```

## Parameters
| Param | Type | Notes |
| --- | --- | --- |
| ImageBase64 | str | One of this or ImageUrl; ≤10MB |
| ImageUrl | str | Used in preference when both given |
| IsPdf | bool | Enable PDF recognition (default false) |
| PdfPageNumber | int | Page to read when IsPdf=true (default 1) |
| IsWords | bool | Return per-character position + confidence (default false) |
| UserAgent | str | Optional source tag; fixed to `Skills` |

`--user-agent` is optional and defaults to `Skills`; it is recorded for call tracing and needs no manual value.

## Output
Success:
```json
{ "raw_text": "line 1\nline 2\nline 3", "RequestId": "xxx" }
```
No text:
```json
{ "raw_text": "", "message": "No text detected in the image.", "RequestId": "xxx" }
```

## Setup
1. Create the key at https://console.cloud.tencent.com/cam/capi
2. Enable GeneralAccurateOCR at https://buy.cloud.tencent.com/iai_ocr (pick 通用文字识别（高精度版）)
3. Export credentials:
   - Linux/macOS: `export TENCENTCLOUD_SECRET_ID=…; export TENCENTCLOUD_SECRET_KEY=…`
   - Windows: `$env:TENCENTCLOUD_SECRET_ID=…; $env:TENCENTCLOUD_SECRET_KEY=…`
