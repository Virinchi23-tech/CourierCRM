-- International Courier CRM (CourierCRM) Complete Database Schema

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('ADMIN', 'SALES', 'OPERATIONS')),
  mobile TEXT,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  avatar_url TEXT,
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Roles Table
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  description TEXT
);

-- 3. Permissions Table
CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  module TEXT NOT NULL
);

-- 4. Role Permissions
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);

-- 5. Lead Sources
CREATE TABLE IF NOT EXISTS lead_sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  active INTEGER DEFAULT 1
);

-- 6. Leads
CREATE TABLE IF NOT EXISTS leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_code TEXT UNIQUE,
  customer_name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  whatsapp_number TEXT,
  email TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  source TEXT NOT NULL DEFAULT 'Manual',
  campaign TEXT,
  ad_set TEXT,
  ad TEXT,
  requirement TEXT,
  destination_country TEXT,
  destination_city TEXT,
  package_type TEXT DEFAULT 'PARCEL',
  estimated_weight REAL DEFAULT 0,
  notes TEXT,
  assigned_to INTEGER,
  status TEXT NOT NULL DEFAULT 'NEW' CHECK (status IN (
    'NEW', 'CONTACTED', 'QUALIFIED', 'QUOTATION_SENT', 'NEGOTIATION', 
    'PAYMENT_PENDING', 'BOOKED', 'LOST', 'NOT_INTERESTED', 'DUPLICATE'
  )),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- 7. Lead Activities
CREATE TABLE IF NOT EXISTS lead_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER NOT NULL,
  user_id INTEGER,
  activity_type TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 8. Lead Followups
CREATE TABLE IF NOT EXISTS lead_followups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lead_id INTEGER,
  customer_id INTEGER,
  assigned_to INTEGER NOT NULL,
  followup_date DATE NOT NULL,
  followup_time TIME,
  type TEXT NOT NULL DEFAULT 'CALL' CHECK (type IN ('CALL', 'WHATSAPP', 'EMAIL', 'MEETING', 'OTHER')),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'COMPLETED', 'MISSED', 'RESCHEDULED')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE CASCADE
);

-- 9. Customers
CREATE TABLE IF NOT EXISTS customers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_code TEXT UNIQUE,
  lead_id INTEGER,
  name TEXT NOT NULL,
  mobile TEXT NOT NULL,
  whatsapp_number TEXT,
  email TEXT,
  company_name TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  country TEXT DEFAULT 'India',
  postal_code TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL
);

-- 10. Customer Addresses
CREATE TABLE IF NOT EXISTS customer_addresses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  customer_id INTEGER NOT NULL,
  label TEXT DEFAULT 'Primary',
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL,
  postal_code TEXT,
  is_default INTEGER DEFAULT 0,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- 11. Enquiries
CREATE TABLE IF NOT EXISTS enquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  enquiry_code TEXT UNIQUE,
  customer_id INTEGER,
  lead_id INTEGER,
  sender_name TEXT NOT NULL,
  sender_mobile TEXT NOT NULL,
  sender_email TEXT,
  sender_address TEXT,
  sender_city TEXT,
  sender_state TEXT,
  sender_country TEXT DEFAULT 'India',
  sender_pincode TEXT,
  receiver_name TEXT NOT NULL,
  receiver_mobile TEXT NOT NULL,
  receiver_email TEXT,
  receiver_address TEXT NOT NULL,
  receiver_city TEXT NOT NULL,
  receiver_state TEXT,
  receiver_country TEXT NOT NULL,
  receiver_postal_code TEXT,
  shipment_type TEXT NOT NULL DEFAULT 'PARCEL' CHECK (shipment_type IN ('DOCUMENT', 'PARCEL', 'COMMERCIAL', 'SAMPLE', 'PERSONAL', 'OTHER')),
  destination_country TEXT NOT NULL,
  destination_city TEXT,
  package_count INTEGER DEFAULT 1,
  actual_weight REAL NOT NULL DEFAULT 0,
  length REAL DEFAULT 0,
  width REAL DEFAULT 0,
  height REAL DEFAULT 0,
  volumetric_weight REAL DEFAULT 0,
  chargeable_weight REAL DEFAULT 0,
  contents TEXT,
  declared_value REAL DEFAULT 0,
  purpose TEXT,
  special_instructions TEXT,
  status TEXT DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'QUOTED', 'CANCELLED')),
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 12. Couriers Master
CREATE TABLE IF NOT EXISTS couriers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE,
  service_type TEXT,
  contact_person TEXT,
  phone TEXT,
  email TEXT,
  tracking_url TEXT,
  api_endpoint TEXT,
  api_status TEXT DEFAULT 'INACTIVE',
  rate_card TEXT,
  active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 13. Courier Services
CREATE TABLE IF NOT EXISTS courier_services (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  courier_id INTEGER NOT NULL,
  service_name TEXT NOT NULL,
  code TEXT,
  estimated_days TEXT,
  FOREIGN KEY (courier_id) REFERENCES couriers(id) ON DELETE CASCADE
);

-- 14. Quotations
CREATE TABLE IF NOT EXISTS quotations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quotation_code TEXT UNIQUE,
  customer_id INTEGER NOT NULL,
  enquiry_id INTEGER,
  courier_id INTEGER,
  service_type TEXT DEFAULT 'Standard Express',
  actual_weight REAL DEFAULT 0,
  volumetric_weight REAL DEFAULT 0,
  chargeable_weight REAL DEFAULT 0,
  base_rate REAL DEFAULT 0,
  shipping_charge REAL DEFAULT 0,
  pickup_charge REAL DEFAULT 0,
  packing_charge REAL DEFAULT 0,
  customs_charge REAL DEFAULT 0,
  other_charge REAL DEFAULT 0,
  discount REAL DEFAULT 0,
  tax REAL DEFAULT 0,
  total_amount REAL NOT NULL DEFAULT 0,
  valid_until DATE,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED')),
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE SET NULL,
  FOREIGN KEY (courier_id) REFERENCES couriers(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 15. Quotation Items
CREATE TABLE IF NOT EXISTS quotation_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quotation_id INTEGER NOT NULL,
  item_description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  unit_price REAL DEFAULT 0,
  total_price REAL DEFAULT 0,
  FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE CASCADE
);

-- 16. Bookings
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  booking_code TEXT UNIQUE,
  customer_id INTEGER NOT NULL,
  quotation_id INTEGER,
  enquiry_id INTEGER,
  booking_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  pickup_date DATE,
  pickup_address TEXT,
  service_type TEXT,
  courier_id INTEGER,
  payment_status TEXT DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'PARTIAL', 'PAID')),
  booking_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (booking_status IN ('PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED')),
  special_instructions TEXT,
  created_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (quotation_id) REFERENCES quotations(id) ON DELETE SET NULL,
  FOREIGN KEY (enquiry_id) REFERENCES enquiries(id) ON DELETE SET NULL,
  FOREIGN KEY (courier_id) REFERENCES couriers(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 17. Shipments
CREATE TABLE IF NOT EXISTS shipments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  tracking_number TEXT UNIQUE NOT NULL,
  booking_id INTEGER,
  customer_id INTEGER NOT NULL,
  courier_id INTEGER,
  awb_number TEXT,
  service_type TEXT,
  origin TEXT DEFAULT 'India',
  destination TEXT NOT NULL,
  package_count INTEGER DEFAULT 1,
  actual_weight REAL DEFAULT 0,
  volumetric_weight REAL DEFAULT 0,
  chargeable_weight REAL DEFAULT 0,
  declared_value REAL DEFAULT 0,
  contents TEXT,
  pickup_date DATETIME,
  expected_delivery_date DATE,
  current_status TEXT NOT NULL DEFAULT 'BOOKED' CHECK (current_status IN (
    'BOOKED', 'PICKUP_SCHEDULED', 'PICKED_UP', 'RECEIVED_AT_OFFICE', 
    'PACKAGING', 'READY_FOR_DISPATCH', 'HANDED_TO_COURIER', 'IN_TRANSIT', 
    'CUSTOMS_CLEARANCE', 'CUSTOMS_HOLD', 'OUT_FOR_DELIVERY', 'DELIVERED', 
    'DELIVERY_FAILED', 'RETURNED', 'CANCELLED', 'LOST', 'DAMAGED'
  )),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (courier_id) REFERENCES couriers(id) ON DELETE SET NULL
);

-- 18. Packages
CREATE TABLE IF NOT EXISTS packages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  package_code TEXT UNIQUE,
  shipment_id INTEGER NOT NULL,
  package_number INTEGER DEFAULT 1,
  weight REAL DEFAULT 0,
  length REAL DEFAULT 0,
  width REAL DEFAULT 0,
  height REAL DEFAULT 0,
  volumetric_weight REAL DEFAULT 0,
  contents TEXT,
  declared_value REAL DEFAULT 0,
  condition TEXT DEFAULT 'GOOD',
  received_at DATETIME,
  received_by INTEGER,
  photo_url TEXT,
  notes TEXT,
  FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE,
  FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 19. Tracking Events
CREATE TABLE IF NOT EXISTS tracking_events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shipment_id INTEGER NOT NULL,
  status TEXT NOT NULL,
  location TEXT,
  description TEXT,
  event_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  source TEXT DEFAULT 'SYSTEM',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
);

-- 20. Deliveries & POD
CREATE TABLE IF NOT EXISTS deliveries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  shipment_id INTEGER NOT NULL UNIQUE,
  delivery_date DATE NOT NULL,
  delivery_time TIME,
  received_by TEXT NOT NULL,
  signature TEXT,
  pod_file TEXT,
  delivery_notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (shipment_id) REFERENCES shipments(id) ON DELETE CASCADE
);

-- 21. Payments
CREATE TABLE IF NOT EXISTS payments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_code TEXT UNIQUE,
  customer_id INTEGER NOT NULL,
  booking_id INTEGER,
  invoice_id INTEGER,
  amount REAL NOT NULL DEFAULT 0,
  payment_method TEXT NOT NULL DEFAULT 'UPI' CHECK (payment_method IN ('CASH', 'UPI', 'BANK_TRANSFER', 'CARD', 'ONLINE', 'OTHER')),
  transaction_id TEXT,
  payment_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'PAID' CHECK (status IN ('PENDING', 'PARTIAL', 'PAID', 'FAILED', 'REFUNDED')),
  notes TEXT,
  received_by INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE SET NULL,
  FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 22. Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number TEXT UNIQUE NOT NULL,
  booking_id INTEGER,
  customer_id INTEGER NOT NULL,
  total_amount REAL NOT NULL DEFAULT 0,
  paid_amount REAL DEFAULT 0,
  status TEXT DEFAULT 'UNPAID' CHECK (status IN ('UNPAID', 'PARTIAL', 'PAID', 'CANCELLED')),
  issue_date DATE DEFAULT (DATE('now')),
  due_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (booking_id) REFERENCES bookings(id) ON DELETE SET NULL,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
);

-- 23. WhatsApp Contacts
CREATE TABLE IF NOT EXISTS whatsapp_contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL UNIQUE,
  name TEXT,
  customer_id INTEGER,
  lead_id INTEGER,
  last_interaction DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE SET NULL,
  FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE SET NULL
);

-- 24. WhatsApp Conversations
CREATE TABLE IF NOT EXISTS whatsapp_conversations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  contact_id INTEGER NOT NULL,
  status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED', 'PENDING')),
  assigned_to INTEGER,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contact_id) REFERENCES whatsapp_contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (assigned_to) REFERENCES users(id) ON DELETE SET NULL
);

-- 25. WhatsApp Messages
CREATE TABLE IF NOT EXISTS whatsapp_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  conversation_id INTEGER NOT NULL,
  direction TEXT NOT NULL CHECK (direction IN ('INBOUND', 'OUTBOUND')),
  message_type TEXT DEFAULT 'text',
  content TEXT NOT NULL,
  template_id TEXT,
  status TEXT DEFAULT 'SENT' CHECK (status IN ('SENT', 'DELIVERED', 'READ', 'FAILED')),
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (conversation_id) REFERENCES whatsapp_conversations(id) ON DELETE CASCADE
);

-- 26. WhatsApp Templates
CREATE TABLE IF NOT EXISTS whatsapp_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  template_name TEXT NOT NULL UNIQUE,
  category TEXT DEFAULT 'UTILITY',
  language TEXT DEFAULT 'en_US',
  body_content TEXT NOT NULL,
  variables_json TEXT,
  status TEXT DEFAULT 'APPROVED',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 27. Meta Campaigns
CREATE TABLE IF NOT EXISTS meta_campaigns (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meta_campaign_id TEXT UNIQUE NOT NULL,
  campaign_name TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE'
);

-- 28. Meta Adsets
CREATE TABLE IF NOT EXISTS meta_adsets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meta_adset_id TEXT UNIQUE NOT NULL,
  campaign_id INTEGER,
  adset_name TEXT NOT NULL,
  FOREIGN KEY (campaign_id) REFERENCES meta_campaigns(id) ON DELETE CASCADE
);

-- 29. Meta Ads
CREATE TABLE IF NOT EXISTS meta_ads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meta_ad_id TEXT UNIQUE NOT NULL,
  adset_id INTEGER,
  ad_name TEXT NOT NULL,
  FOREIGN KEY (adset_id) REFERENCES meta_adsets(id) ON DELETE CASCADE
);

-- 30. Meta Leads
CREATE TABLE IF NOT EXISTS meta_leads (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  meta_lead_id TEXT UNIQUE NOT NULL,
  ad_id INTEGER,
  form_data_json TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ad_id) REFERENCES meta_ads(id) ON DELETE SET NULL
);

-- 31. Documents
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  entity_type TEXT NOT NULL,
  entity_id INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT,
  uploaded_by INTEGER,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- 32. Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 33. Activity Logs (Audit Log)
CREATE TABLE IF NOT EXISTS activity_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id INTEGER,
  old_value TEXT,
  new_value TEXT,
  ip_address TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 34. System Settings
CREATE TABLE IF NOT EXISTS system_settings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL,
  category TEXT DEFAULT 'GENERAL',
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for High Performance Searching & Filtering
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_to);
CREATE INDEX IF NOT EXISTS idx_leads_mobile ON leads(mobile);
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile);
CREATE INDEX IF NOT EXISTS idx_shipments_tracking ON shipments(tracking_number);
CREATE INDEX IF NOT EXISTS idx_shipments_status ON shipments(current_status);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_followups_date ON lead_followups(followup_date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
