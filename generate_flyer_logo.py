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
    canvas = Image.new('RGBA', (W, H), (245, 248, 253, 255))
    draw = ImageDraw.Draw(canvas)

    # Smooth subtle bright gradient
    for y in range(H):
        r = int(243 + (248 - 243) * (y / H))
        g = int(247 + (251 - 247) * (y / H))
        b = int(255 + (252 - 255) * (y / H))
        draw.line([(0, y), (W, y)], fill=(r, g, b, 255))

    # Vibrant ambient light accents with gold and cyan (Branding & Innovation Glow)
    glow = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    gdraw = ImageDraw.Draw(glow)
    gdraw.ellipse([(-120, -120), (550, 500)], fill=(254, 215, 170, 150)) # Golden Amber
    gdraw.ellipse([(W-450, 160), (W+150, 750)], fill=(186, 230, 253, 140)) # Sky Blue
    gdraw.ellipse([(-120, H-450), (450, H+100)], fill=(199, 210, 254, 130)) # Indigo
    gdraw.ellipse([(W-380, H-350), (W+100, H+80)], fill=(254, 215, 170, 140)) # Warm Amber
    glow = glow.filter(ImageFilter.GaussianBlur(80))
    canvas.alpha_composite(glow)

    draw = ImageDraw.Draw(canvas)

    # Fonts
    font_bold_path = "C:/Windows/Fonts/segoeuib.ttf"
    font_reg_path = "C:/Windows/Fonts/segoeui.ttf"

    font_title = ImageFont.truetype(font_bold_path, 47)
    font_sub = ImageFont.truetype(font_bold_path, 21)
    font_badge = ImageFont.truetype(font_bold_path, 15)
    font_school = ImageFont.truetype(font_bold_path, 16)
    font_motto = ImageFont.truetype(font_bold_path, 14)
    font_step_title = ImageFont.truetype(font_bold_path, 18)
    font_step_desc = ImageFont.truetype(font_reg_path, 13)
    font_banner_title = ImageFont.truetype(font_bold_path, 16)
    font_banner_desc = ImageFont.truetype(font_reg_path, 13)
    font_url = ImageFont.truetype(font_bold_path, 20)
    font_cta_label = ImageFont.truetype(font_bold_path, 15)
    font_footer = ImageFont.truetype(font_reg_path, 13)
    font_bubble = ImageFont.truetype(font_bold_path, 14)
    font_bubble_reg = ImageFont.truetype(font_reg_path, 12)

    # --- 1. Institutional Header ---
    top_bar_h = 145
    top_bar = Image.new('RGBA', (W, top_bar_h), (255, 255, 255, 252))
    tb_draw = ImageDraw.Draw(top_bar)
    tb_draw.line([(0, top_bar_h-1), (W, top_bar_h-1)], fill=(226, 232, 240, 255), width=2)
    canvas.alpha_composite(top_bar, (0, 0))

    base_dir = r"c:\Users\Luis Velásquez\Desktop\SIGAE_Unificado\public\assets\img"
    icons_dir = r"c:\Users\Luis Velásquez\Desktop\SIGAE_Unificado\public\icons3d"
    public_dir = r"c:\Users\Luis Velásquez\Desktop\SIGAE_Unificado\public"
    
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

    # Center: SIGAE Logo (Superimposed / Sobrepuesto, 185x185px with soft 3D drop shadow)
    sigae_logo_path = os.path.join(base_dir, "sigae.png")
    if os.path.exists(sigae_logo_path):
        sigae_img = Image.open(sigae_logo_path).convert('RGBA')
        sigae_img.thumbnail((185, 185), Image.Resampling.LANCZOS)
        sx = (W - sigae_img.width) // 2
        sy = 10
        
        # Soft shadow under superimposed logo
        shadow_layer = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        sdraw = ImageDraw.Draw(shadow_layer)
        sdraw.ellipse([(sx + 10, sy + 15), (sx + sigae_img.width - 10, sy + sigae_img.height + 20)], fill=(217, 119, 6, 70))
        shadow_layer = shadow_layer.filter(ImageFilter.GaussianBlur(15))
        canvas.alpha_composite(shadow_layer)

        canvas.paste(sigae_img, (sx, sy), sigae_img)

    # --- 2. Title Section ---
    y_cursor = top_bar_h + 36
    
    # Badge Pill: "NUEVA IMAGEN INSTITUCIONAL 3D"
    badge_text = "NUEVA IMAGEN INSTITUCIONAL 3D"
    bbox = font_badge.getbbox(badge_text)
    bw, bh = bbox[2] - bbox[0], bbox[3] - bbox[1]
    bx = (W - bw - 44) // 2
    draw_rounded_rect(draw, [bx, y_cursor, bx + bw + 44, y_cursor + bh + 16], radius=20, 
                      fill=(254, 243, 199, 255), outline=(217, 119, 6, 200), width=2)
    draw.ellipse([bx + 14, y_cursor + (bh + 16)//2 - 4, bx + 22, y_cursor + (bh + 16)//2 + 4], fill=(217, 119, 6, 255))
    draw.ellipse([bx + bw + 22, y_cursor + (bh + 16)//2 - 4, bx + bw + 30, y_cursor + (bh + 16)//2 + 4], fill=(217, 119, 6, 255))
    draw.text((bx + 28, y_cursor + 7), badge_text, font=font_badge, fill=(180, 83, 9, 255))

    y_cursor += bh + 22

    # Main Title
    title_text = "MODERNIZACIÓN DEL LOGO SIGAE"
    draw.text((W // 2, y_cursor), title_text, font=font_title, fill=(15, 23, 42, 255), anchor="mt")
    y_cursor += 54

    # Subtitle
    sub_text = "Una identidad visual innovadora, elegante y con relieve tridimensional"
    draw.text((W // 2, y_cursor), sub_text, font=font_sub, fill=(180, 83, 9, 255), anchor="mt")
    y_cursor += 36

    # --- 3. Center Section: Zoe & Max (Left) + 4 Pillars of the New Logo (Right) ---
    col_w_left = 360
    col_w_right = 610
    left_x = 45
    right_x = left_x + col_w_left + 20
    section_y = y_cursor

    char_card_h = 585
    draw_rounded_rect(draw, [left_x, section_y, left_x + col_w_left, section_y + char_card_h],
                      radius=24, fill=(255, 255, 255, 245), outline=(254, 215, 170, 255), width=2)

    # Speech Bubble at Top of Left Card
    bubble_w = col_w_left - 36
    bubble_x = left_x + 18
    bubble_y = section_y + 18
    bubble_h = 94
    draw_rounded_rect(draw, [bubble_x, bubble_y, bubble_x + bubble_w, bubble_y + bubble_h],
                      radius=16, fill=(254, 252, 232, 255), outline=(253, 224, 71, 255), width=1)
    
    # Bubble pointer triangle
    b_pt_x = bubble_x + bubble_w // 2
    b_pt_y = bubble_y + bubble_h
    draw.polygon([(b_pt_x - 10, b_pt_y), (b_pt_x + 10, b_pt_y), (b_pt_x, b_pt_y + 8)], fill=(254, 252, 232, 255))
    draw.line([(b_pt_x - 10, b_pt_y), (b_pt_x, b_pt_y + 8)], fill=(253, 224, 71, 255), width=1)
    draw.line([(b_pt_x + 10, b_pt_y), (b_pt_x, b_pt_y + 8)], fill=(253, 224, 71, 255), width=1)

    draw.text((bubble_x + 14, bubble_y + 10), "¡Hola! Somos Zoe y Max.", font=font_bubble, fill=(180, 83, 9, 255))
    draw_text_wrapped(draw, "Te presentamos el nuevo emblema 3D de SIGAE: diseñado para representar el futuro y la excelencia educativa.",
                      font=font_bubble_reg, fill=(51, 65, 85, 255), x=bubble_x + 14, y=bubble_y + 32, max_width=bubble_w - 28, line_spacing=2)

    # Zoe & Max Duo Image
    duo_path = os.path.join(base_dir, "personajes", "zoe_max_duo_3d.png")
    if os.path.exists(duo_path):
        duo_img = Image.open(duo_path).convert('RGBA')
        duo_img.thumbnail((330, 360), Image.Resampling.LANCZOS)
        dx = left_x + (col_w_left - duo_img.width) // 2
        dy = bubble_y + bubble_h + 10
        canvas.paste(duo_img, (dx, dy), duo_img)

    # Caption Badge
    badge_duo_text = "ZOE & MAX (ASISTENTES IA)"
    zbbox = font_step_title.getbbox(badge_duo_text)
    zbw = zbbox[2] - zbbox[0]
    zbx = left_x + (col_w_left - zbw - 36) // 2
    zby = section_y + char_card_h - 102
    draw_rounded_rect(draw, [zbx, zby, zbx + zbw + 36, zby + 36], radius=18,
                      fill=(217, 119, 6, 255), outline=(180, 83, 9, 255), width=1)
    draw.text((left_x + col_w_left // 2, zby + 8), badge_duo_text, font=font_step_title, fill=(255, 255, 255, 255), anchor="mt")

    # Bottom notice in left card
    draw.text((left_x + col_w_left // 2, zby + 44), "Elegancia, Vanguardia y Sentido de Pertenencia", font=ImageFont.truetype(font_bold_path, 11), fill=(180, 83, 9, 255), anchor="mt")
    draw.text((left_x + col_w_left // 2, zby + 60), "Un símbolo que une a toda la comunidad escolar", font=ImageFont.truetype(font_reg_path, 11), fill=(100, 116, 139, 255), anchor="mt")

    # Right Column: 4 Key Innovations of the New Logo
    pillars = [
        {
            "tag": "1",
            "tag_color": (217, 119, 6, 255),      # Amber
            "tag_bg": (254, 243, 199, 255),
            "tag_border": (253, 230, 138, 255),
            "icon_path": os.path.join(base_dir, "sigae.png"),
            "title": "Relieve y Acabados 3D de Alta Definición",
            "desc": "Elaborado con acabados dorados y azul naval profundo, aportando volumen, reflejos realistas y presencia institucional de primer nivel."
        },
        {
            "tag": "2",
            "tag_color": (2, 132, 199, 255),       # Sky Blue
            "tag_bg": (224, 242, 254, 255),
            "tag_border": (186, 230, 253, 255),
            "icon_path": os.path.join(icons_dir, "icono_academico_3d.png"),
            "title": "Símbolo de Excelencia y Saber Académico",
            "desc": "El birrete dorado corona la cima del escudo, representando la meta de cada estudiante, el éxito formativo y el orgullo docente."
        },
        {
            "tag": "3",
            "tag_color": (124, 58, 237, 255),      # Purple
            "tag_bg": (245, 243, 255, 255),
            "tag_border": (221, 214, 254, 255),
            "icon_path": os.path.join(icons_dir, "icono_disenos_3d.png"),
            "title": "Tecnología, Innovación y Modernidad",
            "desc": "Trazos geométricos modernos que expresan el salto hacia la digitalización total: notas, asistencias y trámites sin burocracia."
        },
        {
            "tag": "4",
            "tag_color": (5, 150, 105, 255),       # Emerald
            "tag_bg": (236, 253, 245, 255),
            "tag_border": (167, 243, 208, 255),
            "icon_path": os.path.join(icons_dir, "icono_organizacion_3d.png"),
            "title": "Identidad en Boletines, Carnets y Reportes",
            "desc": "El nuevo logo encabeza toda la papelería digital oficial, constancias, certificaciones y credenciales emitidas por el sistema."
        }
    ]

    pillar_card_h = 132
    pillar_gap = 19
    py = section_y

    for p in pillars:
        # Card background
        draw_rounded_rect(draw, [right_x, py, right_x + col_w_right, py + pillar_card_h],
                          radius=20, fill=(255, 255, 255, 250), outline=(226, 232, 240, 255), width=1)
        
        # Left decorative accent bar
        draw_rounded_rect(draw, [right_x, py + 14, right_x + 6, py + pillar_card_h - 14],
                          radius=3, fill=p["tag_color"])

        # Tag Badge
        nb_size = 54
        nb_x = right_x + 18
        nb_y = py + (pillar_card_h - nb_size) // 2
        draw_rounded_rect(draw, [nb_x, nb_y, nb_x + nb_size, nb_y + nb_size],
                          radius=14, fill=p["tag_bg"], outline=p["tag_border"], width=2)
        draw.text((nb_x + nb_size // 2, nb_y + 8), "HITO", font=ImageFont.truetype(font_bold_path, 10), fill=p["tag_color"], anchor="mt")
        draw.text((nb_x + nb_size // 2, nb_y + 22), p["tag"], font=ImageFont.truetype(font_bold_path, 22), fill=p["tag_color"], anchor="mt")

        # 3D Icon container: Clean white box
        ibox_size = 72
        ibox_x = nb_x + nb_size + 14
        ibox_y = py + (pillar_card_h - ibox_size) // 2
        draw_rounded_rect(draw, [ibox_x, ibox_y, ibox_x + ibox_size, ibox_y + ibox_size],
                          radius=16, fill=(255, 255, 255, 255), outline=(226, 232, 240, 255), width=2)
        
        # Paste 3D icon
        if os.path.exists(p["icon_path"]):
            ic_img = Image.open(p["icon_path"]).convert('RGBA')
            ic_img.thumbnail((56, 56), Image.Resampling.LANCZOS)
            ic_x = ibox_x + (ibox_size - ic_img.width) // 2
            ic_y = ibox_y + (ibox_size - ic_img.height) // 2
            canvas.paste(ic_img, (ic_x, ic_y), ic_img)

        # Title & wrapped description
        tx = ibox_x + ibox_size + 16
        draw.text((tx, py + 18), p["title"], font=font_step_title, fill=(15, 23, 42, 255))
        
        draw_text_wrapped(draw, p["desc"], font=font_step_desc, fill=(71, 85, 105, 255),
                          x=tx, y=py + 48, max_width=col_w_right - (tx - right_x) - 18, line_spacing=3)

        py += pillar_card_h + pillar_gap

    y_cursor = section_y + char_card_h + 20

    # --- 4. Golden Notice Banner ---
    banner_h = 92
    draw_rounded_rect(draw, [45, y_cursor, W - 45, y_cursor + banner_h],
                      radius=20, fill=(254, 243, 199, 255), outline=(217, 119, 6, 255), width=2)
    
    # Superimposed small logo inside banner
    if os.path.exists(sigae_logo_path):
        bi_img = Image.open(sigae_logo_path).convert('RGBA')
        bi_img.thumbnail((54, 54), Image.Resampling.LANCZOS)
        canvas.paste(bi_img, (72, y_cursor + (banner_h - bi_img.height)//2), bi_img)

    draw.text((140, y_cursor + 20), "IDENTIDAD VISUAL UNIFICADA  •  EXCELENCIA Y TECNOLOGÍA EN CADA PANTALLA", 
              font=font_banner_title, fill=(180, 83, 9, 255))
    draw.text((140, y_cursor + 50), "El nuevo emblema oficial refleja la fortaleza académica y la evolución continua de nuestras instituciones.", 
              font=font_banner_desc, fill=(120, 53, 15, 255))

    y_cursor += banner_h + 20

    # --- 5. Call To Action & QR Access Box ---
    cta_h = 175
    # Elegant deep royal blue container
    draw_rounded_rect(draw, [45, y_cursor, W - 45, y_cursor + cta_h],
                      radius=24, fill=(15, 28, 56, 255), outline=(217, 119, 6, 220), width=2)

    # CTA Texts
    draw.text((80, y_cursor + 26), "ACCESO DIRECTO A LA PLATAFORMA:", font=font_cta_label, fill=(253, 230, 138, 255))
    draw.text((80, y_cursor + 54), "¡Vive la nueva experiencia visual de SIGAE hoy!", font=font_sub, fill=(255, 255, 255, 255))

    # URL Button
    url_box_y = y_cursor + 96
    url_text = "https://app-delta-ten-80.vercel.app/login"
    ubbox = font_url.getbbox(url_text)
    ubw = ubbox[2] - ubbox[0]
    draw_rounded_rect(draw, [80, url_box_y, 80 + ubw + 35, url_box_y + 48], radius=12,
                      fill=(255, 255, 255, 255), outline=(253, 230, 138, 255), width=1)
    draw.text((97, url_box_y + 12), url_text, font=font_url, fill=(15, 28, 56, 255))

    # QR Code on the right
    qr_url = "https://api.qrserver.com/v1/create-qr-code/?size=140x140&data=https://app-delta-ten-80.vercel.app/login&color=0f1c38&bgcolor=ffffff"
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
                  font=ImageFont.truetype(font_bold_path, 11), fill=(15, 28, 56, 255), anchor="mm")
    except Exception as e:
        print("QR load failed:", e)

    # --- 6. Footer ---
    draw.text((W // 2, H - 26), "SIGAE • Sistema Integral de Gestión y Administración Escolar • U.E. Santa Bárbara & U.E. Libertador Bolívar",
              font=font_footer, fill=(100, 116, 139, 255), anchor="mm")

    # Save to both project public and artifacts
    output_path_public = os.path.join(public_dir, "flyer_logo_sigae.png")
    canvas.convert('RGB').save(output_path_public, format='PNG', quality=95)
    print("Saved public flyer:", output_path_public)

    artifact_dir = r"C:\Users\Luis Velásquez\.gemini\antigravity-ide\brain\1054edda-ad28-47e4-910b-1e21a924ee4c"
    if os.path.exists(artifact_dir):
        output_path_artifact = os.path.join(artifact_dir, "flyer_logo_sigae_oficial.png")
        canvas.convert('RGB').save(output_path_artifact, format='PNG', quality=95)
        print("Saved artifact flyer:", output_path_artifact)

if __name__ == "__main__":
    main()
