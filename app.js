/**
 * Lucero Computación - Presupuestos
 * Generador de cotizaciones para servicio técnico de computadoras.
 */

// ─── PRESETS por defecto ─────────────────────────────────────────────────────
const DEFAULT_PRESETS = [
  { label: '+ SSD 240 GB',    desc: 'Disco SSD 240 GB',       price: 0 },
  { label: '+ Win 10',        desc: 'Windows 10',              price: 0 },
  { label: '+ Mantenimiento', desc: 'Mantenimiento y limpieza', price: 0 },
  { label: '+ Memoria RAM',   desc: 'Memoria RAM',             price: 0 },
  { label: '+ Hora Técnica',  desc: 'Hora Técnica',            price: 0 },
];

// ─── ESTADO ──────────────────────────────────────────────────────────────────
const state = {
  shop: {
    name: 'LUCERO COMPUTACIÓN',
    phone: '',
    address: ''
  },
  client: {
    name: '',
    device: '',
    phone: '',
    observations: ''
  },
  items: [],
  presets: []           // Se carga desde localStorage o DEFAULT_PRESETS
};

// Presets que se están editando en el modal (copia temporal)
let presetsEditing = [];

// ─── FORMATO MONEDA ───────────────────────────────────────────────────────────
function formatCurrency(amount) {
  const num = Number(amount) || 0;
  return '$ ' + num.toLocaleString('en-US');
}

// ─── INICIALIZACIÓN ───────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  loadShopConfig();
  loadPresets();
  setCurrentDate();
  renderPresetButtons();
  renderItems();
  updateLivePreview();
  setupEventListeners();
});

// ─── CONFIGURACIÓN DEL TALLER ─────────────────────────────────────────────────
function loadShopConfig() {
  const saved = localStorage.getItem('lucero_comp_shop');
  if (saved) {
    try { state.shop = { ...state.shop, ...JSON.parse(saved) }; }
    catch (e) { console.error('Error config', e); }
  }
  document.getElementById('cfg-shop-name').value = state.shop.name;
  document.getElementById('cfg-shop-phone').value = state.shop.phone || '';
  document.getElementById('cfg-shop-address').value = state.shop.address || '';
  updateShopPreview();
}

function updateShopPreview() {
  updateLivePreview();
}

// ─── PRESETS ──────────────────────────────────────────────────────────────────
function loadPresets() {
  const saved = localStorage.getItem('lucero_comp_presets');
  if (saved) {
    try { state.presets = JSON.parse(saved); }
    catch (e) { state.presets = [...DEFAULT_PRESETS]; }
  } else {
    state.presets = [...DEFAULT_PRESETS];
  }
}

function savePresetsToStorage() {
  localStorage.setItem('lucero_comp_presets', JSON.stringify(state.presets));
}

function renderPresetButtons() {
  const container = document.getElementById('preset-buttons');
  container.innerHTML = '';

  if (state.presets.length === 0) {
    container.innerHTML = `<span class="text-xs text-slate-400 italic">No hay atajos. Hacé clic en "Editar atajos" para agregar.</span>`;
    return;
  }

  state.presets.forEach((preset) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'preset-btn px-3 py-1.5 text-xs bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition font-medium';
    btn.textContent = preset.label || `+ ${preset.desc}`;
    btn.addEventListener('click', () => addNewItem(preset.desc, preset.price || 0));
    container.appendChild(btn);
  });
}

// ─── MODAL EDITOR DE PRESETS ──────────────────────────────────────────────────
function openPresetsModal() {
  // Clonar estado actual para edición sin afectar hasta guardar
  presetsEditing = state.presets.map(p => ({ ...p }));
  renderPresetsEditorList();
  document.getElementById('modal-presets').classList.remove('hidden');
}

function closePresetsModal() {
  document.getElementById('modal-presets').classList.add('hidden');
}

function renderPresetsEditorList() {
  const list = document.getElementById('presets-editor-list');
  list.innerHTML = '';

  if (presetsEditing.length === 0) {
    list.innerHTML = `<p class="text-xs text-slate-400 text-center py-4 italic">No hay atajos. Hacé clic en "+ Agregar nuevo atajo".</p>`;
    return;
  }

  presetsEditing.forEach((preset) => {
    const row = document.createElement('div');
    row.className = 'flex items-center gap-2 bg-slate-50 p-2.5 rounded-lg border border-slate-200';
    row.innerHTML = `
      <div class="flex-1 space-y-1.5">
        <div class="flex items-center gap-2">
          <span class="text-[10px] text-slate-400 uppercase font-semibold w-14 flex-shrink-0">Etiqueta</span>
          <input type="text" value="${escapeHtml(preset.label)}" placeholder="Ej: + SSD 240 GB"
            class="preset-label-input flex-1 text-xs px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:outline-none transition">
        </div>
        <div class="flex items-center gap-2">
          <span class="text-[10px] text-slate-400 uppercase font-semibold w-14 flex-shrink-0">Concepto</span>
          <input type="text" value="${escapeHtml(preset.desc)}" placeholder="Ej: Disco SSD 240 GB"
            class="preset-desc-input flex-1 text-xs px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:outline-none transition">
        </div>
        <div class="flex items-center gap-2">
          <span class="text-[10px] text-slate-400 uppercase font-semibold w-14 flex-shrink-0">Precio $</span>
          <input type="number" value="${preset.price || ''}" placeholder="0 (opcional)"
            class="preset-price-input flex-1 text-xs px-2.5 py-1.5 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:outline-none transition font-mono">
        </div>
      </div>
      <button type="button" class="btn-delete-preset flex-shrink-0 self-start mt-1 text-slate-400 hover:text-red-600 p-1.5 rounded transition" title="Eliminar atajo">
        <i class="ph ph-trash text-base"></i>
      </button>
    `;

    // Listeners vinculados al objeto por referencia, no por índice
    row.querySelector('.preset-label-input').addEventListener('input', (e) => {
      preset.label = e.target.value;
    });
    row.querySelector('.preset-desc-input').addEventListener('input', (e) => {
      preset.desc = e.target.value;
    });
    row.querySelector('.preset-price-input').addEventListener('input', (e) => {
      preset.price = parseFloat(e.target.value) || 0;
    });
    row.querySelector('.btn-delete-preset').addEventListener('click', () => {
      const idx = presetsEditing.indexOf(preset);
      if (idx !== -1) presetsEditing.splice(idx, 1);
      renderPresetsEditorList();
    });

    list.appendChild(row);
  });
}

// ─── FECHA ────────────────────────────────────────────────────────────────────
function setCurrentDate() {
  const now = new Date();
  const formatted = now.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const dateBadge = document.getElementById('current-date-badge');
  if (dateBadge) dateBadge.textContent = formatted;

  const timeFormatted = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  const timeEl = document.getElementById('preview-timestamp');
  if (timeEl) timeEl.textContent = timeFormatted;
}

// ─── EVENT LISTENERS ──────────────────────────────────────────────────────────
function setupEventListeners() {
  const clientNameInput    = document.getElementById('input-client-name');
  const deviceModelInput   = document.getElementById('input-device-model');
  const clientPhoneInput   = document.getElementById('input-client-phone');
  const observationsInput  = document.getElementById('input-observations');

  clientNameInput.addEventListener('input',   (e) => { state.client.name         = e.target.value; updateLivePreview(); });
  deviceModelInput.addEventListener('input',  (e) => { state.client.device       = e.target.value; updateLivePreview(); });
  clientPhoneInput.addEventListener('input',  (e) => { state.client.phone        = e.target.value.replace(/[^0-9]/g, ''); });
  observationsInput.addEventListener('input', (e) => { state.client.observations = e.target.value; updateLivePreview(); });

  // Agregar ítem
  document.getElementById('btn-add-item').addEventListener('click', () => addNewItem('', 0));

  // Modal Datos del Taller
  const modalConfig = document.getElementById('modal-config');
  document.getElementById('btn-config-shop').addEventListener('click', () => modalConfig.classList.remove('hidden'));
  document.getElementById('btn-close-modal').addEventListener('click', () => modalConfig.classList.add('hidden'));
  modalConfig.addEventListener('click', (e) => { if (e.target === modalConfig) modalConfig.classList.add('hidden'); });

  document.getElementById('btn-save-config').addEventListener('click', () => {
    state.shop.name    = document.getElementById('cfg-shop-name').value.trim() || 'LUCERO COMPUTACIÓN';
    state.shop.phone   = document.getElementById('cfg-shop-phone').value.trim();
    state.shop.address = document.getElementById('cfg-shop-address').value.trim();
    localStorage.setItem('lucero_comp_shop', JSON.stringify(state.shop));
    updateShopPreview();
    modalConfig.classList.add('hidden');
    showToast('Datos del taller guardados.', 'success');
  });

  // Modal Editor de Presets
  const modalPresets = document.getElementById('modal-presets');
  document.getElementById('btn-edit-presets').addEventListener('click', openPresetsModal);
  document.getElementById('btn-close-presets').addEventListener('click', closePresetsModal);
  document.getElementById('btn-cancel-presets').addEventListener('click', closePresetsModal);
  modalPresets.addEventListener('click', (e) => { if (e.target === modalPresets) closePresetsModal(); });

  document.getElementById('btn-add-preset').addEventListener('click', () => {
    presetsEditing.push({ label: '', desc: '', price: 0 });
    renderPresetsEditorList();
    // Scroll al final después de que el DOM se actualice
    requestAnimationFrame(() => {
      const list = document.getElementById('presets-editor-list');
      list.scrollTop = list.scrollHeight;
      // Foco en el último input de etiqueta
      const labels = list.querySelectorAll('.preset-label-input');
      if (labels.length > 0) labels[labels.length - 1].focus();
    });
  });

  document.getElementById('btn-save-presets').addEventListener('click', () => {
    // Guardar todo atajo que tenga al menos etiqueta O concepto
    state.presets = presetsEditing
      .filter(p => p.label.trim() !== '' || p.desc.trim() !== '')
      .map(p => {
        const label = p.label.trim();
        const desc  = p.desc.trim() || label; // Si no hay concepto, usar la etiqueta como concepto
        return {
          label: label || `+ ${desc}`,
          desc,
          price: p.price || 0
        };
      });
    savePresetsToStorage();
    renderPresetButtons();
    closePresetsModal();
    showToast('Atajos rápidos guardados.', 'success');
  });

  // Reiniciar
  document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm('¿Querés limpiar el formulario para comenzar un nuevo presupuesto?')) {
      clientNameInput.value   = '';
      deviceModelInput.value  = '';
      clientPhoneInput.value  = '';
      observationsInput.value = '';
      state.client = { name: '', device: '', phone: '', observations: '' };
      state.items  = [];
      renderItems();
      updateLivePreview();
      showToast('Formulario reiniciado.', 'info');
    }
  });

  // Acciones de exportación
  document.getElementById('btn-share-whatsapp').addEventListener('click', shareViaWhatsApp);
  document.getElementById('btn-copy-text').addEventListener('click', copyTextToClipboard);
  document.getElementById('btn-download-text').addEventListener('click', downloadTextFile);

  const btnQuickCopy = document.getElementById('btn-quick-copy');
  if (btnQuickCopy) {
    btnQuickCopy.addEventListener('click', copyTextToClipboard);
  }
}

// ─── MANEJO DE ÍTEMS ──────────────────────────────────────────────────────────
function addNewItem(description = '', price = 0) {
  state.items.push({ id: Date.now() + Math.random(), description, price });
  renderItems();
  updateLivePreview();
  setTimeout(() => {
    const inputs = document.querySelectorAll('.item-desc-input');
    if (inputs.length > 0) inputs[inputs.length - 1].focus();
  }, 60);
}

function renderItems() {
  const container = document.getElementById('items-container');
  container.innerHTML = '';

  if (state.items.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4 text-xs text-slate-400 border border-dashed border-slate-200 rounded-lg">
        Usá los atajos rápidos o "Agregar" para sumar conceptos
      </div>`;
    return;
  }

  state.items.forEach((item, index) => {
    const row = document.createElement('div');
    row.className = 'flex items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200';
    row.innerHTML = `
      <span class="text-xs font-semibold text-slate-400 w-5 text-center flex-shrink-0">${index + 1}</span>
      <input type="text" value="${escapeHtml(item.description)}" placeholder="Ej: Disco SSD 240 GB"
        class="item-desc-input flex-1 text-sm px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:outline-none transition min-w-0">
      <div class="relative w-32 flex-shrink-0">
        <span class="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-semibold pointer-events-none">$</span>
        <input type="number" value="${item.price === 0 ? '' : item.price}" placeholder="0" min="0" step="any"
          class="item-price-input w-full text-sm pl-6 pr-2 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-sky-500 focus:outline-none transition font-mono text-right">
      </div>
      <button type="button" title="Eliminar" class="btn-delete-row flex-shrink-0 text-slate-400 hover:text-red-600 p-1.5 rounded transition">
        <i class="ph ph-trash text-base"></i>
      </button>
    `;

    row.querySelector('.item-desc-input').addEventListener('input', (e) => { item.description = e.target.value; updateLivePreview(); });
    row.querySelector('.item-price-input').addEventListener('input', (e) => { item.price = parseFloat(e.target.value) || 0; updateLivePreview(); });
    row.querySelector('.btn-delete-row').addEventListener('click', () => {
      state.items = state.items.filter(i => i.id !== item.id);
      renderItems();
      updateLivePreview();
    });

    container.appendChild(row);
  });
}

// ─── GENERACIÓN DE TEXTO PARA WHATSAPP ────────────────────────────────────────
function generateBudgetText() {
  const shopName = (state.shop.name || 'LUCERO COMPUTACIÓN').trim();

  const dateEl = document.getElementById('current-date-badge');
  const date = (dateEl && dateEl.textContent) ||
    new Date().toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });

  const clientName = (state.client.name || '').trim();
  const deviceModel = (state.client.device || '').trim();
  const observations = (state.client.observations || '').trim();

  const lines = [];

  // Encabezado centrado: espacios para centrar en burbuja WhatsApp (~15 chars de ancho)
  const name = shopName.toUpperCase();
  const totalWidth = 15;
  const pad = Math.max(0, Math.floor((totalWidth - name.length) / 2));
  const centeredName = ' '.repeat(pad) + name;
  lines.push(`*${centeredName}*`);
  lines.push(`_Presupuesto de S. Técnico_`);

  lines.push('───────────────');

  // Datos del servicio (solo si tienen contenido)
  lines.push(`*Fecha:* ${date}`);
  if (clientName) lines.push(`*Cliente:* ${clientName}`);
  if (deviceModel) lines.push(`*Equipo:* ${deviceModel}`);

  lines.push('───────────────');
  lines.push(`*DETALLE:*`);

  let total = 0;
  if (state.items.length === 0) {
    lines.push(`• (Sin conceptos cargados)`);
  } else {
    state.items.forEach(item => {
      const desc = (item.description || '').trim() || 'Concepto';
      const price = Number(item.price) || 0;
      total += price;
      lines.push(`• ${desc}: ${formatCurrency(price)}`);
    });
  }

  lines.push('───────────────');
  lines.push(`*TOTAL:* ${formatCurrency(total)}`);
  lines.push('───────────────');

  if (observations) {
    lines.push(`*Observaciones:*`);
    lines.push(observations);
    lines.push('───────────────');
  }

  return lines.join('\n');
}

function formatWhatsAppPreview(rawText) {
  const escaped = escapeHtml(rawText);
  return escaped
    .replace(/\*([^*]+)\*/g, '<strong class="font-bold text-slate-900">*$1*</strong>')
    .replace(/_([^_]+)_/g, '<em class="italic text-slate-600">_$1_</em>');
}

// ─── VISTA PREVIA EN TIEMPO REAL ──────────────────────────────────────────────
function updateLivePreview() {
  // Calcular total para el formulario
  let total = 0;
  state.items.forEach(item => {
    total += Number(item.price) || 0;
  });
  const formTotalDisplay = document.getElementById('form-total-display');
  if (formTotalDisplay) {
    formTotalDisplay.textContent = formatCurrency(total);
  }

  // Generar y actualizar vista previa de texto
  const text = generateBudgetText();
  const textPreviewEl = document.getElementById('text-preview');
  if (textPreviewEl) {
    textPreviewEl.innerHTML = formatWhatsAppPreview(text);
  }

  // Actualizar hora en la burbuja
  const timeEl = document.getElementById('preview-timestamp');
  if (timeEl) {
    const now = new Date();
    timeEl.textContent = now.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' });
  }
}

// ─── COMPARTIR POR WHATSAPP ───────────────────────────────────────────────────
async function shareViaWhatsApp() {
  const text = generateBudgetText();
  const phone = (state.client.phone || '').trim().replace(/[^0-9]/g, '');

  // Copiar al portapapeles como respaldo
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
    }
  } catch (_) {}

  // En móvil con Web Share API
  const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  if (isMobile && navigator.share) {
    try {
      await navigator.share({
        title: `Presupuesto - ${state.shop.name || 'Lucero Computación'}`,
        text: text
      });
      showToast('¡Presupuesto compartido con éxito!', 'success');
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
    }
  }

  // Abrir WhatsApp Web o App con el texto codificado
  // wa.me es más confiable que api.whatsapp.com para ir directo al chat
  const waUrl = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(text)}`
    : `https://wa.me/?text=${encodeURIComponent(text)}`;

  window.open(waUrl, '_blank');
  showToast('¡Abriendo WhatsApp! El texto también fue copiado al portapapeles.', 'success');
}

// ─── COPIAR TEXTO ─────────────────────────────────────────────────────────────
async function copyTextToClipboard() {
  const text = generateBudgetText();
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      showToast('¡Texto copiado al portapapeles! Listo para pegar en WhatsApp.', 'success');
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      showToast('¡Texto copiado al portapapeles!', 'success');
    }
  } catch (err) {
    showToast('No se pudo copiar automáticamente. Podés seleccionarlo de la vista previa.', 'error');
  }
}

// ─── DESCARGAR TEXTO (TXT) ────────────────────────────────────────────────────
function downloadTextFile() {
  const text = generateBudgetText();
  const clientName = (state.client.name || '').trim();
  const fileName = `Presupuesto_${(clientName || 'Lucero').replace(/\s+/g, '_')}.txt`;
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  downloadBlob(blob, fileName);
  showToast('¡Archivo de texto descargado correctamente!', 'success');
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

let toastTimer = null;
function showToast(message, type = 'info', duration = 4000) {
  const toast = document.getElementById('status-toast');
  if (toastTimer) clearTimeout(toastTimer);

  toast.className = 'text-xs py-2.5 px-3 rounded-lg border font-medium flex items-center gap-2 transition-all';

  let icon = 'ph-info';
  if (type === 'success') {
    toast.classList.add('bg-emerald-50', 'text-emerald-800', 'border-emerald-200');
    icon = 'ph-check-circle';
  } else if (type === 'error') {
    toast.classList.add('bg-red-50', 'text-red-800', 'border-red-200');
    icon = 'ph-warning-circle';
  } else {
    toast.classList.add('bg-sky-50', 'text-sky-800', 'border-sky-200');
  }

  toast.innerHTML = `<i class="ph ${icon} text-lg flex-shrink-0"></i><span>${escapeHtml(message)}</span>`;

  toastTimer = setTimeout(() => { toast.className = 'hidden'; }, duration);
}

function escapeHtml(text) {
  if (typeof text !== 'string') return String(text);
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
