# -*- coding: utf-8 -*-
"""메가헤르츠 블로그 썸네일 v2 — 모델 사진 배경 + 후킹 문구 (2026-09-22 대표님 지시).

기존(텍스트 카드) 대비: 실사 모델 사진을 깔고 왼쪽에 어두운 그라데이션 + 큰 후킹 문구.
사용:
  python megahertz_thumb.py <사진> <출력> "제목줄1|제목줄2" "노랑강조줄" ["하단소제목"]
"""
import sys

from PIL import Image, ImageDraw, ImageFont

W = H = 1080
FONT_B = r"C:\Windows\Fonts\malgunbd.ttf"
FONT_R = r"C:\Windows\Fonts\malgun.ttf"

MINT = (100, 226, 183)
YELLOW = (255, 214, 51)
WHITE = (255, 255, 255)
GREY = (200, 208, 220)


def cover(img):
    r = max(W / img.width, H / img.height)
    img = img.resize((int(img.width * r) + 1, int(img.height * r) + 1), Image.LANCZOS)
    x = (img.width - W) // 2
    return img.crop((x, 0, x + W, H))


def build(photo, out, title_lines, accent_line, sub=None):
    base = cover(Image.open(photo).convert("RGB"))
    ov = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(ov)
    # 왼쪽 어두운 그라데이션 (텍스트 가독성) + 하단 얕은 그라데이션
    for x in range(W):
        a = int(215 * max(0.0, 1 - x / (W * 0.68)) ** 1.15)
        d.line([(x, 0), (x, H)], fill=(10, 16, 32, a))
    for y in range(H):
        a = int(140 * max(0.0, (y - H * 0.62) / (H * 0.38)) ** 1.3) if y > H * 0.62 else 0
        d.line([(0, y), (W, y)], fill=(8, 12, 24, a))
    base = Image.alpha_composite(base.convert("RGBA"), ov)
    d = ImageDraw.Draw(base)

    chip = ImageFont.truetype(FONT_B, 34)
    big = ImageFont.truetype(FONT_B, 88)
    subf = ImageFont.truetype(FONT_R, 36)

    DARK = (12, 18, 34)
    d.text((72, 88), "MEGAHERTZ LAB", font=chip, fill=MINT,
           stroke_width=2, stroke_fill=DARK)

    y = 210
    for ln in title_lines:
        d.text((72, y), ln, font=big, fill=WHITE, stroke_width=5, stroke_fill=DARK)
        y += 118
    d.text((72, y + 6), accent_line, font=big, fill=YELLOW,
           stroke_width=5, stroke_fill=DARK)
    y += 118 + 6

    if sub:
        d.text((72, y + 40), sub, font=subf, fill=WHITE,
               stroke_width=3, stroke_fill=DARK)

    d.text((72, H - 110), "메가헤르츠 마케팅연구소",
           font=ImageFont.truetype(FONT_R, 30), fill=WHITE,
           stroke_width=2, stroke_fill=DARK)
    base.convert("RGB").save(out, "PNG")
    print("SAVED", out)


if __name__ == "__main__":
    photo, out, titles, accent = sys.argv[1:5]
    sub = sys.argv[5] if len(sys.argv) > 5 else None
    build(photo, out, titles.split("|"), accent, sub)
