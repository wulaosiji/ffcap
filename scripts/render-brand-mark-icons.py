#!/usr/bin/env python3
"""Rasterize the shared BrandMark geometry into favicon / apple-touch assets."""

from __future__ import annotations

import math
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = (ROOT / 'src' / 'content' / 'brand-mark.mjs').read_text()


def hex_color(value: str) -> tuple[int, int, int, int]:
    value = value.removeprefix('#')
    return int(value[0:2], 16), int(value[2:4], 16), int(value[4:6], 16), 255


def parse_constants() -> dict:
    paper = SOURCE.split("BRAND_MARK_PAPER = '")[1].split("'")[0]
    viewbox = int(SOURCE.split('BRAND_MARK_VIEWBOX = ')[1].split('\n')[0])
    paper_rx = int(SOURCE.split('BRAND_MARK_PAPER_RX = ')[1].split('\n')[0])
    bar_w = int(SOURCE.split('width: ')[1].split(',')[0])
    bar_h = int(SOURCE.split('height: ')[1].split(',')[0])
    bar_rx = int(SOURCE.split('rx: ')[1].split(' ')[0])
    bars = []
    for line in SOURCE.split('export const BRAND_MARK_BARS = [')[1].split(']')[0].splitlines():
        if 'fill:' not in line:
            continue
        x = int(line.split('x: ')[1].split(',')[0])
        y = int(line.split('y: ')[1].split(',')[0])
        fill = line.split("fill: '")[1].split("'")[0]
        bars.append((x, y, fill))
    return {
        'paper': paper,
        'viewbox': viewbox,
        'paper_rx': paper_rx,
        'bar': (bar_w, bar_h, bar_rx),
        'bars': bars,
    }


def rounded_rect_coverage(px: float, py: float, x: float, y: float, w: float, h: float, r: float) -> float:
    cx = min(max(px, x + r), x + w - r)
    cy = min(max(py, y + r), y + h - r)
    if x + r <= px <= x + w - r or y + r <= py <= y + h - r:
        inside = x <= px <= x + w and y <= py <= y + h
        return 1.0 if inside else 0.0
    dx = px - cx
    dy = py - cy
    dist = math.hypot(dx, dy)
    if dist <= r - 0.5:
        return 1.0
    if dist >= r + 0.5:
        return 0.0
    return max(0.0, min(1.0, r + 0.5 - dist))


def blend(dst: tuple[int, int, int, int], src: tuple[int, int, int, int], alpha: float) -> tuple[int, int, int, int]:
    a = src[3] / 255 * alpha
    if a <= 0:
        return dst
    out_a = a + dst[3] / 255 * (1 - a)
    inv = 1 - a
    return (
        round((src[0] * a + dst[0] * dst[3] / 255 * inv) / out_a),
        round((src[1] * a + dst[1] * dst[3] / 255 * inv) / out_a),
        round((src[2] * a + dst[2] * dst[3] / 255 * inv) / out_a),
        round(out_a * 255),
    )


def render(size: int, constants: dict) -> list[tuple[int, int, int, int]]:
    scale = size / constants['viewbox']
    paper = hex_color(constants['paper'])
    bar_w, bar_h, bar_rx = constants['bar']
    pixels = []
    for y in range(size):
        for x in range(size):
            px = (x + 0.5) / scale
            py = (y + 0.5) / scale
            color = (0, 0, 0, 0)
            color = blend(color, paper, rounded_rect_coverage(px, py, 0, 0, constants['viewbox'], constants['viewbox'], constants['paper_rx']))
            for bx, by, fill in constants['bars']:
                color = blend(color, hex_color(fill), rounded_rect_coverage(px, py, bx, by, bar_w, bar_h, bar_rx))
            pixels.append(color)
    return pixels


def png_bytes(size: int, pixels: list[tuple[int, int, int, int]]) -> bytes:
    raw = b''.join(b'\x00' + b''.join(bytes(p) for p in pixels[y * size:(y + 1) * size]) for y in range(size))

    def chunk(tag: bytes, data: bytes) -> bytes:
        return struct.pack('>I', len(data)) + tag + data + struct.pack('>I', zlib.crc32(tag + data) & 0xFFFFFFFF)

    return (
        b'\x89PNG\r\n\x1a\n'
        + chunk(b'IHDR', struct.pack('>IIBBBBB', size, size, 8, 6, 0, 0, 0))
        + chunk(b'IDAT', zlib.compress(raw, 9))
        + chunk(b'IEND', b'')
    )


def bmp_icon(size: int, pixels: list[tuple[int, int, int, int]]) -> bytes:
    xor = b''
    for y in range(size - 1, -1, -1):
        for x in range(size):
            r, g, b, a = pixels[y * size + x]
            xor += bytes((b, g, r, a))
    row = ((size + 31) // 32) * 4
    mask = b'\x00' * (row * size)
    header = struct.pack('<IiiHHIIiiII', 40, size, size * 2, 1, 32, 0, len(xor), 0, 0, 0, 0)
    return header + xor + mask


def ico_bytes(images: list[tuple[int, bytes]]) -> bytes:
    header = struct.pack('<HHH', 0, 1, len(images))
    offset = 6 + 16 * len(images)
    entries = b''
    payload = b''
    for size, data in images:
        entries += struct.pack('<BBBBHHII', size if size < 256 else 0, size if size < 256 else 0, 0, 0, 1, 32, len(data), offset)
        payload += data
        offset += len(data)
    return header + entries + payload


def svg_markup(constants: dict, size: int = 64) -> str:
    scale = size / constants['viewbox']
    bar_w, bar_h, bar_rx = constants['bar']
    tiles = '\n'.join(
        f'  <rect x="{bx * scale:.1f}" y="{by * scale:.1f}" width="{bar_w * scale:.1f}" height="{bar_h * scale:.1f}" rx="{bar_rx * scale:.1f}" fill="{fill}"/>'
        for bx, by, fill in constants['bars']
    )
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}">\n'
        f'  <rect width="{size}" height="{size}" rx="{constants["paper_rx"] * scale:.1f}" fill="{constants["paper"]}"/>\n'
        f'{tiles}\n'
        f'</svg>\n'
    )


def write(path: Path, data: bytes | str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if isinstance(data, str):
        path.write_text(data)
    else:
        path.write_bytes(data)


def main() -> None:
    constants = parse_constants()
    svg = svg_markup(constants)
    write(ROOT / 'public' / 'favicon.svg', svg)
    write(ROOT / 'src' / 'app' / 'icon.svg', svg)

    px32 = render(32, constants)
    px48 = render(48, constants)
    png180 = png_bytes(180, render(180, constants))
    ico = ico_bytes([(32, bmp_icon(32, px32)), (48, bmp_icon(48, px48))])
    write(ROOT / 'src' / 'app' / 'favicon.ico', ico)
    write(ROOT / 'public' / 'favicon.ico', ico)
    write(ROOT / 'src' / 'app' / 'apple-icon.png', png180)
    write(ROOT / 'public' / 'apple-touch-icon.png', png180)


if __name__ == '__main__':
    main()
