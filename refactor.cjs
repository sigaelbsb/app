const fs = require('fs');

let content = fs.readFileSync('src/pages/estudiantil/SolicitudCupos.tsx', 'utf-8');

const healthBlockRegex = /<div className="col-12 mt-4">\s*<h6 className="fw-bold text-dark border-bottom pb-2 mb-3">[\s\S]*?(?=<div className="col-md-3">\s*<label className="form-label fw-semibold">N° de Hijo\/a en la Familia<\/label>)/;
const match = content.match(healthBlockRegex);
if (!match) {
  console.log('No health block found');
  process.exit(1);
}
const healthBlock = match[0];
content = content.replace(healthBlock, '');

let cleanHealth = healthBlock.replace(/<div className="col-12 mt-4">[\s\S]*?<\/div>\s*/, '');

content = content.replace('const renderStep6 = () => {', 'const renderStep7 = () => {');
content = content.replace('const renderStep5 = () => {', 'const renderStep6 = () => {');
content = content.replace('const renderStep4 = () => {', 'const renderStep5 = () => {');

content = content.replace('PASO 4: TRANSPORTE ESCOLAR', 'PASO 5: TRANSPORTE ESCOLAR');
content = content.replace('PASO 5: DOCUMENTOS ADJUNTOS', 'PASO 6: DOCUMENTOS ADJUNTOS');
content = content.replace('PASO 6: CONFIRMACIÓN Y ENVÍO', 'PASO 7: CONFIRMACIÓN Y ENVÍO');

const newStep4 = `  // ─── PASO 4: SALUD Y BIENESTAR ─────────────────────────────────────────────
  const renderStep4 = () => {
    return (
      <div className="animate__animated animate__fadeIn">
        <div className="d-flex align-items-center gap-2 mb-3 pb-2 border-bottom">
          <i className="bi bi-heart-pulse-fill text-danger fs-5"></i>
          <h6 className="fw-bold text-dark mb-0">Información de Salud y Bienestar (Confidencial)</h6>
        </div>
        <div className="row g-3">
` + cleanHealth + `        </div>

        <div className="d-flex justify-content-between mt-4 pt-3 border-top">
          <button className="btn btn-outline-secondary rounded-pill px-4" onClick={() => setStep(3)}>
            <i className="bi bi-arrow-left me-1"></i> Anterior
          </button>
          <button className="btn btn-success rounded-pill px-5 fw-bold shadow hover-efecto" onClick={() => setStep(5)}>
            Siguiente <i className="bi bi-arrow-right ms-1"></i>
          </button>
        </div>
      </div>
    );
  };

  // ─── PASO 5: TRANSPORTE ESCOLAR`;

content = content.replace('  // ─── PASO 5: TRANSPORTE ESCOLAR', newStep4);

let renderStep5Chunk = content.substring(content.indexOf('const renderStep5 = () => {'), content.indexOf('const renderStep6 = () => {'));
renderStep5Chunk = renderStep5Chunk.replace('setStep(3)', 'setStep(4)').replace('setStep(5)', 'setStep(6)');
content = content.substring(0, content.indexOf('const renderStep5 = () => {')) + renderStep5Chunk + content.substring(content.indexOf('const renderStep6 = () => {'));

let renderStep6Chunk = content.substring(content.indexOf('const renderStep6 = () => {'), content.indexOf('const renderStep7 = () => {'));
renderStep6Chunk = renderStep6Chunk.replace('setStep(4)', 'setStep(5)').replace('setStep(6)', 'setStep(7)');
content = content.substring(0, content.indexOf('const renderStep6 = () => {')) + renderStep6Chunk + content.substring(content.indexOf('const renderStep7 = () => {'));

const oldRenders = `{step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}
              {step === 5 && renderStep5()}
              {step === 6 && renderStep6()}`;
const newRenders = `{step === 1 && renderStep1()}
              {step === 2 && renderStep2()}
              {step === 3 && renderStep3()}
              {step === 4 && renderStep4()}
              {step === 5 && renderStep5()}
              {step === 6 && renderStep6()}
              {step === 7 && renderStep7()}`;
content = content.replace(oldRenders, newRenders);

fs.writeFileSync('src/pages/estudiantil/SolicitudCupos.tsx', content, 'utf-8');
console.log('Refactor complete');
