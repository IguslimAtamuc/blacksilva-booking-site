import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Bell,
  CalendarDays,
  Check,
  Clock,
  CreditCard,
  Mail,
  Package,
  RefreshCw,
  Scissors,
  Search,
  ShoppingBag,
  ShieldCheck,
  UserRound,
  Users,
} from 'lucide-react';
import {
  buildCalendarUrl,
  displayDate,
  displayLongDate,
  formatMoney,
  getBookingTotal,
  getNextOpenDays,
  getProduct,
  getShopProducts,
  getService,
  getStylist,
  getTimeSlots,
} from './booking.js';
import { products, salon, services, stylists } from './data.js';

const emptyClient = { name: '', phone: '', email: '', notes: '' };

const initialSelection = {
  hairLengthId: '',
  serviceId: 'classic-skin-fade-scissors-top',
  stylistId: 'eduard',
  date: '',
  time: '',
  client: emptyClient,
  protection: true,
  productId: 'none',
  paymentMethod: 'salon',
  source: 'client',
};

const hairLengthOptions = [
  {
    id: 'short-soft',
    label: 'Very short',
    detail: 'Closest to a pixie or short soft shape.',
    image: '/images/hair-lengths/4.png',
    serviceId: 'classic-fade-no-skin-fade',
  },
  {
    id: 'bob',
    label: 'Bob length',
    detail: 'Closest to chin length or a compact bob.',
    image: '/images/hair-lengths/5.png',
    serviceId: 'ladys-haircut-medium-short',
  },
  {
    id: 'medium-classic',
    label: 'Medium short',
    detail: 'Closest to medium top length with clean sides.',
    image: '/images/hair-lengths/2.png',
    serviceId: 'elegant-scissors-haircut-only',
  },
  {
    id: 'short-fade',
    label: 'Short fade',
    detail: 'Closest to a short crop, fade, or tight sides.',
    image: '/images/hair-lengths/1.png',
    serviceId: 'classic-skin-fade-scissors-top',
  },
  {
    id: 'long-layered',
    label: 'Long layered',
    detail: 'Closest to shoulder length or longer layers.',
    image: '/images/hair-lengths/6.png',
    serviceId: 'ladys-haircut-long-hair',
  },
  {
    id: 'long-flow',
    label: 'Long flow',
    detail: 'Closest to long hair past the neck or shoulders.',
    image: '/images/hair-lengths/3.png',
    serviceId: 'ladys-haircut-long-hair',
  },
];

const statuses = [
  { id: 'confirmed', label: 'Confirmed' },
  { id: 'completed', label: 'Completed' },
  { id: 'cancelled', label: 'Cancelled' },
  { id: 'no-show', label: 'No-show' },
];

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

function loadLocalJson(key, fallback) {
  try {
    const saved = window.localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch {
    return fallback;
  }
}

function saveLocalJson(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

const paymentOptions = [
  { id: 'salon', label: 'Pay at the salon', detail: 'Your booking is confirmed now, and you pay at reception.' },
  { id: 'card-demo', label: 'Card demo', detail: 'Preview a card payment flow. Stripe can be connected with live keys.' },
  { id: 'deposit', label: 'Deposit ready', detail: 'Prepared for online deposits when Stripe is connected.' },
];

function getPaymentLabel(method = 'salon') {
  return paymentOptions.find((option) => option.id === method)?.label || 'Pay at the salon';
}

function getBookingDateTime(booking) {
  return new Date(`${booking.date}T${booking.time || '00:00'}:00`).getTime();
}

function getCustomers(bookings) {
  const byEmail = new Map();
  bookings.forEach((booking) => {
    const email = booking.client?.email || `phone:${booking.client?.phone || booking.id}`;
    const current = byEmail.get(email) || {
      name: booking.client?.name || 'Client',
      email: booking.client?.email || '-',
      phone: booking.client?.phone || '-',
      bookings: 0,
      spent: 0,
      lastVisit: booking.date,
    };
    current.bookings += 1;
    current.spent += getBookingTotal(booking);
    if (getBookingDateTime(booking) > getBookingDateTime({ date: current.lastVisit, time: '00:00' })) {
      current.lastVisit = booking.date;
    }
    byEmail.set(email, current);
  });
  return [...byEmail.values()].sort((a, b) => b.spent - a.spent);
}

async function apiFetch(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.message || 'Cererea nu a reusit.');
  }
  return payload;
}

function PhoneFrame({ app, children }) {
  return (
    <div className={cx('phone-stage', `${app}-stage`)}>
      <div className="phone-frame">
        <div className="phone-island" />
        <div className="statusbar">
          <span>09:41</span>
          <span className="status-dots">5G 100%</span>
        </div>
        <div className="app-shell">
          <header className="app-header">
            <a className="mini-brand" href={app === 'admin' ? '/admin' : '/client'}>
              <span>BS</span>
              <strong>{app === 'admin' ? 'BlackSilva Admin' : 'BlackSilva'}</strong>
            </a>
            <a className="swap-link" href={app === 'admin' ? '/client' : '/admin'}>
              {app === 'admin' ? 'Client' : 'Admin'}
            </a>
          </header>
          {children}
        </div>
      </div>
    </div>
  );
}

function AdminShell({ activeTab, setActiveTab, onRefresh, children }) {
  return (
    <div className="tailadmin-app">
      <aside className="tailadmin-sidebar">
        <a className="tailadmin-logo" href="/admin">
          <span>BS</span>
          <strong>BlackSilva</strong>
        </a>
        <p className="tailadmin-section-label">Menu</p>
        <AdminTabs active={activeTab} setActive={setActiveTab} variant="sidebar" />
        <a className="tailadmin-client-link" href="/client">
          Client website
        </a>
      </aside>
      <div className="tailadmin-main">
        <header className="tailadmin-header">
          <div>
            <span>BlackSilva Admin</span>
            <strong>Salon management</strong>
          </div>
          <button type="button" onClick={onRefresh} aria-label="Refresh admin">
            <RefreshCw size={18} />
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

function Launcher() {
  return (
    <PhoneFrame app="client">
      <main className="screen launcher-screen">
        <div className="hero-mark">
          <Scissors size={26} />
        </div>
        <h1>BlackSilva booking system</h1>
        <p>Choose the experience you want to open.</p>
        <div className="launcher-actions">
          <a href="/client">
            <UserRound size={20} />
            Client booking
          </a>
          <a href="/admin">
            <CalendarDays size={20} />
            Salon admin
          </a>
        </div>
      </main>
    </PhoneFrame>
  );
}

function Progress({ step }) {
  return (
    <div className="mobile-progress" aria-label="Booking steps">
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <span key={item} className={item <= step ? 'active' : ''} />
      ))}
    </div>
  );
}

function BigButton({ selected, children, onClick, disabled, className }) {
  return (
    <button
      type="button"
      className={cx('big-button', className, selected && 'selected')}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}

function HairLengthScreen({ selection, setSelection, onSelect }) {
  return (
    <section className="step-screen hair-length-screen">
      <span className="screen-kicker">Step 01</span>
      <h1>Current hair length.</h1>
      <p className="fine-copy">
        Which image is closest to your current hair length? Not the haircut you want, just the length that matches you now.
      </p>
      <div className="hair-length-grid">
        {hairLengthOptions.map((option) => (
          <button
            type="button"
            key={option.id}
            className={cx('hair-length-card', selection.hairLengthId === option.id && 'selected')}
            onClick={() => {
              const service = getService(option.serviceId);
              setSelection((current) => ({
                ...current,
                hairLengthId: option.id,
                serviceId: option.serviceId,
                stylistId: service?.staffIds.includes(current.stylistId) ? current.stylistId : service?.staffIds[0] || current.stylistId,
                time: '',
              }));
              window.setTimeout(onSelect, 260);
            }}
          >
            <span className="hair-image-wrap">
              <img src={option.image} alt="" />
            </span>
            <span>
              <strong>{option.label}</strong>
              <small>{option.detail}</small>
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}

function ServiceScreen({ selection, setSelection }) {
  const clientServices = services
    .filter((service) => service.category !== 'Business')
    .sort((a, b) => b.price - a.price);
  const categories = [...new Set(clientServices.map((service) => service.category))];

  return (
    <section className="step-screen">
      <span className="screen-kicker">Step 02</span>
      <h1>Choose service.</h1>
      <div className="stack-list">
        {categories.map((category) => (
          <div key={category} className="list-group">
            <h2>{category}</h2>
            {clientServices
              .filter((service) => service.category === category)
              .map((service) => (
                <BigButton
                  key={service.id}
                  selected={selection.serviceId === service.id}
                  onClick={() => {
                    const stylistId = service.staffIds.includes(selection.stylistId)
                      ? selection.stylistId
                      : service.staffIds[0];
                    setSelection((current) => ({
                      ...current,
                      serviceId: service.id,
                      stylistId,
                      time: '',
                    }));
                  }}
                >
                  <span>
                    <strong>{service.name}</strong>
                    <small>
                      <em>{service.description}</em>
                    </small>
                  </span>
                  <b>{service.priceLabel || formatMoney(service.price)}</b>
                </BigButton>
              ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function StylistScreen({ selection, setSelection, onSelect }) {
  const service = getService(selection.serviceId);
  const available = stylists.filter((stylist) => stylist.id !== 'chair' && (!service || service.staffIds.includes(stylist.id)));

  return (
    <section className="step-screen">
      <span className="screen-kicker">Step 03</span>
      <h1>Choose your specialist.</h1>
      <div className="stack-list">
        {available.map((stylist) => (
          <BigButton
            key={stylist.id}
            className="stylist-button"
            selected={selection.stylistId === stylist.id}
            onClick={() => {
              setSelection((current) => ({ ...current, stylistId: stylist.id, time: '' }));
              onSelect?.();
            }}
          >
            <span className="avatar">{stylist.initial}</span>
            <span>
              <strong>{stylist.name}</strong>
              <small>{stylist.focus}</small>
            </span>
          </BigButton>
        ))}
      </div>
    </section>
  );
}

function TimeScreen({ selection, setSelection, bookings }) {
  const service = getService(selection.serviceId);
  const days = useMemo(() => getNextOpenDays(14), []);

  useEffect(() => {
    if (!selection.date && days[0]?.key) {
      setSelection((current) => ({ ...current, date: days[0].key }));
    }
  }, [days, selection.date, setSelection]);

  const activeDate = selection.date || days[0]?.key || '';
  const slots = getTimeSlots(activeDate, service?.duration || 45, bookings, selection.stylistId);

  return (
    <section className="step-screen">
      <span className="screen-kicker">Step 04</span>
      <h1>Choose date and time.</h1>
      <div className="day-rail">
        {days.map((day) => (
          <button
            type="button"
            key={day.key}
            className={selection.date === day.key ? 'selected' : ''}
            onClick={() => setSelection((current) => ({ ...current, date: day.key, time: '' }))}
          >
            <strong>{displayDate(day.key)}</strong>
            <span>{day.schedule.start}-{day.schedule.end}</span>
          </button>
        ))}
      </div>
      <div className="slot-grid">
        {slots.map((slot) => (
          <button
            type="button"
            key={slot.time}
            className={selection.time === slot.time ? 'selected' : ''}
            disabled={!slot.available}
            onClick={() => setSelection((current) => ({ ...current, time: slot.time }))}
          >
            {slot.time}
          </button>
        ))}
      </div>
    </section>
  );
}

function ClientScreen({ selection, setSelection }) {
  const updateClient = (field, value) => {
    setSelection((current) => ({
      ...current,
      client: { ...current.client, [field]: value },
    }));
  };

  return (
    <section className="step-screen">
      <span className="screen-kicker">Step 04</span>
      <h1>Your details.</h1>
      <div className="form-stack">
        <label>
          Full name
          <input value={selection.client.name} onChange={(event) => updateClient('name', event.target.value)} />
        </label>
        <label>
          Phone
          <input value={selection.client.phone} onChange={(event) => updateClient('phone', event.target.value)} />
        </label>
        <label>
          Confirmation email
          <input value={selection.client.email} onChange={(event) => updateClient('email', event.target.value)} />
        </label>
        <label>
          Notes
          <textarea value={selection.client.notes} onChange={(event) => updateClient('notes', event.target.value)} />
        </label>
      </div>
      <div className="addons-panel">
        <button
          type="button"
          className={selection.protection ? 'selected' : ''}
          onClick={() => setSelection((current) => ({ ...current, protection: !current.protection }))}
        >
          <ShieldCheck size={20} />
          <span>
            <strong>Booking Protection</strong>
            <small>+59 kr for flexible rescheduling.</small>
          </span>
        </button>
        <label>
          Product
          <select
            value={selection.productId}
            onChange={(event) => setSelection((current) => ({ ...current, productId: event.target.value }))}
          >
            {products.map((product) => (
              <option key={product.id} value={product.id}>
                {product.name} {product.price ? `+ ${product.price} kr` : ''}
              </option>
            ))}
          </select>
        </label>
      </div>
    </section>
  );
}

function BookingShopScreen({ selection, setSelection }) {
  const shopProducts = getShopProducts();
  const productChoices = [{ id: 'none', name: 'No product', price: 0, stock: 0, category: 'Optional' }, ...shopProducts];

  return (
    <section className="step-screen booking-shop-screen">
      <span className="screen-kicker">Step 05</span>
      <h1>Add products?</h1>
      <p className="fine-copy">Choose a product if you want it prepared with your booking. You can also skip this step.</p>
      <div className="shop-choice-grid">
        {productChoices.map((product) => (
          <button
            type="button"
            key={product.id}
            className={cx('shop-choice-card', selection.productId === product.id && 'selected')}
            onClick={() => setSelection((current) => ({ ...current, productId: product.id }))}
          >
            <span>
              <small>{product.category}</small>
              <strong>{product.name}</strong>
              <em>{product.stock ? `${product.stock} in stock` : product.id === 'none' ? 'Skip shop' : 'Ask in salon'}</em>
            </span>
            <b>{product.price ? formatMoney(product.price) : '0 kr'}</b>
          </button>
        ))}
      </div>
    </section>
  );
}

function SummaryRows({ booking }) {
  const service = getService(booking.serviceId);
  const stylist = getStylist(booking.stylistId);
  const product = getProduct(booking.productId);
  const hairLength = hairLengthOptions.find((option) => option.id === booking.hairLengthId);

  return (
    <dl className="summary-rows">
      <div>
        <dt>Current length</dt>
        <dd>{hairLength?.label || '-'}</dd>
      </div>
      <div>
        <dt>Service</dt>
        <dd>{service?.name || '-'}</dd>
      </div>
      <div>
        <dt>Specialist</dt>
        <dd>{stylist?.name || '-'}</dd>
      </div>
      <div>
        <dt>Date</dt>
        <dd>{booking.date ? displayLongDate(booking.date) : '-'}</dd>
      </div>
      <div>
        <dt>Time</dt>
        <dd>{booking.time || '-'}</dd>
      </div>
      <div>
        <dt>Extra</dt>
        <dd>
          {booking.protection && booking.serviceId !== 'booking-protection' ? 'Protection' : 'No protection'}
          {product?.price ? ` + ${product.name}` : ''}
        </dd>
      </div>
      <div>
        <dt>Payment</dt>
        <dd>{getPaymentLabel(booking.payment?.method || booking.paymentMethod)}</dd>
      </div>
    </dl>
  );
}

function ReviewScreen({ selection, setSelection }) {
  return (
    <section className="step-screen">
      <span className="screen-kicker">Step 06</span>
      <h1>Ready to book.</h1>
      <div className="review-card">
        <SummaryRows booking={selection} />
        <div className="total-row">
          <span>Estimated total</span>
          <strong>{formatMoney(getBookingTotal(selection))}</strong>
        </div>
      </div>
      <div className="payment-options">
        {paymentOptions.map((option) => (
          <button
            type="button"
            key={option.id}
            className={selection.paymentMethod === option.id ? 'selected' : ''}
            onClick={() => setSelection((current) => ({ ...current, paymentMethod: option.id }))}
          >
            <CreditCard size={18} />
            <span>
              <strong>{option.label}</strong>
              <small>{option.detail}</small>
            </span>
          </button>
        ))}
      </div>
      <p className="fine-copy">
        You will receive a confirmation email after the booking is saved in the system.
        <br />
        <span>5.0 ★ · 847 verified reviews</span>
        <br />
        <span>23 bookings this week</span>
        <br />
        <span>⚑ Only 3 spots remaining this week</span>
        <br />
        <span>
          <span aria-hidden="true" style={{ animation: 'splashPulse 1.6s ease-in-out infinite', color: 'var(--success)', display: 'inline-block' }}>
            ●
          </span>{' '}
          Live — Weekend slots filling fast
        </span>
        <br />
        <em>Imagine walking into your next meeting or date knowing you look exactly right.</em>
        <br />
        <span>Not satisfied? Come back within 7 days — free of charge.</span>
      </p>
    </section>
  );
}

function ConfirmationScreen({ booking, email, onReset }) {
  return (
    <main className="screen confirmation-screen">
      <span className="success-badge">
        <Check size={26} />
      </span>
      <h1>Booking confirmed.</h1>
      <p>
        Your code is <strong>{booking.id}</strong>. The confirmation email{' '}
        {email?.sent ? 'has been sent.' : 'is prepared, but Resend is not configured yet.'}
      </p>
      <div className="review-card">
        <SummaryRows booking={booking} />
      </div>
      <div className="confirmation-actions">
        <a href={buildCalendarUrl(booking)} download={`${booking.id}.ics`}>
          Calendar + 1h alert
        </a>
        <button type="button" onClick={onReset}>
          New booking
        </button>
      </div>
    </main>
  );
}

function ClientQuickNav({ view, setView }) {
  const items = [
    { id: 'book', label: 'Booking', icon: <Scissors size={19} /> },
    { id: 'calendar', label: 'Calendar', icon: <CalendarDays size={19} /> },
    { id: 'shop', label: 'Shop', icon: <ShoppingBag size={19} /> },
    { id: 'profile', label: 'Account', icon: <UserRound size={19} /> },
  ];

  return (
    <div className="app-nav-grid">
      {items.map((item) => (
        <button
          type="button"
          key={item.id}
          className={view === item.id ? 'selected' : ''}
          onClick={() => setView(item.id)}
        >
          {item.icon}
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}

function ProfileScreen({ profile, setProfile, applyProfile }) {
  const updateProfile = (field, value) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };

  return (
    <section className="step-screen feature-screen">
      <span className="screen-kicker">Client login</span>
      <h1>Your profile.</h1>
      <p className="fine-copy">We save your details locally for faster booking and your BlackSilva calendar.</p>
      <div className="form-stack">
        <label>
          Full name
          <input value={profile.name} onChange={(event) => updateProfile('name', event.target.value)} />
        </label>
        <label>
          Phone
          <input value={profile.phone} onChange={(event) => updateProfile('phone', event.target.value)} />
        </label>
        <label>
          Email login
          <input value={profile.email} onChange={(event) => updateProfile('email', event.target.value)} />
        </label>
      </div>
      <button type="button" className="wide-action" onClick={applyProfile}>
        <UserRound size={18} />
        Save profile
      </button>
    </section>
  );
}

function ClientSplash({ opening, onContinue }) {
  return (
    <div className="phone-stage client-stage client-splash-stage">
      <main className={cx('client-splash', opening && 'opening')} aria-label="BlackSilva entry">
        <div className="splash-content">
          <button type="button" className={cx('splash-button', opening && 'opening')} onClick={onContinue}>
            <span>BS</span>
          </button>
          <strong>BLACK SILVA</strong>
          <small>press to continue</small>
        </div>
      </main>
    </div>
  );
}

function ClientAuthGate({ mode, setMode, profile, setProfile, onSubmit }) {
  const isCreate = mode === 'create';
  const updateProfile = (field, value) => {
    setProfile((current) => ({ ...current, [field]: value }));
  };
  const canSubmit = isCreate ? Boolean(profile.name && profile.phone && profile.email) : Boolean(profile.email);

  return (
    <main className="screen client-screen auth-screen">
      <section className="app-hero auth-hero">
        <div>
          <span className="screen-kicker">BlackSilva access</span>
          <h1>{isCreate ? 'Create account.' : 'Login.'}</h1>
          <p>{isCreate ? 'Create your profile, then start booking.' : 'Enter your email to access your booking.'}</p>
        </div>
        <span className="hero-icon hero-lettermark">BS</span>
      </section>

      <div className="app-nav-grid auth-toggle">
        <button type="button" className={mode === 'login' ? 'selected' : ''} onClick={() => setMode('login')}>
          <UserRound size={19} />
          <span>Login</span>
        </button>
        <button type="button" className={mode === 'create' ? 'selected' : ''} onClick={() => setMode('create')}>
          <Check size={19} />
          <span>Create Account</span>
        </button>
      </div>

      <section className="step-screen feature-screen auth-card">
        <span className="screen-kicker">{isCreate ? 'New client' : 'Client login'}</span>
        <h1>{isCreate ? 'New profile.' : 'Welcome back.'}</h1>
        <div className="form-stack">
          {isCreate && (
            <>
              <label>
                Full name
                <input value={profile.name} onChange={(event) => updateProfile('name', event.target.value)} />
              </label>
              <label>
                Phone
                <input value={profile.phone} onChange={(event) => updateProfile('phone', event.target.value)} />
              </label>
            </>
          )}
          <label>
            Email
            <input value={profile.email} onChange={(event) => updateProfile('email', event.target.value)} />
          </label>
        </div>
        <button type="button" className="wide-action" disabled={!canSubmit} onClick={onSubmit}>
          <UserRound size={18} />
          {isCreate ? 'Create Account' : 'Login'}
        </button>
      </section>
    </main>
  );
}

function ClientCalendarScreen({ profile, bookings, loading, error, onLoad }) {
  const upcoming = bookings.filter((booking) => booking.status !== 'cancelled');

  return (
    <section className="step-screen feature-screen">
      <span className="screen-kicker">Client calendar</span>
      <h1>Your appointments.</h1>
      {!profile.email ? (
        <div className="empty-state">Add your email at login to see saved appointments.</div>
      ) : (
        <>
          <button type="button" className="wide-action" onClick={onLoad}>
            <RefreshCw size={18} />
            Refresh calendar
          </button>
          {error && <div className="error-box">{error}</div>}
          {loading && <div className="empty-state">Loading...</div>}
          {!loading && upcoming.length === 0 && <div className="empty-state">There are no active appointments for this email.</div>}
          <div className="compact-list">
            {upcoming.map((booking) => {
              const service = getService(booking.serviceId);
              return (
                <article className="mini-card" key={booking.id}>
                  <div>
                    <strong>{service?.name || 'Booking'}</strong>
                    <span>
                      {displayDate(booking.date)} at {booking.time}
                    </span>
                  </div>
                  <a href={buildCalendarUrl(booking)} download={`${booking.id}.ics`}>
                    <Bell size={16} />
                    Alert
                  </a>
                </article>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}

function ShopScreen({ selection, setSelection, goToBooking }) {
  const [cart, setCart] = useState(() => loadLocalJson('bs-shop-cart', []));
  const [message, setMessage] = useState('');
  const shopProducts = getShopProducts();
  const cartTotal = cart.reduce((sum, id) => sum + (getProduct(id)?.price || 0), 0);

  const addToCart = (id) => {
    const nextCart = [...cart, id];
    setCart(nextCart);
    saveLocalJson('bs-shop-cart', nextCart);
    setMessage('Product added to cart.');
  };

  return (
    <section className="step-screen feature-screen">
      <span className="screen-kicker">Online shop</span>
      <h1>Stock salon.</h1>
      <p className="fine-copy">Choose products for your cart or attach a product directly to your next booking.</p>
      <div className="shop-list">
        {shopProducts.map((product) => (
          <article className="product-card" key={product.id}>
            <div>
              <span>{product.category}</span>
              <strong>{product.name}</strong>
              <small>{product.stock} in stock</small>
            </div>
            <b>{formatMoney(product.price)}</b>
            <div className="product-actions">
              <button type="button" onClick={() => addToCart(product.id)}>
                <ShoppingBag size={15} />
                Cart
              </button>
              <button
                type="button"
                className={selection.productId === product.id ? 'selected' : ''}
                onClick={() => {
                  setSelection((current) => ({ ...current, productId: product.id }));
                  goToBooking(3);
                }}
              >
                <Check size={15} />
                Add to booking
              </button>
            </div>
          </article>
        ))}
      </div>
      <div className="cart-summary">
        <span>Online cart demo</span>
        <strong>{formatMoney(cartTotal)}</strong>
        <button
          type="button"
          onClick={() => {
            setMessage('The demo order is ready. Connecting Stripe completes real online payment.');
          }}
        >
          Checkout
        </button>
      </div>
      {message && <div className="empty-state">{message}</div>}
    </section>
  );
}

function ClientApp() {
  const savedProfile = loadLocalJson('bs-client-profile', emptyClient);
  const [view, setView] = useState('book');
  const [step, setStep] = useState(0);
  const [profile, setProfile] = useState(savedProfile);
  const [selection, setSelection] = useState({ ...initialSelection, client: { ...emptyClient, ...savedProfile } });
  const [authMode, setAuthMode] = useState('login');
  const [isClientAuthed, setIsClientAuthed] = useState(
    () => Boolean(savedProfile.email) && window.localStorage.getItem('bs-client-auth') === '1'
  );
  const [bookings, setBookings] = useState([]);
  const [clientBookings, setClientBookings] = useState([]);
  const [clientCalendarLoading, setClientCalendarLoading] = useState(false);
  const [clientCalendarError, setClientCalendarError] = useState('');
  const [confirmed, setConfirmed] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [introComplete, setIntroComplete] = useState(false);
  const [introOpening, setIntroOpening] = useState(false);

  const loadClientBookings = async (email = profile.email) => {
    if (!email) return;
    setClientCalendarLoading(true);
    setClientCalendarError('');
    try {
      const payload = await apiFetch(`/api/client-bookings?email=${encodeURIComponent(email)}`);
      setClientBookings(payload.bookings || []);
    } catch (calendarError) {
      setClientCalendarError(calendarError.message);
    } finally {
      setClientCalendarLoading(false);
    }
  };

  useEffect(() => {
    apiFetch('/api/availability')
      .then((payload) => setBookings(payload.bookings || []))
      .catch(() => setBookings([]));
  }, []);

  useEffect(() => {
    if (profile.email) loadClientBookings(profile.email);
  }, [profile.email]);

  useEffect(() => {
    if (view !== 'book' || step === 0) return undefined;

    const frame = window.requestAnimationFrame(() => {
      document.querySelector('.client-stage .step-screen')?.scrollIntoView({ behavior: 'auto', block: 'start' });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [step, view]);

  const selectedService = getService(selection.serviceId);
  const canContinue = [
    Boolean(selection.hairLengthId),
    Boolean(selection.serviceId),
    Boolean(selection.stylistId && selectedService?.staffIds.includes(selection.stylistId)),
    Boolean(selection.date && selection.time),
    true,
    true,
  ];

  const submit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const payload = await apiFetch('/api/bookings', {
        method: 'POST',
        body: JSON.stringify(selection),
      });
      setConfirmed(payload);
      if (selection.client.email) loadClientBookings(selection.client.email);
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  const applyProfile = () => {
    saveLocalJson('bs-client-profile', profile);
    window.localStorage.setItem('bs-client-auth', '1');
    const fallbackName = profile.name || profile.email?.split('@')[0] || 'Client';
    setSelection((current) => ({
      ...current,
      client: {
        ...current.client,
        name: fallbackName,
        phone: profile.phone || 'Not provided',
        email: profile.email,
      },
    }));
    setIsClientAuthed(true);
    setView('book');
    loadClientBookings(profile.email);
    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
  };

  const goToBooking = (nextStep = step) => {
    setView('book');
    setStep(nextStep);
  };

  const continueFromIntro = () => {
    if (introOpening) return;
    setIntroOpening(true);
    window.setTimeout(() => {
      setIntroComplete(true);
      window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'auto' }));
    }, 680);
  };

  if (!introComplete) {
    return <ClientSplash opening={introOpening} onContinue={continueFromIntro} />;
  }

  if (confirmed?.booking) {
    return (
      <PhoneFrame app="client">
        <ConfirmationScreen
          booking={confirmed.booking}
          email={confirmed.email}
          onReset={() => {
            setConfirmed(null);
            setSelection({ ...initialSelection, client: { ...emptyClient, ...profile } });
            setStep(0);
          }}
        />
      </PhoneFrame>
    );
  }

  if (!isClientAuthed) {
    return (
      <PhoneFrame app="client">
        <ClientAuthGate
          mode={authMode}
          setMode={setAuthMode}
          profile={profile}
          setProfile={setProfile}
          onSubmit={applyProfile}
        />
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame app="client">
      <main className="screen client-screen">
        <section className="app-hero">
          <div>
            <span className="screen-kicker">Hair Salon</span>
            <h1>The First Impression Never Repeats.</h1>
            <p>
              Leave looking exactly how you want to be perceived.
              <br />
              <span>{salon.hours}</span>
              <br />
              <span>Most wanted: Skin Fade / Elegant Scissors / Lady's Long Hair</span>
            </p>
          </div>
          <span className="hero-icon hero-lettermark">BS</span>
        </section>

        {view === 'book' && (
          <>
            <Progress step={step} />

            {step === 0 && (
              <HairLengthScreen selection={selection} setSelection={setSelection} onSelect={() => setStep(1)} />
            )}
            {step === 1 && <ServiceScreen selection={selection} setSelection={setSelection} />}
            {step === 2 && (
              <StylistScreen selection={selection} setSelection={setSelection} onSelect={() => setStep(3)} />
            )}
            {step === 3 && <TimeScreen selection={selection} setSelection={setSelection} bookings={bookings} />}
            {step === 4 && <BookingShopScreen selection={selection} setSelection={setSelection} />}
            {step === 5 && <ReviewScreen selection={selection} setSelection={setSelection} />}

            {error && <div className="error-box">{error}</div>}

            <footer className="app-footer">
              <button
                type="button"
                className="footer-secondary"
                disabled={step === 0 || submitting}
                onClick={() => setStep(step - 1)}
              >
                <ArrowLeft size={18} />
              </button>
              {step < 5 ? (
                <button type="button" className="footer-primary" disabled={!canContinue[step]} onClick={() => setStep(step + 1)}>
                  Continue
                  <ArrowRight size={18} />
                </button>
              ) : (
                <button type="button" className="footer-primary" disabled={submitting} onClick={submit}>
                  {submitting ? 'Booking...' : 'Book Now'}
                  <Check size={18} />
                </button>
              )}
            </footer>
          </>
        )}

        {view === 'calendar' && (
          <ClientCalendarScreen
            profile={profile}
            bookings={clientBookings}
            loading={clientCalendarLoading}
            error={clientCalendarError}
            onLoad={() => loadClientBookings(profile.email)}
          />
        )}
        {view === 'shop' && <ShopScreen selection={selection} setSelection={setSelection} goToBooking={goToBooking} />}
        {view === 'profile' && <ProfileScreen profile={profile} setProfile={setProfile} applyProfile={applyProfile} />}
      </main>
    </PhoneFrame>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="stat-card">
      {icon}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function AdminBookingCard({ booking, onStatus, onEmail, onReminder }) {
  const service = getService(booking.serviceId);
  const stylist = getStylist(booking.stylistId);
  const emailState = booking.emailStatus?.state || 'unknown';
  const reminderState = booking.reminderStatus?.state || 'unknown';

  return (
    <article className="admin-booking-card">
      <div className="booking-card-top">
        <span className={cx('status-pill', booking.status)}>{booking.status || 'confirmed'}</span>
        <small>{booking.id}</small>
      </div>
      <strong>{booking.client?.name || 'Client'}</strong>
      <p>
        {service?.name} with {stylist?.name}
      </p>
      <div className={cx('email-pill', emailState)}>
        <Mail size={14} />
        <span>{booking.emailStatus?.label || 'Email not verified'}</span>
      </div>
      <div className={cx('email-pill', reminderState)}>
        <Bell size={14} />
        <span>{booking.reminderStatus?.label || 'Reminder not active'}</span>
      </div>
      <div className="booking-meta">
        <span>
          <CalendarDays size={15} />
          {displayDate(booking.date)}
        </span>
        <span>
          <Clock size={15} />
          {booking.time}
        </span>
        <span>
          <Mail size={15} />
          {booking.client?.email}
        </span>
        <span>
          <CreditCard size={15} />
          {getPaymentLabel(booking.payment?.method)} / {booking.payment?.status || 'pending'}
        </span>
      </div>
      <div className="status-actions">
        {statuses.map((status) => (
          <button
            type="button"
            key={status.id}
            className={booking.status === status.id ? 'selected' : ''}
            onClick={() => onStatus(booking.id, status.id)}
          >
            {status.label}
          </button>
        ))}
      </div>
      <button type="button" className="email-action" onClick={() => onEmail(booking.id)}>
        <Mail size={15} />
        Resend email
      </button>
      <button type="button" className="email-action" onClick={() => onReminder(booking.id)}>
        <Bell size={15} />
        Send reminder
      </button>
    </article>
  );
}

function AdminTabs({ active, setActive, variant = 'inline' }) {
  const tabs = [
    { id: 'dashboard', label: 'Summary', icon: <BarChart3 size={18} /> },
    { id: 'calendar', label: 'Calendar', icon: <CalendarDays size={18} /> },
    { id: 'bookings', label: 'Bookings', icon: <Clock size={18} /> },
    { id: 'clients', label: 'Clients', icon: <Users size={18} /> },
    { id: 'stock', label: 'Stock', icon: <Package size={18} /> },
    { id: 'rentals', label: 'Rent Chair', icon: <ShieldCheck size={18} /> },
  ];

  return (
    <div className={cx('admin-tabs', variant === 'sidebar' && 'sidebar-tabs')}>
      {tabs.map((tab) => (
        <button type="button" key={tab.id} className={active === tab.id ? 'selected' : ''} onClick={() => setActive(tab.id)}>
          {tab.icon}
          <span>{tab.label}</span>
        </button>
      ))}
    </div>
  );
}

function AdminDashboard({ bookings }) {
  const completed = bookings.filter((booking) => booking.status === 'completed').length;
  const cancelled = bookings.filter((booking) => booking.status === 'cancelled').length;
  const chairRentals = bookings.filter((booking) => booking.source === 'chair-rental' || booking.serviceId?.includes('chair-rental')).length;
  const productSales = bookings.filter((booking) => getProduct(booking.productId)?.price).length;
  const revenue = bookings
    .filter((booking) => booking.status !== 'cancelled')
    .reduce((sum, booking) => sum + getBookingTotal(booking), 0);
  const serviceCounts = bookings.reduce((acc, booking) => {
    acc[booking.serviceId] = (acc[booking.serviceId] || 0) + 1;
    return acc;
  }, {});
  const bestServiceId = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  return (
    <section className="dashboard-grid">
      <StatCard label="Sales" value={formatMoney(revenue)} icon={<CreditCard size={18} />} />
      <StatCard label="Completed" value={completed} icon={<Check size={18} />} />
      <StatCard label="Cancelled" value={cancelled} icon={<Clock size={18} />} />
      <div className="insight-card">
        <span>Performance summary</span>
        <strong>{bestServiceId ? getService(bestServiceId)?.name : 'Waiting for data'}</strong>
        <small>The most requested service by booking count.</small>
      </div>
      <div className="insight-card">
        <span>Sales summary</span>
        <strong>{productSales} products + {chairRentals} chair rentals</strong>
        <small>Track add-ons, products, and chair rental from the same admin.</small>
      </div>
    </section>
  );
}

function AdminCalendar({ bookings }) {
  const grouped = bookings
    .filter((booking) => booking.status !== 'cancelled')
    .sort((a, b) => getBookingDateTime(a) - getBookingDateTime(b))
    .reduce((acc, booking) => {
      acc[booking.date] = acc[booking.date] || [];
      acc[booking.date].push(booking);
      return acc;
    }, {});

  return (
    <section className="step-screen feature-screen">
      <span className="screen-kicker">Admin calendar</span>
      <h1>Day by day.</h1>
      {Object.keys(grouped).length === 0 && <div className="empty-state">There are no bookings in the calendar.</div>}
      <div className="calendar-list">
        {Object.entries(grouped).map(([date, dayBookings]) => (
          <article className="day-card" key={date}>
            <h2>{displayLongDate(date)}</h2>
            {dayBookings.map((booking) => {
              const service = getService(booking.serviceId);
              return (
                <div className="calendar-row" key={booking.id}>
                  <time>{booking.time}</time>
                  <span>
                    <strong>{booking.client?.name || 'Client'}</strong>
                    <small>{service?.name || 'Booking'} / {booking.client?.phone}</small>
                  </span>
                </div>
              );
            })}
          </article>
        ))}
      </div>
    </section>
  );
}

function CustomersScreen({ bookings }) {
  const customers = getCustomers(bookings);

  return (
    <section className="step-screen feature-screen">
      <span className="screen-kicker">Customers database</span>
      <h1>Client list.</h1>
      <div className="compact-list">
        {customers.map((customer) => (
          <article className="mini-card" key={customer.email}>
            <div>
              <strong>{customer.name}</strong>
              <span>{customer.email}</span>
              <small>{customer.phone}</small>
            </div>
            <b>{formatMoney(customer.spent)}</b>
          </article>
        ))}
      </div>
    </section>
  );
}

function StockScreen({ bookings }) {
  const soldProducts = bookings.reduce((acc, booking) => {
    if (booking.productId && booking.productId !== 'none') {
      acc[booking.productId] = (acc[booking.productId] || 0) + 1;
    }
    return acc;
  }, {});

  return (
    <section className="step-screen feature-screen">
      <span className="screen-kicker">Stock & shop</span>
      <h1>Products.</h1>
      <div className="shop-list">
        {getShopProducts().map((product) => {
          const sold = soldProducts[product.id] || 0;
          return (
            <article className="product-card" key={product.id}>
              <div>
                <span>{product.category}</span>
                <strong>{product.name}</strong>
                <small>{Math.max(product.stock - sold, 0)} available / {sold} sold</small>
              </div>
              <b>{formatMoney(product.price)}</b>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function ChairRentalsScreen({ bookings }) {
  const rentalServices = services.filter((service) => service.category === 'Business');
  const rentalBookings = bookings.filter(
    (booking) => booking.source === 'chair-rental' || booking.serviceId?.includes('chair-rental')
  );

  return (
    <section className="step-screen feature-screen">
      <span className="screen-kicker">Rent chair</span>
      <h1>Chair rental.</h1>
      <p className="fine-copy">The offer and requests for independent barbers or stylists stay inside admin.</p>
      <div className="shop-list">
        {rentalServices.map((service) => (
          <article className="product-card" key={service.id}>
            <div>
              <span>{service.duration} minute</span>
              <strong>{service.name}</strong>
              <small>{service.description}</small>
            </div>
            <b>{formatMoney(service.price)}</b>
          </article>
        ))}
      </div>
      <div className="compact-list">
        {rentalBookings.length === 0 ? <div className="empty-state">There are no rental requests yet.</div> : null}
        {rentalBookings.map((booking) => {
          const service = getService(booking.serviceId);
          return (
            <article className="mini-card" key={booking.id}>
              <div>
                <strong>{booking.client?.name || 'Business client'}</strong>
                <span>
                  {service?.name || 'Chair rental'} / {displayDate(booking.date)} at {booking.time}
                </span>
                <small>{booking.client?.email || booking.client?.phone || booking.id}</small>
              </div>
              <b>{formatMoney(getBookingTotal(booking))}</b>
            </article>
          );
        })}
      </div>
    </section>
  );
}

function AdminApp() {
  const [bookings, setBookings] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [adminCode, setAdminCode] = useState(() => window.localStorage.getItem('bs-admin-code') || '');
  const [codeDraft, setCodeDraft] = useState('');

  const load = async (overrideCode = adminCode) => {
    setLoading(true);
    setError('');
    try {
      const payload = await apiFetch('/api/bookings', {
        headers: overrideCode ? { 'x-admin-code': overrideCode } : {},
      });
      setBookings(payload.bookings || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = bookings.filter((booking) => {
    const statusOk = filter === 'all' || booking.status === filter;
    const text = `${booking.client?.name} ${booking.client?.email} ${booking.client?.phone} ${booking.id}`.toLowerCase();
    return statusOk && text.includes(query.toLowerCase());
  });

  const updateStatus = async (id, status) => {
    setBookings((current) => current.map((booking) => (booking.id === id ? { ...booking, status } : booking)));
    try {
      await apiFetch(`/api/bookings/${id}`, {
        method: 'PATCH',
        headers: adminCode ? { 'x-admin-code': adminCode } : {},
        body: JSON.stringify({ status }),
      });
    } catch (statusError) {
      setError(statusError.message);
      load();
    }
  };

  const resendEmail = async (id) => {
    setError('');
    setBookings((current) =>
      current.map((booking) =>
        booking.id === id
          ? {
              ...booking,
              emailStatus: {
                ...(booking.emailStatus || {}),
                state: 'sending',
                label: 'Sending...',
              },
            }
          : booking
      )
    );

    try {
      const payload = await apiFetch(`/api/bookings/${id}`, {
        method: 'POST',
        headers: adminCode ? { 'x-admin-code': adminCode } : {},
        body: JSON.stringify({ action: 'send-email' }),
      });
      setBookings((current) => current.map((booking) => (booking.id === id ? payload.booking : booking)));
      if (!payload.email?.sent) {
        setError(payload.email?.reason || 'The email was not sent. Check RESEND_API_KEY.');
      }
    } catch (emailError) {
      setError(emailError.message);
      load();
    }
  };

  const sendReminder = async (id) => {
    setError('');
    setBookings((current) =>
      current.map((booking) =>
        booking.id === id
          ? {
              ...booking,
              reminderStatus: {
                ...(booking.reminderStatus || {}),
                state: 'sending',
                label: 'Sending...',
              },
            }
          : booking
      )
    );

    try {
      const payload = await apiFetch(`/api/bookings/${id}`, {
        method: 'POST',
        headers: adminCode ? { 'x-admin-code': adminCode } : {},
        body: JSON.stringify({ action: 'send-reminder' }),
      });
      setBookings((current) => current.map((booking) => (booking.id === id ? payload.booking : booking)));
      if (!payload.reminder?.sent) {
        setError(payload.reminder?.reason || 'The reminder was not sent. Check RESEND_API_KEY.');
      }
    } catch (reminderError) {
      setError(reminderError.message);
      load();
    }
  };

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayCount = bookings.filter((booking) => booking.date === todayKey).length;
  const revenue = bookings
    .filter((booking) => booking.status !== 'cancelled')
    .reduce((sum, booking) => sum + getBookingTotal(booking), 0);

  if (error === 'Admin code required.') {
    return (
      <div className="tailadmin-app tailadmin-login">
        <main className="launcher-screen">
          <div className="hero-mark">
            <ShieldCheck size={26} />
          </div>
          <h1>Admin access.</h1>
          <p>Enter the admin code for the BlackSilva booking app.</p>
          <div className="form-stack">
            <label>
              Admin code
              <input value={codeDraft} onChange={(event) => setCodeDraft(event.target.value)} />
            </label>
          </div>
          <div className="launcher-actions">
            <button
              type="button"
              onClick={() => {
                window.localStorage.setItem('bs-admin-code', codeDraft);
                setAdminCode(codeDraft);
                load(codeDraft);
              }}
            >
              Unlock admin
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <AdminShell activeTab={activeTab} setActiveTab={setActiveTab} onRefresh={load}>
      <main className="screen admin-screen">
        <section className="app-hero admin-hero">
          <div>
            <span className="screen-kicker">Salon dashboard</span>
            <h1>Booking app.</h1>
            <p>{bookings.length} saved bookings</p>
          </div>
          <button type="button" className="icon-button" onClick={load} aria-label="Refresh">
            <RefreshCw size={20} />
          </button>
        </section>

        <div className="admin-stats">
          <StatCard label="Today" value={todayCount} icon={<CalendarDays size={18} />} />
          <StatCard label="Total" value={bookings.length} icon={<UserRound size={18} />} />
          <StatCard label="Value" value={formatMoney(revenue)} icon={<Scissors size={18} />} />
        </div>

        <AdminTabs active={activeTab} setActive={setActiveTab} />

        {error && <div className="error-box">{error}</div>}
        {loading ? <div className="empty-state">Loading...</div> : null}

        {!loading && activeTab === 'dashboard' && <AdminDashboard bookings={bookings} />}
        {!loading && activeTab === 'calendar' && <AdminCalendar bookings={bookings} />}
        {!loading && activeTab === 'clients' && <CustomersScreen bookings={bookings} />}
        {!loading && activeTab === 'stock' && <StockScreen bookings={bookings} />}
        {!loading && activeTab === 'rentals' && <ChairRentalsScreen bookings={bookings} />}

        {!loading && activeTab === 'bookings' && (
          <>
            <label className="search-box">
              <Search size={17} />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search client" />
            </label>

            <div className="filter-rail">
              <button type="button" className={filter === 'all' ? 'selected' : ''} onClick={() => setFilter('all')}>
                All
              </button>
              {statuses.map((status) => (
                <button
                  type="button"
                  key={status.id}
                  className={filter === status.id ? 'selected' : ''}
                  onClick={() => setFilter(status.id)}
                >
                  {status.label}
                </button>
              ))}
            </div>

            {filtered.length === 0 ? <div className="empty-state">There are no bookings here.</div> : null}
            <div className="admin-list">
              {filtered.map((booking) => (
                <AdminBookingCard
                  key={booking.id}
                  booking={booking}
                  onStatus={updateStatus}
                  onEmail={resendEmail}
                  onReminder={sendReminder}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </AdminShell>
  );
}

export default function App() {
  const path = window.location.pathname;

  if (path.startsWith('/admin')) return <AdminApp />;
  if (path.startsWith('/client')) return <ClientApp />;
  return <Launcher />;
}
