export const salon = {
  name: 'BlackSilva',
  email: 'blacksilvahd@gmail.com',
  address: 'Badstuestraede 16, 1053 Kobenhavn',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=Badstuestr%C3%A6de+16%2C+1053+K%C3%B8benhavn',
  hours: 'Mie 14-20 / Joi-Dum 11-17',
};

export const stylists = [
  {
    id: 'eduard',
    name: 'Eduard',
    role: 'Men grooming specialist',
    initial: 'E',
    focus: 'Tunsori masculine moderne, barba, detalii precise si styling cu personalitate.',
    specialties: ['Tunsori barbati', 'Barba', 'Grooming'],
  },
  {
    id: 'elena',
    name: 'Elena',
    role: 'Women hair specialist',
    initial: 'E',
    focus: 'Tunsori feminine, styling, blow dry si look-uri versatile pentru evenimente.',
    specialties: ['Tunsori femei', 'Styling', 'Unisex'],
  },
  {
    id: 'chair',
    name: 'Chair 01',
    role: 'Rentable salon station',
    initial: 'C',
    focus: 'Scaun pregatit pentru barber/stylist independent, cu acces direct la rezervare.',
    specialties: ['Chair rental', 'Studio'],
  },
];

export const services = [
  {
    id: 'men-haircut',
    name: "Men's Haircut",
    category: 'Barbati',
    duration: 45,
    price: 180,
    staffIds: ['eduard', 'elena'],
    description: 'Consultatie, tunsoare la foarfeca sau masina, finisaj cald si styling.',
    popular: true,
  },
  {
    id: 'haircut-beard',
    name: 'Haircut + Beard',
    category: 'Barbati',
    duration: 60,
    price: 260,
    staffIds: ['eduard'],
    description: 'Tunsoare completa impreuna cu sculptarea barbii, contur si ingrijire.',
  },
  {
    id: 'beard-trim',
    name: 'Beard Trim',
    category: 'Barbati',
    duration: 25,
    price: 140,
    staffIds: ['eduard'],
    description: 'Forma, contur si finish cu prosop cald si ulei pentru barba.',
  },
  {
    id: 'women-haircut',
    name: "Women's Haircut",
    category: 'Femei',
    duration: 60,
    price: 320,
    staffIds: ['elena'],
    description: 'Tunsoare adaptata formei fetei, texturii parului si stilului tau.',
    popular: true,
  },
  {
    id: 'wash-cut-style',
    name: 'Wash + Cut + Styling',
    category: 'Femei',
    duration: 75,
    price: 420,
    staffIds: ['elena'],
    description: 'Spalare, tunsoare precisa si finisaj editorial cu protectie termica.',
  },
  {
    id: 'blow-dry',
    name: 'Blow Dry / Styling',
    category: 'Styling',
    duration: 40,
    price: 240,
    staffIds: ['elena'],
    description: 'Sleek, soft sau sculptat pentru evenimente, fotografii sau o zi buna.',
  },
  {
    id: 'unisex-refresh',
    name: 'Unisex Refresh',
    category: 'Unisex',
    duration: 50,
    price: 280,
    staffIds: ['eduard', 'elena'],
    description: 'O improspatare rapida, construita in jurul parului tau, nu al etichetei.',
  },
  {
    id: 'pack-five',
    name: '5x Haircut Pack',
    category: 'Pachete',
    duration: 45,
    price: 799,
    staffIds: ['eduard'],
    description: 'Cinci tunsori preplatite, valabile 12 luni, cu economie fata de vizite separate.',
  },
  {
    id: 'chair-rental-halfday',
    name: 'Chair Rental / Half Day',
    category: 'Business',
    duration: 240,
    price: 900,
    staffIds: ['chair'],
    description: 'Inchiriaza scaunul BlackSilva pentru jumatate de zi, cu confirmare in admin.',
  },
  {
    id: 'chair-rental-day',
    name: 'Chair Rental / Full Day',
    category: 'Business',
    duration: 360,
    price: 1500,
    staffIds: ['chair'],
    description: 'Rezerva un scaun complet pentru o zi de lucru in salon.',
  },
];

export const products = [
  { id: 'none', name: 'Fara produs', price: 0, stock: 0, category: 'None' },
  { id: 'stylist-pick', name: 'Produs ales de stilist', price: 180, stock: 12, category: 'Salon Pick' },
  { id: 'texture-spray', name: 'Texture Salt Spray', price: 195, stock: 18, category: 'Styling' },
  { id: 'matte-clay', name: 'Matte Clay', price: 210, stock: 9, category: 'Styling' },
  { id: 'repair-mask', name: 'Repair Mask No.7', price: 320, stock: 6, category: 'Care' },
];

export const openingHours = {
  0: { label: 'Duminica', start: '11:00', end: '17:00' },
  1: null,
  2: null,
  3: { label: 'Miercuri', start: '14:00', end: '20:00' },
  4: { label: 'Joi', start: '11:00', end: '17:00' },
  5: { label: 'Vineri', start: '11:00', end: '17:00' },
  6: { label: 'Sambata', start: '11:00', end: '17:00' },
};

export const seededBookings = [
  {
    id: 'BS-DEMO-1001',
    serviceId: 'women-haircut',
    stylistId: 'elena',
    date: '',
    time: '12:00',
    client: { name: 'Demo client', phone: '+45 12 34 56 78', email: 'demo@blacksilva.ro' },
    protection: true,
    productId: 'repair-mask',
    status: 'confirmed',
    source: 'seed',
    createdAt: 'demo',
  },
];
