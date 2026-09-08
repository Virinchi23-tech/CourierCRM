const bcrypt = require('bcryptjs');
const { query, execute } = require('./client');
const { initDb } = require('./init');

async function seedDb() {
  await initDb();
  console.log('Seeding initial data into CourierCRM database...');

  // 1. Roles & Permissions
  const roles = [
    { name: 'ADMIN', description: 'Full access to all CRM functions and settings' },
    { name: 'SALES', description: 'Leads, Customers, Quotations, Follow-ups, WhatsApp' },
    { name: 'OPERATIONS', description: 'Bookings, Shipments, Packages, Tracking, Delivery POD' }
  ];

  for (const role of roles) {
    const existing = await query('SELECT id FROM roles WHERE name = ?', [role.name]);
    if (existing.length === 0) {
      await execute('INSERT INTO roles (name, description) VALUES (?, ?)', [role.name, role.description]);
    }
  }

  // 2. Default Users
  const salt = await bcrypt.genSalt(10);
  const adminPass = await bcrypt.hash('Admin@123', salt);
  const salesPass = await bcrypt.hash('Sales@123', salt);
  const opsPass = await bcrypt.hash('Ops@123', salt);

  const users = [
    { name: 'Alexander Wright (Admin)', email: 'admin@couriercrm.com', password_hash: adminPass, role: 'ADMIN', mobile: '+919876543210' },
    { name: 'Sarah Jenkins (Sales)', email: 'sales@couriercrm.com', password_hash: salesPass, role: 'SALES', mobile: '+919876543211' },
    { name: 'Marcus Vance (Ops)', email: 'ops@couriercrm.com', password_hash: opsPass, role: 'OPERATIONS', mobile: '+919876543212' }
  ];

  let adminId = 1, salesId = 2, opsId = 3;

  for (const user of users) {
    const existing = await query('SELECT id FROM users WHERE email = ?', [user.email]);
    if (existing.length === 0) {
      const res = await execute(
        'INSERT INTO users (name, email, password_hash, role, mobile, status) VALUES (?, ?, ?, ?, ?, ?)',
        [user.name, user.email, user.password_hash, user.role, user.mobile, 'ACTIVE']
      );
      if (user.role === 'ADMIN') adminId = res.lastInsertRowid;
      if (user.role === 'SALES') salesId = res.lastInsertRowid;
      if (user.role === 'OPERATIONS') opsId = res.lastInsertRowid;
    } else {
      if (user.role === 'ADMIN') adminId = existing[0].id;
      if (user.role === 'SALES') salesId = existing[0].id;
      if (user.role === 'OPERATIONS') opsId = existing[0].id;
    }
  }

  // 3. Lead Sources
  const sources = [
    'Meta Ads', 'Facebook', 'Instagram', 'WhatsApp', 'Website', 'CSV Import', 'Manual', 'Referral', 'Existing Customer'
  ];

  for (const src of sources) {
    const existing = await query('SELECT id FROM lead_sources WHERE name = ?', [src]);
    if (existing.length === 0) {
      await execute('INSERT INTO lead_sources (name) VALUES (?)', [src]);
    }
  }

  // 4. Couriers
  const couriers = [
    { name: 'DHL Express', service_type: 'International Express', tracking_url: 'https://www.dhl.com/en/express/tracking.html?AWB=', contact_person: 'David Miller', phone: '+18002255345', email: 'support@dhl.com' },
    { name: 'FedEx Priority', service_type: 'Air Freight Express', tracking_url: 'https://www.fedex.com/fedextrack/?trknbr=', contact_person: 'Karen White', phone: '+18004633339', email: 'support@fedex.com' },
    { name: 'UPS Worldwide', service_type: 'Global Saver', tracking_url: 'https://www.ups.com/track?tracknum=', contact_person: 'Robert Lang', phone: '+18007425877', email: 'support@ups.com' },
    { name: 'Aramex International', service_type: 'GCC & Middle East Express', tracking_url: 'https://www.aramex.com/express/track-results-detail?mode=0&expressNumber=', contact_person: 'Tariq Al-Mansoor', phone: '+97148888888', email: 'support@aramex.com' },
    { name: 'DTDC Premium', service_type: 'South Asia Express', tracking_url: 'https://www.dtdc.in/tracking/shipment-tracking.asp?strBookingID=', contact_person: 'Rajesh Sharma', phone: '+9118002090343', email: 'support@dtdc.com' }
  ];

  const courierIds = {};
  for (const c of couriers) {
    const existing = await query('SELECT id FROM couriers WHERE name = ?', [c.name]);
    if (existing.length === 0) {
      const res = await execute(
        'INSERT INTO couriers (name, service_type, tracking_url, contact_person, phone, email, active) VALUES (?, ?, ?, ?, ?, ?, 1)',
        [c.name, c.service_type, c.tracking_url, c.contact_person, c.phone, c.email]
      );
      courierIds[c.name] = res.lastInsertRowid;
    } else {
      courierIds[c.name] = existing[0].id;
    }
  }

  // 5. Sample Leads
  const leadsData = [
    { code: 'LD-1001', name: 'John Doe Electronics', mobile: '+14155552671', email: 'john@doeelectronics.com', city: 'San Jose', country: 'United States', source: 'Meta Ads', destCountry: 'United Kingdom', destCity: 'London', pkgType: 'PARCEL', weight: 12.5, status: 'QUALIFIED', notes: 'Urgent express delivery for PCB components.' },
    { code: 'LD-1002', name: 'Global Tech Traders', mobile: '+447911123456', email: 'info@globaltechtraders.co.uk', city: 'Manchester', country: 'United Kingdom', source: 'Website', destCountry: 'Canada', destCity: 'Toronto', pkgType: 'COMMERCIAL', weight: 45.0, status: 'QUOTATION_SENT', notes: 'Monthly bulk commercial export inquiry.' },
    { code: 'LD-1003', name: 'Priya Sharma Garments', mobile: '+919811223344', email: 'priya@sharmagarments.in', city: 'New Delhi', country: 'India', source: 'Instagram', destCountry: 'United Arab Emirates', destCity: 'Dubai', pkgType: 'SAMPLE', weight: 5.2, status: 'BOOKED', notes: 'Textile fabric samples for buyer approval.' },
    { code: 'LD-1004', name: 'Dr. Robert Carter', mobile: '+61412345678', email: 'robert.carter@sydneypharma.au', city: 'Sydney', country: 'Australia', source: 'WhatsApp', destCountry: 'Germany', destCity: 'Frankfurt', pkgType: 'PARCEL', weight: 8.0, status: 'NEW', notes: 'Temperature sensitive medical document & sample.' },
    { code: 'LD-1005', name: 'Anita Patel', mobile: '+919988776655', email: 'anita.p@gmail.com', city: 'Ahmedabad', country: 'India', source: 'Referral', destCountry: 'United States', destCity: 'Chicago', pkgType: 'PERSONAL', weight: 18.0, status: 'CONTACTED', notes: 'Personal belongings and sweets package for family.' }
  ];

  const leadIds = {};
  for (const l of leadsData) {
    const existing = await query('SELECT id FROM leads WHERE lead_code = ?', [l.code]);
    if (existing.length === 0) {
      const res = await execute(
        `INSERT INTO leads (lead_code, customer_name, mobile, email, city, country, source, destination_country, destination_city, package_type, estimated_weight, notes, status, assigned_to) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [l.code, l.name, l.mobile, l.email, l.city, l.country, l.source, l.destCountry, l.destCity, l.pkgType, l.weight, l.notes, l.status, salesId]
      );
      leadIds[l.code] = res.lastInsertRowid;
    } else {
      leadIds[l.code] = existing[0].id;
    }
  }

  // 6. Sample Customers
  const customersData = [
    { code: 'CUST-2001', name: 'Priya Sharma Garments', mobile: '+919811223344', email: 'priya@sharmagarments.in', company: 'Priya Garments Pvt Ltd', address: '45 Okhla Industrial Area Phase 3', city: 'New Delhi', country: 'India', leadId: leadIds['LD-1003'] },
    { code: 'CUST-2002', name: 'John Doe Electronics', mobile: '+14155552671', email: 'john@doeelectronics.com', company: 'Doe Tech LLC', address: '789 Innovation Way', city: 'San Jose', country: 'United States', leadId: leadIds['LD-1001'] }
  ];

  const customerIds = {};
  for (const cust of customersData) {
    const existing = await query('SELECT id FROM customers WHERE customer_code = ?', [cust.code]);
    if (existing.length === 0) {
      const res = await execute(
        `INSERT INTO customers (customer_code, lead_id, name, mobile, email, company_name, address, city, country) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [cust.code, cust.leadId, cust.name, cust.mobile, cust.email, cust.company, cust.address, cust.city, cust.country]
      );
      customerIds[cust.code] = res.lastInsertRowid;
    } else {
      customerIds[cust.code] = existing[0].id;
    }
  }

  // 7. Enquiries, Quotations, Bookings, Shipments, Payments
  const existingEnquiry = await query('SELECT id FROM enquiries WHERE enquiry_code = ?', ['ENQ-3001']);
  let enquiryId;
  if (existingEnquiry.length === 0) {
    const res = await execute(
      `INSERT INTO enquiries (
        enquiry_code, customer_id, lead_id, sender_name, sender_mobile, sender_email, sender_address, sender_city, sender_country,
        receiver_name, receiver_mobile, receiver_address, receiver_city, receiver_country, receiver_postal_code,
        shipment_type, destination_country, destination_city, package_count, actual_weight, length, width, height, volumetric_weight, chargeable_weight, contents, declared_value, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'ENQ-3001', customerIds['CUST-2001'], leadIds['LD-1003'], 'Priya Sharma', '+919811223344', 'priya@sharmagarments.in', '45 Okhla Ind Area', 'New Delhi', 'India',
        'Dubai Fashion Mart', '+97143332211', 'Bur Dubai Business Center Suite 402', 'Dubai', 'United Arab Emirates', '00000',
        'SAMPLE', 'United Arab Emirates', 'Dubai', 2, 5.2, 30, 20, 20, 2.4, 5.2, 'High Quality Cotton Fabric Samples', 450.00, salesId
      ]
    );
    enquiryId = res.lastInsertRowid;
  } else {
    enquiryId = existingEnquiry[0].id;
  }

  // Quotation
  const existingQuote = await query('SELECT id FROM quotations WHERE quotation_code = ?', ['QT-4001']);
  let quoteId;
  if (existingQuote.length === 0) {
    const res = await execute(
      `INSERT INTO quotations (
        quotation_code, customer_id, enquiry_id, courier_id, service_type, actual_weight, volumetric_weight, chargeable_weight,
        base_rate, shipping_charge, pickup_charge, packing_charge, customs_charge, discount, tax, total_amount, valid_until, status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'QT-4001', customerIds['CUST-2001'], enquiryId, courierIds['DHL Express'], 'International Express', 5.2, 2.4, 5.2,
        450.00, 2340.00, 150.00, 100.00, 200.00, 90.00, 486.00, 3186.00, '2026-10-01', 'ACCEPTED', salesId
      ]
    );
    quoteId = res.lastInsertRowid;
  } else {
    quoteId = existingQuote[0].id;
  }

  // Booking
  const existingBooking = await query('SELECT id FROM bookings WHERE booking_code = ?', ['BK-5001']);
  let bookingId;
  if (existingBooking.length === 0) {
    const res = await execute(
      `INSERT INTO bookings (
        booking_code, customer_id, quotation_id, enquiry_id, pickup_date, pickup_address, service_type, courier_id, payment_status, booking_status, created_by
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'BK-5001', customerIds['CUST-2001'], quoteId, enquiryId, '2026-09-09', '45 Okhla Ind Area Phase 3, New Delhi', 'International Express', courierIds['DHL Express'], 'PAID', 'CONFIRMED', salesId
      ]
    );
    bookingId = res.lastInsertRowid;
  } else {
    bookingId = existingBooking[0].id;
  }

  // Payment
  const existingPayment = await query('SELECT id FROM payments WHERE payment_code = ?', ['PAY-6001']);
  if (existingPayment.length === 0) {
    await execute(
      `INSERT INTO payments (payment_code, customer_id, booking_id, amount, payment_method, transaction_id, status, received_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      ['PAY-6001', customerIds['CUST-2001'], bookingId, 3186.00, 'UPI', 'UPI/20260908/99881122', 'PAID', salesId]
    );
  }

  // Shipments (3 realistic shipments with different statuses)
  const sampleShipments = [
    {
      tracking: 'ICC-882091-IN',
      awb: 'DHL-992018234',
      status: 'IN_TRANSIT',
      dest: 'Dubai, UAE',
      courier: courierIds['DHL Express'],
      pkgCount: 2,
      weight: 5.2,
      expected: '2026-09-12',
      booking: bookingId
    },
    {
      tracking: 'ICC-773412-US',
      awb: 'FDX-771209384',
      status: 'CUSTOMS_HOLD',
      dest: 'Chicago, USA',
      courier: courierIds['FedEx Priority'],
      pkgCount: 1,
      weight: 18.0,
      expected: '2026-09-15',
      booking: null
    },
    {
      tracking: 'ICC-661092-UK',
      awb: 'UPS-551029384',
      status: 'DELIVERED',
      dest: 'London, UK',
      courier: courierIds['UPS Worldwide'],
      pkgCount: 3,
      weight: 12.5,
      expected: '2026-09-07',
      booking: null
    }
  ];

  for (const ship of sampleShipments) {
    const existingShipment = await query('SELECT id FROM shipments WHERE tracking_number = ?', [ship.tracking]);
    let shipmentId;
    if (existingShipment.length === 0) {
      const res = await execute(
        `INSERT INTO shipments (
          tracking_number, booking_id, customer_id, courier_id, awb_number, service_type, origin, destination,
          package_count, actual_weight, volumetric_weight, chargeable_weight, expected_delivery_date, current_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          ship.tracking, ship.booking, customerIds['CUST-2001'], ship.courier, ship.awb, 'Express Air', 'New Delhi, India', ship.dest,
          ship.pkgCount, ship.weight, ship.weight * 0.8, ship.weight, ship.expected, ship.status
        ]
      );
      shipmentId = res.lastInsertRowid;

      // Packages for shipment
      await execute(
        `INSERT INTO packages (package_code, shipment_id, package_number, weight, length, width, height, volumetric_weight, contents, condition)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [`PKG-${shipmentId}-1`, shipmentId, 1, ship.weight / ship.pkgCount, 30, 20, 20, 2.4, 'Garments & Samples', 'GOOD']
      );

      // Tracking Events
      await execute(
        `INSERT INTO tracking_events (shipment_id, status, location, description, source)
         VALUES (?, ?, ?, ?, ?)`,
        [shipmentId, 'BOOKED', 'New Delhi, India', 'Shipment booking created in CourierCRM', 'SYSTEM']
      );
      await execute(
        `INSERT INTO tracking_events (shipment_id, status, location, description, source)
         VALUES (?, ?, ?, ?, ?)`,
        [shipmentId, 'HANDED_TO_COURIER', 'IGIA Cargo Terminal, New Delhi', `Package handed over to ${ship.status === 'DELIVERED' ? 'UPS' : 'DHL'} Air Courier`, 'OPERATIONS']
      );

      if (ship.status === 'DELIVERED') {
        await execute(
          `INSERT INTO tracking_events (shipment_id, status, location, description, source)
           VALUES (?, ?, ?, ?, ?)`,
          [shipmentId, 'DELIVERED', 'London, UK', 'Package delivered successfully to recipient', 'COURIER_API']
        );
        await execute(
          `INSERT INTO deliveries (shipment_id, delivery_date, delivery_time, received_by, delivery_notes)
           VALUES (?, ?, ?, ?, ?)`,
          [shipmentId, '2026-09-07', '14:30:00', 'Arthur Dent', 'Signed at front desk reception']
        );
      }
    }
  }

  // 8. Follow-ups
  const existingFollowup = await query('SELECT id FROM lead_followups WHERE notes LIKE ?', ['%Initial follow-up call%']);
  if (existingFollowup.length === 0) {
    await execute(
      `INSERT INTO lead_followups (lead_id, assigned_to, followup_date, followup_time, type, notes, status)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [leadIds['LD-1001'], salesId, '2026-09-08', '11:00:00', 'CALL', 'Initial follow-up call regarding component shipment rate card.', 'PENDING']
    );
  }

  // 9. WhatsApp Templates
  const templates = [
    { name: 'lead_created', body: 'Thank you for contacting International Courier CRM. Our sales team will contact you shortly regarding your shipment requirement.' },
    { name: 'quotation_ready', body: 'Dear {{1}}, your international courier quotation {{2}} for shipment to {{3}} is ready. Total amount: {{4}}.' },
    { name: 'payment_received', body: 'Dear {{1}}, your payment of {{2}} for booking {{3}} has been received successfully. Thank you!' },
    { name: 'booking_confirmed', body: 'Your courier booking {{1}} has been confirmed. Pickup scheduled on {{2}}.' },
    { name: 'shipment_dispatched', body: 'Your shipment {{1}} (AWB: {{2}}) has been dispatched via {{3}}. Track live: {{4}}' },
    { name: 'out_for_delivery', body: 'Good news! Your shipment {{1}} is out for delivery in {{2}} today.' },
    { name: 'delivered_pod', body: 'Your shipment {{1}} has been delivered to {{2}} on {{3}}. Thank you for choosing CourierCRM!' }
  ];

  for (const t of templates) {
    const existing = await query('SELECT id FROM whatsapp_templates WHERE template_name = ?', [t.name]);
    if (existing.length === 0) {
      await execute('INSERT INTO whatsapp_templates (template_name, body_content) VALUES (?, ?)', [t.name, t.body]);
    }
  }

  // 10. System Settings
  const settings = [
    { key: 'COMPANY_NAME', value: 'International Courier CRM Services', category: 'GENERAL', description: 'Company Display Name' },
    { key: 'DEFAULT_CURRENCY', value: 'INR', category: 'GENERAL', description: 'Default Currency Code' },
    { key: 'VOLUMETRIC_FACTOR', value: '5000', category: 'COURIER', description: 'Standard Volumetric Factor (L x W x H / 5000)' },
    { key: 'TAX_RATE_PERCENT', value: '18', category: 'BILLING', description: 'GST / Tax Percentage' }
  ];

  for (const s of settings) {
    const existing = await query('SELECT id FROM system_settings WHERE key = ?', [s.key]);
    if (existing.length === 0) {
      await execute('INSERT INTO system_settings (key, value, category, description) VALUES (?, ?, ?, ?)', [s.key, s.value, s.category, s.description]);
    }
  }

  console.log('Database seeding completed successfully!');
}

if (require.main === module) {
  seedDb()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Seeding error:', err);
      process.exit(1);
    });
}

module.exports = { seedDb };
