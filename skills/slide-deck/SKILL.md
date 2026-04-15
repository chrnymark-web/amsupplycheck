---
name: slide-deck
description: >
  Use when the user wants to create a presentation, slide deck, PowerPoint, or PPTX file.
  Triggers on: "lav en presentation", "make a slideshow", "PowerPoint", "pitch deck",
  "slide deck", "partner presentation", "customer meeting slides", "PPTX".
  Generates branded SupplyCheck presentations using python-pptx with correct branding,
  layout, colors, and logo placement.
---

# Slide Deck Generator

## Overview

Generate branded SupplyCheck PowerPoint presentations using `python-pptx`. All slides follow the pitch deck layout: dark header bar, green accent strip with slide number, light gray content area, and the AMSupplyCheck logo.

## Branding Constants

```python
# Colors
GREEN = RGBColor(0x6B, 0x8F, 0x3C)       # Brand green
DARK = RGBColor(0x1A, 0x1A, 0x1A)         # Header/dark backgrounds
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
GRAY_LIGHT = RGBColor(0xF2, 0xF2, 0xF2)   # Content area background
GRAY_TEXT = RGBColor(0x55, 0x55, 0x55)     # Body text
DARK_TEXT = RGBColor(0x33, 0x33, 0x33)     # Heading text
RED_MUTED = RGBColor(0xCC, 0x44, 0x44)     # Negative/missing features

# Slide dimensions (16:9 widescreen)
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

# Fonts
# Headings: "Georgia" (serif, bold)
# Body: "Arial" (sans-serif)
```

## Logo Assets

| Asset | Path | Usage |
|-------|------|-------|
| Logo (dark bg) | `src/assets/amsupplycheck-logo-new.png` | Title slide, dark backgrounds |
| Logo (white/transparent) | `src/assets/amsupplycheck-logo-white.png` | Slide headers (small, top-right) |
| Checkmark icon | `public/brand/brand-logo-icon.png` | Decorative, dark panels |

## Slide Layout Pattern

Every slide (except title) follows this structure:

```
+--------------------------------------------------+--------+
|  [Logo small]          SLIDE TITLE (white)        | NUMBER |  <- Dark header (#1a1a1a)
|                                                   | (green)|  <- Green accent strip
+--------------------------------------------------+--------+
|                                                            |
|                    CONTENT AREA                            |  <- Light gray (#f2f2f2)
|                                                            |
|                                                            |
+------------------------------------------------------------+
```

### Header Helper Function

```python
def add_header(slide, title_text, slide_num):
    # Dark header bar (full width, 1.4" tall)
    header = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, 0, prs.slide_width, Inches(1.4))
    header.fill.solid()
    header.fill.fore_color.rgb = DARK
    header.line.fill.background()

    # Title text
    txBox = slide.shapes.add_textbox(Inches(0.5), Inches(0.25), Inches(10), Inches(0.9))
    p = txBox.text_frame.paragraphs[0]
    p.text = title_text
    p.font.size = Pt(36)
    p.font.bold = True
    p.font.color.rgb = WHITE
    p.font.name = "Georgia"

    # Green accent strip (right side)
    accent = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(12.333), 0, Inches(1), Inches(1.4))
    accent.fill.solid()
    accent.fill.fore_color.rgb = GREEN
    accent.line.fill.background()

    # Slide number in accent strip
    numBox = slide.shapes.add_textbox(Inches(12.333), Inches(0.25), Inches(1), Inches(0.9))
    p2 = numBox.text_frame.paragraphs[0]
    p2.text = str(slide_num)
    p2.font.size = Pt(32)
    p2.font.bold = True
    p2.font.color.rgb = WHITE
    p2.font.name = "Georgia"
    p2.alignment = PP_ALIGN.CENTER

    # Logo in header (white version, small)
    slide.shapes.add_picture(LOGO_WHITE, Inches(9.5), Inches(0.15), height=Inches(0.45))

def add_bg(slide):
    bg = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, 0, Inches(1.4), prs.slide_width, Inches(6.1))
    bg.fill.solid()
    bg.fill.fore_color.rgb = GRAY_LIGHT
    bg.line.fill.background()
```

## Common Slide Types

### 1. Title Slide
- Left 70%: light gray background with logo (large) + title + subtitle
- Right 30%: dark panel with checkmark icon
- No header bar

### 2. Content Slide with Flow Diagram
- Rounded rectangle boxes connected by green arrows (`MSO_SHAPE.RIGHT_ARROW`)
- Boxes: white bg for external entities, dark bg for SupplyCheck
- Stats cards below: white rounded rectangles with green bold numbers

### 3. Benefits/Features List
- Left side: icon squares (green rounded rect with white checkmark) + title + description
- Right side: dark card with dashboard preview mockup (stats, search matches)

### 4. Pricing Slide
- Side-by-side cards (white rounded rectangles)
- Featured card: green border + "Recommended" badge (green rounded rect above card)
- Checkmarks (green) for included features, X marks (red muted) for excluded
- Guarantee callout: dark green rounded rectangle at bottom of premium card

### 5. Contact/CTA Slide
- Centered layout with large checkmark circle
- Heading + subtitle + contact info with icons

## Quick Reference

```python
# Required imports
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

# Install if needed
# pip3 install python-pptx

# Create presentation
prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

# Add blank slide (always use layout 6 = blank)
slide = prs.slides.add_slide(prs.slide_layouts[6])

# Add image
slide.shapes.add_picture("path.png", Inches(x), Inches(y), width=Inches(w))
# or height=Inches(h) to scale by height

# Add shape
shape = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, width, height)
shape.fill.solid()
shape.fill.fore_color.rgb = GREEN
shape.line.fill.background()  # no border

# Add text with multiple styled runs
txBox = slide.shapes.add_textbox(left, top, width, height)
tf = txBox.text_frame
tf.word_wrap = True
p = tf.paragraphs[0]
p.alignment = PP_ALIGN.CENTER

r = p.add_run()
r.text = "Bold text"
r.font.size = Pt(16)
r.font.bold = True
r.font.color.rgb = GREEN
r.font.name = "Arial"

# New paragraph in same text frame
p2 = tf.add_paragraph()

# Save
prs.save("output.pptx")
```

## Workflow

1. Clarify slide count and content with user
2. Generate PPTX using python-pptx with branding above
3. Save to project root as `SupplyCheck_[Purpose]_Presentation.pptx`
4. Optionally create HTML version in `public/presentations/` for web viewing
5. Commit and push (auto-deploy per project convention)

## Common Mistakes

- Using `slide_layouts[0]` instead of `[6]` (blank) - other layouts have placeholder shapes
- Forgetting `line.fill.background()` on shapes - leaves ugly default borders
- Not setting `word_wrap = True` on text frames - text overflows
- Using wrong logo for background (dark logo on dark bg = invisible)
- Hardcoding pixel values instead of `Inches()` / `Pt()`
