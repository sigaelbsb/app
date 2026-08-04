import os
from PIL import Image, ImageDraw, ImageFont

def get_font(size, bold=False):
    fonts = [
        "C:\\Windows\\Fonts\\segoeuib.ttf" if bold else "C:\\Windows\\Fonts\\segoeui.ttf",
        "C:\\Windows\\Fonts\\arialbd.ttf" if bold else "C:\\Windows\\Fonts\\arial.ttf",
        "C:\\Windows\\Fonts\\calibrib.ttf" if bold else "C:\\Windows\\Fonts\\calibri.ttf"
    ]
    for f in fonts:
        if os.path.exists(f):
            try:
                return ImageFont.truetype(f, size)
            except Exception:
                pass
    return ImageFont.load_default()

def draw_rounded_rect(draw, bounds, radius, fill=None, outline=None, width=1):
    draw.rounded_rectangle(bounds, radius=radius, fill=fill, outline=outline, width=width)

def overlay_real_logos(ai_img_path, output_path):
    if not os.path.exists(ai_img_path):
        print(f"Error: No se encontró {ai_img_path}")
        return

    orig = Image.open(ai_img_path).convert("RGBA")
    w, h = orig.size
    
    # Expandir el lienzo hacia abajo 115 px para alojar los logos de las escuelas en su propio espacio sin tapar las tarjetas
    base = Image.new("RGBA", (w, h + 115), (6, 9, 17, 255))
    base.paste(orig, (0, 0))
    draw = ImageDraw.Draw(base)

    # --- 1. BANNER SUPERIOR ELEGANTE PARA EL LOGO REAL DEL SIGAE ---
    header_box = [25, 18, w - 25, 145]
    draw_rounded_rect(draw, header_box, radius=24, fill=(11, 17, 32, 240), outline=(0, 195, 255, 180), width=2)
    draw.line([45, 20, w - 45, 20], fill=(0, 230, 118, 255), width=3)

    sigae_path = "public/assets/img/sigae.png"
    if os.path.exists(sigae_path):
        sigae_img = Image.open(sigae_path).convert("RGBA")
        sw, sh = sigae_img.size
        new_h = 105
        new_w = int(sw * (new_h / sh))
        sigae_img = sigae_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        base.paste(sigae_img, (45, 28), sigae_img)
        title_x = 45 + new_w + 20
    else:
        title_x = 45

    draw.text((title_x, 38), "SOLICITUD DE CUPOS EN LÍNEA", font=get_font(34, bold=True), fill=(255, 255, 255, 255))
    draw.text((title_x, 82), "MÓDULO DE ADMISIONES • SIGAE UNIFICADO", font=get_font(21, bold=True), fill=(0, 195, 255, 255))
    
    badge_w = 210
    badge_box = [w - badge_w - 40, 50, w - 40, 110]
    draw_rounded_rect(draw, badge_box, radius=16, fill=(0, 230, 118, 35), outline=(0, 230, 118, 160), width=1)
    draw.text((w - badge_w - 26, 62), "⚡ EN VIVO 24/7", font=get_font(18, bold=True), fill=(0, 230, 118, 255))
    draw.text((w - badge_w - 26, 85), "100% Digital", font=get_font(15, bold=False), fill=(226, 232, 240, 255))

    # --- 2. BANNER DE ESCUELAS EN LA ZONA EXTENDIDA INFERIOR (SIN MONTARSE EN LOS PASOS) ---
    footer_box = [25, h + 10, w - 25, h + 100]
    draw_rounded_rect(draw, footer_box, radius=20, fill=(11, 17, 32, 245), outline=(139, 92, 246, 180), width=2)

    lb_path = "public/assets/img/logo_lb.png"
    if os.path.exists(lb_path):
        lb_img = Image.open(lb_path).convert("RGBA")
        nw = int(lb_img.width * (65 / lb_img.height))
        lb_img = lb_img.resize((nw, 65), Image.Resampling.LANCZOS)
        base.paste(lb_img, (45, h + 22), lb_img)
        draw.text((45 + nw + 14, h + 28), "UE Libertador Bolívar", font=get_font(19, bold=True), fill=(255, 255, 255, 255))
        draw.text((45 + nw + 14, h + 53), "Escuela en Oriente", font=get_font(14, bold=False), fill=(148, 163, 184, 255))

    sb_path = "public/assets/img/logo_sb.png"
    if os.path.exists(sb_path):
        sb_img = Image.open(sb_path).convert("RGBA")
        nw = int(sb_img.width * (65 / sb_img.height))
        sb_img = sb_img.resize((nw, 65), Image.Resampling.LANCZOS)
        base.paste(sb_img, (w//2 + 20, h + 22), sb_img)
        draw.text((w//2 + 20 + nw + 14, h + 28), "UE Santa Bárbara", font=get_font(19, bold=True), fill=(255, 255, 255, 255))
        draw.text((w//2 + 20 + nw + 14, h + 53), "Escuela en Oriente", font=get_font(14, bold=False), fill=(148, 163, 184, 255))

    base.save(output_path, "PNG")
    print(f"Éxito: {output_path}")

if __name__ == "__main__":
    ai_img = r"C:\Users\Luis Velásquez\.gemini\antigravity-ide\brain\b4e34d0d-d29f-4175-aef5-4c0bc35aca59\collage_cupos_8pasos_bg_1783991811396.png"
    overlay_real_logos(ai_img, "public/collage_solicitud_cupos_premium.png")
    overlay_real_logos(ai_img, "public/collage_solicitud_cupos.png")
