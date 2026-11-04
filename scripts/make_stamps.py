"""文字スタンプの画像を作る(client/public/stamps に置く画像の元)。

使い方:  python3 scripts/make_stamps.py <出力先フォルダ>
  → <出力先>/<id>.png と、全体の確認用 _sheet.png、大きさの一覧 _meta.json ができる。
  できた画像は 0.32 倍に縮めて client/public/stamps/ に置いている
  (画面では reactionStamps.ts の imageHeight の高さで出す)。

必要なもの: Pillow(pip install pillow)、~/Library/Fonts の 851チカラヨワク・源暎ゴシック2・
Morisawa Fonts(MorisawaFonts フォルダ)、macOS のヒラギノ明朝(神のみ)。
文言・色・飾り・フォントは下の STAMPS / FONT_FOR / OPTS を直す。
🙏の絵は Noto Emoji (Google, Apache 2.0 / OFL 1.1) で、scripts/stamps/ に同梱。
"""
import math, random, sys, json, os, unicodedata
from PIL import Image, ImageDraw, ImageFont, ImageFilter

HOME = os.path.expanduser("~")
FONT = f"{HOME}/Library/Fonts/851CHIKARA-YOWAKU_002.ttf"   # 手書き(飾りの「？」にも使う)
MF = f"{HOME}/Library/Fonts/MorisawaFonts"
FONTS = {
    "handwrite": FONT,
    "geneiblack": f"{HOME}/Library/Fonts/GenEiMGothic2-Black.ttf",
    "gocurl": f"{MF}/A-SK-GocurlMin2-H.otf",
    "gosha": f"{MF}/A-SK-GoshaMin2-E.otf",
    "inamin": f"{MF}/A-SK-InaminMin2-E.otf",
    "puhu": f"{MF}/AP-OTF-PuhuPicnicMin2-H.otf",
    "kantei": f"{MF}/YuKantei-U.otf",
    "mincho": ("/System/Library/Fonts/ヒラギノ明朝 ProN.ttc", 2),   # 仮: システムフォント(アプリに載せる前にAdobe Fontsの明朝へ替える)
}
# 文言に合わせたフォント: 気持ちの強さ・やわらかさで選ぶ
FONT_FOR = {
    "thanks": "gocurl", "kansha": "gosha", "tasukaru": "gocurl", "kami": "mincho",
    "naruhodo": "puhu", "tame": "gocurl", "ryokai": "geneiblack", "wakaru": "gocurl",
    "watashi": "puhu", "shirabe": "gosha", "jikan": "handwrite", "makasete": "inamin",
    "kaiketsu": "gocurl", "gomen": "handwrite",
}
OUT = sys.argv[1]; os.makedirs(OUT, exist_ok=True)
OUTLINE = (60, 44, 74, 255)
def rgb(h, a=255): h=h.lstrip('#'); return tuple(int(h[i:i+2],16) for i in (0,2,4))+(a,)

# ---------- 飾り(4倍で描いて縮める) ----------
SS = 4
def canvas(size): return Image.new("RGBA", (size*SS, size*SS), (0,0,0,0))
def fin(img, size): return img.resize((size, size), Image.LANCZOS)

def heart(size, color="#f472b6"):
    im = canvas(size); d = ImageDraw.Draw(im); W = size*SS
    pts = []
    for i in range(200):
        t = i/200*2*math.pi
        x = 16*math.sin(t)**3
        y = -(13*math.cos(t)-5*math.cos(2*t)-2*math.cos(3*t)-math.cos(4*t))
        pts.append((W*(0.5+x/36), W*(0.5+y/36+0.04)))
    d.polygon(pts, fill=rgb(color), outline=OUTLINE, width=int(W*0.05))
    return fin(im, size)

def star4(d, cx, cy, r, color, W):
    pts = []
    for i in range(8):
        a = math.pi/4*i - math.pi/2
        rr = r if i%2==0 else r*0.28
        pts.append((cx+rr*math.cos(a), cy+rr*math.sin(a)))
    d.polygon(pts, fill=rgb(color), outline=OUTLINE, width=int(W*0.03))

def sparkles(size, color="#fde047"):
    im = canvas(size); d = ImageDraw.Draw(im); W = size*SS
    star4(d, W*0.40, W*0.58, W*0.36, color, W)
    star4(d, W*0.78, W*0.24, W*0.20, "#fff7ae", W)
    star4(d, W*0.80, W*0.80, W*0.14, color, W)
    return fin(im, size)

def drop_shape(d, cx, cy, r, color, W):
    pts = [(cx, cy-r*1.7)]
    for i in range(-60, 241, 6):
        a = math.radians(i)
        pts.append((cx + r*math.cos(a), cy + r*math.sin(a)))
    d.polygon(pts, fill=rgb(color), outline=OUTLINE, width=int(W*0.035))

def sweat(size, color="#7dd3fc"):
    im = canvas(size); d = ImageDraw.Draw(im); W = size*SS
    drop_shape(d, W*0.40, W*0.62, W*0.20, color, W)
    drop_shape(d, W*0.74, W*0.40, W*0.12, color, W)
    return fin(im, size)

def bulb(size):
    im = canvas(size); d = ImageDraw.Draw(im); W = size*SS
    for i in range(7):
        a = math.radians(-160 + i*20)
        x1, y1 = W*0.5+W*0.34*math.cos(a), W*0.40+W*0.34*math.sin(a)
        x2, y2 = W*0.5+W*0.47*math.cos(a), W*0.40+W*0.47*math.sin(a)
        d.line([(x1,y1),(x2,y2)], fill=rgb("#f59e0b"), width=int(W*0.05))
    d.ellipse([W*0.27, W*0.14, W*0.73, W*0.60], fill=rgb("#fde047"), outline=OUTLINE, width=int(W*0.05))
    d.rounded_rectangle([W*0.38, W*0.58, W*0.62, W*0.80], radius=W*0.04, fill=rgb("#cbd5e1"), outline=OUTLINE, width=int(W*0.04))
    return fin(im, size)

def magnifier(size):
    im = canvas(size); d = ImageDraw.Draw(im); W = size*SS
    d.line([(W*0.62,W*0.62),(W*0.88,W*0.88)], fill=OUTLINE, width=int(W*0.15))
    d.line([(W*0.62,W*0.62),(W*0.88,W*0.88)], fill=rgb("#b45309"), width=int(W*0.07))
    d.ellipse([W*0.10, W*0.10, W*0.70, W*0.70], fill=rgb("#cffafe"), outline=OUTLINE, width=int(W*0.06))
    d.arc([W*0.20, W*0.20, W*0.55, W*0.55], 200, 270, fill=(255,255,255,255), width=int(W*0.04))
    return fin(im, size)

def clock(size):
    im = canvas(size); d = ImageDraw.Draw(im); W = size*SS
    d.ellipse([W*0.08, W*0.14, W*0.78, W*0.84], fill=rgb("#ffffff"), outline=OUTLINE, width=int(W*0.055))
    c = (W*0.43, W*0.49)
    d.line([c, (W*0.43, W*0.25)], fill=OUTLINE, width=int(W*0.05))
    d.line([c, (W*0.60, W*0.58)], fill=OUTLINE, width=int(W*0.05))
    drop_shape(d, W*0.84, W*0.30, W*0.09, "#7dd3fc", W)
    return fin(im, size)

def bubble_q(size, font):
    im = canvas(size); d = ImageDraw.Draw(im); W = size*SS
    d.polygon([(W*0.22,W*0.62),(W*0.14,W*0.90),(W*0.46,W*0.72)], fill=rgb("#ffffff"), outline=OUTLINE, width=int(W*0.04))
    d.ellipse([W*0.08, W*0.10, W*0.92, W*0.72], fill=rgb("#ffffff"), outline=OUTLINE, width=int(W*0.05))
    f = ImageFont.truetype(FONT, int(W*0.52))
    d.text((W*0.5, W*0.40), "？", font=f, fill=rgb("#0ea5e9"), anchor="mm", stroke_width=int(W*0.02), stroke_fill=OUTLINE)
    return fin(im, size)

def check_badge(size):
    im = canvas(size); d = ImageDraw.Draw(im); W = size*SS
    d.ellipse([W*0.08, W*0.08, W*0.92, W*0.92], fill=rgb("#22c55e"), outline=OUTLINE, width=int(W*0.055))
    pts = [(W*0.27,W*0.52),(W*0.44,W*0.69),(W*0.74,W*0.33)]
    d.line(pts, fill=OUTLINE, width=int(W*0.15), joint="curve")
    d.line(pts, fill=(255,255,255,255), width=int(W*0.08), joint="curve")
    return fin(im, size)

def nod(size):
    im = canvas(size); d = ImageDraw.Draw(im); W = size*SS
    for k, y in enumerate((0.20, 0.52)):
        pts = [(W*0.18, W*y), (W*0.5, W*(y+0.24)), (W*0.82, W*y)]
        d.line(pts, fill=OUTLINE, width=int(W*0.15), joint="curve")
        d.line(pts, fill=rgb("#4ade80" if k==0 else "#22c55e"), width=int(W*0.08), joint="curve")
    return fin(im, size)

def confetti(size, seed=3):
    rnd = random.Random(seed); im = canvas(size); d = ImageDraw.Draw(im); W = size*SS
    cols = ["#f87171","#fbbf24","#34d399","#60a5fa","#c084fc","#f472b6"]
    for i in range(16):
        a = rnd.uniform(0, 2*math.pi); rr = rnd.uniform(0.40, 0.50)   # 中心から離れた外周だけ
        cx, cy = W*(0.5+rr*math.cos(a)), W*(0.5+rr*math.sin(a))
        a = rnd.uniform(0, math.pi); w, h = W*0.055, W*0.028
        pts = [(cx+math.cos(a)*dx-math.sin(a)*dy, cy+math.sin(a)*dx+math.cos(a)*dy) for dx,dy in ((-w,-h),(w,-h),(w,h),(-w,h))]
        d.polygon(pts, fill=rgb(rnd.choice(cols)), outline=OUTLINE, width=int(W*0.012))
    return fin(im, size)

def kaomoji(size, text="m(_ _)m", color="#a78bfa"):
    im = Image.new("RGBA", (size*3, size), (0,0,0,0)); d = ImageDraw.Draw(im)
    f = ImageFont.truetype(FONT, int(size*0.62))
    d.text((size*1.5, size*0.5), text, font=f, fill=rgb(color), anchor="mm", stroke_width=5, stroke_fill=OUTLINE)
    return im.crop(im.getbbox())

def bow(size, color="#f59e0b"):
    im = canvas(size); d = ImageDraw.Draw(im); W = size*SS
    legs = [(W*0.30, W*0.93), (W*0.30, W*0.62)]; torso = [(W*0.30, W*0.62), (W*0.68, W*0.46)]
    for pts in (legs, torso):
        d.line(pts, fill=OUTLINE, width=int(W*0.20)); 
    for pts in (legs, torso):
        d.line(pts, fill=rgb(color), width=int(W*0.11))
    d.ellipse([W*0.66, W*0.40, W*0.90, W*0.64], fill=rgb("#fde68a"), outline=OUTLINE, width=int(W*0.05))
    return fin(im, size)

def flower(size, color="#f9a8d4"):
    im = canvas(size); d = ImageDraw.Draw(im); W = size*SS
    for i in range(5):
        a = 2*math.pi*i/5 - math.pi/2; cx, cy = W*(0.5+0.24*math.cos(a)), W*(0.5+0.24*math.sin(a)); r = W*0.17
        d.ellipse([cx-r, cy-r, cx+r, cy+r], fill=rgb(color), outline=OUTLINE, width=int(W*0.04))
    r = W*0.12; d.ellipse([W*0.5-r, W*0.5-r, W*0.5+r, W*0.5+r], fill=rgb("#fde047"), outline=OUTLINE, width=int(W*0.04))
    return fin(im, size)

def noto_pray(size):
    # Noto Emoji の🙏(Apache 2.0 / OFL 1.1)。512px版を縮めて使う
    src = Image.open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "stamps", "noto_emoji_u1f64f_512.png")).convert("RGBA")
    return src.resize((size, size), Image.LANCZOS)

def pray(size):
    im = canvas(size); W = size*SS
    def hand():
        h = canvas(size); d = ImageDraw.Draw(h)
        d.ellipse([W*0.30, W*0.10, W*0.58, W*0.90], fill=rgb("#fbbf24"), outline=OUTLINE, width=int(W*0.05))
        for yy in (0.40, 0.52, 0.64):
            d.line([(W*0.36, W*yy), (W*0.50, W*yy)], fill=rgb("#d97706"), width=int(W*0.025))
        return h.rotate(-16, resample=Image.BICUBIC, center=(W*0.5, W*0.9))
    left = hand(); right = left.transpose(Image.FLIP_LEFT_RIGHT)
    im.alpha_composite(right); im.alpha_composite(left)
    d = ImageDraw.Draw(im)
    for dx, ang in ((0.0, -90), (-0.16, -130), (0.16, -50)):
        a = math.radians(ang); x0, y0 = W*(0.5+dx), W*0.10
        d.line([(x0+W*0.05*math.cos(a), y0+W*0.05*math.sin(a)), (x0+W*0.13*math.cos(a), y0+W*0.13*math.sin(a))], fill=rgb("#facc15"), width=int(W*0.04))
    return fin(im, size)

def popper(size, seed=7):
    rnd = random.Random(seed); im = canvas(size); d = ImageDraw.Draw(im); W = size*SS
    ap, m1, m2 = (W*0.08, W*0.94), (W*0.20, W*0.50), (W*0.50, W*0.80)   # クラッカーの先端と口の両端
    cone = [ap, m1, m2]
    d.polygon(cone, fill=rgb("#fbbf24"))
    for t in (0.42, 0.66):                                               # しま模様
        p1 = (ap[0]+(m1[0]-ap[0])*t, ap[1]+(m1[1]-ap[1])*t); p2 = (ap[0]+(m2[0]-ap[0])*t, ap[1]+(m2[1]-ap[1])*t)
        d.line([p1, p2], fill=rgb("#ef4444"), width=int(W*0.06))
    d.polygon(cone, outline=OUTLINE, width=int(W*0.03))
    d.line([m1, m2], fill=OUTLINE, width=int(W*0.04))
    ox, oy = (m1[0]+m2[0])/2, (m1[1]+m2[1])/2
    cols = ["#f87171","#fbbf24","#34d399","#60a5fa","#c084fc","#f472b6"]
    for i in range(7):                                                   # 口から飛び出す、うねる紙テープ
        a0 = math.radians(-75 + i*9); pts = []
        for k in range(16):
            t = k/15; r = W*(0.10 + 0.42*t); wob = math.sin(t*9 + i)*W*0.03
            pts.append((ox + r*math.cos(a0) - wob*math.sin(a0), oy + r*math.sin(a0) + wob*math.cos(a0)))
        d.line(pts, fill=OUTLINE, width=int(W*0.055), joint="curve")
        d.line(pts, fill=rgb(cols[i % len(cols)]), width=int(W*0.03), joint="curve")
    for i in range(9):                                                   # 紙吹雪
        a = math.radians(rnd.uniform(-85, -10)); r = W*rnd.uniform(0.18, 0.52)
        cx, cy = ox + r*math.cos(a), oy + r*math.sin(a); c = rgb(rnd.choice(cols))
        if i % 3 == 0:
            rr = W*0.04; d.ellipse([cx-rr, cy-rr, cx+rr, cy+rr], fill=c, outline=OUTLINE, width=int(W*0.012))
        else:
            ang = rnd.uniform(0, math.pi); w, h = W*0.05, W*0.026
            pts = [(cx+math.cos(ang)*dx-math.sin(ang)*dy, cy+math.sin(ang)*dx+math.cos(ang)*dy) for dx,dy in ((-w,-h),(w,-h),(w,h),(-w,h))]
            d.polygon(pts, fill=c, outline=OUTLINE, width=int(W*0.012))
    return fin(im, size)

def emph(size, color="#4ade80"):
    im = canvas(size); d = ImageDraw.Draw(im); W = size*SS
    for ang, ln in ((-82, 0.40), (-48, 0.46), (-14, 0.40)):
        a = math.radians(ang); x0, y0 = W*0.12, W*0.88
        p0 = (x0 + W*0.28*math.cos(a), y0 + W*0.28*math.sin(a)); p1 = (x0 + W*(0.28+ln)*math.cos(a), y0 + W*(0.28+ln)*math.sin(a))
        d.line([p0, p1], fill=OUTLINE, width=int(W*0.13)); d.line([p0, p1], fill=rgb(color), width=int(W*0.065))
    return fin(im, size)

def nodmarks(size):
    im = canvas(size); d = ImageDraw.Draw(im); W = size*SS
    for k, y in enumerate((0.28, 0.62)):
        pts = [(W*0.16, W*y), (W*0.50, W*(y+0.20)), (W*0.84, W*y)]
        d.line(pts, fill=OUTLINE, width=int(W*0.14), joint="curve"); d.line(pts, fill=rgb("#4ade80"), width=int(W*0.07), joint="curve")
    return fin(im, size)

def glitter(w, h, seed=11):
    rnd = random.Random(seed); s = max(w, h)*2.1; im = Image.new("RGBA", (int(s), int(s)), (0,0,0,0)); d = ImageDraw.Draw(im)
    cx = cy = s/2
    for i in range(16):
        a = rnd.uniform(0, 2*math.pi); r = s*rnd.uniform(0.27, 0.46); x, y = cx + r*math.cos(a), cy + r*math.sin(a)
        rr = s*rnd.choice((0.035, 0.05, 0.075)); pts = []
        for j in range(8):
            aa = math.pi/4*j - math.pi/2; q = rr if j % 2 == 0 else rr*0.26
            pts.append((x+q*math.cos(aa), y+q*math.sin(aa)))
        d.polygon(pts, fill=rgb(rnd.choice(("#ffffff","#fff7ae","#fde047"))), outline=OUTLINE, width=3)
    return im

def speedlines(w, h):
    s = max(w, h); im = Image.new("RGBA", (int(s*2.3), int(s*1.9)), (0,0,0,0)); d = ImageDraw.Draw(im)
    cx, cy = im.width/2, im.height/2
    for i in range(36):
        a = 2*math.pi*i/36; da = math.radians(2.2)
        r0, r1 = s*0.60, s*(0.78 + 0.5*(rnd_len(i)-0.95))
        d.polygon([(cx+r0*math.cos(a-da), cy+r0*math.sin(a-da)*0.85), (cx+r1*math.cos(a), cy+r1*math.sin(a)*0.85), (cx+r0*math.cos(a+da), cy+r0*math.sin(a+da)*0.85)], fill=(120, 53, 15, 150))
    return im

def rnd_len(i):
    return 0.95 + 0.25*((i*37) % 7)/7

def rays(w, h, colors=("#fde047","#fbbf24")):
    s = max(w, h)*0.72; im = Image.new("RGBA", (int(s*2.4), int(s*2.4)), (0,0,0,0)); d = ImageDraw.Draw(im)
    cx = cy = s*1.2; n = 16
    for i in range(n):
        a1 = 2*math.pi*i/n; a2 = a1 + math.pi/n
        d.polygon([(cx,cy),(cx+s*1.15*math.cos(a1), cy+s*1.15*math.sin(a1)),(cx+s*1.15*math.cos(a2), cy+s*1.15*math.sin(a2))],
                  fill=rgb(colors[i%2]))
    return im

def burst(w, h, color="#fde68a"):
    s = max(w, h)*0.52; im = Image.new("RGBA", (int(s*2.6), int(s*2.2)), (0,0,0,0)); d = ImageDraw.Draw(im)
    cx, cy = im.width/2, im.height/2; pts = []
    for i in range(20):
        a = 2*math.pi*i/20; r = 1.0 if i%2==0 else 0.58
        pts.append((cx+s*1.15*r*math.cos(a)*1.15, cy+s*0.95*r*math.sin(a)))
    d.polygon(pts, fill=rgb(color), outline=OUTLINE, width=6)
    return im

# ---------- 文字 ----------
def load_font(spec, size):
    if isinstance(spec, tuple): return ImageFont.truetype(spec[0], size, index=spec[1])
    return ImageFont.truetype(spec or FONT, size)

def text_layer(lines, colors, size, seed, fontpath=None, opts=None):
    opts = opts or {}
    rnd = random.Random(seed); font = load_font(fontpath, size)
    pad = 40; line_h = int(size*1.12)
    widths = [sum(font.getlength(c) for c in l)*0.97 for l in lines]
    W = int(max(widths)) + pad*2; H = line_h*len(lines) + pad*2
    im = Image.new("RGBA", (W, H), (0,0,0,0)); k = 0
    for li, line in enumerate(lines):
        x = pad + (max(widths)-widths[li])/2
        for ch in line:
            layer = Image.new("RGBA", (size*2, size*2), (0,0,0,0)); d = ImageDraw.Draw(layer)
            nfd = unicodedata.normalize("NFD", ch); mark = nfd[1] if len(nfd) == 2 else None
            base = nfd[0] if mark in ("\u3099", "\u309a") else ch
            col = rgb(colors[k % len(colors)]); sw = max(4, size//24)
            if opts.get('gradient'):
                d.text((size//2, size//2 - 8), base, font=font, fill=OUTLINE, stroke_width=sw, stroke_fill=OUTLINE)
                m = Image.new("L", layer.size, 0); ImageDraw.Draw(m).text((size//2, size//2 - 8), base, font=font, fill=255)
                gh = layer.size[1]; grad = Image.new("RGBA", layer.size)
                gp = grad.load(); stops = [rgb(c) for c in opts['gradient']]
                for yy in range(gh):
                    t0 = min(max((yy - size*0.45)/(size*0.95), 0), 1)*(len(stops)-1); i0 = min(int(t0), len(stops)-2); f0 = t0 - i0
                    c0 = tuple(int(stops[i0][j]*(1-f0) + stops[i0+1][j]*f0) for j in range(4))
                    for xx in range(layer.size[0]): gp[xx, yy] = c0
                layer.paste(grad, (0, 0), m)
            else:
                d.text((size//2, size//2 - 8), base, font=font, fill=col, stroke_width=sw, stroke_fill=OUTLINE)
            if base != ch:   # 濁点・半濁点を太く描き足す
                bx0, by0, bx1, by1 = font.getbbox(base); ox0, oy0 = size//2, size//2 - 8
                tx, ty = ox0 + bx1 - size*0.30, oy0 + by0 + size*0.01
                if mark == "\u3099":
                    for dx in (0, size*0.10):
                        seg = [(tx+dx, ty), (tx+dx+size*0.04, ty+size*0.12)]
                        d.line(seg, fill=OUTLINE, width=int(size*0.085)+sw); d.line(seg, fill=col, width=int(size*0.085))
                else:
                    r = size*0.075; cx, cy = tx+size*0.07, ty+size*0.07
                    d.ellipse([cx-r-sw, cy-r-sw, cx+r+sw, cy+r+sw], fill=OUTLINE); d.ellipse([cx-r, cy-r, cx+r, cy+r], fill=(255,255,255,255))
            layer = layer.rotate(rnd.uniform(-6, 6), resample=Image.BICUBIC, center=(size, size))
            im.alpha_composite(layer, (int(x - size//2), pad + li*line_h - size//2 + (rnd.randint(-4, 4) if not opts.get('bob') else (-9 if k % 2 == 0 else 9)) + 8))
            x += font.getlength(ch)*0.97; k += 1
    return im.crop(im.getbbox())

# ---------- 組み立て ----------
def compose(lines, colors, decos, seed, tall, fontpath=None, opts=None):
    opts = opts or {}
    size = 84 if len(lines) > 1 else (170 if len(''.join(lines)) == 1 else 112)
    t = text_layer(lines, colors, size, seed, fontpath, opts); tw, th = t.size
    if opts.get('shear'):
        a = opts['shear']; t = t.transform((tw + int(a*th), th), Image.AFFINE, (1, a, -a*th, 0, 1, 0), resample=Image.BICUBIC); tw, th = t.size
    M = 40; Wc, Hc = tw + 520, th + 360
    base = Image.new("RGBA", (Wc, Hc), (0,0,0,0))
    ox, oy = 260, 180                      # 文字の左上
    back = Image.new("RGBA", (Wc, Hc), (0,0,0,0)); front = Image.new("RGBA", (Wc, Hc), (0,0,0,0))
    for kind, place in decos:
        if kind == "glitter": im = glitter(tw, th); front.alpha_composite(im, (int(ox+tw/2-im.width/2), int(oy+th/2-im.height/2))); continue
        if kind == "speed":   im = speedlines(tw, th); back.alpha_composite(im, (int(ox+tw/2-im.width/2), int(oy+th/2-im.height/2))); continue
        if kind == "rays":   im = rays(tw, th); back.alpha_composite(im, (int(ox+tw/2-im.width/2), int(oy+th/2-im.height/2))); continue
        if kind == "burst":  im = burst(tw, th); back.alpha_composite(im, (int(ox+tw/2-im.width/2), int(oy+th/2-im.height/2))); continue
        if kind == "confetti": im = confetti(int(max(tw, th*1.5)*1.25)); back.alpha_composite(im, (int(ox+tw/2-im.width/2), int(oy+th/2-im.height/2))); continue
        ds = int((th*0.78 if place in ("L","R") else th*0.62) * {"pray":1.1,"popper":1.6}.get(kind, 1))
        im = {"heart":lambda:heart(ds),"sparkles":lambda:sparkles(ds),"sweat":lambda:sweat(ds),"bulb":lambda:bulb(ds),
              "magnifier":lambda:magnifier(ds),"clock":lambda:clock(ds),"q":lambda:bubble_q(ds, FONT),
              "check":lambda:check_badge(ds),"nod":lambda:nod(ds),
              "flower":lambda:flower(ds),"pray":lambda:noto_pray(ds),"popper":lambda:popper(ds),"nodmarks":lambda:nodmarks(ds),"emph":lambda:emph(ds)}[kind]()
        if place == "L":   pos = (ox - im.width + 14, oy + th//2 - im.height//2)
        elif place == "R": pos = (ox + tw - 14, oy + th//2 - im.height//2)
        elif place == "TR":pos = (ox + tw - int(im.width*0.55), oy - int(im.height*0.62))
        elif place == "TL":pos = (ox - int(im.width*0.45), oy - int(im.height*0.62))
        elif place == "BR":pos = (ox + tw - int(im.width*0.55), oy + th - int(im.height*0.45))
        else: pos = (ox, oy)
        front.alpha_composite(im, (int(pos[0]), int(pos[1])))
    base.alpha_composite(back); base.alpha_composite(t, (ox, oy)); base.alpha_composite(front)
    alpha = base.split()[3]
    border = alpha.filter(ImageFilter.MaxFilter(27)).filter(ImageFilter.GaussianBlur(1.2)).point(lambda v: 255 if v > 90 else 0)
    white = Image.new("RGBA", base.size, (255,255,255,255)); white.putalpha(border)
    shadow = Image.new("RGBA", base.size, (30,20,40,0)); shadow.putalpha(border.filter(ImageFilter.GaussianBlur(5)).point(lambda v: int(v*0.35)))
    out = Image.new("RGBA", base.size, (0,0,0,0)); out.alpha_composite(shadow, (0,5)); out.alpha_composite(white); out.alpha_composite(base)
    bb = out.getbbox(); out = out.crop((max(bb[0]-4,0), max(bb[1]-4,0), min(bb[2]+4,out.width), min(bb[3]+4,out.height)))
    return out   # 拡縮しない。文字の大きさが全スタンプで一定になる

PAL = lambda *c: list(c)
STAMPS = [
 ("thanks",  ["ありがとう"],            PAL("#fb923c","#f97316","#facc15","#fb923c","#f472b6"), [("heart","TR")]),
 ("kansha",  ["感謝"],                  PAL("#fde047","#facc15","#fbbf24"),                       [("pray","R")]),
 ("tasukaru",["たすかる"],              PAL("#ec4899","#f472b6","#db2777","#f472b6"),            []),
 ("kami",    ["神"],                    PAL("#fbbf24"),                                           [("rays","BG"),("glitter","FG")]),
 ("naruhodo",["なるほど"],              PAL("#eab308","#facc15","#ca8a04","#facc15"),             [("bulb","L")]),
 ("tame",    ["ために","なりました"],   PAL("#8b5cf6","#a78bfa","#7c3aed","#a78bfa","#8b5cf6"), [("sparkles","TR")]),
 ("ryokai",  ["了解です"],              PAL("#3b82f6","#60a5fa","#2563eb","#60a5fa"),             [("check","R")]),
 ("wakaru",  ["わかる"],                PAL("#22c55e","#4ade80","#16a34a"),                       [("emph","TR")]),
 ("watashi", ["私も","気になる"],       PAL("#0ea5e9","#38bdf8","#0284c7","#38bdf8","#0ea5e9"),  [("q","TR")]),
 ("shirabe", ["調べてます"],            PAL("#14b8a6","#2dd4bf","#0d9488","#2dd4bf","#14b8a6"),  [("magnifier","R")]),
 ("jikan",   ["時間","かかりそうです"], PAL("#64748b","#94a3b8","#475569","#94a3b8","#64748b","#94a3b8","#475569"), [("clock","R")]),
 ("makasete",["任せて"],                PAL("#dc2626","#b91c1c","#ef4444"),                       [("burst","BG")]),
 ("kaiketsu",["解決","しました！"],     PAL("#84cc16","#a3e635","#65a30d","#a3e635","#84cc16","#65a30d"), [("popper","R")]),
 ("gomen",   ["ごめん","なさい"],       PAL("#a78bfa","#c4b5fd","#8b5cf6","#c4b5fd"),            [("sweat","TR")]),
]
OPTS = {
    "kami": {"gradient": ["#fffbe0", "#fde047", "#f59e0b"]},
    "wakaru": {"bob": True},
    "makasete": {"shear": 0.30},
}
imgs = []; meta = {}
for k, (sid, lines, cols, decos) in enumerate(STAMPS):
    im = compose(lines, cols, decos, k*13+5, False, FONTS[FONT_FOR[sid]], OPTS.get(sid, {})); im.save(f"{OUT}/{sid}.png", optimize=True)
    imgs.append((sid, im)); meta[sid] = {"w": im.width, "h": im.height, "kb": os.path.getsize(f"{OUT}/{sid}.png")//1024, "lines": len(lines)}
json.dump(meta, open(f"{OUT}/_meta.json","w"), ensure_ascii=False, indent=1)

sheet_w = 1200
def sheet(bg):
    x = y = 20; rowh = 0; placed = []
    for sid, im in imgs:
        if x + im.width + 20 > sheet_w: x = 20; y += rowh + 24; rowh = 0
        placed.append((im, x, y)); x += im.width + 24; rowh = max(rowh, im.height)
    s = Image.new("RGBA", (sheet_w, y + rowh + 20), bg)
    for im, px, py in placed: s.alpha_composite(im, (px, py))
    return s
a, b = sheet((250,250,250,255)), sheet((30,41,59,255))
full = Image.new("RGB", (sheet_w, a.height + b.height)); full.paste(a.convert("RGB"), (0,0)); full.paste(b.convert("RGB"), (0,a.height))
full.save(f"{OUT}/_sheet.png"); print(json.dumps(meta, ensure_ascii=False))
