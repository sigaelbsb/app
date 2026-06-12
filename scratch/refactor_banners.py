import os
import re

vistas_dir = r"c:\Users\Luis Velásquez\Desktop\SIGAE_Unificado\vistas"

logo_pattern = re.compile(r'<div class="col-md-3 text-center text-md-end d-none d-md-block">\s*<img[^>]*logo\.png[^>]*>\s*</div>', re.IGNORECASE)

for root, _, files in os.walk(vistas_dir):
    for file in files:
        if file.endswith(".html"):
            path = os.path.join(root, file)
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
                
            modified = False
            
            # Remove logo
            if logo_pattern.search(content):
                content = logo_pattern.sub('', content)
                modified = True
                
            # Replace col-md-9 with col-12
            if 'col-md-9 text-center text-md-start' in content:
                content = content.replace('col-md-9 text-center text-md-start', 'col-12 text-center text-md-start')
                modified = True
                
            # Extract icon from badge and put in H1 if H1 doesn't have an icon
            # badge pattern: <span class="badge...><i class="bi bi-something me-1"></i> TEXT</span>
            badge_match = re.search(r'<span class="badge[^>]*>\s*<i class="(bi bi-[^"]+) me-1"></i>', content)
            if badge_match:
                icon_class = badge_match.group(1)
                
                # Check if h1 exists and doesn't have an icon yet
                h1_match = re.search(r'(<h1[^>]*>)(?!<i)(.*?)(</h1>)', content)
                if h1_match:
                    new_h1 = f'{h1_match.group(1)}<i class="{icon_class} me-3"></i>{h1_match.group(2)}{h1_match.group(3)}'
                    content = content[:h1_match.start()] + new_h1 + content[h1_match.end():]
                    modified = True
            
            if modified:
                with open(path, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"Updated: {path}")
