import os
import io
import urllib.request
from PIL import Image, ImageDraw, ImageFont, ImageFilter

def draw_rounded_rect(draw, bbox, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(bbox, radius=radius, fill=fill, outline=outline, width=width)

def draw_text_wrapped(draw, text, font, fill, x, y, max_width, line_spacing=4):
    words = text.split(' ')
    lines = []
    current_line = []

    for word in words:
        test_line = ' '.join(current_line + [word])
        bbox = font.getbbox(test_line)
        w = bbox[2] - bbox[0]
        if w <= max_width:
            current_line.append(word)
        else:
            if current_line:
                lines.append(' '.join(current_line))
                current_line = [word]
            else:
                lines.append(word)
                current_line = []
    if current_line:
        lines.append(' '.join(current_line))

    curr_y = y
    for line in lines:
        draw.text((x, curr_y), line, font=font, fill=fill)
        bbox = font.getbbox(line)
        h = bbox[3] - bbox[1]
        curr_y += h + line_spacing
    return curr_y

def main():
    W, H = 1080, 1580
    # Clean bright canvas
    canvas = Image.new('RGBA', (W, H), (244, 248, 253, 255))
    draw = ImageDraw.Draw(canvas)

    # Smooth subtle bright sky gradient
    for y in range(H):
        r = int(242 + (248 - 242) * (y / H))
        g = int(247 + (251 - 247) * (y / H))
        b = int(255 + (253 - 255) * (y / H))
        draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

    # Vibrant ambient light accents
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse([(-120, -120), (550, 500)], fill=(186, 230, 253, 150))
    gdraw.ellipse([(W-450, 180), (W+150, 750)], fill=(199, 210, 254, 140))
    gdraw.ellipse([(-120, H-450), (450, H+100)], fill=(167, 243, 208, 130))
    gdraw.ellipse([(W-380, H-350), (W+100, H+80)], fill=(254, 215, 170, 150))
    glow = glow.filter(ImageFilter.GaussianBlur(80))
    canvas.alpha_composite(glow)

    draw = ImageDraw.Draw(canvas)

    # Fonts
    font_bold_path = "C:/Windows/Fonts/segoeuib.ttf"
    font_reg_path = "C:/Windows/Fonts/segoeui.ttf"

    font_title = ImageFont.truetype(font_bold_path, 52)
    font_sub = ImageFont.truetype(font_bold_path, 21)
    font_badge = ImageFont.truetype(font_bold_path, 15)
    font_school = ImageFont.truetype(font_bold_path, 16)
    font_motto = ImageFont.truetype(font_bold_path, 14)
    font_feat_title = ImageFont.truetype(font_bold_path, 19)
    font_feat_desc = ImageFont.truetype(font_reg_path, 14)
    font_banner_title = ImageFont.truetype(font_bold_path, 17)
    font_banner_desc = ImageFont.truetype(font_reg_path, 14)
    font_url = ImageFont.truetype(font_bold_path, 20)
    font_cta_label = ImageFont.truetype(font_bold_path, 15)
    font_footer = ImageFont.truetype(font_reg_path, 13)

    # --- 1. Institutional Header ---
    top_bar_h = 145
    top_bar = Image.new('RGBA', (W, top_bar_h), (255, 255, 255, 250))
    tb_draw = ImageDraw.Draw(top_bar)
    tb_draw.line([(0, top_bar_h-1), (W, top_bar_h-1)], fill=(226, 232, 240, 255), width=2)
    canvas.alpha_composite(top_bar, (0, 0))

    base_dir = r"c:\Users\Luis Velásquez\Desktop\SIGAE_Unificado\public\assets\img"
    icons_dir = r"c:\Users\Luis Velásquez\Desktop\SIGAE_Unificado\public\icons3d"
    
    # Left: Santa Bárbara - "Educar para la Vida"
    sb_logo_path = os.path.join(base_dir, "logo_sb.png")
    if os.path.exists(sb_logo_path):
        sb_img = Image.open(sb_logo_path).convert('RGBA')
        sb_img.thumbnail((90, 100), Image.Resampling.LANCZOS)
        canvas.paste(sb_img, (45, (top_bar_h - sb_img.height) // 2), sb_img)
        draw.text((145, 46), "U.E. SANTA BÁRBARA", font=font_school, fill=(15, 23, 42, 255))
        draw.text((145, 74), "“Educar para la Vida”", font=font_motto, fill=(2, 132, 199, 255))

    # Right: Libertador Bolívar - "Formando al Nuevo Republicano"
    lb_logo_path = os.path.join(base_dir, "logo_lb.png")
    if os.path.exists(lb_logo_path):
        lb_img = Image.open(lb_logo_path).convert('RGBA')
        lb_img.thumbnail((90, 100), Image.Resampling.LANCZOS)
        lb_x = W - 45 - lb_img.width
        canvas.paste(lb_img, (lb_x, (top_bar_h - lb_img.height) // 2), lb_img)
        draw.text((lb_x - 15, 46), "U.E. LIBERTADOR BOLÍVAR", font=font_school, fill=(15, 23, 42, 255), anchor="rt")
        draw.text((lb_x - 15, 74), "“Formando al Nuevo Republicano”", font=font_motto, fill=(225, 29, 72, 255), anchor="rt")

    # Center: SIGAE Logo (Superimposed / Sobrepuesto, much bigger with 3D drop shadow!)
    sigae_logo_path = os.path.join(base_dir, "sigae.png")
    if os.path.exists(sigae_logo_path):
        sigae_img = Image.open(sigae_logo_path).convert('RGBA')
        # Significantly larger: 185x185px
        sigae_img.thumbnail((185, 185), Image.Resampling.LANCZOS)
        sx = (W - sigae_img.width) // 2
        # Position overlapping the top bar line: centered at y=75
        sy = 10
        
        # Soft shadow under superimposed logo
        shadow_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        sdraw = ImageDraw.Draw(shadow_layer)
        sdraw.ellipse([(sx + 10, sy + 15), (sx + sigae_img.width - 10, sy + sigae_img.height + 20)], fill=(15, 23, 42, 70))
        shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(15))
        canvas.alpha_composite(shadow_layer)

        canvas.paste(sigae_img, (sx, sy), sigae_img)

    # --- 2. Title Section ---
    y_cursor = top_bar_h + 38
    
    # Badge Pill: "NUEVA ACTUALIZACIÓN DE SISTEMA"
    badge_text = "NUEVA ACTUALIZACIÓN DE SISTEMA"
    bbox = font_badge.getbbox(badge_text)
    bw, bh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    bx = (W - bw - 44) // 2
    draw_rounded_rect(draw, [bx, y_cursor, bx + bw + 44, y_cursor + bh + 16], radius=20, 
                      fill=(224, 242, 254, 255), outline=(2, 132, 199, 180), width=2)
    draw.ellipse([bx + 14, y_cursor + (bh + 16)//2 - 4, bx + 22, y_cursor + (bh + 16)//2 + 4], fill=(2, 132, 199, 255))
    draw.ellipse([bx + bw + 22, y_cursor + (bh + 16)//2 - 4, bx + bw + 30, y_cursor + (bh + 16)//2 + 4], fill=(2, 132, 199, 255))
    draw.text((bx + 28, y_cursor + 7), badge_text, font=font_badge, fill=(2, 132, 199, 255))

    y_cursor += bh + 24

    # Main Title
    title_text = "SIGAE VERSIÓN 1.1"
    draw.text((W // 2, y_cursor), title_text, font=font_title, fill=(15, 23, 42, 255), anchor="mt")
    y_cursor += 58

    # Subtitle with exact full name: Sistema Integral de Gestión y Administración Escolar
    sub_text = "Sistema Integral de Gestión y Administración Escolar"
    draw.text((W // 2, y_cursor), sub_text, font=font_sub, fill=(30, 64, 175, 255), anchor="mt")
    y_cursor += 38

    # --- 3. Center Section: Zoe & Max 3D + Features List with WHITE BACKGROUND ICONS ---
    col_w_left = 360
    col_w_right = 610
    left_x = 45
    right_x = left_x + col_w_left + 20
    section_y = y_cursor

    char_card_h = 580
    draw_rounded_rect(draw, [left_x, section_y, left_x + col_w_left, section_y + char_card_h],
                      radius=24, fill=(255, 255, 255, 240), outline=(226, 232, 240, 255), width=2)

    zoe_max_path = os.path.join(base_dir, "personajes", "zoe_max_duo_3d.png")
    if os.path.exists(zoe_max_path):
        zm_img = Image.open(zoe_max_path).convert('RGBA')
        zm_img.thumbnail((330, 400), Image.Resampling.LANCZOS)
        zx = left_x + (col_w_left - zm_img.width) // 2
        zy = section_y + 25
        canvas.paste(zm_img, (zx, zy), zm_img)

    # Zoe & Max Caption Badge
    zm_badge_text = "ZOE & MAX (IA Asistente)"
    zbbox = font_feat_title.getbbox(zm_badge_text)
    zbw = zbbox[2] - zbbox[0]
    zbx = left_x + (col_w_left - zbw - 36) // 2
    zby = section_y + char_card_h - 118
    draw_rounded_rect(draw, [zbx, zby, zbx + zbw + 36, zby + 38], radius=19,
                      fill=(2, 132, 199, 255), outline=(3, 105, 161, 255), width=1)
    draw.text((left_x + col_w_left // 2, zby + 8), zm_badge_text, font=font_feat_title, fill=(255, 255, 255, 255), anchor="mt")

    draw.text((left_x + col_w_left // 2, zby + 48), "Inteligencia artificial renovada para", font=font_feat_desc, fill=(71, 85, 105, 255), anchor="mt")
    draw.text((left_x + col_w_left // 2, zby + 68), "guiarte y responder tus consultas 24/7", font=font_feat_desc, fill=(100, 116, 139, 255), anchor="mt")

    # Right Column: 5 Features using 3D ICONS ON PURE WHITE BACKGROUNDS!
    features = [
        {
            "icon_path": os.path.join(icons_dir, "icono_seguridad_3d.png"),
            "title": "Ingreso Biométrico por Huella Móvil",
            "desc": "Configura tu huella dactilar o Face ID para iniciar sesión en segundos sin necesidad de contraseñas."
        },
        {
            "icon_path": os.path.join(icons_dir, "icono_disenos_3d.png"),
            "title": "Estilo Visual 3D e Intuitivo",
            "desc": "Nueva interfaz visual con micro-interacciones 3D, botones claros y navegación ultra fluida en móviles y PC."
        },
        {
            "icon_path": os.path.join(base_dir, "sigae.png"),
            "title": "Nuevo Logo Oficial SIGAE 3D",
            "desc": "Identidad visual modernizada con relieve y acabados 3D de alta definición en todos los módulos del sistema."
        },
        {
            "icon_path": os.path.join(icons_dir, "icono_organizacion_3d.png"),
            "title": "Seguridad en Dos Pasos (2FA) y Sesiones",
            "desc": "Protección de datos con código 2FA, historial de conexiones y cierre remoto de sesiones abiertas."
        },
        {
            "icon_path": os.path.join(icons_dir, "icono_transporte_3d.png"),
            "title": "Módulo de Transporte Escolar (Próximamente)",
            "desc": "En pleno desarrollo para seguimiento de rutas, paradas y control de viajes escolares en tiempo real."
        }
    ]

    feat_card_h = 104
    gap_y = 15
    fy = section_y

    for f in features:
        # Card background
        draw_rounded_rect(draw, [right_x, fy, right_x + col_w_right, fy + feat_card_h],
                          radius=18, fill=(255, 255, 255, 245), outline=(226, 232, 240, 255), width=1)
        
        # 3D Icon container: PURE WHITE BACKGROUND with crisp clean border and subtle depth
        ibox_size = 72
        ibox_x = right_x + 14
        ibox_y = fy + (feat_card_h - ibox_size) // 2
        draw_rounded_rect(draw, [ibox_x, ibox_y, ibox_x + ibox_size, ibox_y + ibox_size],
                          radius=16, fill=(255, 255, 255, 255), outline=(226, 232, 240, 255), width=2)
        
        # Paste 3D icon
        if os.path.exists(f["icon_path"]):
            ic_img = Image.open(f["icon_path"]).convert('RGBA')
            ic_img.thumbnail((56, 56), Image.Resampling.LANCZOS)
            ic_x = ibox_x + (ibox_size - ic_img.width) // 2
            ic_y = ibox_y + (ibox_size - ic_img.height) // 2
            canvas.paste(ic_img, (ic_x, ic_y), ic_img)

        # Title & wrapped description
        tx = ibox_x + ibox_size + 16
        draw.text((tx, fy + 16), f["title"], font=font_feat_title, fill=(15, 23, 42, 255))
        
        draw_text_wrapped(draw, f["desc"], font=font_feat_desc, fill=(71, 85, 105, 255),
                          x=tx, y=fy + 46, max_width=col_w_right - ibox_size - 40, line_spacing=2)

        fy += feat_card_h + gap_y

    y_cursor = section_y + char_card_h + 24

    # --- 4. Web App Banner (Important Notice: No Play Store) ---
    banner_h = 95
    draw_rounded_rect(draw, [45, y_cursor, W - 45, y_cursor + banner_h],
                      radius=20, fill=(255, 247, 237, 255), outline=(251, 146, 60, 255), width=2)
    
    font_web_emoji = ImageFont.truetype("C:/Windows/Fonts/seguiemj.ttf", 34)
    draw.text((82, y_cursor + banner_h // 2), "🌐", font=font_web_emoji, fill=(0, 0, 0, 255), anchor="mm")

    draw.text((128, y_cursor + 22), "APLICACIÓN 100% WEB  •  NO REQUIERE DESCARGA EN PLAY STORE / APP STORE", 
              font=font_banner_title, fill=(194, 65, 12, 255))
    draw.text((128, y_cursor + 52), "Accede directamente desde Chrome, Safari o cualquier navegador en tu celular o computadora.", 
              font=font_banner_desc, fill=(124, 45, 18, 255))

    y_cursor += banner_h + 24

    # --- 5. Call To Action & QR Access Box ---
    cta_h = 175
    draw_rounded_rect(draw, [45, y_cursor, W - 45, y_cursor + cta_h],
                      radius=24, fill=(30, 58, 138, 255), outline=(2, 132, 199, 255), width=2)

    # CTA Texts
    draw.text((80, y_cursor + 26), "ACCESO DIRECTO AL SISTEMA:", font=font_cta_label, fill=(186, 230, 253, 255))
    draw.text((80, y_cursor + 54), "¡Ingresa hoy y configura tu huella digital!", font=font_sub, fill=(255, 255, 255, 255))

    # URL Button
    url_box_y = y_cursor + 96
    url_text = "https://app-delta-ten-80.vercel.app/login"
    ubbox = font_url.getbbox(url_text)
    ubw = ubbox[2] - ubbox[0]
    draw_rounded_rect(draw, [80, url_box_y, 80 + ubw + 35, url_box_y + 48], radius=12,
                      fill=(255, 255, 255, 255), outline=(147, 197, 253, 255), width=1)
    draw.text((97, url_box_y + 12), url_text, font=font_url, fill=(30, 64, 175, 255))

    # QR Code on the right
    qr_url = "https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=https://app-delta-ten-80.vercel.app/login&color=1e3a8a&bgcolor=ffffff"
    try:
        qr_data = urllib.request.urlopen(qr_url, timeout=5).read()
        qr_img = Image.open(io.BytesIO(qr_data)).convert('RGBA')
        qr_card_size = 148
        qr_card_x = W - 45 - qr_card_size - 25
        qr_card_y = y_cursor + 13
        
        draw_rounded_rect(draw, [qr_card_x, qr_card_y, qr_card_x + qr_card_size, qr_card_y + qr_card_size],
                          radius=14, fill=(255, 255, 255, 255))
        
        qr_img.thumbnail((118, 118), Image.Resampling.LANCZOS)
        canvas.paste(qr_img, (qr_card_x + (qr_card_size - qr_img.width)//2, qr_card_y + 6), qr_img)
        draw.text((qr_card_x + qr_card_size//2, qr_card_y + qr_card_size - 14), "ESCANEA AQUÍ", 
                  font=ImageFont.truetype(font_bold_path, 11), fill=(30, 58, 138, 255), anchor="mm")
    except Exception as e:
        print("QR load failed:", e)

    # --- 6. Footer ---
    draw.text((W // 2, H - 26), "SIGAE • Sistema Integral de Gestión y Administración Escolar • U.E. Santa Bárbara & U.E. Libertador Bolívar",
              font=font_footer, fill=(100, 116, 139, 255), anchor="mm")

    # Save to both project public and artifacts
    output_path_public = r"c:\Users\Luis Velásquez\Desktop\SIGAE_Unificado\public\flyer_sigae_1_1.png"
    canvas.convert('RGB').save(output_path_public, format='PNG', quality=95)
    print("Saved public flyer:", output_path_public)

    artifact_dir = r"C:\Users\Luis Velásquez\.gemini\antigravity-ide\brain\cfa48beb-c58e-4fe1-9f9f-51fc4eba3a36"
    output_path_artifact = os.path.join(artifact_dir, "flyer_sigae_1_1_oficial.png")
    canvas.convert('RGB').save(output_path_artifact, format='PNG', quality=95)
    print("Saved artifact flyer:", output_path_artifact)

if __name__ == "__main__":
    main()
