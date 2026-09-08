const { query, queryOne, execute } = require('../db/client');
const env = require('../config/env');
const { logAudit } = require('../utils/audit.utils');

async function getMetaLeads(req, res, next) {
  try {
    const leads = await query(`
      SELECT ml.*, ma.ad_name, mc.campaign_name
      FROM meta_leads ml
      LEFT JOIN meta_ads ma ON ml.ad_id = ma.id
      LEFT JOIN meta_adsets mas ON ma.adset_id = mas.id
      LEFT JOIN meta_campaigns mc ON mas.campaign_id = mc.id
      ORDER BY ml.id DESC
    `);
    return res.json({ success: true, leads });
  } catch (err) {
    next(err);
  }
}

async function verifyMetaWebhook(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === env.META_VERIFY_TOKEN) {
      console.log('Meta Lead Ads Webhook Verified!');
      return res.status(200).send(challenge);
    }
    return res.sendStatus(403);
  }
  return res.sendStatus(400);
}

async function handleMetaLeadWebhook(req, res) {
  try {
    const body = req.body;

    if (body.object === 'page' || body.object === 'leadgen') {
      const entries = body.entry || [];
      for (const entry of entries) {
        const changes = entry.changes || [];
        for (const change of changes) {
          if (change.field === 'leadgen') {
            const leadgenId = change.value.leadgen_id;
            const adId = change.value.ad_id;
            const formId = change.value.form_id;

            // Check duplicate Meta lead
            const existing = await queryOne('SELECT id FROM meta_leads WHERE meta_lead_id = ?', [leadgenId]);
            if (!existing) {
              const resMetaLead = await execute(
                'INSERT INTO meta_leads (meta_lead_id, form_data_json) VALUES (?, ?)',
                [leadgenId, JSON.stringify(change.value)]
              );

              // Auto-create CRM Lead from Meta payload
              const leadCode = `LD-META-${Math.floor(100000 + Math.random() * 900000)}`;
              const sampleName = change.value.full_name || `Meta Lead ${leadgenId}`;
              const sampleMobile = change.value.phone_number || `+91${Math.floor(9000000000 + Math.random() * 999999999)}`;

              // Duplicate CRM lead check
              const dupCrm = await queryOne('SELECT id FROM leads WHERE mobile = ?', [sampleMobile]);
              if (!dupCrm) {
                // Assign to Sales user
                const salesUser = await queryOne('SELECT id FROM users WHERE role = ? LIMIT 1', ['SALES']);
                const assignee = salesUser ? salesUser.id : 1;

                await execute(`
                  INSERT INTO leads (
                    lead_code, customer_name, mobile, email, source, campaign, requirement, status, assigned_to
                  ) VALUES (?, ?, ?, ?, 'Meta Ads', ?, 'Meta Lead Ad Form Submission', 'NEW', ?)
                `, [leadCode, sampleName, sampleMobile, change.value.email || null, `Form_${formId}`, assignee]);
              }
            }
          }
        }
      }
      return res.status(200).send('EVENT_RECEIVED');
    }
    return res.sendStatus(404);
  } catch (err) {
    console.error('Meta Lead Ads Webhook Error:', err);
    return res.sendStatus(500);
  }
}

module.exports = {
  getMetaLeads,
  verifyMetaWebhook,
  handleMetaLeadWebhook
};
