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
  activeTab: 'home',
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
            <div class="text-strong">${state.config.storeName}</div>
            <div class="text-subtle">${state.config.address}</div>
          </div>
        </div>
        <div class="nav-tabs" role="tablist">
          <button class="tab ${state.activeTab === 'home' ? 'active' : ''}" data-tab="home">Inicio</button>
          <button class="tab ${state.activeTab === 'products' ? 'active' : ''}" data-tab="products">Productos</button>
          <button class="tab ${state.activeTab === 'admin' ? 'active' : ''}" data-tab="admin">Admin</button>
        </div>
        <div class="nav-actions">
          <button class="button ghost" id="theme-toggle">${state.config.theme === 'light' ? '🌙 Oscuro' : '☀️ Claro'}</button>
          <a class="button primary" href="#contacto">Contacto</a>
        </div>
      </div>

      ${renderHero(isOpen)}

      ${
        state.activeTab === 'home'
          ? `
              ${renderHighlights()}
              ${renderOffers()}
              ${renderCombos()}
              ${renderContact()}
            `
          : ''
      }

      ${state.activeTab === 'products' ? renderCatalog(pageItems, products, totalPages) : ''}

      ${state.activeTab === 'admin' ? renderAdmin() : ''}

      <footer>
        <div class="text-strong">Información</div>
        <div class="text-subtle">
          Catálogo virtual con persistencia local. Ajusta colores, horarios y datos de contacto desde el panel Admin.
        </div>
      </footer>

      <div class="support-icon" title="Soporte flotante">💬</div>
    </div>
  `;

  attachHandlers();
}

function renderHero(isOpen) {
  return `
    <section class="hero">
      <div class="flex-between">
        <div>
          <div class="status ${isOpen ? '' : 'closed'}">
            <span>${isOpen ? '● Abierto' : '○ Cerrado'}</span>
            <small>Horario ${state.config.openTime} - ${state.config.closeTime}</small>
          </div>
          <h1>${state.config.heroMessage}</h1>
          <p class="text-subtle">
            Descubre un catálogo curado de productos listos para entrega. Combos, ofertas y un carrito que prepara tu pedido para WhatsApp.
          </p>
          <div class="hero-actions">
            <button class="button primary" data-tab="products">Ver catálogo</button>
            <button class="button" data-tab="home">Ver novedades</button>
          </div>
        </div>
        <div class="hero-card">
          <div class="text-subtle">Estado</div>
          <div class="text-strong">${isOpen ? 'Estamos entregando' : 'Volvemos pronto'}</div>
          <div class="badge subtle">Tiempo estimado: 25-40 min</div>
        </div>
      </div>
    </section>
  `;
}

function renderHighlights() {
  return `
    <section class="card split">
      <div>
        <div class="section-title">
          <h2>Ofertas relámpago</h2>
          <div class="badge subtle">Renovables</div>
        </div>
        <p class="text-subtle">Encuentra descuentos de temporada y combos especiales listos para enviar.</p>
      </div>
      <div class="pill-group">
        <span class="pill">Entrega rápida</span>
        <span class="pill">Pagos al recibir</span>
        <span class="pill">Precios en RD$</span>
      </div>
    </section>
  `;
}

function renderCatalog(pageItems, products, totalPages) {
  return `
    <section id="catalogo">
      <div class="section-title">
        <h2>Catálogo (${products.length})</h2>
        <div class="search wide">
          <span role="img" aria-label="search">🔎</span>
          <input id="search-input" placeholder="Buscar productos" value="${state.filters.search}" />
        </div>
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
        <label class="checkbox">
          <input type="checkbox" id="available-filter" ${state.filters.onlyAvailable ? 'checked' : ''} />
          Solo disponibles
        </label>
      </div>

      <div class="product-layout">
        <div class="product-grid">
          ${pageItems
            .map(
              (product) => `
                <article class="product-card ${!product.available ? 'muted' : ''}">
                  <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" loading="lazy" />
                    ${product.available ? '' : '<div class="product-overlay">No disponible</div>'}
                    <div class="product-tags">
                      ${product.tags.map((t) => `<span class="pill">#${t}</span>`).join('')}
                    </div>
                  </div>
                  <header class="product-header">
                    <div>
                      <div class="text-strong">${product.name}</div>
                      <small class="text-subtle">${product.category}</small>
                    </div>
                    <div class="badge subtle">Stock ${product.stock}</div>
                  </header>
                  <p class="text-subtle clamp">${product.description}</p>
                  <div class="product-footer">
                    <div class="price">${currency(product.price)}</div>
                    <button class="button primary" data-add="${product.id}" ${!product.available ? 'disabled' : ''}>Añadir</button>
                  </div>
                </article>
              `
            )
            .join('')}
        </div>

        <aside class="card cart" id="carrito">
          <div class="section-title" style="margin-top:0">
            <h3>Carrito</h3>
            <div class="badge">${state.cart.items.length} items</div>
          </div>
          <div class="cart-body">
            ${
              state.cart.items.length === 0
                ? '<p class="text-subtle">Agrega productos para continuar.</p>'
                : state.cart.items
                    .map((item) => {
                      const product = state.products.find((p) => p.id === item.id);
                      if (!product) return '';
                      return `
                        <div class="cart-item" data-cart-id="${item.id}">
                          <div>
                            <div class="text-strong">${product.name}</div>
                            <small class="text-subtle">${currency(product.price)}</small>
                          </div>
                          <div class="cart-actions">
                            <button class="button ghost" data-dec="${item.id}">-</button>
                            <div>${item.quantity}</div>
                            <button class="button ghost" data-inc="${item.id}">+</button>
                          </div>
                        </div>
                      `;
                    })
                    .join('')
            }
          </div>
          <div class="field">
            <label>Nota</label>
            <textarea rows="2" id="cart-note" placeholder="Instrucciones para el repartidor">${state.cart.note}</textarea>
          </div>
          <div class="field">
            <label>Dirección de entrega</label>
            <input id="cart-address" placeholder="Calle, número, referencia" value="${state.cart.address}" />
          </div>
          <div class="flex-between totals">
            <strong>Total</strong>
            <strong>${currency(cartTotal())}</strong>
          </div>
          <a class="button primary full" id="whatsapp-btn" href="${whatsappLink()}" target="_blank" rel="noreferrer">
            Enviar pedido por WhatsApp
          </a>
        </aside>
      </div>

      <div class="pager">
        <div class="badge">Página ${state.filters.page} / ${totalPages}</div>
        <div class="pager-actions">
          <button class="button ghost" id="prev-page" ${state.filters.page === 1 ? 'disabled' : ''}>Anterior</button>
          <button class="button ghost" id="next-page" ${state.filters.page === totalPages ? 'disabled' : ''}>Siguiente</button>
        </div>
      </div>
    </section>
  `;
}

function renderOffers() {
  return `
    <section>
      <div class="section-title">
        <h2>Ofertas del día</h2>
        <div class="badge subtle">Personaliza en Admin</div>
      </div>
      <div class="grid">
        ${state.offers
          .map(
            (offer) => `
            <div class="card offer-card">
              <div>
                <div class="text-strong">${offer.title}</div>
                <small class="text-subtle">${offer.description}</small>
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
  `;
}

function renderCombos() {
  return `
    <section>
      <div class="section-title">
        <h2>Combos</h2>
        <div class="badge subtle">Con temporizador</div>
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
                  <div class="text-strong">${combo.title}</div>
                  <small class="text-subtle">${combo.items}</small>
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
  `;
}

function renderContact() {
  return `
    <section id="contacto" class="card contact">
      <div>
        <div class="section-title" style="margin-top:0">
          <h2>Contacto y ubicación</h2>
          <div class="badge">Atención inmediata</div>
        </div>
        <div class="grid tight">
          <div>
            <div class="text-strong">WhatsApp</div>
            <a href="https://wa.me/${state.config.whatsapp}" target="_blank" rel="noreferrer">${state.config.whatsapp}</a>
            <p class="text-subtle">Botón flotante de soporte listo para usar.</p>
          </div>
          <div>
            <div class="text-strong">Dirección</div>
            <p class="text-subtle">${state.config.address}</p>
            <a class="button ghost" href="${state.config.mapLink}" target="_blank" rel="noreferrer">Ver en Google Maps</a>
          </div>
        </div>
      </div>
    </section>
  `;
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
            <div class="text-strong">Acceso</div>
            <p class="text-subtle">Solo el dueño ingresa aquí. Los clientes usan las pestañas Inicio/Productos.</p>
            <div class="flex-between gap">
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
        <div class="badge">Solo dueño</div>
      </div>
      <div class="admin-grid">
        <fieldset>
          <legend>Configuración general</legend>
          <p class="text-subtle">Editar datos generales del colmado.</p>
          <label>Nombre del negocio</label>
          <input id="conf-name" value="${state.config.storeName}" />
          <label>WhatsApp</label>
          <input id="conf-whatsapp" value="${state.config.whatsapp}" />
          <label>Dirección</label>
          <input id="conf-address" value="${state.config.address}" />
          <label>Mapa (Google Maps)</label>
          <input id="conf-map" value="${state.config.mapLink}" />
          <label>Mensaje principal</label>
          <input id="conf-hero" value="${state.config.heroMessage}" />
          <div class="flex-between gap">
            <div class="field compact">
              <label>Abre</label>
              <input type="time" id="conf-open" value="${state.config.openTime}" />
            </div>
            <div class="field compact">
              <label>Cierra</label>
              <input type="time" id="conf-close" value="${state.config.closeTime}" />
            </div>
          </div>
          <div class="flex-between gap">
            <input id="conf-pin" placeholder="Nuevo PIN" value="${state.config.pin}" />
            <button class="button ghost" id="save-pin">Actualizar PIN</button>
          </div>
          <div class="flex-between gap" style="margin-top:10px">
            <button class="button primary" id="regen-catalog">Recargar catálogo automático</button>
            <button class="button ghost" id="toggle-theme-admin">${state.config.theme === 'light' ? 'Activar oscuro' : 'Activar claro'}</button>
          </div>
        </fieldset>

        <fieldset>
          <legend>Crear/editar producto</legend>
          <p class="text-subtle">Formulario breve para crear o modificar un producto.</p>
          <form id="product-form" class="grid two-col">
            <input placeholder="ID (opcional)" name="id" value="" />
            <input required placeholder="Nombre" name="name" />
            <input type="number" min="0" step="0.01" required placeholder="Precio" name="price" />
            <input type="number" min="0" required placeholder="Stock" name="stock" />
            <select name="category">${categories.map((c) => `<option value="${c}">${c}</option>`).join('')}</select>
            <input placeholder="Imagen (URL)" name="image" />
            <input placeholder="Etiquetas separadas por coma" name="tags" value="Nuevo,Popular" />
            <input placeholder="Descripción" name="description" />
            <label class="checkbox wide">
              <input type="checkbox" name="available" checked /> Disponible
            </label>
            <button class="button primary" type="submit" style="grid-column: span 2">Guardar producto</button>
          </form>
        </fieldset>

        <fieldset>
          <legend>Editor rápido precio/stock</legend>
          <p class="text-subtle">Ajusta rápido los primeros 30 productos cargados.</p>
          <div class="quick-list">
            ${state.products.slice(0, 30).map((p) => `
              <div class="flex-between">
                <div>
                  <div class="text-strong">${p.name}</div>
                  <small class="text-subtle">${p.category}</small>
                </div>
                <div class="quick-inputs">
                  <input type="number" min="0" style="width:90px" data-quick-price="${p.id}" value="${p.price}" />
                  <input type="number" min="0" style="width:80px" data-quick-stock="${p.id}" value="${p.stock}" />
                </div>
              </div>
            `).join('')}
          </div>
        </fieldset>

        <fieldset>
          <legend>Ofertas</legend>
          <p class="text-subtle">Gestiona las ofertas del día.</p>
          <form id="offer-form" class="stack">
            <input placeholder="Título" name="title" />
            <input placeholder="Descripción" name="description" />
            <input type="number" min="0" placeholder="Precio" name="price" />
            <label class="checkbox"><input type="checkbox" name="active" checked /> Activa</label>
            <button class="button primary" type="submit">Agregar oferta</button>
            <div class="stack">
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
          <p class="text-subtle">Combos con duración opcional.</p>
          <form id="combo-form" class="stack">
            <input placeholder="Título" name="title" />
            <input placeholder="Items" name="items" />
            <input type="number" min="0" placeholder="Precio" name="price" />
            <input type="number" min="0" placeholder="Duración en minutos" name="durationMinutes" />
            <label class="checkbox"><input type="checkbox" name="active" checked /> Activo</label>
            <button class="button primary" type="submit">Agregar combo</button>
            <div class="stack">
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

  document.querySelectorAll('[data-tab]')?.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const next = e.currentTarget.dataset.tab;
      state.activeTab = next;
      if (next === 'products') state.filters.page = 1;
      render();
    });
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
