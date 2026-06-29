import re

with open('src/pages/estudiantil/SolicitudCupos.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Interface
content = content.replace('pdvsa_localidad_trabajo: string;', 'pdvsa_localidad_trabajo: string;\n  pdvsa_localidad_trabajo_otra?: string;')

# 2. Initial state
content = content.replace('pdvsa_localidad_trabajo: '''',', 'pdvsa_localidad_trabajo: '''',\n  pdvsa_localidad_trabajo_otra: '''',')

# 3. Submit intercept
old_submit = '''const payload: Omit<SolicitudDB, 'id' | 'created_at' | 'updated_at'> = {
        ...form,
        doc_ficha: urlFicha,
        doc_foto_estudiante: urlFoto,'''
new_submit = '''const { pdvsa_localidad_trabajo_otra, ...formToSubmit } = form as any;

      const payload: Omit<SolicitudDB, 'id' | 'created_at' | 'updated_at'> = {
        ...formToSubmit,
        pdvsa_localidad_trabajo: form.pdvsa_localidad_trabajo === 'Otra' ? pdvsa_localidad_trabajo_otra || '' : form.pdvsa_localidad_trabajo,
        doc_ficha: urlFicha,
        doc_foto_estudiante: urlFoto,'''
content = content.replace(old_submit, new_submit)

# 4. UI changes
old_ui = '''<select className="form-select input-moderno" value={form.pdvsa_localidad_trabajo}
                      onChange={(e) => updateForm('pdvsa_localidad_trabajo', e.target.value)} required>
                      <option value="">Seleccione...</option>
                      {localidadesDB.map((l, i) => <option key={i} value={l}>{l}</option>)}
                    </select>'''
new_ui = '''<select className="form-select input-moderno mb-2" value={form.pdvsa_localidad_trabajo}
                      onChange={(e) => updateForm('pdvsa_localidad_trabajo', e.target.value)} required>
                      <option value="">Seleccione...</option>
                      {localidadesDB.map((l, i) => <option key={i} value={l}>{l}</option>)}
                      <option value="Otra">Otra (Especificar)</option>
                    </select>
                    {form.pdvsa_localidad_trabajo === 'Otra' && (
                      <input type="text" className="form-control input-moderno animate__animated animate__fadeIn" 
                        placeholder="Especifique la localidad..."
                        value={(form as any).pdvsa_localidad_trabajo_otra || ''}
                        onChange={(e) => updateForm('pdvsa_localidad_trabajo_otra', e.target.value)} required />
                    )}'''
content = content.replace(old_ui, new_ui)

# 5. Validation
old_val = '''camposRequeridos.push(form.pdvsa_gerencia_dpto);
        camposRequeridos.push(form.pdvsa_localidad_trabajo);
      }'''
new_val = '''camposRequeridos.push(form.pdvsa_gerencia_dpto);
        camposRequeridos.push(form.pdvsa_localidad_trabajo);
        if (form.pdvsa_localidad_trabajo === 'Otra') {
          camposRequeridos.push((form as any).pdvsa_localidad_trabajo_otra || '');
        }
      }'''
content = content.replace(old_val, new_val)

with open('src/pages/estudiantil/SolicitudCupos.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
