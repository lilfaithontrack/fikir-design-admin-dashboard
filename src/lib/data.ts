// Static demo data for the dashboard

export interface Product {
  id: string
  name: string
  nameAm: string
  sku: string
  category: string
  price: number
  stock: number
  status: 'active' | 'inactive' | 'out_of_stock'
  image: string
  description: string
  supplier: string
  createdAt: string
}

export interface Order {
  id: string
  customer: string
  customerEmail: string
  items: number
  total: number
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled'
  paymentStatus: 'paid' | 'unpaid' | 'refunded'
  date: string
  shippingAddress: string
}

export interface Customer {
  id: string
  name: string
  email: string
  phone: string
  type: 'individual' | 'business' | 'wholesale'
  totalOrders: number
  totalSpent: number
  status: 'active' | 'inactive'
  joinedDate: string
  address: string
}

export interface InventoryItem {
  id: string
  productName: string
  sku: string
  currentStock: number
  minStock: number
  maxStock: number
  location: string
  lastRestocked: string
  status: 'in_stock' | 'low_stock' | 'out_of_stock'
}

export const products: Product[] = [
  {
    id: 'PRD-001',
    name: 'Ethiopian Coffee Beans - Premium',
    nameAm: 'የኢትዮጵያ ቡና ፕሪሚየም',
    sku: 'ECB-001',
    category: 'Coffee',
    price: 450,
    stock: 120,
    status: 'active',
    image: '/products/coffee.jpg',
    description: 'Premium Ethiopian Arabica coffee beans from Sidamo region',
    supplier: 'Sidamo Coffee Cooperative',
    createdAt: '2024-01-10'
  },
  {
    id: 'PRD-002',
    name: 'Traditional Habesha Dress',
    nameAm: 'ባህላዊ የሀበሻ ልብስ',
    sku: 'THD-002',
    category: 'Clothing',
    price: 2500,
    stock: 15,
    status: 'active',
    image: '/products/dress.jpg',
    description: 'Handwoven traditional Ethiopian dress with intricate patterns',
    supplier: 'Addis Textile',
    createdAt: '2024-01-08'
  },
  {
    id: 'PRD-003',
    name: 'Handwoven Basket - Large',
    nameAm: 'እጅ የተሰራ ቅርጫት - ትልቅ',
    sku: 'HWB-003',
    category: 'Handicrafts',
    price: 350,
    stock: 8,
    status: 'active',
    image: '/products/basket.jpg',
    description: 'Traditional Ethiopian handwoven basket made from natural fibers',
    supplier: 'Artisan Collective',
    createdAt: '2024-01-05'
  },
  {
    id: 'PRD-004',
    name: 'Leather Sandals - Handmade',
    nameAm: 'የቆዳ ጫማ - እጅ የተሰራ',
    sku: 'LHS-004',
    category: 'Footwear',
    price: 680,
    stock: 25,
    status: 'active',
    image: '/products/sandals.jpg',
    description: 'Authentic Ethiopian leather sandals, handcrafted by local artisans',
    supplier: 'Leather Works Ethiopia',
    createdAt: '2024-01-12'
  },
  {
    id: 'PRD-005',
    name: 'Injera Mitad - Traditional',
    nameAm: 'እንጀራ ምጣድ - ባህላዊ',
    sku: 'IMT-005',
    category: 'Cookware',
    price: 1200,
    stock: 0,
    status: 'out_of_stock',
    image: '/products/mitad.jpg',
    description: 'Traditional clay cooking surface for making injera',
    supplier: 'Traditional Cookware Ltd',
    createdAt: '2024-01-03'
  },
  {
    id: 'PRD-006',
    name: 'Ethiopian Honey - Organic',
    nameAm: 'የኢትዮጵያ ማር - ኦርጋኒክ',
    sku: 'EHO-006',
    category: 'Food',
    price: 550,
    stock: 45,
    status: 'active',
    image: '/products/honey.jpg',
    description: 'Pure organic honey from Ethiopian highlands',
    supplier: 'Bee Keepers Association',
    createdAt: '2024-01-15'
  },
  {
    id: 'PRD-007',
    name: 'Mesob - Handwoven Table',
    nameAm: 'መሶብ - እጅ የተሰራ ጠረጴዛ',
    sku: 'MHT-007',
    category: 'Furniture',
    price: 1800,
    stock: 12,
    status: 'active',
    image: '/products/mesob.jpg',
    description: 'Traditional Ethiopian dining table, handwoven with colorful patterns',
    supplier: 'Artisan Collective',
    createdAt: '2024-01-07'
  },
  {
    id: 'PRD-008',
    name: 'Berbere Spice Mix',
    nameAm: 'በርበሬ ቅመም',
    sku: 'BSM-008',
    category: 'Spices',
    price: 180,
    stock: 200,
    status: 'active',
    image: '/products/berbere.jpg',
    description: 'Authentic Ethiopian berbere spice blend',
    supplier: 'Spice Merchants',
    createdAt: '2024-01-20'
  }
]

export const orders: Order[] = [
  {
    id: 'ORD-001',
    customer: 'Abebe Kebede',
    customerEmail: 'abebe.k@email.com',
    items: 3,
    total: 2500,
    status: 'delivered',
    paymentStatus: 'paid',
    date: '2024-01-15',
    shippingAddress: 'Bole, Addis Ababa'
  },
  {
    id: 'ORD-002',
    customer: 'Tigist Alemu',
    customerEmail: 'tigist.a@email.com',
    items: 2,
    total: 1800,
    status: 'pending',
    paymentStatus: 'unpaid',
    date: '2024-01-15',
    shippingAddress: 'Piazza, Addis Ababa'
  },
  {
    id: 'ORD-003',
    customer: 'Dawit Haile',
    customerEmail: 'dawit.h@email.com',
    items: 5,
    total: 3200,
    status: 'processing',
    paymentStatus: 'paid',
    date: '2024-01-14',
    shippingAddress: 'Megenagna, Addis Ababa'
  },
  {
    id: 'ORD-004',
    customer: 'Sara Tesfaye',
    customerEmail: 'sara.t@email.com',
    items: 1,
    total: 950,
    status: 'delivered',
    paymentStatus: 'paid',
    date: '2024-01-14',
    shippingAddress: 'CMC, Addis Ababa'
  },
  {
    id: 'ORD-005',
    customer: 'Yonas Bekele',
    customerEmail: 'yonas.b@email.com',
    items: 4,
    total: 4100,
    status: 'shipped',
    paymentStatus: 'paid',
    date: '2024-01-13',
    shippingAddress: 'Kazanchis, Addis Ababa'
  },
  {
    id: 'ORD-006',
    customer: 'Marta Girma',
    customerEmail: 'marta.g@email.com',
    items: 2,
    total: 1350,
    status: 'processing',
    paymentStatus: 'paid',
    date: '2024-01-13',
    shippingAddress: '4 Kilo, Addis Ababa'
  },
  {
    id: 'ORD-007',
    customer: 'Solomon Tadesse',
    customerEmail: 'solomon.t@email.com',
    items: 6,
    total: 5200,
    status: 'cancelled',
    paymentStatus: 'refunded',
    date: '2024-01-12',
    shippingAddress: 'Gerji, Addis Ababa'
  },
  {
    id: 'ORD-008',
    customer: 'Hanna Wolde',
    customerEmail: 'hanna.w@email.com',
    items: 3,
    total: 2700,
    status: 'shipped',
    paymentStatus: 'paid',
    date: '2024-01-12',
    shippingAddress: 'Arat Kilo, Addis Ababa'
  }
]

export const customers: Customer[] = [
  {
    id: 'CUST-001',
    name: 'Abebe Kebede',
    email: 'abebe.k@email.com',
    phone: '+251-911-234567',
    type: 'individual',
    totalOrders: 12,
    totalSpent: 15400,
    status: 'active',
    joinedDate: '2023-06-15',
    address: 'Bole, Addis Ababa'
  },
  {
    id: 'CUST-002',
    name: 'Tigist Alemu',
    email: 'tigist.a@email.com',
    phone: '+251-911-345678',
    type: 'individual',
    totalOrders: 8,
    totalSpent: 9800,
    status: 'active',
    joinedDate: '2023-08-20',
    address: 'Piazza, Addis Ababa'
  },
  {
    id: 'CUST-003',
    name: 'Ethiopian Coffee Exporters',
    email: 'info@ethcoffee.com',
    phone: '+251-911-456789',
    type: 'business',
    totalOrders: 45,
    totalSpent: 125000,
    status: 'active',
    joinedDate: '2023-03-10',
    address: 'Merkato, Addis Ababa'
  },
  {
    id: 'CUST-004',
    name: 'Sara Tesfaye',
    email: 'sara.t@email.com',
    phone: '+251-911-567890',
    type: 'individual',
    totalOrders: 5,
    totalSpent: 4200,
    status: 'active',
    joinedDate: '2023-11-05',
    address: 'CMC, Addis Ababa'
  },
  {
    id: 'CUST-005',
    name: 'Addis Handicrafts Wholesale',
    email: 'sales@addishandicrafts.com',
    phone: '+251-911-678901',
    type: 'wholesale',
    totalOrders: 78,
    totalSpent: 285000,
    status: 'active',
    joinedDate: '2023-01-15',
    address: 'Megenagna, Addis Ababa'
  },
  {
    id: 'CUST-006',
    name: 'Dawit Haile',
    email: 'dawit.h@email.com',
    phone: '+251-911-789012',
    type: 'individual',
    totalOrders: 3,
    totalSpent: 2100,
    status: 'inactive',
    joinedDate: '2023-09-22',
    address: 'Megenagna, Addis Ababa'
  }
]

export const inventory: InventoryItem[] = [
  {
    id: 'INV-001',
    productName: 'Ethiopian Coffee Beans - Premium',
    sku: 'ECB-001',
    currentStock: 120,
    minStock: 50,
    maxStock: 500,
    location: 'Warehouse A - Section 1',
    lastRestocked: '2024-01-10',
    status: 'in_stock'
  },
  {
    id: 'INV-002',
    productName: 'Traditional Habesha Dress',
    sku: 'THD-002',
    currentStock: 15,
    minStock: 20,
    maxStock: 100,
    location: 'Warehouse B - Section 3',
    lastRestocked: '2024-01-08',
    status: 'low_stock'
  },
  {
    id: 'INV-003',
    productName: 'Handwoven Basket - Large',
    sku: 'HWB-003',
    currentStock: 8,
    minStock: 30,
    maxStock: 150,
    location: 'Warehouse A - Section 2',
    lastRestocked: '2024-01-05',
    status: 'low_stock'
  },
  {
    id: 'INV-004',
    productName: 'Leather Sandals - Handmade',
    sku: 'LHS-004',
    currentStock: 25,
    minStock: 40,
    maxStock: 200,
    location: 'Warehouse B - Section 1',
    lastRestocked: '2024-01-12',
    status: 'low_stock'
  },
  {
    id: 'INV-005',
    productName: 'Injera Mitad - Traditional',
    sku: 'IMT-005',
    currentStock: 0,
    minStock: 10,
    maxStock: 50,
    location: 'Warehouse A - Section 3',
    lastRestocked: '2023-12-20',
    status: 'out_of_stock'
  },
  {
    id: 'INV-006',
    productName: 'Ethiopian Honey - Organic',
    sku: 'EHO-006',
    currentStock: 45,
    minStock: 25,
    maxStock: 200,
    location: 'Warehouse C - Section 1',
    lastRestocked: '2024-01-15',
    status: 'in_stock'
  },
  {
    id: 'INV-007',
    productName: 'Mesob - Handwoven Table',
    sku: 'MHT-007',
    currentStock: 12,
    minStock: 15,
    maxStock: 60,
    location: 'Warehouse B - Section 2',
    lastRestocked: '2024-01-07',
    status: 'low_stock'
  },
  {
    id: 'INV-008',
    productName: 'Berbere Spice Mix',
    sku: 'BSM-008',
    currentStock: 200,
    minStock: 100,
    maxStock: 1000,
    location: 'Warehouse C - Section 2',
    lastRestocked: '2024-01-20',
    status: 'in_stock'
  }
]
