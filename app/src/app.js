const root = document.getElementById('root');

const defaultConfig = {
  storeName: 'Colmado Digital',
  whatsapp: '18095550123',
  address: 'Calle 1 #23, Santo Domingo',
  mapLink: 'https://maps.google.com/?q=colmado+santo+domingo',
  openTime: '08:00',
  closeTime: '23:00',
  theme: 'light',
  pin: '1234',
  heroMessage: 'Todo lo que necesitas, entregado en minutos.',
};

const baseTags = ['Popular', 'Nuevo', 'Eco', 'Premium', 'Oferta', 'Frío', 'Caliente'];
const categories = ['Despensa', 'Bebidas', 'Snacks', 'Limpieza', 'Lácteos', 'Hogar', 'Salud', 'Congelados'];

function randomPick(arr, n = 2) {
  const copy = [...arr].sort(() => 0.5 - Math.random());
  return copy.slice(0, n);
}

function generateCatalog(count = 100) {
  const list = [];
  for (let i = 1; i <= count; i++) {
    const category = categories[i % categories.length];
    const stock = Math.floor(Math.random() * 50) + 1;
    const available = Math.random() > 0.05;
    list.push({
      id: `prod-${i}`,
      name: `Producto ${i.toString().padStart(3, '0')}`,
      description: 'Artículo seleccionado para entrega rápida en tu zona.',
      price: +(80 + Math.random() * 900).toFixed(2),
      category,
      image: `https://picsum.photos/seed/colmado-${i}/480/360`,
      stock,
      available,
      tags: randomPick(baseTags, 2),
      popularity: Math.floor(Math.random() * 1000),
    });
  }
  return list;
}

const defaultOffers = [
  {
    id: 'offer-1',
    title: 'Descuento desayuno',
    description: 'Pan + Café + Leche entera',
    price: 450,
    active: true,
  },
  {
    id: 'offer-2',
    title: 'Dúo hidratación',
    description: 'Dos bebidas deportivas 600ml',
    price: 320,
    active: true,
  },
];

const defaultCombos = [
  {
    id: 'combo-1',
    title: 'Combo parrillada',
    items: 'Carbón + Salchichas + Salsas',
    price: 980,
    durationMinutes: 180,
    startsAt: Date.now(),
    active: true,
  },
];

function loadState(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (e) {
    return fallback;
  }
}

function saveState(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

function checkOpen(openTime, closeTime) {
  const now = new Date();
  const [openH, openM] = openTime.split(':').map(Number);
  const [closeH, closeM] = closeTime.split(':').map(Number);
  const openMinutes = openH * 60 + openM;
  const closeMinutes = closeH * 60 + closeM;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
}

function currency(n) {
  return `RD$ ${Number(n).toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
}

const state = {
  config: loadState('config', defaultConfig),
  products: loadState('products', generateCatalog()),
  offers: loadState('offers', defaultOffers),
  combos: loadState('combos', defaultCombos),
  cart: loadState('cart', { items: [], note: '', address: '' }),
  filters: {
    search: '',
    category: '',
    tag: '',
    sortBy: 'popularity',
    onlyAvailable: false,
    page: 1,
    perPage: 20,
  },
  admin: {
    pinInput: '',
    unlocked: false,
  },
};

function persist() {
  saveState('config', state.config);
  saveState('products', state.products);
  saveState('offers', state.offers);
  saveState('combos', state.combos);
  saveState('cart', state.cart);
}

document.documentElement.setAttribute('data-theme', state.config.theme);

function filteredProducts() {
  let list = [...state.products];
  const { search, category, tag, sortBy, onlyAvailable } = state.filters;
  if (search) {
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
    );
  }
  if (category) list = list.filter((p) => p.category === category);
  if (tag) list = list.filter((p) => p.tags.includes(tag));
  if (onlyAvailable) list = list.filter((p) => p.available && p.stock > 0);
  list.sort((a, b) => {
    if (sortBy === 'price-asc') return a.price - b.price;
    if (sortBy === 'price-desc') return b.price - a.price;
    return b.popularity - a.popularity;
  });
  return list;
}

function render() {
  document.documentElement.setAttribute('data-theme', state.config.theme);
  const isOpen = checkOpen(state.config.openTime, state.config.closeTime);
  const products = filteredProducts();
  const totalPages = Math.max(1, Math.ceil(products.length / state.filters.perPage));
  state.filters.page = Math.min(state.filters.page, totalPages);
  const start = (state.filters.page - 1) * state.filters.perPage;
  const pageItems = products.slice(start, start + state.filters.perPage);

  root.innerHTML = `
    <div class="app-shell">
      <div class="top-bar">
        <div class="brand">
          <div class="logo">CD</div>
          <div>
            <div style="font-weight: 800">${state.config.storeName}</div>
            <div style="color: var(--muted); font-size: 13px">${state.config.address}</div>
          </div>
        </div>
        <div class="search">
          <span role="img" aria-label="search">🔎</span>
          <input id="search-input" placeholder="Buscar productos" value="${state.filters.search}" style="flex: 1; border: none; background: transparent" />
        </div>
        <div class="nav-actions">
          <button class="button" id="theme-toggle">${state.config.theme === 'light' ? 'Modo oscuro' : 'Modo claro'}</button>
          <a class="button primary" href="#catalogo">Catálogo</a>
          <a class="button secondary" href="#contacto">Contacto</a>
        </div>
      </div>

      <section class="hero">
        <div class="flex-between">
          <div>
            <div class="status ${isOpen ? '' : 'closed'}">
              <span>${isOpen ? '● Abierto' : '○ Cerrado'}</span>
              <small>Horario ${state.config.openTime} - ${state.config.closeTime}</small>
            </div>
            <h1>${state.config.heroMessage}</h1>
            <p style="color: var(--muted); max-width: 620px">
              Descubre un catálogo curado de productos listos para entrega. Combos, ofertas y un carrito que prepara tu pedido para WhatsApp.
            </p>
          </div>
          <div class="banner">
            <div style="font-weight: 700">Ofertas relámpago activas</div>
            <div style="color: var(--muted)">Actualiza stock y precios en vivo desde el panel Admin.</div>
          </div>
        </div>
      </section>

      <section id="catalogo">
        <div class="section-title">
          <h2>Catálogo</h2>
          <div class="badge">${products.length} productos</div>
        </div>
        <div class="filters">
          <select id="category-filter">
            <option value="">Todas las categorías</option>
            ${categories.map((c) => `<option value="${c}" ${state.filters.category === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
          <select id="tag-filter">
            <option value="">Todas las etiquetas</option>
            ${baseTags.map((t) => `<option value="${t}" ${state.filters.tag === t ? 'selected' : ''}>${t}</option>`).join('')}
          </select>
          <select id="sort-filter">
            <option value="popularity" ${state.filters.sortBy === 'popularity' ? 'selected' : ''}>Más populares</option>
            <option value="price-asc" ${state.filters.sortBy === 'price-asc' ? 'selected' : ''}>Precio: menor a mayor</option>
            <option value="price-desc" ${state.filters.sortBy === 'price-desc' ? 'selected' : ''}>Precio: mayor a menor</option>
          </select>
          <label style="display: flex; align-items: center; gap: 8px">
            <input type="checkbox" id="available-filter" ${state.filters.onlyAvailable ? 'checked' : ''} />
            Solo disponibles
          </label>
        </div>

        <div class="grid" style="align-items: start">
          <div class="list-container">
            ${pageItems
              .map(
                (product) => `
                  <div style="padding: 12px">
                    <div class="card product-card">
                      <div class="product-media">
                        <img src="${product.image}" alt="${product.name}" loading="lazy" />
                        ${product.available ? '' : '<div style="position:absolute; inset:0; background:rgba(15,23,42,0.6); color:#fff; display:grid; place-items:center; font-weight:700;">No disponible</div>'}
                      </div>
                      <div class="flex-between">
                        <div>
                          <div style="font-weight:700">${product.name}</div>
                          <small style="color: var(--muted)">${product.category}</small>
                        </div>
                        <div class="badge">Stock: ${product.stock}</div>
                      </div>
                      <div class="price">${currency(product.price)}</div>
                      <div class="tags">
                        ${product.tags.map((t) => `<span class="badge">#${t}</span>`).join('')}
                      </div>
                      <div class="flex-between">
                        <small style="color: var(--muted)">${product.description}</small>
                        <button class="button primary" data-add="${product.id}" ${!product.available ? 'disabled' : ''}>Añadir</button>
                      </div>
                    </div>
                  </div>
                `
              )
              .join('')}
          </div>

          <div class="card cart" id="carrito">
            <div class="section-title" style="margin-top:0">
              <h3>Carrito</h3>
              <div class="badge">${state.cart.items.length} items</div>
            </div>
            <div>
              ${state.cart.items.length === 0
                ? '<p style="color: var(--muted)">Agrega productos para continuar.</p>'
                : state.cart.items
                    .map((item) => {
                      const product = state.products.find((p) => p.id === item.id);
                      if (!product) return '';
                      return `
                        <div class="cart-item" data-cart-id="${item.id}">
                          <div>
                            <div style="font-weight:700">${product.name}</div>
                            <small style="color: var(--muted)">${currency(product.price)}</small>
                          </div>
                          <div class="cart-actions">
                            <button class="button" data-dec="${item.id}">-</button>
                            <div>${item.quantity}</div>
                            <button class="button" data-inc="${item.id}">+</button>
                          </div>
                        </div>
                      `;
                    })
                    .join('')}
            </div>
            <div style="margin-top: 12px">
              <label>Nota</label>
              <textarea rows="2" id="cart-note" placeholder="Instrucciones para el repartidor">${state.cart.note}</textarea>
            </div>
            <div style="margin-top: 12px">
              <label>Dirección de entrega</label>
              <input id="cart-address" placeholder="Calle, número, referencia" value="${state.cart.address}" />
            </div>
            <div class="flex-between" style="margin-top: 12px">
              <strong>Total</strong>
              <strong>${currency(cartTotal())}</strong>
            </div>
            <a class="button primary" style="margin-top: 12px; text-align:center; display:block" id="whatsapp-btn" href="${whatsappLink()}" target="_blank" rel="noreferrer">
              Enviar pedido por WhatsApp
            </a>
          </div>
        </div>

        <div class="flex-between" style="margin-top: 12px">
          <div class="badge">Página ${state.filters.page} / ${totalPages}</div>
          <div style="display:flex; gap:8px">
            <button class="button" id="prev-page" ${state.filters.page === 1 ? 'disabled' : ''}>Anterior</button>
            <button class="button" id="next-page" ${state.filters.page === totalPages ? 'disabled' : ''}>Siguiente</button>
          </div>
        </div>
      </section>

      <section>
        <div class="section-title">
          <h2>Ofertas del día</h2>
          <div class="badge">Personaliza en Admin</div>
        </div>
        <div class="grid">
          ${state.offers
            .map(
              (offer) => `
              <div class="card offer-card">
                <div>
                  <div style="font-weight:700">${offer.title}</div>
                  <small style="color: var(--muted)">${offer.description}</small>
                </div>
                <div>
                  <div class="price">${currency(offer.price)}</div>
                  <span class="badge">${offer.active ? 'Activa' : 'Inactiva'}</span>
                </div>
              </div>`
            )
            .join('')}
        </div>
      </section>

      <section>
        <div class="section-title">
          <h2>Combos</h2>
          <div class="badge">Con temporizador</div>
        </div>
        <div class="grid">
          ${state.combos
            .map((combo) => {
              const expiresAt = combo.durationMinutes ? combo.startsAt + combo.durationMinutes * 60000 : null;
              const remaining = expiresAt ? Math.max(0, expiresAt - Date.now()) : null;
              const minutes = remaining ? Math.floor(remaining / 60000) : null;
              return `
                <div class="card combo-card">
                  <div>
                    <div style="font-weight:700">${combo.title}</div>
                    <small style="color: var(--muted)">${combo.items}</small>
                    ${minutes !== null ? `<div class="badge">Expira en ${minutes} min</div>` : ''}
                  </div>
                  <div>
                    <div class="price">${currency(combo.price)}</div>
                    <span class="badge">${combo.active ? 'Activo' : 'Pausado'}</span>
                  </div>
                </div>`;
            })
            .join('')}
        </div>
      </section>

      <section id="contacto" class="card" style="margin-top:24px">
        <div class="section-title" style="margin-top:0">
          <h2>Contacto y ubicación</h2>
          <div class="badge">Atención inmediata</div>
        </div>
        <div class="grid">
          <div>
            <div style="font-weight:700">WhatsApp</div>
            <a href="https://wa.me/${state.config.whatsapp}" target="_blank" rel="noreferrer">${state.config.whatsapp}</a>
            <p style="color: var(--muted)">Botón flotante de soporte listo para usar.</p>
          </div>
          <div>
            <div style="font-weight:700">Dirección</div>
            <p style="margin:0">${state.config.address}</p>
            <a class="button" href="${state.config.mapLink}" target="_blank" rel="noreferrer">Ver en Google Maps</a>
          </div>
        </div>
      </section>

      ${renderAdmin()}

      <footer>
        <div style="font-weight:700">Información</div>
        <div style="color: var(--muted)">
          Catálogo virtual con persistencia local. Ajusta colores, horarios y datos de contacto desde el panel Admin.
        </div>
      </footer>

      <div class="support-icon" title="Soporte flotante">💬</div>
    </div>
  `;

  attachHandlers();
}

function renderAdmin() {
  if (!state.admin.unlocked) {
    return `
      <section class="admin-panel" id="admin">
        <div class="section-title" style="margin-top:0">
          <h2>Panel Admin</h2>
          <div class="badge">PIN requerido</div>
        </div>
        <div class="grid">
          <div class="card">
            <div style="font-weight:700">Acceso</div>
            <p style="color: var(--muted)">Introduce el PIN configurado para editar.</p>
            <div class="flex-between">
              <input id="pin-input" placeholder="PIN" value="${state.admin.pinInput}" />
              <button class="button primary" id="pin-submit">Entrar</button>
            </div>
          </div>
        </div>
      </section>
    `;
  }

  return `
    <section class="admin-panel" id="admin">
      <div class="section-title" style="margin-top:0">
        <h2>Panel Admin</h2>
        <div class="badge">PIN correcto</div>
      </div>
      <div class="admin-grid">
        <fieldset>
          <legend>Configuración general</legend>
          <label>Nombre</label>
          <input id="conf-name" value="${state.config.storeName}" />
          <label>WhatsApp</label>
          <input id="conf-whatsapp" value="${state.config.whatsapp}" />
          <label>Dirección</label>
          <input id="conf-address" value="${state.config.address}" />
          <label>Mapa</label>
          <input id="conf-map" value="${state.config.mapLink}" />
          <label>Mensaje hero</label>
          <input id="conf-hero" value="${state.config.heroMessage}" />
          <div class="flex-between" style="margin-top:8px">
            <div>
              <label>Abre</label>
              <input type="time" id="conf-open" value="${state.config.openTime}" />
            </div>
            <div>
              <label>Cierra</label>
              <input type="time" id="conf-close" value="${state.config.closeTime}" />
            </div>
          </div>
          <div class="flex-between" style="margin-top:10px">
            <input id="conf-pin" placeholder="Nuevo PIN" value="${state.config.pin}" />
            <button class="button" id="save-pin">Guardar PIN</button>
          </div>
          <button class="button primary" style="margin-top:10px" id="regen-catalog">Generar/Recargar catálogo automático</button>
          <button class="button" style="margin-top:10px" id="toggle-theme-admin">${state.config.theme === 'light' ? 'Activar oscuro' : 'Activar claro'}</button>
        </fieldset>

        <fieldset>
          <legend>Crear/editar producto</legend>
          <form id="product-form" class="grid" style="grid-template-columns: 1fr 1fr">
            <input placeholder="ID (opcional)" name="id" value="" />
            <input required placeholder="Nombre" name="name" />
            <input type="number" min="0" step="0.01" required placeholder="Precio" name="price" />
            <input type="number" min="0" required placeholder="Stock" name="stock" />
            <select name="category">${categories.map((c) => `<option value="${c}">${c}</option>`).join('')}</select>
            <input placeholder="Imagen (URL)" name="image" />
            <input placeholder="Etiquetas separadas por coma" name="tags" value="Nuevo,Popular" />
            <input placeholder="Descripción" name="description" />
            <label style="grid-column: span 2; display:flex; align-items:center; gap:8px">
              <input type="checkbox" name="available" checked /> Disponible
            </label>
            <button class="button primary" type="submit" style="grid-column: span 2">Guardar producto</button>
          </form>
        </fieldset>

        <fieldset>
          <legend>Editor rápido precio/stock</legend>
          <div style="max-height:260px; overflow:auto; display:grid; gap:8px">
            ${state.products.slice(0, 30).map((p) => `
              <div class="flex-between">
                <div>
                  <div style="font-weight:700">${p.name}</div>
                  <small style="color: var(--muted)">${p.category}</small>
                </div>
                <div style="display:flex; gap:8px; align-items:center">
                  <input type="number" min="0" style="width:90px" data-quick-price="${p.id}" value="${p.price}" />
                  <input type="number" min="0" style="width:80px" data-quick-stock="${p.id}" value="${p.stock}" />
                </div>
              </div>
            `).join('')}
          </div>
        </fieldset>

        <fieldset>
          <legend>Ofertas</legend>
          <form id="offer-form" style="display:grid; gap:8px">
            <input placeholder="Título" name="title" />
            <input placeholder="Descripción" name="description" />
            <input type="number" min="0" placeholder="Precio" name="price" />
            <label style="display:flex; align-items:center; gap:8px"><input type="checkbox" name="active" checked /> Activa</label>
            <button class="button primary" type="submit">Agregar oferta</button>
            <div style="margin-top:8px">
              ${state.offers
                .map(
                  (o) => `
                  <div class="flex-between">
                    <div>${o.title}</div>
                    <button class="button" data-del-offer="${o.id}" type="button">Eliminar</button>
                  </div>`
                )
                .join('')}
            </div>
          </form>
        </fieldset>

        <fieldset>
          <legend>Combos</legend>
          <form id="combo-form" style="display:grid; gap:8px">
            <input placeholder="Título" name="title" />
            <input placeholder="Items" name="items" />
            <input type="number" min="0" placeholder="Precio" name="price" />
            <input type="number" min="0" placeholder="Duración en minutos" name="durationMinutes" />
            <label style="display:flex; align-items:center; gap:8px"><input type="checkbox" name="active" checked /> Activo</label>
            <button class="button primary" type="submit">Agregar combo</button>
            <div style="margin-top:8px">
              ${state.combos
                .map(
                  (c) => `
                  <div class="flex-between">
                    <div>${c.title}</div>
                    <button class="button" data-del-combo="${c.id}" type="button">Eliminar</button>
                  </div>`
                )
                .join('')}
            </div>
          </form>
        </fieldset>
      </div>
    </section>
  `;
}

function cartTotal() {
  return state.cart.items.reduce((sum, item) => {
    const product = state.products.find((p) => p.id === item.id);
    return product ? sum + product.price * item.quantity : sum;
  }, 0);
}

function whatsappLink() {
  const lines = state.cart.items
    .map((item) => {
      const product = state.products.find((p) => p.id === item.id);
      if (!product) return '';
      return `• ${product.name} x${item.quantity} — ${currency(product.price * item.quantity)}`;
    })
    .filter(Boolean);
  lines.push(`Total: ${currency(cartTotal())}`);
  if (state.cart.note) lines.push(`Nota: ${state.cart.note}`);
  if (state.cart.address) lines.push(`Entrega: ${state.cart.address}`);
  return `https://wa.me/${state.config.whatsapp}?text=${encodeURIComponent(lines.join('\n'))}`;
}

function attachHandlers() {
  const searchInput = document.getElementById('search-input');
  searchInput?.addEventListener('input', (e) => {
    state.filters.search = e.target.value;
    state.filters.page = 1;
    render();
  });

  document.getElementById('theme-toggle')?.addEventListener('click', () => {
    state.config.theme = state.config.theme === 'light' ? 'dark' : 'light';
    persist();
    render();
  });

  document.getElementById('category-filter')?.addEventListener('change', (e) => {
    state.filters.category = e.target.value;
    state.filters.page = 1;
    render();
  });
  document.getElementById('tag-filter')?.addEventListener('change', (e) => {
    state.filters.tag = e.target.value;
    state.filters.page = 1;
    render();
  });
  document.getElementById('sort-filter')?.addEventListener('change', (e) => {
    state.filters.sortBy = e.target.value;
    render();
  });
  document.getElementById('available-filter')?.addEventListener('change', (e) => {
    state.filters.onlyAvailable = e.target.checked;
    state.filters.page = 1;
    render();
  });

  document.getElementById('prev-page')?.addEventListener('click', () => {
    state.filters.page = Math.max(1, state.filters.page - 1);
    render();
  });
  document.getElementById('next-page')?.addEventListener('click', () => {
    const totalPages = Math.max(1, Math.ceil(filteredProducts().length / state.filters.perPage));
    state.filters.page = Math.min(totalPages, state.filters.page + 1);
    render();
  });

  document.querySelectorAll('[data-add]')?.forEach((btn) => {
    btn.addEventListener('click', () => addToCart(btn.dataset.add));
  });
  document.querySelectorAll('[data-dec]')?.forEach((btn) => {
    btn.addEventListener('click', () => updateCart(btn.dataset.dec, -1));
  });
  document.querySelectorAll('[data-inc]')?.forEach((btn) => {
    btn.addEventListener('click', () => updateCart(btn.dataset.inc, 1));
  });

  document.getElementById('cart-note')?.addEventListener('input', (e) => {
    state.cart.note = e.target.value;
    persist();
  });
  document.getElementById('cart-address')?.addEventListener('input', (e) => {
    state.cart.address = e.target.value;
    persist();
  });
  document.getElementById('whatsapp-btn')?.setAttribute('href', whatsappLink());

  const pinInput = document.getElementById('pin-input');
  const pinBtn = document.getElementById('pin-submit');
  pinInput?.addEventListener('input', (e) => (state.admin.pinInput = e.target.value));
  pinBtn?.addEventListener('click', () => {
    if (state.admin.pinInput === state.config.pin) {
      state.admin.unlocked = true;
      render();
    } else {
      alert('PIN incorrecto');
    }
  });

  document.getElementById('save-pin')?.addEventListener('click', () => {
    state.config.pin = document.getElementById('conf-pin').value || state.config.pin;
    persist();
    alert('PIN actualizado');
  });
  document.getElementById('regen-catalog')?.addEventListener('click', () => {
    state.products = generateCatalog();
    persist();
    render();
  });
  document.getElementById('toggle-theme-admin')?.addEventListener('click', () => {
    state.config.theme = state.config.theme === 'light' ? 'dark' : 'light';
    persist();
    render();
  });

  document.getElementById('conf-name')?.addEventListener('input', (e) => {
    state.config.storeName = e.target.value;
    persist();
  });
  document.getElementById('conf-whatsapp')?.addEventListener('input', (e) => {
    state.config.whatsapp = e.target.value;
    persist();
  });
  document.getElementById('conf-address')?.addEventListener('input', (e) => {
    state.config.address = e.target.value;
    persist();
  });
  document.getElementById('conf-map')?.addEventListener('input', (e) => {
    state.config.mapLink = e.target.value;
    persist();
  });
  document.getElementById('conf-hero')?.addEventListener('input', (e) => {
    state.config.heroMessage = e.target.value;
    persist();
  });
  document.getElementById('conf-open')?.addEventListener('input', (e) => {
    state.config.openTime = e.target.value;
    persist();
    render();
  });
  document.getElementById('conf-close')?.addEventListener('input', (e) => {
    state.config.closeTime = e.target.value;
    persist();
    render();
  });

  document.getElementById('product-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const entry = {
      id: data.get('id') || `prod-${state.products.length + 1}`,
      name: data.get('name') || 'Nuevo producto',
      price: Number(data.get('price')),
      stock: Number(data.get('stock')),
      category: data.get('category'),
      image: data.get('image') || `https://picsum.photos/seed/colmado-${Date.now()}/480/360`,
      tags: (data.get('tags') || '')
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      description: data.get('description') || 'Producto personalizado',
      available: data.get('available') === 'on',
      popularity: Math.floor(Math.random() * 1000),
    };
    if (entry.price < 0 || entry.stock < 0) return alert('Sin precios o stock negativos');
    const exists = state.products.findIndex((p) => p.id === entry.id);
    if (exists >= 0) state.products[exists] = entry; else state.products.push(entry);
    persist();
    e.target.reset();
    render();
  });

  document.getElementById('offer-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const price = Number(data.get('price'));
    if (price < 0) return alert('Precio inválido');
    const offer = {
      id: `offer-${state.offers.length + 1}`,
      title: data.get('title') || 'Nueva oferta',
      description: data.get('description') || 'Descripción de oferta',
      price,
      active: data.get('active') === 'on',
    };
    state.offers.push(offer);
    persist();
    e.target.reset();
    render();
  });
  document.querySelectorAll('[data-del-offer]')?.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.offers = state.offers.filter((o) => o.id !== btn.dataset.delOffer);
      persist();
      render();
    });
  });

  document.getElementById('combo-form')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = new FormData(e.target);
    const price = Number(data.get('price'));
    const duration = Number(data.get('durationMinutes'));
    if (price < 0 || duration < 0) return alert('Datos inválidos');
    const combo = {
      id: `combo-${state.combos.length + 1}`,
      title: data.get('title') || 'Nuevo combo',
      items: data.get('items') || 'Productos combinados',
      price,
      durationMinutes: duration,
      active: data.get('active') === 'on',
      startsAt: Date.now(),
    };
    state.combos.push(combo);
    persist();
    e.target.reset();
    render();
  });
  document.querySelectorAll('[data-del-combo]')?.forEach((btn) => {
    btn.addEventListener('click', () => {
      state.combos = state.combos.filter((c) => c.id !== btn.dataset.delCombo);
      persist();
      render();
    });
  });

  document.querySelectorAll('[data-quick-price]')?.forEach((input) => {
    input.addEventListener('input', (e) => {
      const product = state.products.find((p) => p.id === e.target.dataset.quickPrice);
      if (!product) return;
      const value = Number(e.target.value);
      if (value < 0) return;
      product.price = value;
      persist();
    });
  });
  document.querySelectorAll('[data-quick-stock]')?.forEach((input) => {
    input.addEventListener('input', (e) => {
      const product = state.products.find((p) => p.id === e.target.dataset.quickStock);
      if (!product) return;
      const value = Number(e.target.value);
      if (value < 0) return;
      product.stock = value;
      persist();
    });
  });
}

function addToCart(productId) {
  const product = state.products.find((p) => p.id === productId);
  if (!product) return;
  const existing = state.cart.items.find((i) => i.id === productId);
  if (existing) {
    if (existing.quantity < product.stock) existing.quantity += 1;
  } else {
    state.cart.items.push({ id: productId, quantity: 1 });
  }
  persist();
  render();
}

function updateCart(productId, delta) {
  const item = state.cart.items.find((i) => i.id === productId);
  const product = state.products.find((p) => p.id === productId);
  if (!item || !product) return;
  item.quantity = Math.min(Math.max(1, item.quantity + delta), product.stock);
  if (item.quantity <= 0) {
    state.cart.items = state.cart.items.filter((i) => i.id !== productId);
  }
  persist();
  render();
}

setInterval(() => {
  const before = root.innerHTML;
  render();
  // avoid re-render storm when DOM identical
  if (root.innerHTML === before) return;
}, 60000);

render();
