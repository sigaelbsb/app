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

def wrap_text(text, font, max_width, draw):
    words = text.split()
    lines = []
    current_line = []
    for word in words:
        test_line = ' '.join(current_line + [word])
        bbox = draw.textbbox((0, 0), test_line, font=font)
        if bbox[2] - bbox[0] <= max_width:
            current_line.append(word)
        else:
            if current_line:
                lines.append(' '.join(current_line))
                current_line = [word]
            else:
                lines.append(word)
    if current_line:
        lines.append(' '.join(current_line))
    return lines

def draw_icon_globe(draw, center, radius, color):
    cx, cy = center
    draw.ellipse([cx-radius, cy-radius, cx+radius, cy+radius], outline=color, width=3)
    draw.ellipse([cx-int(radius*0.5), cy-radius, cx+int(radius*0.5), cy+radius], outline=color, width=2)
    draw.line([cx-radius, cy, cx+radius, cy], fill=color, width=2)
    draw.line([cx-int(radius*0.8), cy-int(radius*0.5), cx+int(radius*0.8), cy-int(radius*0.5)], fill=color, width=1)
    draw.line([cx-int(radius*0.8), cy+int(radius*0.5), cx+int(radius*0.8), cy+int(radius*0.5)], fill=color, width=1)

def draw_icon_school(draw, center, radius, color):
    cx, cy = center
    # Techo / Sombrero de graduación
    draw.polygon([(cx, cy-radius+4), (cx+radius-4, cy-4), (cx, cy+6), (cx-radius+4, cy-4)], fill=color)
    draw.rectangle([cx-int(radius*0.6), cy+6, cx+int(radius*0.6), cy+radius-4], outline=color, width=3)

def draw_icon_user(draw, center, radius, color):
    cx, cy = center
    draw.ellipse([cx-int(radius*0.4), cy-radius+6, cx+int(radius*0.4), cy-int(radius*0.1)], fill=color)
    draw.chord([cx-int(radius*0.8), cy-int(radius*0.2), cx+int(radius*0.8), cy+int(radius*1.4)], start=180, end=0, fill=color)

def draw_icon_checkdoc(draw, center, radius, color):
    cx, cy = center
    draw.rectangle([cx-int(radius*0.6), cy-radius+4, cx+int(radius*0.6), cy+radius-4], outline=color, width=3)
    # Checkmark
    draw.line([cx-int(radius*0.3), cy, cx-int(radius*0.05), cy+int(radius*0.3), cx+int(radius*0.4), cy-int(radius*0.3)], fill=color, width=4)

def create_resumido_poster(output_path):
    width, height = 1200, 1400
    base = Image.new("RGBA", (width, height), (9, 13, 22, 255))
    draw = ImageDraw.Draw(base)

    # Resplandores de fondo y mallas visuales
    for r in range(450, 0, -25):
        alpha = int((1 - r/450) * 15)
        draw.ellipse([width//2 - r, 120 - r, width//2 + r, 120 + r], fill=(0, 102, 255, alpha))
        draw.ellipse([width//2 - r, height - 300 - r, width//2 + r, height - 300 + r], fill=(139, 92, 246, alpha))

    # Barra superior moderna
    draw.rectangle([0, 0, width, 8], fill=(0, 102, 255, 255))
    draw.rectangle([width//3, 0, width*2//3, 8], fill=(139, 92, 246, 255))
    draw.rectangle([width*2//3, 0, width, 8], fill=(0, 230, 118, 255))

    # Marco principal
    draw_rounded_rect(draw, [40, 40, width-40, height-40], radius=32, fill=(15, 23, 42, 235), outline=(255, 255, 255, 50), width=2)

    # --- HEADER CON LOGO REAL GRANDE Y ELEMENTOS VISUALES ---
    sigae_path = "public/assets/img/sigae.png"
    if os.path.exists(sigae_path):
        sigae_img = Image.open(sigae_path).convert("RGBA")
        w, h = sigae_img.size
        new_h = 155
        new_w = int(w * (new_h / h))
        sigae_img = sigae_img.resize((new_w, new_h), Image.Resampling.LANCZOS)
        base.paste(sigae_img, (70, 75), sigae_img)
        title_x = 70 + new_w + 35
    else:
        title_x = 70

    draw.text((title_x, 82), "SOLICITUD DE CUPOS EN LÍNEA", font=get_font(44, bold=True), fill=(255, 255, 255, 255))
    draw.text((title_x, 140), "MÓDULO DE ADMISIONES • SIGAE", font=get_font(28, bold=True), fill=(0, 195, 255, 255))
    
    # Insignias visuales en el header
    draw_rounded_rect(draw, [title_x, 182, title_x + 340, 218], radius=18, fill=(0, 230, 118, 40), outline=(0, 230, 118, 160), width=1)
    draw.text((title_x + 16, 189), "⚡ Proceso Rápido • 100% Digital • 24/7", font=get_font(18, bold=True), fill=(0, 230, 118, 255))

    # --- BANNER DE LINK E INSTALACIÓN DE APP ---
    draw_rounded_rect(draw, [70, 250, width-70, 360], radius=24, fill=(0, 102, 255, 45), outline=(0, 195, 255, 160), width=2)
    draw.text((100, 268), "🌐 ENLACE WEB DEL SISTEMA:", font=get_font(24, bold=False), fill=(226, 232, 240, 255))
    draw.text((100, 302), "https://sigae-hh6u.onrender.com/", font=get_font(36, bold=True), fill=(0, 230, 118, 255))
    
    # Badge PWA / App Instalable con icono
    draw_rounded_rect(draw, [width - 460, 275, width - 95, 335], radius=20, fill=(139, 92, 246, 65), outline=(139, 92, 246, 220), width=2)
    draw.text((width - 435, 288), "📲 ¡INSTALA LA APLICACIÓN!", font=get_font(21, bold=True), fill=(255, 255, 255, 255))
    draw.text((width - 435, 312), "Úsala directo desde tu Celular o PC", font=get_font(17, bold=False), fill=(226, 232, 240, 255))

    # --- 4 PASOS CON ICONOS VISUALES Y DISEÑO ATRACTIVO ---
    pasos = [
        ("PASO 1", "Entrar al Link o Instalar App", "Ingresa a sigae-hh6u.onrender.com. Desde tu celular o PC puedes tocar 'Instalar Aplicación' para agregar el ícono en tu pantalla de inicio.", (0, 195, 255), draw_icon_globe),
        ("PASO 2", "Seleccionar tu Escuela", "En la barra superior activa la institución donde deseas el cupo (UE Libertador Bolívar o UE Santa Bárbara) y haz clic en Solicitud de Cupos.", (139, 92, 246), draw_icon_school),
        ("PASO 3", "Llenar Datos y Vínculo PDVSA", "Registra los datos de identificación del estudiante, grado solicitado, datos del representante y la Gerencia o Nómina de PDVSA del trabajador.", (255, 141, 0), draw_icon_user),
        ("PASO 4", "Subir Requisitos y Código", "Adjunta foto digital, partida, cédula y constancia laboral. Al presionar 'Enviar Solicitud' recibirás al instante tu Código Único de seguimiento.", (0, 230, 118), draw_icon_checkdoc)
    ]

    card_w = (width - 170) // 2
    card_h = 420
    grid_y = 390

    for i, (num, title, desc, color, icon_func) in enumerate(pasos):
        col = i % 2
        row = i // 2
        cx = 70 + col * (card_w + 30)
        cy = grid_y + row * (card_h + 30)

        # Tarjeta
        draw_rounded_rect(draw, [cx, cy, cx + card_w, cy + card_h], radius=24, fill=(18, 26, 43, 235), outline=(*color, 160), width=2)
        
        # Etiqueta de Paso
        draw_rounded_rect(draw, [cx + 24, cy + 24, cx + 130, cy + 64], radius=16, fill=(*color, 55), outline=(*color, 200), width=1)
        draw.text((cx + 38, cy + 31), num, font=get_font(22, bold=True), fill=(255, 255, 255, 255))

        # Dibujar Icono Visual Circular a la derecha de la tarjeta
        icon_center = (cx + card_w - 55, cy + 44)
        draw.ellipse([icon_center[0]-26, icon_center[1]-26, icon_center[0]+26, icon_center[1]+26], fill=(*color, 40), outline=(*color, 180), width=2)
        icon_func(draw, icon_center, 16, color)

        # Título
        draw.text((cx + 24, cy + 82), title, font=get_font(26, bold=True), fill=(255, 255, 255, 255))

        # Descripción con viñetas visuales
        ty = cy + 135
        wrapped = wrap_text(desc, get_font(21, bold=False), card_w - 48, draw)
        for w_line in wrapped:
            draw.text((cx + 24, ty), w_line, font=get_font(21, bold=False), fill=(226, 232, 240, 255))
            ty += 33

    # --- FOOTER CON LOGOS REALES SIN TEXTO MPPE ---
    footer_y = height - 125
    draw.line([70, footer_y - 15, width - 70, footer_y - 15], fill=(255, 255, 255, 35), width=1)

    lb_path = "public/assets/img/logo_lb.png"
    if os.path.exists(lb_path):
        lb_img = Image.open(lb_path).convert("RGBA")
        nw = int(lb_img.width * (65 / lb_img.height))
        lb_img = lb_img.resize((nw, 65), Image.Resampling.LANCZOS)
        base.paste(lb_img, (80, footer_y), lb_img)
        draw.text((80 + nw + 18, footer_y + 10), "UE Libertador Bolívar", font=get_font(24, bold=True), fill=(255, 255, 255, 255))
        draw.text((80 + nw + 18, footer_y + 40), "Escuela Básica y Media en Oriente", font=get_font(17, bold=False), fill=(148, 163, 184, 255))

    sb_path = "public/assets/img/logo_sb.png"
    if os.path.exists(sb_path):
        sb_img = Image.open(sb_path).convert("RGBA")
        nw = int(sb_img.width * (65 / sb_img.height))
        sb_img = sb_img.resize((nw, 65), Image.Resampling.LANCZOS)
        base.paste(sb_img, (width//2 + 50, footer_y), sb_img)
        draw.text((width//2 + 50 + nw + 18, footer_y + 10), "UE Santa Bárbara", font=get_font(24, bold=True), fill=(255, 255, 255, 255))
        draw.text((width//2 + 50 + nw + 18, footer_y + 40), "Escuela Básica y Media en Oriente", font=get_font(17, bold=False), fill=(148, 163, 184, 255))

    base.save(output_path, "PNG")
    print(f"Creado con éxito: {output_path}")

if __name__ == "__main__":
    create_resumido_poster("public/collage_solicitud_cupos_resumido.png")
