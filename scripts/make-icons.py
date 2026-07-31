"""Generate LuminaPlus favicon + PWA icons (any + maskable)."""

from __future__ import annotations

import struct
from io import BytesIO
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
ICONS = ROOT / "public" / "icons"

BG = (11, 12, 16, 255)
CARD = (24, 24, 27, 255)
ACCENT = (59, 130, 246, 255)
ONLINE = (47, 158, 101, 255)
BAR_CPU = (59, 130, 246, 255)
BAR_MEM = (139, 92, 246, 255)
BAR_NET = (16, 185, 129, 255)
TRACK = (39, 39, 42, 255)


def rounded_rect(draw: ImageDraw.ImageDraw, xy, radius: int, fill) -> None:
    draw.rounded_rectangle(xy, radius=radius, fill=fill)


def draw_dashboard(
    d: ImageDraw.ImageDraw,
    *,
    size: int,
    origin: tuple[int, int],
    box: int,
    with_l_mark: bool,
) -> None:
    """Draw monitor bars + online dot inside a square box of side `box`."""
    ox, oy = origin
    # inner card
    inset = max(2, box * 14 // 100)
    inner_r = max(3, box * 14 // 100)
    rounded_rect(
        d,
        [ox + inset, oy + inset, ox + box - 1 - inset, oy + box - 1 - inset],
        inner_r,
        CARD,
    )

    left = ox + box * 22 // 100
    right = ox + box * 62 // 100
    top = oy + box * 28 // 100
    bottom = oy + box * 72 // 100
    gap = max(1, box * 6 // 100)
    bar_h = max(2, (bottom - top - 2 * gap) // 3)
    widths = [0.92, 0.68, 0.80]
    colors = [BAR_CPU, BAR_MEM, BAR_NET]
    y = top
    for width, color in zip(widths, colors):
        d.rounded_rectangle(
            [left, y, right, y + bar_h],
            radius=max(1, bar_h // 2),
            fill=TRACK,
        )
        fill_r = left + max(bar_h, int((right - left) * width))
        d.rounded_rectangle(
            [left, y, fill_r, y + bar_h],
            radius=max(1, bar_h // 2),
            fill=color,
        )
        y += bar_h + gap

    dot_r = max(2, box * 7 // 100)
    cx = ox + box * 78 // 100
    cy = oy + box * 28 // 100
    ring = max(1, box // 48)
    d.ellipse(
        [cx - dot_r - ring, cy - dot_r - ring, cx + dot_r + ring, cy + dot_r + ring],
        fill=(15, 23, 18, 255),
    )
    d.ellipse([cx - dot_r, cy - dot_r, cx + dot_r, cy + dot_r], fill=ONLINE)

    if with_l_mark and box >= 64:
        mark_s = box * 10 // 100
        mx = ox + box * 72 // 100
        my = oy + box * 70 // 100
        stroke = max(2, box // 48)
        d.rectangle([mx, my - mark_s, mx + stroke, my], fill=ACCENT)
        d.rectangle([mx, my - stroke, mx + mark_s, my], fill=ACCENT)


def make_any_icon(size: int) -> Image.Image:
    """Standard app icon with transparent outside + rounded tile (for purpose: any)."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    pad = max(1, size // 32)
    radius = max(4, size * 22 // 100)
    rounded_rect(d, [pad, pad, size - 1 - pad, size - 1 - pad], radius, BG)
    draw_dashboard(d, size=size, origin=(0, 0), box=size, with_l_mark=size >= 64)
    return img


def make_maskable_icon(size: int) -> Image.Image:
    """
    Maskable icon: full-bleed opaque background, artwork in center ~80% safe zone.
    Installers (Android/Chrome) mask this; without safe padding they crop badly.
    """
    img = Image.new("RGBA", (size, size), BG)
    d = ImageDraw.Draw(img)
    # safe zone content ~ 80% centered
    content = int(size * 0.72)
    ox = (size - content) // 2
    oy = (size - content) // 2
    # soft card behind bars for depth
    card_r = max(6, content * 18 // 100)
    rounded_rect(d, [ox, oy, ox + content - 1, oy + content - 1], card_r, CARD)
    draw_dashboard(
        d,
        size=size,
        origin=(ox, oy),
        box=content,
        with_l_mark=True,
    )
    return img


def make_icon_small(size: int) -> Image.Image:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    rounded_rect(d, [0, 0, size - 1, size - 1], max(2, size // 5), BG)
    left, right = size * 18 // 100, size * 70 // 100
    top, bottom = size * 22 // 100, size * 78 // 100
    gap = 1 if size <= 16 else 2
    bar_h = max(1, (bottom - top - 2 * gap) // 3)
    widths = [0.95, 0.65, 0.8]
    colors = [BAR_CPU, BAR_MEM, BAR_NET]
    y = top
    for width, color in zip(widths, colors):
        fill_r = left + max(1, int((right - left) * width))
        d.rectangle([left, y, fill_r, y + bar_h], fill=color)
        y += bar_h + gap
    r = 1 if size <= 16 else 2
    cx, cy = size * 82 // 100, size * 28 // 100
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=ONLINE)
    return img


def png_bytes(img: Image.Image) -> bytes:
    buf = BytesIO()
    img.save(buf, format="PNG", optimize=True)
    return buf.getvalue()


def ico_from_pngs(entries: list[tuple[int, bytes]]) -> bytes:
    count = len(entries)
    header = struct.pack("<HHH", 0, 1, count)
    dir_entries: list[bytes] = []
    blobs: list[bytes] = []
    offset = 6 + 16 * count
    for size, data in entries:
        w = 0 if size >= 256 else size
        h = 0 if size >= 256 else size
        dir_entries.append(struct.pack("<BBBBHHII", w, h, 0, 0, 1, 32, len(data), offset))
        blobs.append(data)
        offset += len(data)
    return header + b"".join(dir_entries) + b"".join(blobs)


def main() -> None:
    ICONS.mkdir(parents=True, exist_ok=True)

    icon16 = make_icon_small(16)
    icon32 = make_icon_small(32)
    icon48 = make_any_icon(48)
    icon180 = make_any_icon(180)
    icon192 = make_any_icon(192)
    icon512 = make_any_icon(512)
    maskable192 = make_maskable_icon(192)
    maskable512 = make_maskable_icon(512)

    icon192.save(ICONS / "pwa-192x192.png", optimize=True)
    icon512.save(ICONS / "pwa-512x512.png", optimize=True)
    maskable192.save(ICONS / "pwa-192x192-maskable.png", optimize=True)
    maskable512.save(ICONS / "pwa-512x512-maskable.png", optimize=True)
    icon180.save(ICONS / "apple-touch-icon.png", optimize=True)
    icon32.save(ICONS / "favicon-32x32.png", optimize=True)
    icon16.save(ICONS / "favicon-16x16.png", optimize=True)

    ico = ico_from_pngs(
        [
            (16, png_bytes(icon16)),
            (32, png_bytes(icon32)),
            (48, png_bytes(icon48)),
        ]
    )
    (ROOT / "public" / "favicon.ico").write_bytes(ico)
    print(f"wrote public/favicon.ico ({len(ico)} bytes)")
    for path in sorted(ICONS.glob("*")):
        print(f"  {path.name}: {path.stat().st_size} bytes")


if __name__ == "__main__":
    main()
