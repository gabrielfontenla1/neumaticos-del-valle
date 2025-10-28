#!/usr/bin/env python3
"""
Create a placeholder image for products without images
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Create image dimensions
width = 800
height = 800

# Create a light gray image
image = Image.new('RGB', (width, height), color=(245, 245, 245))
draw = ImageDraw.Draw(image)

# Draw border
border_color = (220, 220, 220)
border_width = 2
draw.rectangle(
    [(0, 0), (width-1, height-1)],
    outline=border_color,
    width=border_width
)

# Add tire icon outline (simple representation)
center_x = width // 2
center_y = height // 2
outer_radius = 200
inner_radius = 120
tire_color = (200, 200, 200)

# Draw outer circle
draw.ellipse(
    [(center_x - outer_radius, center_y - outer_radius - 50),
     (center_x + outer_radius, center_y + outer_radius - 50)],
    outline=tire_color,
    width=3
)

# Draw inner circle
draw.ellipse(
    [(center_x - inner_radius, center_y - inner_radius - 50),
     (center_x + inner_radius, center_y + inner_radius - 50)],
    outline=tire_color,
    width=3
)

# Add tread lines
for i in range(8):
    angle = i * 45
    import math
    x1 = center_x + inner_radius * math.cos(math.radians(angle))
    y1 = center_y - 50 + inner_radius * math.sin(math.radians(angle))
    x2 = center_x + outer_radius * math.cos(math.radians(angle))
    y2 = center_y - 50 + outer_radius * math.sin(math.radians(angle))
    draw.line([(x1, y1), (x2, y2)], fill=tire_color, width=2)

# Add text
text = "Imagen no disponible"
text_color = (128, 128, 128)

# Try to use a better font, fall back to default if not available
try:
    # Try to use system font
    font_size = 48
    font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", font_size)
except:
    # Fall back to default font
    font = ImageFont.load_default()
    # For default font, we need to manually calculate size and position

# Get text bounding box
bbox = draw.textbbox((0, 0), text, font=font)
text_width = bbox[2] - bbox[0]
text_height = bbox[3] - bbox[1]

# Position text at the bottom center
text_x = (width - text_width) // 2
text_y = height - 150

# Draw text
draw.text((text_x, text_y), text, fill=text_color, font=font)

# Add secondary text
secondary_text = "Neumático sin fotografía"
try:
    secondary_font = ImageFont.truetype("/System/Library/Fonts/Helvetica.ttc", 32)
except:
    secondary_font = ImageFont.load_default()

# Get secondary text bounding box
bbox2 = draw.textbbox((0, 0), secondary_text, font=secondary_font)
text2_width = bbox2[2] - bbox2[0]

# Position secondary text
text2_x = (width - text2_width) // 2
text2_y = text_y + text_height + 20

# Draw secondary text
draw.text((text2_x, text2_y), secondary_text, fill=(160, 160, 160), font=secondary_font)

# Save the image
output_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'public', 'no-image.png')
image.save(output_path, 'PNG', optimize=True)

print(f"✅ Placeholder image created at: {output_path}")
print(f"   Dimensions: {width}x{height}")
print(f"   Format: PNG")