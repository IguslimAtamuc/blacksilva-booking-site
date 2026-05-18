import {
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  Download,
  Mail,
  MapPin,
  Phone,
  Scissors,
  ShieldCheck,
  Sparkles,
  Trash2,
} from 'lucide-react';
import React from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  buildCalendarUrl,
  clearBookings,
  createBooking,
  displayLongDate,
  formatMoney,
  getBookingTotal,
  getNextOpenDays,
  getProduct,
  getService,
  getStylist,
  getTimeSlots,
  loadBookings,
  saveBookings,
} from './booking.js';
import { products, salon, services, stylists } from './data.js';

const defaultSelection = {
  serviceId: services[0].id,
  stylistId: 'eduard',
  date: '',
  time: '',
  client: { name: '', phone: '', email: '', notes: '' },
  protection: true,
  productId: 'none',
};

function cx(...classes) {
  return classes.filter(Boolean).join(' ');
}

function BrandMark() {
  return (
    <a className="brand" href="#top" aria-label="BlackSilva home">
      <span className="brand__seal">BS</span>
      <span>
        <strong>BlackSilva</strong>
        <small>Hair Salon Booking</small>
      </span>
    </a>
  );
}

function Header() {
  return (
    <header className="site-header">
      <BrandMark />
      <nav aria-label="Navigare principala">
        <a href="#booking">Booking</a>
        <a href="#servicii">Servicii</a>
        <a href="#agenda">Agenda</a>
      </nav>
      <a className="header-action" href={`mailto:${salon.email}`}>
        <Mail size={16} />
        Contact
      </a>
    </header>
  );
}

function SalonIntro() {
  return (
    <section className="salon-intro" aria-label="BlackSilva salon">
      <div className="salon-visual">
        <img
          src="https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=85"
          alt="Interior de salon premium cu scaune de coafor"
        />
        <div className="visual-panel">
          <Scissors size={20} />
          <span>Single salon booking</span>
        </div>
      </div>
      <div className="intro-copy">
        <h1>Programari BlackSilva, direct pentru salonul tau.</h1>
        <p>
          Un booking website premium, construit pentru o singura afacere: servicii, specialisti,
          ore disponibile si confirmare in acelasi loc.
        </p>
      </div>
      <div className="intro-meta" aria-label="Detalii salon">
        <a href={salon.mapsUrl} target="_blank" rel="noreferrer">
          <MapPin size={17} />
          {salon.address}
        </a>
        <span>
          <Clock size={17} />
          Mie 14-20 / Joi-Dum 11-17
        </span>
      </div>
    </section>
  );
}

function Steps({ step }) {
  const labels = ['Serviciu', 'Specialist', 'Ora', 'Client', 'Confirmare'];
  return (
    <div className="steps" aria-label="Progres booking">
      {labels.map((label, index) => (
        <span key={label} className={cx(index <= step && 'active')}>
          {label}
        </span>
      ))}
    </div>
  );
}

function ServicePicker({ selection, setSelection }) {
  const categories = [...new Set(services.map((service) => service.category))];

  return (
    <div className="booking-stage" aria-label="Alege serviciul">
      {categories.map((category) => (
        <div className="service-group" key={category}>
          <h3>{category}</h3>
          <div className="service-list">
            {services
              .filter((service) => service.category === category)
              .map((service) => {
                const active = selection.serviceId === service.id;
                return (
                  <button
                    type="button"
                    className={cx('service-row', active && 'selected')}
                    key={service.id}
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
                    <span className="service-price">
                      <b>{formatMoney(service.price)}</b>
                      <small>{service.duration} min</small>
                    </span>
                    {service.popular && <em>Popular</em>}
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}

function StylistPicker({ selection, setSelection }) {
  const service = getService(selection.serviceId);
  const availableStylists = stylists.filter((stylist) => service?.staffIds.includes(stylist.id));

  return (
    <div className="stylist-grid" aria-label="Alege specialistul">
      {availableStylists.map((stylist) => (
        <button
          type="button"
          className={cx('stylist-card', selection.stylistId === stylist.id && 'selected')}
          key={stylist.id}
          onClick={() => setSelection((current) => ({ ...current, stylistId: stylist.id, time: '' }))}
        >
          <span className="avatar">{stylist.initial}</span>
          <span className="stylist-card__body">
            <strong>{stylist.name}</strong>
            <small>{stylist.role}</small>
            <span>{stylist.focus}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

function TimePicker({ selection, setSelection, bookings }) {
  const service = getService(selection.serviceId);
  const days = useMemo(() => getNextOpenDays(12), []);
  const activeDate = selection.date || days[0]?.key || '';
  const slots = getTimeSlots(activeDate, service?.duration || 45, bookings, selection.stylistId);

  useEffect(() => {
    if (!selection.date && days[0]?.key) {
      setSelection((current) => ({ ...current, date: days[0].key }));
    }
  }, [days, selection.date, setSelection]);

  return (
    <div className="time-layout">
      <div className="date-strip" aria-label="Alege ziua">
        {days.map((day) => (
          <button
            type="button"
            className={cx(selection.date === day.key && 'selected')}
            key={day.key}
            onClick={() => setSelection((current) => ({ ...current, date: day.key, time: '' }))}
          >
            <strong>{day.short}</strong>
            <span>{day.schedule.start}-{day.schedule.end}</span>
          </button>
        ))}
      </div>
      <div className="time-grid" aria-label="Alege ora">
        {slots.map((slot) => (
          <button
            type="button"
            className={cx(selection.time === slot.time && 'selected')}
            key={slot.time}
            disabled={!slot.available}
            onClick={() => setSelection((current) => ({ ...current, time: slot.time }))}
          >
            {slot.time}
          </button>
        ))}
      </div>
    </div>
  );
}

function ClientForm({ selection, setSelection }) {
  const updateClient = (field, value) => {
    setSelection((current) => ({
      ...current,
      client: { ...current.client, [field]: value },
    }));
  };

  return (
    <div className="client-form">
      <label>
        Nume complet
        <input
          value={selection.client.name}
          onChange={(event) => updateClient('name', event.target.value)}
          placeholder="Numele tau"
        />
      </label>
      <label>
        Telefon
        <input
          value={selection.client.phone}
          onChange={(event) => updateClient('phone', event.target.value)}
          placeholder="+45 ..."
          inputMode="tel"
        />
      </label>
      <label>
        Email
        <input
          value={selection.client.email}
          onChange={(event) => updateClient('email', event.target.value)}
          placeholder="email@example.com"
          inputMode="email"
        />
      </label>
      <label>
        Observatii
        <textarea
          value={selection.client.notes}
          onChange={(event) => updateClient('notes', event.target.value)}
          placeholder="Preferinte, alergii, inspiratie, orice ajuta stilistul"
        />
      </label>
    </div>
  );
}

function AddOns({ selection, setSelection }) {
  return (
    <div className="addons">
      <button
        type="button"
        className={cx('protection', selection.protection && 'selected')}
        onClick={() => setSelection((current) => ({ ...current, protection: !current.protection }))}
      >
        <ShieldCheck size={20} />
        <span>
          <strong>Booking Protection</strong>
          <small>+59 kr, o reprogramare flexibila si risc limitat la late-cancel.</small>
        </span>
        <b>{selection.protection ? 'Activ' : 'Optional'}</b>
      </button>
      <label>
        Produs in-chair
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
  );
}

function BookingSummary({ selection, compact = false }) {
  const service = getService(selection.serviceId);
  const stylist = getStylist(selection.stylistId);
  const product = getProduct(selection.productId);
  const total = getBookingTotal(selection);

  return (
    <aside className={cx('summary', compact && 'summary--compact')} aria-label="Sumar rezervare">
      <div className="summary__head">
        <span>Rezervarea ta</span>
        <strong>{formatMoney(total)}</strong>
      </div>
      <dl>
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
          <dd>{selection.date ? displayLongDate(selection.date) : '-'}</dd>
        </div>
        <div>
          <dt>Ora</dt>
          <dd>{selection.time || '-'}</dd>
        </div>
        <div>
          <dt>Extra</dt>
          <dd>
            {selection.protection ? 'Protectie 59 kr' : 'Fara protectie'}
            {product?.price ? ` + ${product.name}` : ''}
          </dd>
        </div>
      </dl>
    </aside>
  );
}

function Confirmation({ booking, onNewBooking }) {
  const service = getService(booking.serviceId);
  const stylist = getStylist(booking.stylistId);
  const total = getBookingTotal(booking);
  const mailSubject = encodeURIComponent(`Rezervare ${booking.id}`);
  const mailBody = encodeURIComponent(
    `Salut BlackSilva,\n\nConfirm rezervarea ${booking.id}:\n${service?.name} cu ${stylist?.name}\n${displayLongDate(
      booking.date
    )}, ora ${booking.time}\nTotal estimat: ${formatMoney(total)}\n\nMultumesc!`
  );

  return (
    <section className="confirmation">
      <span className="success-icon">
        <Check size={26} />
      </span>
      <h2>Rezervare confirmata.</h2>
      <p>
        Codul tau este <strong>{booking.id}</strong>. Programarea ramane salvata in acest preview si
        poate fi trimisa salonului prin email.
      </p>
      <div className="confirmation-actions">
        <a href={buildCalendarUrl(booking)} download={`${booking.id}.ics`}>
          <Download size={17} />
          Calendar
        </a>
        <a href={`mailto:${salon.email}?subject=${mailSubject}&body=${mailBody}`}>
          <Mail size={17} />
          Trimite email
        </a>
        <button type="button" onClick={onNewBooking}>
          <ArrowRight size={17} />
          Alta programare
        </button>
      </div>
    </section>
  );
}

function BookingPanel({ bookings, setBookings }) {
  const [step, setStep] = useState(0);
  const [selection, setSelection] = useState(defaultSelection);
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const service = getService(selection.serviceId);
  const canContinue = [
    Boolean(selection.serviceId),
    Boolean(selection.stylistId),
    Boolean(selection.date && selection.time),
    Boolean(selection.client.name && selection.client.phone && selection.client.email),
    true,
  ];

  const goNext = () => {
    if (step < 4) setStep((current) => current + 1);
  };

  const confirm = () => {
    const booking = createBooking(selection);
    const updated = [booking, ...bookings];
    setBookings(updated);
    saveBookings(updated);
    setConfirmedBooking(booking);
  };

  if (confirmedBooking) {
    return (
      <div className="booking-panel" id="booking">
        <Confirmation
          booking={confirmedBooking}
          onNewBooking={() => {
            setConfirmedBooking(null);
            setSelection(defaultSelection);
            setStep(0);
          }}
        />
      </div>
    );
  }

  return (
    <section className="booking-panel" id="booking" aria-label="Booking BlackSilva">
      <div className="booking-panel__top">
        <div>
          <h2>Book your chair</h2>
          <p>Programare rapida, fara marketplace si fara profiluri inutile.</p>
        </div>
        <Sparkles size={22} />
      </div>
      <Steps step={step} />

      {step === 0 && <ServicePicker selection={selection} setSelection={setSelection} />}
      {step === 1 && <StylistPicker selection={selection} setSelection={setSelection} />}
      {step === 2 && <TimePicker selection={selection} setSelection={setSelection} bookings={bookings} />}
      {step === 3 && (
        <>
          <ClientForm selection={selection} setSelection={setSelection} />
          <AddOns selection={selection} setSelection={setSelection} />
        </>
      )}
      {step === 4 && (
        <div className="final-review">
          <BookingSummary selection={selection} compact />
          <div className="terms-line">
            <ShieldCheck size={18} />
            Plata se face in salon. Pretul este estimativ si poate varia dupa consultatie.
          </div>
        </div>
      )}

      <div className="panel-footer">
        <button type="button" className="ghost-button" disabled={step === 0} onClick={() => setStep((s) => s - 1)}>
          Inapoi
        </button>
        {step < 4 ? (
          <button type="button" className="primary-button" disabled={!canContinue[step]} onClick={goNext}>
            Continua
            <ArrowRight size={17} />
          </button>
        ) : (
          <button type="button" className="primary-button" onClick={confirm}>
            Confirma programarea
            <Check size={17} />
          </button>
        )}
      </div>
      <BookingSummary selection={{ ...selection, date: selection.date, time: selection.time }} compact />
      <p className="slot-note">
        {service?.duration || 45} minute rezervate. Sloturile ocupate sunt blocate automat in demo.
      </p>
    </section>
  );
}

function ServicesSection() {
  return (
    <section className="content-band" id="servicii">
      <div className="band-head">
        <span>Menu</span>
        <h2>Servicii facute pentru un singur salon, nu pentru o lista infinita.</h2>
      </div>
      <div className="menu-grid">
        {services.slice(0, 6).map((service) => (
          <article key={service.id}>
            <strong>{service.name}</strong>
            <p>{service.description}</p>
            <span>
              {formatMoney(service.price)} / {service.duration} min
            </span>
          </article>
        ))}
      </div>
    </section>
  );
}

function Agenda({ bookings, setBookings }) {
  const sorted = [...bookings].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

  return (
    <section className="agenda" id="agenda">
      <div className="band-head">
        <span>Preview owner</span>
        <h2>Programarile salvate in browser.</h2>
      </div>
      <div className="agenda-list">
        {sorted.length === 0 ? (
          <div className="empty-state">Nu exista programari in demo.</div>
        ) : (
          sorted.map((booking) => {
            const service = getService(booking.serviceId);
            const stylist = getStylist(booking.stylistId);
            return (
              <article className="agenda-item" key={booking.id}>
                <span className="agenda-date">
                  <CalendarDays size={18} />
                  {displayLongDate(booking.date)} / {booking.time}
                </span>
                <strong>{service?.name}</strong>
                <p>
                  {booking.client.name} cu {stylist?.name} · {booking.client.phone}
                </p>
                <small>{booking.id}</small>
              </article>
            );
          })
        )}
      </div>
      <button
        type="button"
        className="danger-button"
        onClick={() => {
          clearBookings();
          setBookings([]);
        }}
      >
        <Trash2 size={16} />
        Sterge programarile demo
      </button>
    </section>
  );
}

function ContactBand() {
  return (
    <section className="contact-band">
      <div>
        <h2>BlackSilva ramane personal.</h2>
        <p>
          Website-ul poate prelua booking-ul, dar relatia cu clientul ramane directa: email, locatie si
          contact personal dupa vizita.
        </p>
      </div>
      <div className="contact-links">
        <a href={salon.mapsUrl} target="_blank" rel="noreferrer">
          <MapPin size={18} />
          Deschide harta
        </a>
        <a href={`mailto:${salon.email}`}>
          <Mail size={18} />
          {salon.email}
        </a>
        <span>
          <Phone size={18} />
          {salon.phonePolicy}
        </span>
      </div>
    </section>
  );
}

export default function App() {
  const [bookings, setBookings] = useState([]);

  useEffect(() => {
    setBookings(loadBookings());
  }, []);

  return (
    <div className="site" id="top">
      <Header />
      <main>
        <section className="booking-hero">
          <SalonIntro />
          <BookingPanel bookings={bookings} setBookings={setBookings} />
        </section>
        <ServicesSection />
        <section className="team-band" aria-label="Specialistii BlackSilva">
          {stylists.map((stylist) => (
            <article key={stylist.id}>
              <span className="avatar">{stylist.initial}</span>
              <div>
                <strong>{stylist.name}</strong>
                <p>{stylist.focus}</p>
                <small>{stylist.specialties.join(' · ')}</small>
              </div>
            </article>
          ))}
        </section>
        <Agenda bookings={bookings} setBookings={setBookings} />
        <ContactBand />
      </main>
    </div>
  );
}
