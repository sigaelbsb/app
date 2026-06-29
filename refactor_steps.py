import re

with open('src/pages/estudiantil/SolicitudCupos.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update STEPS array
old_steps = '''  const STEPS = [
    { num: 1, label: 'Términos', icon: 'bi-file-text' },
    { num: 2, label: 'Representante', icon: 'bi-person-lines-fill' },
    { num: 3, label: 'Estudiante', icon: 'bi-mortarboard' },
    { num: 4, label: 'Transporte Escolar', icon: 'bi-bus-front' },
    { num: 5, label: 'Documentos', icon: 'bi-file-earmark-arrow-up' },
    { num: 6, label: 'Confirmación', icon: 'bi-patch-check' },
  ];'''
new_steps = '''  const STEPS = [
    { num: 1, label: 'Términos', icon: 'bi-file-text' },
    { num: 2, label: 'Representante', icon: 'bi-person-lines-fill' },
    { num: 3, label: 'Estudiante', icon: 'bi-mortarboard' },
    { num: 4, label: 'Salud', icon: 'bi-heart-pulse-fill' },
    { num: 5, label: 'Transporte', icon: 'bi-bus-front' },
    { num: 6, label: 'Documentos', icon: 'bi-file-earmark-arrow-up' },
    { num: 7, label: 'Confirmación', icon: 'bi-patch-check' },
  ];'''
content = content.replace(old_steps, new_steps)

# 2. Extract health block from renderStep3
health_block_regex = r'(<div className="col-12 mt-4">\s*<h6 className="fw-bold text-dark border-bottom pb-2 mb-3">\s*<i className="bi bi-heart-pulse-fill text-danger me-2"></i>Información de Salud y Bienestar \(Confidencial\)\s*</h6>\s*</div>\s*<div className="col-md-4">\s*<label className="form-label fw-semibold">Condición / Discapacidad[\s\S]*?</>)\s*\)}'
match = re.search(health_block_regex, content)
health_block = match.group(0)

# Remove the health block from Step 3
content = content.replace(health_block, '')

# Change Step 3 button to go to Step 4 (already goes to 4, wait, let's check setStep(4))
# Actually, step 3 went to 4. Now step 3 goes to 4, step 4 goes to 5. So Step 3 button doesn't need to change its setStep!
# Wait, let's see. In renderStep3, it does setStep(4). That is correct!

# 3. Rename old renderStep4, 5, 6 to 5, 6, 7
content = content.replace('const renderStep6 = () => {', 'const renderStep7 = () => {')
content = content.replace('const renderStep5 = () => {', 'const renderStep6 = () => {')
content = content.replace('const renderStep4 = () => {', 'const renderStep5 = () => {')

# 4. Update the renderStep calls at the bottom
old_renders = '''              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}
              {step === 5 && renderStep5()}
              {step === 6 && renderStep6()}'''
new_renders = '''              {step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}
              {step === 5 && renderStep5()}
              {step === 6 && renderStep6()}
              {step === 7 && renderStep7()}'''
content = content.replace(old_renders, new_renders)

# 5. Insert new renderStep4
new_step4 = f'''  const renderStep4 = () => {{
    return (
      <div className="animate__animated animate__fadeIn">
        <h5 className="fw-bold text-dark mb-4 border-bottom pb-2">Paso 4: Información de Salud y Bienestar (Confidencial)</h5>
        
        <div className="bg-light p-4 rounded-4 border mb-4">
          <div className="row g-3">
            {{/* Extraído de Step 3 */}}
            {health_block}
          </div>
        </div>

        <div className="d-flex justify-content-between mt-4 pt-3 border-top">
          <button className="btn btn-outline-secondary rounded-pill px-4" onClick={{() => setStep(3)}}>
            <i className="bi bi-arrow-left me-1"></i> Atrás
          </button>
          <button className="btn btn-success rounded-pill px-5 fw-bold shadow hover-efecto"
            onClick={{() => {{
              setStep(5);
            }}}}>
            Siguiente <i className="bi bi-arrow-right ms-1"></i>
          </button>
        </div>
      </div>
    );
  }};

  const renderStep5'''
content = content.replace('  const renderStep5 = () => {', new_step4)

# 6. Adjust internal step references in renderStep5 (old renderStep4) and renderStep6 (old renderStep5)
# In old renderStep4 (now renderStep5):
# Atrás button went to 3, now should go to 4.
content = content.replace('onClick={() => setStep(3)}', 'onClick={() => setStep(4)}')
# Siguiente button went to 5, now should go to 6.
content = content.replace('onClick={() => setStep(5)}', 'onClick={() => setStep(6)}')

# In old renderStep5 (now renderStep6):
# Atrás button went to 4, now should go to 5.
content = content.replace('onClick={() => setStep(4)} disabled={subiendoDocs}', 'onClick={() => setStep(5)} disabled={subiendoDocs}')
# setStep(6) on submit -> setStep(7)
content = content.replace('setStep(6);', 'setStep(7);')


with open('src/pages/estudiantil/SolicitudCupos.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
