import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  Mail,
  MapPin,
  RefreshCw,
  Scissors,
  Search,
  ShieldCheck,
  Sparkles,
  UserRound,
} from 'lucide-react';
import {
  buildCalendarUrl,
  displayDate,
  displayLongDate,
  formatMoney,
  getBookingTotal,
  getNextOpenDays,
  getProduct,
  getService,
  getStylist,
  getTimeSlots,
} from './booking.js';
import { products, salon, services, stylists } from './data.js';

const emptyClient = { name: '', phone: '', email: '', notes: '' };

const initialSelection = {
  serviceId: services[0].id,
  stylistId: services[0].staffIds[0],
  date: '',
  time: '',
  client: emptyClient,
  protection: true,
  productId: 'none',
};

const statuses = [
  { id: 'confirmed', label: 'Confirmate' },
  { id: 'completed', label: 'Finalizate' },
  { id: 'cancelled', label: 'Anulate' },
  { id: 'no-show', label: 'No-show' },
];

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
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
    <div className="phone-stage">
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

function Launcher() {
  return (
    <PhoneFrame app="client">
      <main className="screen launcher-screen">
        <div className="hero-mark">
          <Scissors size={26} />
        </div>
        <h1>BlackSilva booking system</h1>
        <p>Alege experienta pe care vrei sa o deschizi.</p>
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
    <div className="mobile-progress" aria-label="Pasi rezervare">
      {[0, 1, 2, 3, 4].map((item) => (
        <span key={item} className={item <= step ? 'active' : ''} />
      ))}
    </div>
  );
}

function BigButton({ selected, children, onClick, disabled }) {
  return (
    <button type="button" className={cx('big-button', selected && 'selected')} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

function ServiceScreen({ selection, setSelection }) {
  const categories = [...new Set(services.map((service) => service.category))];

  return (
    <section className="step-screen">
      <span className="screen-kicker">Step 01</span>
      <h1>Alege serviciul.</h1>
      <div className="stack-list">
        {categories.map((category) => (
          <div key={category} className="list-group">
            <h2>{category}</h2>
            {services
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
                    <small>{service.description}</small>
                  </span>
                  <b>
                    {formatMoney(service.price)}
                    <small>{service.duration}m</small>
                  </b>
                </BigButton>
              ))}
          </div>
        ))}
      </div>
    </section>
  );
}

function StylistScreen({ selection, setSelection }) {
  const service = getService(selection.serviceId);
  const available = stylists.filter((stylist) => service?.staffIds.includes(stylist.id));

  return (
    <section className="step-screen">
      <span className="screen-kicker">Step 02</span>
      <h1>Alege specialistul.</h1>
      <div className="stack-list">
        {available.map((stylist) => (
          <BigButton
            key={stylist.id}
            selected={selection.stylistId === stylist.id}
            onClick={() => setSelection((current) => ({ ...current, stylistId: stylist.id, time: '' }))}
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
      <span className="screen-kicker">Step 03</span>
      <h1>Alege data si ora.</h1>
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
      <h1>Datele clientului.</h1>
      <div className="form-stack">
        <label>
          Nume complet
          <input value={selection.client.name} onChange={(event) => updateClient('name', event.target.value)} />
        </label>
        <label>
          Telefon
          <input value={selection.client.phone} onChange={(event) => updateClient('phone', event.target.value)} />
        </label>
        <label>
          Email confirmare
          <input value={selection.client.email} onChange={(event) => updateClient('email', event.target.value)} />
        </label>
        <label>
          Observatii
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
            <small>+59 kr pentru reprogramare flexibila.</small>
          </span>
        </button>
        <label>
          Produs
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

function SummaryRows({ booking }) {
  const service = getService(booking.serviceId);
  const stylist = getStylist(booking.stylistId);
  const product = getProduct(booking.productId);

  return (
    <dl className="summary-rows">
      <div>
        <dt>Serviciu</dt>
        <dd>{service?.name || '-'}</dd>
      </div>
      <div>
        <dt>Specialist</dt>
        <dd>{stylist?.name || '-'}</dd>
      </div>
      <div>
        <dt>Data</dt>
        <dd>{booking.date ? displayLongDate(booking.date) : '-'}</dd>
      </div>
      <div>
        <dt>Ora</dt>
        <dd>{booking.time || '-'}</dd>
      </div>
      <div>
        <dt>Extra</dt>
        <dd>
          {booking.protection ? 'Protectie' : 'Fara protectie'}
          {product?.price ? ` + ${product.name}` : ''}
        </dd>
      </div>
    </dl>
  );
}

function ReviewScreen({ selection }) {
  return (
    <section className="step-screen">
      <span className="screen-kicker">Step 05</span>
      <h1>Confirma programarea.</h1>
      <div className="review-card">
        <SummaryRows booking={selection} />
        <div className="total-row">
          <span>Total estimat</span>
          <strong>{formatMoney(getBookingTotal(selection))}</strong>
        </div>
      </div>
      <p className="fine-copy">Vei primi email de confirmare dupa ce rezervarea este salvata in sistem.</p>
    </section>
  );
}

function ConfirmationScreen({ booking, email, onReset }) {
  return (
    <main className="screen confirmation-screen">
      <span className="success-badge">
        <Check size={26} />
      </span>
      <h1>Rezervare confirmata.</h1>
      <p>
        Codul tau este <strong>{booking.id}</strong>. Emailul de confirmare{' '}
        {email?.sent ? 'a fost trimis.' : 'este pregatit, dar Resend nu este configurat inca.'}
      </p>
      <div className="review-card">
        <SummaryRows booking={booking} />
      </div>
      <div className="confirmation-actions">
        <a href={buildCalendarUrl(booking)} download={`${booking.id}.ics`}>
          Calendar
        </a>
        <button type="button" onClick={onReset}>
          Alta programare
        </button>
      </div>
    </main>
  );
}

function ClientApp() {
  const [step, setStep] = useState(0);
  const [selection, setSelection] = useState(initialSelection);
  const [bookings, setBookings] = useState([]);
  const [confirmed, setConfirmed] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/availability')
      .then((payload) => setBookings(payload.bookings || []))
      .catch(() => setBookings([]));
  }, []);

  const canContinue = [
    Boolean(selection.serviceId),
    Boolean(selection.stylistId),
    Boolean(selection.date && selection.time),
    Boolean(selection.client.name && selection.client.phone && selection.client.email),
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
    } catch (submitError) {
      setError(submitError.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmed?.booking) {
    return (
      <PhoneFrame app="client">
        <ConfirmationScreen
          booking={confirmed.booking}
          email={confirmed.email}
          onReset={() => {
            setConfirmed(null);
            setSelection(initialSelection);
            setStep(0);
          }}
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
            <h1>Book your chair.</h1>
            <p>{salon.hours}</p>
          </div>
          <span className="hero-icon">
            <Sparkles size={24} />
          </span>
        </section>

        <Progress step={step} />

        {step === 0 && <ServiceScreen selection={selection} setSelection={setSelection} />}
        {step === 1 && <StylistScreen selection={selection} setSelection={setSelection} />}
        {step === 2 && <TimeScreen selection={selection} setSelection={setSelection} bookings={bookings} />}
        {step === 3 && <ClientScreen selection={selection} setSelection={setSelection} />}
        {step === 4 && <ReviewScreen selection={selection} />}

        {error && <div className="error-box">{error}</div>}

        <footer className="app-footer">
          <button type="button" className="footer-secondary" disabled={step === 0 || submitting} onClick={() => setStep(step - 1)}>
            <ArrowLeft size={18} />
          </button>
          {step < 4 ? (
            <button type="button" className="footer-primary" disabled={!canContinue[step]} onClick={() => setStep(step + 1)}>
              Continua
              <ArrowRight size={18} />
            </button>
          ) : (
            <button type="button" className="footer-primary" disabled={submitting} onClick={submit}>
              {submitting ? 'Se salveaza...' : 'Confirma'}
              <Check size={18} />
            </button>
          )}
        </footer>
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

function AdminBookingCard({ booking, onStatus }) {
  const service = getService(booking.serviceId);
  const stylist = getStylist(booking.stylistId);

  return (
    <article className="admin-booking-card">
      <div className="booking-card-top">
        <span className={cx('status-pill', booking.status)}>{booking.status || 'confirmed'}</span>
        <small>{booking.id}</small>
      </div>
      <strong>{booking.client?.name || 'Client'}</strong>
      <p>
        {service?.name} cu {stylist?.name}
      </p>
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
    </article>
  );
}

function AdminApp() {
  const [bookings, setBookings] = useState([]);
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

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayCount = bookings.filter((booking) => booking.date === todayKey).length;
  const revenue = bookings
    .filter((booking) => booking.status !== 'cancelled')
    .reduce((sum, booking) => sum + getBookingTotal(booking), 0);

  if (error === 'Admin code required.') {
    return (
      <PhoneFrame app="admin">
        <main className="screen launcher-screen">
          <div className="hero-mark">
            <ShieldCheck size={26} />
          </div>
          <h1>Admin access.</h1>
          <p>Introdu codul de administrare pentru BlackSilva booking app.</p>
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
              Deblocheaza admin
            </button>
          </div>
        </main>
      </PhoneFrame>
    );
  }

  return (
    <PhoneFrame app="admin">
      <main className="screen admin-screen">
        <section className="app-hero admin-hero">
          <div>
            <span className="screen-kicker">Salon dashboard</span>
            <h1>Booking app.</h1>
            <p>{bookings.length} programari salvate</p>
          </div>
          <button type="button" className="icon-button" onClick={load} aria-label="Refresh">
            <RefreshCw size={20} />
          </button>
        </section>

        <div className="admin-stats">
          <StatCard label="Azi" value={todayCount} icon={<CalendarDays size={18} />} />
          <StatCard label="Total" value={bookings.length} icon={<UserRound size={18} />} />
          <StatCard label="Valoare" value={formatMoney(revenue)} icon={<Scissors size={18} />} />
        </div>

        <label className="search-box">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Cauta client" />
        </label>

        <div className="filter-rail">
          <button type="button" className={filter === 'all' ? 'selected' : ''} onClick={() => setFilter('all')}>
            Toate
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

        {error && <div className="error-box">{error}</div>}
        {loading ? <div className="empty-state">Se incarca...</div> : null}
        {!loading && filtered.length === 0 ? <div className="empty-state">Nu sunt programari aici.</div> : null}
        <div className="admin-list">
          {filtered.map((booking) => (
            <AdminBookingCard key={booking.id} booking={booking} onStatus={updateStatus} />
          ))}
        </div>
      </main>
    </PhoneFrame>
  );
}

export default function App() {
  const path = window.location.pathname;

  if (path.startsWith('/admin')) return <AdminApp />;
  if (path.startsWith('/client')) return <ClientApp />;
  return <Launcher />;
}
