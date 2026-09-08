const { query, queryOne, execute } = require('../db/client');
const { logAudit } = require('../utils/audit.utils');

async function getLeads(req, res, next) {
  try {
    const {
      search, status, source, assigned_to, country,
      page = 1, limit = 10, sortBy = 'created_at', sortOrder = 'DESC', my_leads
    } = req.query;

    const offset = (Number(page) - 1) * Number(limit);
    let whereClauses = ['1=1'];
    let params = [];

    // Filter by My Leads if requested or restricted
    if (my_leads === 'true' || req.query.myLeadsOnly === 'true') {
      whereClauses.push('leads.assigned_to = ?');
      params.push(req.user.id);
    }

    if (search) {
      whereClauses.push('(leads.customer_name LIKE ? OR leads.mobile LIKE ? OR leads.email LIKE ? OR leads.lead_code LIKE ?)');
      const term = `%${search}%`;
      params.push(term, term, term, term);
    }

    if (status) {
      whereClauses.push('leads.status = ?');
      params.push(status);
    }

    if (source) {
      whereClauses.push('leads.source = ?');
      params.push(source);
    }

    if (assigned_to) {
      whereClauses.push('leads.assigned_to = ?');
      params.push(assigned_to);
    }

    if (country) {
      whereClauses.push('leads.destination_country = ?');
      params.push(country);
    }

    const whereString = whereClauses.join(' AND ');

    // Total count
    const countRes = await queryOne(`SELECT COUNT(*) as total FROM leads WHERE ${whereString}`, params);
    const total = countRes ? countRes.total : 0;

    // Leads list
    const sql = `
      SELECT 
        leads.*,
        u.name as assigned_to_name
      FROM leads
      LEFT JOIN users u ON leads.assigned_to = u.id
      WHERE ${whereString}
      ORDER BY leads.${sortBy} ${sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC'}
      LIMIT ? OFFSET ?
    `;

    const leads = await query(sql, [...params, Number(limit), Number(offset)]);

    return res.json({
      success: true,
      data: leads,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    next(err);
  }
}

async function getLeadById(req, res, next) {
  try {
    const { id } = req.params;
    const lead = await queryOne(`
      SELECT leads.*, u.name as assigned_to_name
      FROM leads
      LEFT JOIN users u ON leads.assigned_to = u.id
      WHERE leads.id = ? OR leads.lead_code = ?
    `, [id, id]);

    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Lead activities
    const activities = await query(`
      SELECT la.*, u.name as user_name
      FROM lead_activities la
      LEFT JOIN users u ON la.user_id = u.id
      WHERE la.lead_id = ?
      ORDER BY la.created_at DESC
    `, [lead.id]);

    // Lead follow-ups
    const followups = await query(`
      SELECT lf.*, u.name as assigned_to_name
      FROM lead_followups lf
      LEFT JOIN users u ON lf.assigned_to = u.id
      WHERE lf.lead_id = ?
      ORDER BY lf.followup_date DESC
    `, [lead.id]);

    return res.json({
      success: true,
      lead,
      activities,
      followups
    });
  } catch (err) {
    next(err);
  }
}

async function createLead(req, res, next) {
  try {
    const {
      customer_name, mobile, whatsapp_number, email, city, state, country,
      source = 'Manual', campaign, ad_set, ad, requirement, destination_country, destination_city,
      package_type = 'PARCEL', estimated_weight = 0, notes, assigned_to, status = 'NEW'
    } = req.body;

    if (!customer_name || !mobile) {
      return res.status(400).json({ success: false, message: 'Customer name and mobile number are required' });
    }

    // Duplicate check
    const existing = await queryOne(
      'SELECT id, lead_code FROM leads WHERE mobile = ? OR (email IS NOT NULL AND email != "" AND email = ?)',
      [mobile, email || '']
    );

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'Duplicate lead detected with matching mobile or email',
        existingLeadCode: existing.lead_code
      });
    }

    const leadCode = `LD-${Math.floor(100000 + Math.random() * 900000)}`;
    const assignee = assigned_to || req.user.id;

    const result = await execute(`
      INSERT INTO leads (
        lead_code, customer_name, mobile, whatsapp_number, email, city, state, country,
        source, campaign, ad_set, ad, requirement, destination_country, destination_city,
        package_type, estimated_weight, notes, assigned_to, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      leadCode, customer_name, mobile, whatsapp_number || mobile, email || null, city || null, state || null, country || 'India',
      source, campaign || null, ad_set || null, ad || null, requirement || null, destination_country || null, destination_city || null,
      package_type, estimated_weight, notes || null, assignee, status
    ]);

    const leadId = result.lastInsertRowid;

    // Log Activity
    await execute(
      'INSERT INTO lead_activities (lead_id, user_id, activity_type, description) VALUES (?, ?, ?, ?)',
      [leadId, req.user.id, 'LEAD_CREATED', `Lead created via ${source}`]
    );

    await logAudit({
      userId: req.user.id,
      action: 'CREATE',
      entity: 'leads',
      entityId: leadId,
      newValue: { leadCode, customer_name, mobile, source },
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'Lead created successfully',
      leadId,
      lead_code: leadCode
    });
  } catch (err) {
    next(err);
  }
}

async function updateLead(req, res, next) {
  try {
    const { id } = req.params;
    const oldLead = await queryOne('SELECT * FROM leads WHERE id = ?', [id]);
    if (!oldLead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    const {
      customer_name, mobile, whatsapp_number, email, city, state, country,
      source, campaign, ad_set, ad, requirement, destination_country, destination_city,
      package_type, estimated_weight, notes, assigned_to, status
    } = req.body;

    await execute(`
      UPDATE leads SET
        customer_name = ?, mobile = ?, whatsapp_number = ?, email = ?, city = ?, state = ?, country = ?,
        source = ?, campaign = ?, ad_set = ?, ad = ?, requirement = ?, destination_country = ?, destination_city = ?,
        package_type = ?, estimated_weight = ?, notes = ?, assigned_to = ?, status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `, [
      customer_name || oldLead.customer_name,
      mobile || oldLead.mobile,
      whatsapp_number !== undefined ? whatsapp_number : oldLead.whatsapp_number,
      email !== undefined ? email : oldLead.email,
      city !== undefined ? city : oldLead.city,
      state !== undefined ? state : oldLead.state,
      country || oldLead.country,
      source || oldLead.source,
      campaign !== undefined ? campaign : oldLead.campaign,
      ad_set !== undefined ? ad_set : oldLead.ad_set,
      ad !== undefined ? ad : oldLead.ad,
      requirement !== undefined ? requirement : oldLead.requirement,
      destination_country !== undefined ? destination_country : oldLead.destination_country,
      destination_city !== undefined ? destination_city : oldLead.destination_city,
      package_type || oldLead.package_type,
      estimated_weight !== undefined ? estimated_weight : oldLead.estimated_weight,
      notes !== undefined ? notes : oldLead.notes,
      assigned_to || oldLead.assigned_to,
      status || oldLead.status,
      id
    ]);

    if (status && status !== oldLead.status) {
      await execute(
        'INSERT INTO lead_activities (lead_id, user_id, activity_type, description) VALUES (?, ?, ?, ?)',
        [id, req.user.id, 'STATUS_CHANGE', `Status updated from ${oldLead.status} to ${status}`]
      );
    }

    await logAudit({
      userId: req.user.id,
      action: 'UPDATE',
      entity: 'leads',
      entityId: id,
      oldValue: { status: oldLead.status, assigned_to: oldLead.assigned_to },
      newValue: { status, assigned_to },
      ipAddress: req.ip
    });

    return res.json({ success: true, message: 'Lead updated successfully' });
  } catch (err) {
    next(err);
  }
}

async function deleteLead(req, res, next) {
  try {
    const { id } = req.params;
    const lead = await queryOne('SELECT lead_code FROM leads WHERE id = ?', [id]);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    await execute('DELETE FROM leads WHERE id = ?', [id]);

    await logAudit({
      userId: req.user.id,
      action: 'DELETE',
      entity: 'leads',
      entityId: id,
      oldValue: lead.lead_code,
      ipAddress: req.ip
    });

    return res.json({ success: true, message: 'Lead deleted successfully' });
  } catch (err) {
    next(err);
  }
}

async function bulkAssignLeads(req, res, next) {
  try {
    const { lead_ids, assigned_to } = req.body;
    if (!Array.isArray(lead_ids) || !assigned_to) {
      return res.status(400).json({ success: false, message: 'lead_ids array and assigned_to user ID required' });
    }

    for (const leadId of lead_ids) {
      await execute('UPDATE leads SET assigned_to = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [assigned_to, leadId]);
      await execute(
        'INSERT INTO lead_activities (lead_id, user_id, activity_type, description) VALUES (?, ?, ?, ?)',
        [leadId, req.user.id, 'ASSIGNMENT', `Lead assigned to user ID ${assigned_to}`]
      );
    }

    return res.json({ success: true, message: `Successfully updated ${lead_ids.length} leads` });
  } catch (err) {
    next(err);
  }
}

async function bulkStatusUpdate(req, res, next) {
  try {
    const { lead_ids, status } = req.body;
    if (!Array.isArray(lead_ids) || !status) {
      return res.status(400).json({ success: false, message: 'lead_ids array and status required' });
    }

    for (const leadId of lead_ids) {
      await execute('UPDATE leads SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [status, leadId]);
      await execute(
        'INSERT INTO lead_activities (lead_id, user_id, activity_type, description) VALUES (?, ?, ?, ?)',
        [leadId, req.user.id, 'STATUS_CHANGE', `Bulk status updated to ${status}`]
      );
    }

    return res.json({ success: true, message: `Bulk status updated for ${lead_ids.length} leads` });
  } catch (err) {
    next(err);
  }
}

async function convertLeadToCustomer(req, res, next) {
  try {
    const { id } = req.params;
    const lead = await queryOne('SELECT * FROM leads WHERE id = ?', [id]);
    if (!lead) {
      return res.status(404).json({ success: false, message: 'Lead not found' });
    }

    // Check if customer already exists for this lead
    const existingCust = await queryOne('SELECT id, customer_code FROM customers WHERE lead_id = ? OR mobile = ?', [id, lead.mobile]);
    if (existingCust) {
      return res.json({
        success: true,
        message: 'Customer already exists for this lead',
        customerId: existingCust.id,
        customer_code: existingCust.customer_code
      });
    }

    const customerCode = `CUST-${Math.floor(100000 + Math.random() * 900000)}`;

    const resCust = await execute(`
      INSERT INTO customers (customer_code, lead_id, name, mobile, whatsapp_number, email, city, state, country, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      customerCode, lead.id, lead.customer_name, lead.mobile, lead.whatsapp_number || lead.mobile,
      lead.email, lead.city, lead.state, lead.country || 'India', lead.notes
    ]);

    const customerId = resCust.lastInsertRowid;

    // Update lead status to BOOKED / QUALIFIED
    await execute('UPDATE leads SET status = "QUALIFIED", updated_at = CURRENT_TIMESTAMP WHERE id = ?', [id]);
    await execute(
      'INSERT INTO lead_activities (lead_id, user_id, activity_type, description) VALUES (?, ?, ?, ?)',
      [id, req.user.id, 'CONVERTED', `Converted lead to customer ${customerCode}`]
    );

    await logAudit({
      userId: req.user.id,
      action: 'CONVERT',
      entity: 'customers',
      entityId: customerId,
      newValue: { lead_id: id, customerCode },
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'Lead converted to Customer successfully',
      customerId,
      customer_code: customerCode
    });
  } catch (err) {
    next(err);
  }
}

async function processCsvImport(req, res, next) {
  try {
    const { rows } = req.body; // Array of object parsed from frontend CSV
    if (!Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid data rows submitted' });
    }

    let importedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    const errors = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = row.name || row.customer_name;
      const mobile = row.mobile || row.phone;

      if (!name || !mobile) {
        errorCount++;
        errors.push({ row: i + 1, error: 'Missing name or mobile' });
        continue;
      }

      // Check duplicate
      const dup = await queryOne('SELECT id FROM leads WHERE mobile = ?', [mobile]);
      if (dup) {
        duplicateCount++;
        errors.push({ row: i + 1, error: `Duplicate mobile number: ${mobile}` });
        continue;
      }

      const leadCode = `LD-CSV-${Math.floor(100000 + Math.random() * 900000)}`;
      await execute(`
        INSERT INTO leads (
          lead_code, customer_name, mobile, whatsapp_number, email, country, city,
          requirement, destination_country, estimated_weight, source, notes, assigned_to
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        leadCode, name, mobile, row.whatsapp || mobile, row.email || null, row.country || 'India', row.city || null,
        row.requirement || null, row.destination || row.destination_country || null,
        parseFloat(row.weight) || 0, 'CSV Import', row.notes || null, req.user.id
      ]);

      importedCount++;
    }

    return res.json({
      success: true,
      summary: {
        totalRows: rows.length,
        importedRows: importedCount,
        duplicateRows: duplicateCount,
        invalidRows: errorCount,
        errors
      }
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getLeads,
  getLeadById,
  createLead,
  updateLead,
  deleteLead,
  bulkAssignLeads,
  bulkStatusUpdate,
  convertLeadToCustomer,
  processCsvImport
};
