const { useEffect, useMemo, useState } = React;
const { FixedSizeList } = window.ReactWindow;

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

function usePersistentState(key, initialValue) {
  const [state, setState] = useState(() => {
    if (typeof localStorage === 'undefined') return initialValue;
    const stored = localStorage.getItem(key);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        return initialValue;
      }
    }
    return initialValue;
  });

  useEffect(() => {
    if (typeof localStorage === 'undefined') return;
    localStorage.setItem(key, JSON.stringify(state));
  }, [key, state]);

  return [state, setState];
}

function useIsOpen({ openTime, closeTime }) {
  const [isOpen, setIsOpen] = useState(checkOpen(openTime, closeTime));

  useEffect(() => {
    const id = setInterval(() => setIsOpen(checkOpen(openTime, closeTime)), 30000);
    return () => clearInterval(id);
  }, [openTime, closeTime]);

  return isOpen;
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
  return `RD$ ${n.toLocaleString('es-DO', { minimumFractionDigits: 2 })}`;
}

function App() {
  const [config, setConfig] = usePersistentState('config', defaultConfig);
  const [products, setProducts] = usePersistentState('products', generateCatalog());
  const [offers, setOffers] = usePersistentState('offers', defaultOffers);
  const [combos, setCombos] = usePersistentState('combos', defaultCombos);
  const [cart, setCart] = usePersistentState('cart', { items: [], note: '', address: '' });
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [sortBy, setSortBy] = useState('popularity');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [, setPulse] = useState(0);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', config.theme);
  }, [config.theme]);

  useEffect(() => {
    const id = setInterval(() => setPulse((p) => p + 1), 60000);
    return () => clearInterval(id);
  }, []);

  const isOpen = useIsOpen(config);

  const filteredProducts = useMemo(() => {
    return products
      .filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase())
      )
      .filter((p) => (categoryFilter ? p.category === categoryFilter : true))
      .filter((p) => (tagFilter ? p.tags.includes(tagFilter) : true))
      .filter((p) => (onlyAvailable ? p.available && p.stock > 0 : true))
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        return b.popularity - a.popularity;
      });
  }, [products, search, categoryFilter, tagFilter, sortBy, onlyAvailable]);

  function toggleTheme() {
    setConfig({ ...config, theme: config.theme === 'light' ? 'dark' : 'light' });
  }

  function addToCart(product) {
    setCart((prev) => {
      const exists = prev.items.find((i) => i.id === product.id);
      if (exists) {
        return {
          ...prev,
          items: prev.items.map((i) =>
            i.id === product.id ? { ...i, quantity: Math.min(i.quantity + 1, product.stock) } : i
          ),
        };
      }
      return {
        ...prev,
        items: [...prev.items, { id: product.id, quantity: 1 }],
      };
    });
  }

  function updateCart(id, quantity) {
    if (quantity < 1) {
      setCart((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== id) }));
    } else {
      setCart((prev) => ({
        ...prev,
        items: prev.items.map((i) => (i.id === id ? { ...i, quantity } : i)),
      }));
    }
  }

  function cartTotal() {
    return cart.items.reduce((sum, item) => {
      const product = products.find((p) => p.id === item.id);
      return product ? sum + product.price * item.quantity : sum;
    }, 0);
  }

  function whatsappMessage() {
    const lines = cart.items
      .map((item) => {
        const product = products.find((p) => p.id === item.id);
        if (!product) return '';
        return `• ${product.name} x${item.quantity} — ${currency(product.price * item.quantity)}`;
      })
      .filter(Boolean);
    lines.push(`Total: ${currency(cartTotal())}`);
    if (cart.note) lines.push(`Nota: ${cart.note}`);
    if (cart.address) lines.push(`Entrega: ${cart.address}`);
    return encodeURIComponent(lines.join('\n'));
  }

  function handleAdminLogin() {
    if (pinInput === config.pin) {
      setIsAdmin(true);
    } else {
      alert('PIN incorrecto');
    }
  }

  function upsertProduct(entry) {
    if (entry.price < 0 || entry.stock < 0) return alert('Precio o stock inválido');
    setProducts((prev) => {
      const exists = prev.find((p) => p.id === entry.id);
      if (exists) return prev.map((p) => (p.id === entry.id ? entry : p));
      return [...prev, entry];
    });
  }

  function addOffer(offer) {
    setOffers((prev) => [...prev, { ...offer, id: `offer-${prev.length + 1}` }]);
  }

  function addCombo(combo) {
    setCombos((prev) => [
      ...prev,
      {
        ...combo,
        id: `combo-${prev.length + 1}`,
        startsAt: Date.now(),
      },
    ]);
  }

  function regenerateCatalog() {
    setProducts(generateCatalog());
  }

  const displayedProducts = filteredProducts;
  const listHeight = Math.min(640, Math.max(320, displayedProducts.length * 180));

  return (
    <div className="app-shell">
      <div className="top-bar">
        <div className="brand">
          <div className="logo">CD</div>
          <div>
            <div style={{ fontWeight: 800 }}>{config.storeName}</div>
            <div style={{ color: 'var(--muted)', fontSize: 13 }}>{config.address}</div>
          </div>
        </div>
        <div className="search">
          <span role="img" aria-label="search">
            🔎
          </span>
          <input
            placeholder="Buscar productos"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ flex: 1, border: 'none', background: 'transparent' }}
          />
        </div>
        <div className="nav-actions">
          <button className="button" onClick={toggleTheme}>
            {config.theme === 'light' ? 'Modo oscuro' : 'Modo claro'}
          </button>
          <a className="button primary" href="#catalogo">
            Catálogo
          </a>
          <a className="button secondary" href="#contacto">
            Contacto
          </a>
        </div>
      </div>

      <section className="hero">
        <div className="flex-between">
          <div>
            <div className={`status ${isOpen ? '' : 'closed'}`}>
              <span>{isOpen ? '● Abierto' : '○ Cerrado'}</span>
              <small>
                Horario {config.openTime} - {config.closeTime}
              </small>
            </div>
            <h1>{config.heroMessage}</h1>
            <p style={{ color: 'var(--muted)', maxWidth: 620 }}>
              Descubre un catálogo curado de productos listos para entrega. Combos,
              ofertas y un carrito que prepara tu pedido para WhatsApp.
            </p>
          </div>
          <div className="banner">
            <div style={{ fontWeight: 700 }}>Ofertas relámpago activas</div>
            <div style={{ color: 'var(--muted)' }}>Actualiza stock y precios en vivo desde el panel Admin.</div>
          </div>
        </div>
      </section>

      <section id="catalogo">
        <div className="section-title">
          <h2>Catálogo</h2>
          <div className="badge">{displayedProducts.length} productos</div>
        </div>

        <div className="filters">
          <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
          <select value={tagFilter} onChange={(e) => setTagFilter(e.target.value)}>
            <option value="">Todas las etiquetas</option>
            {baseTags.map((tag) => (
              <option key={tag}>{tag}</option>
            ))}
          </select>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="popularity">Más populares</option>
            <option value="price-asc">Precio: menor a mayor</option>
            <option value="price-desc">Precio: mayor a menor</option>
          </select>
          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={onlyAvailable} onChange={(e) => setOnlyAvailable(e.target.checked)} />
            Solo disponibles
          </label>
        </div>

        <div className="grid" style={{ alignItems: 'start' }}>
          <div className="list-container">
            <FixedSizeList
              height={listHeight}
              itemCount={displayedProducts.length}
              itemSize={180}
              width={'100%'}
            >
              {({ index, style }) => {
                const product = displayedProducts[index];
                return (
                  <div style={{ ...style, padding: 12 }}>
                    <div className="card product-card">
                      <div className="product-media">
                        <img src={product.image} alt={product.name} loading="lazy" />
                        {!product.available && (
                          <div
                            style={{
                              position: 'absolute',
                              inset: 0,
                              background: 'rgba(15,23,42,0.6)',
                              color: '#fff',
                              display: 'grid',
                              placeItems: 'center',
                              fontWeight: 700,
                            }}
                          >
                            No disponible
                          </div>
                        )}
                      </div>
                      <div className="flex-between">
                        <div>
                          <div style={{ fontWeight: 700 }}>{product.name}</div>
                          <small style={{ color: 'var(--muted)' }}>{product.category}</small>
                        </div>
                        <div className="badge">Stock: {product.stock}</div>
                      </div>
                      <div className="price">{currency(product.price)}</div>
                      <div className="tags">
                        {product.tags.map((tag) => (
                          <span className="badge" key={tag}>
                            #{tag}
                          </span>
                        ))}
                      </div>
                      <div className="flex-between">
                        <small style={{ color: 'var(--muted)' }}>{product.description}</small>
                        <button className="button primary" disabled={!product.available}
                          onClick={() => addToCart(product)}>
                          Añadir
                        </button>
                      </div>
                    </div>
                  </div>
                );
              }}
            </FixedSizeList>
          </div>

          <div className="card cart" id="carrito">
            <div className="section-title" style={{ marginTop: 0 }}>
              <h3>Carrito</h3>
              <div className="badge">{cart.items.length} items</div>
            </div>
            <div>
              {cart.items.length === 0 && <p style={{ color: 'var(--muted)' }}>Agrega productos para continuar.</p>}
              {cart.items.map((item) => {
                const product = products.find((p) => p.id === item.id);
                if (!product) return null;
                return (
                  <div className="cart-item" key={item.id}>
                    <div>
                      <div style={{ fontWeight: 700 }}>{product.name}</div>
                      <small style={{ color: 'var(--muted)' }}>{currency(product.price)}</small>
                    </div>
                    <div className="cart-actions">
                      <button className="button" onClick={() => updateCart(item.id, item.quantity - 1)}>-</button>
                      <div>{item.quantity}</div>
                      <button
                        className="button"
                        onClick={() => updateCart(item.id, Math.min(item.quantity + 1, product.stock))}
                      >
                        +
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            <div style={{ marginTop: 12 }}>
              <label>Nota</label>
              <textarea
                rows={2}
                value={cart.note}
                onChange={(e) => setCart({ ...cart, note: e.target.value })}
                placeholder="Instrucciones para el repartidor"
              />
            </div>
            <div style={{ marginTop: 12 }}>
              <label>Dirección de entrega</label>
              <input
                value={cart.address}
                onChange={(e) => setCart({ ...cart, address: e.target.value })}
                placeholder="Calle, número, referencia"
              />
            </div>
            <div className="flex-between" style={{ marginTop: 12 }}>
              <strong>Total</strong>
              <strong>{currency(cartTotal())}</strong>
            </div>
            <a
              className="button primary"
              style={{ marginTop: 12, textAlign: 'center', display: 'block' }}
              href={`https://wa.me/${config.whatsapp}?text=${whatsappMessage()}`}
              target="_blank"
              rel="noreferrer"
            >
              Enviar pedido por WhatsApp
            </a>
          </div>
        </div>
      </section>

      <section>
        <div className="section-title">
          <h2>Ofertas del día</h2>
          <div className="badge">Personaliza en Admin</div>
        </div>
        <div className="grid">
          {offers.map((offer) => (
            <div className="card offer-card" key={offer.id}>
              <div>
                <div style={{ fontWeight: 700 }}>{offer.title}</div>
                <small style={{ color: 'var(--muted)' }}>{offer.description}</small>
              </div>
              <div>
                <div className="price">{currency(offer.price)}</div>
                <span className="badge">{offer.active ? 'Activa' : 'Inactiva'}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <div className="section-title">
          <h2>Combos</h2>
          <div className="badge">Con temporizador</div>
        </div>
        <div className="grid">
          {combos.map((combo) => {
            const expiresAt = combo.durationMinutes
              ? combo.startsAt + combo.durationMinutes * 60000
              : null;
            const remaining = expiresAt ? Math.max(0, expiresAt - Date.now()) : null;
            const minutes = remaining ? Math.floor(remaining / 60000) : null;
            return (
              <div className="card combo-card" key={combo.id}>
                <div>
                  <div style={{ fontWeight: 700 }}>{combo.title}</div>
                  <small style={{ color: 'var(--muted)' }}>{combo.items}</small>
                  {expiresAt && (
                    <div className="badge">Expira en {minutes} min</div>
                  )}
                </div>
                <div>
                  <div className="price">{currency(combo.price)}</div>
                  <span className="badge">{combo.active ? 'Activo' : 'Pausado'}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section id="contacto" className="card" style={{ marginTop: 24 }}>
        <div className="section-title" style={{ marginTop: 0 }}>
          <h2>Contacto y ubicación</h2>
          <div className="badge">Atención inmediata</div>
        </div>
        <div className="grid">
          <div>
            <div style={{ fontWeight: 700 }}>WhatsApp</div>
            <a href={`https://wa.me/${config.whatsapp}`} target="_blank" rel="noreferrer">{config.whatsapp}</a>
            <p style={{ color: 'var(--muted)' }}>Botón flotante de soporte listo para usar.</p>
          </div>
          <div>
            <div style={{ fontWeight: 700 }}>Dirección</div>
            <p style={{ margin: 0 }}>{config.address}</p>
            <a className="button" href={config.mapLink} target="_blank" rel="noreferrer">
              Ver en Google Maps
            </a>
          </div>
        </div>
      </section>

      <AdminPanel
        isAdmin={isAdmin}
        pinInput={pinInput}
        setPinInput={setPinInput}
        handleAdminLogin={handleAdminLogin}
        config={config}
        setConfig={setConfig}
        products={products}
        upsertProduct={upsertProduct}
        offers={offers}
        setOffers={setOffers}
        addOffer={addOffer}
        combos={combos}
        setCombos={setCombos}
        addCombo={addCombo}
        regenerateCatalog={regenerateCatalog}
      />

      <footer>
        <div style={{ fontWeight: 700 }}>Información</div>
        <div style={{ color: 'var(--muted)' }}>
          Catálogo virtual con persistencia local. Ajusta colores, horarios y datos de contacto desde el panel Admin.
        </div>
      </footer>

      <div className="support-icon" title="Soporte flotante">
        💬
      </div>
    </div>
  );
}

function AdminPanel({
  isAdmin,
  pinInput,
  setPinInput,
  handleAdminLogin,
  config,
  setConfig,
  products,
  upsertProduct,
  offers,
  setOffers,
  addOffer,
  combos,
  setCombos,
  addCombo,
  regenerateCatalog,
}) {
  const [productForm, setProductForm] = useState({
    id: '',
    name: '',
    price: 0,
    category: categories[0],
    image: '',
    stock: 0,
    available: true,
    tags: 'Nuevo,Popular',
    description: '',
  });
  const [offerForm, setOfferForm] = useState({ title: '', description: '', price: 0, active: true });
  const [comboForm, setComboForm] = useState({ title: '', items: '', price: 0, durationMinutes: 0, active: true });

  function submitProduct(e) {
    e.preventDefault();
    const entry = {
      ...productForm,
      id: productForm.id || `prod-${products.length + 1}`,
      price: Number(productForm.price),
      stock: Number(productForm.stock),
      tags: productForm.tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      available: Boolean(productForm.available),
    };
    if (entry.price < 0 || entry.stock < 0) return alert('Sin precios o stock negativos');
    upsertProduct(entry);
    setProductForm({
      id: '',
      name: '',
      price: 0,
      category: categories[0],
      image: '',
      stock: 0,
      available: true,
      tags: 'Nuevo,Popular',
      description: '',
    });
  }

  function quickUpdate(productId, field, value) {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    if ((field === 'price' || field === 'stock') && value < 0) return;
    upsertProduct({ ...product, [field]: value });
  }

  return (
    <section className="admin-panel" id="admin">
      <div className="section-title" style={{ marginTop: 0 }}>
        <h2>Panel Admin</h2>
        {!isAdmin && <div className="badge">PIN requerido</div>}
      </div>
      {!isAdmin ? (
        <div className="grid">
          <div className="card">
            <div style={{ fontWeight: 700 }}>Acceso</div>
            <p style={{ color: 'var(--muted)' }}>Introduce el PIN configurado para editar.</p>
            <div className="flex-between">
              <input value={pinInput} onChange={(e) => setPinInput(e.target.value)} placeholder="PIN" />
              <button className="button primary" onClick={handleAdminLogin}>
                Entrar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="admin-grid">
          <fieldset>
            <legend>Configuración general</legend>
            <label>Nombre</label>
            <input
              value={config.storeName}
              onChange={(e) => setConfig({ ...config, storeName: e.target.value })}
            />
            <label>WhatsApp</label>
            <input value={config.whatsapp} onChange={(e) => setConfig({ ...config, whatsapp: e.target.value })} />
            <label>Dirección</label>
            <input value={config.address} onChange={(e) => setConfig({ ...config, address: e.target.value })} />
            <label>Mapa</label>
            <input value={config.mapLink} onChange={(e) => setConfig({ ...config, mapLink: e.target.value })} />
            <label>Mensaje hero</label>
            <input value={config.heroMessage}
              onChange={(e) => setConfig({ ...config, heroMessage: e.target.value })} />
            <div className="flex-between" style={{ marginTop: 8 }}>
              <div>
                <label>Abre</label>
                <input
                  type="time"
                  value={config.openTime}
                  onChange={(e) => setConfig({ ...config, openTime: e.target.value })}
                />
              </div>
              <div>
                <label>Cierra</label>
                <input
                  type="time"
                  value={config.closeTime}
                  onChange={(e) => setConfig({ ...config, closeTime: e.target.value })}
                />
              </div>
            </div>
            <div className="flex-between" style={{ marginTop: 10 }}>
              <input
                placeholder="Nuevo PIN"
                onChange={(e) => setConfig({ ...config, pin: e.target.value })}
                value={config.pin}
              />
              <button className="button">Guardar PIN</button>
            </div>
            <button className="button primary" style={{ marginTop: 10 }} onClick={regenerateCatalog}>
              Generar/Recargar catálogo automático
            </button>
          </fieldset>

          <fieldset>
            <legend>Crear/editar producto</legend>
            <form onSubmit={submitProduct} className="grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <input
                placeholder="ID (opcional)"
                value={productForm.id}
                onChange={(e) => setProductForm({ ...productForm, id: e.target.value })}
              />
              <input
                required
                placeholder="Nombre"
                value={productForm.name}
                onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
              />
              <input
                type="number"
                required
                min="0"
                step="0.01"
                placeholder="Precio"
                value={productForm.price}
                onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
              />
              <input
                type="number"
                required
                min="0"
                placeholder="Stock"
                value={productForm.stock}
                onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
              />
              <select
                value={productForm.category}
                onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
              >
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <input
                placeholder="Imagen (URL)"
                value={productForm.image}
                onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
              />
              <input
                placeholder="Etiquetas separadas por coma"
                value={productForm.tags}
                onChange={(e) => setProductForm({ ...productForm, tags: e.target.value })}
              />
              <input
                placeholder="Descripción"
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
              />
              <label style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={productForm.available}
                  onChange={(e) => setProductForm({ ...productForm, available: e.target.checked })}
                />
                Disponible
              </label>
              <button className="button primary" type="submit" style={{ gridColumn: 'span 2' }}>
                Guardar producto
              </button>
            </form>
          </fieldset>

          <fieldset>
            <legend>Editor rápido precio/stock</legend>
            <div style={{ maxHeight: 260, overflow: 'auto', display: 'grid', gap: 8 }}>
              {products.slice(0, 30).map((p) => (
                <div key={p.id} className="flex-between">
                  <div>
                    <div style={{ fontWeight: 700 }}>{p.name}</div>
                    <small style={{ color: 'var(--muted)' }}>{p.category}</small>
                  </div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <input
                      type="number"
                      min="0"
                      style={{ width: 90 }}
                      value={p.price}
                      onChange={(e) => quickUpdate(p.id, 'price', Number(e.target.value))}
                    />
                    <input
                      type="number"
                      min="0"
                      style={{ width: 80 }}
                      value={p.stock}
                      onChange={(e) => quickUpdate(p.id, 'stock', Number(e.target.value))}
                    />
                  </div>
                </div>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend>Ofertas</legend>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (offerForm.price < 0) return alert('Precio inválido');
                addOffer({
                  ...offerForm,
                  price: Number(offerForm.price),
                });
                setOfferForm({ title: '', description: '', price: 0, active: true });
              }}
              style={{ display: 'grid', gap: 8 }}
            >
              <input
                placeholder="Título"
                value={offerForm.title}
                onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
              />
              <input
                placeholder="Descripción"
                value={offerForm.description}
                onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
              />
              <input
                type="number"
                min="0"
                placeholder="Precio"
                value={offerForm.price}
                onChange={(e) => setOfferForm({ ...offerForm, price: e.target.value })}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={offerForm.active}
                  onChange={(e) => setOfferForm({ ...offerForm, active: e.target.checked })}
                />
                Activa
              </label>
              <button className="button primary" type="submit">
                Agregar oferta
              </button>
              <div style={{ marginTop: 8 }}>
                {offers.map((o) => (
                  <div key={o.id} className="flex-between">
                    <div>{o.title}</div>
                    <button
                      className="button"
                      onClick={() => setOffers(offers.filter((of) => of.id !== o.id))}
                      type="button"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            </form>
          </fieldset>

          <fieldset>
            <legend>Combos</legend>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (comboForm.price < 0 || comboForm.durationMinutes < 0) return alert('Datos inválidos');
                addCombo({
                  ...comboForm,
                  price: Number(comboForm.price),
                  durationMinutes: Number(comboForm.durationMinutes),
                });
                setComboForm({ title: '', items: '', price: 0, durationMinutes: 0, active: true });
              }}
              style={{ display: 'grid', gap: 8 }}
            >
              <input
                placeholder="Título"
                value={comboForm.title}
                onChange={(e) => setComboForm({ ...comboForm, title: e.target.value })}
              />
              <input
                placeholder="Items"
                value={comboForm.items}
                onChange={(e) => setComboForm({ ...comboForm, items: e.target.value })}
              />
              <input
                type="number"
                min="0"
                placeholder="Precio"
                value={comboForm.price}
                onChange={(e) => setComboForm({ ...comboForm, price: e.target.value })}
              />
              <input
                type="number"
                min="0"
                placeholder="Duración en minutos"
                value={comboForm.durationMinutes}
                onChange={(e) => setComboForm({ ...comboForm, durationMinutes: e.target.value })}
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="checkbox"
                  checked={comboForm.active}
                  onChange={(e) => setComboForm({ ...comboForm, active: e.target.checked })}
                />
                Activo
              </label>
              <button className="button primary" type="submit">
                Agregar combo
              </button>
              <div style={{ marginTop: 8 }}>
                {combos.map((c) => (
                  <div key={c.id} className="flex-between">
                    <div>{c.title}</div>
                    <button
                      className="button"
                      onClick={() => setCombos(combos.filter((co) => co.id !== c.id))}
                      type="button"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>
            </form>
          </fieldset>
        </div>
      )}
    </section>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App />);
