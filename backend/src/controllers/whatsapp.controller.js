const { query, queryOne, execute } = require('../db/client');
const env = require('../config/env');
const { logAudit } = require('../utils/audit.utils');

async function getConversations(req, res, next) {
  try {
    const conversations = await query(`
      SELECT wc.*, contact.name as contact_name, contact.phone as contact_phone,
             l.customer_name as lead_name, c.name as customer_name,
             (SELECT content FROM whatsapp_messages WHERE conversation_id = wc.id ORDER BY id DESC LIMIT 1) as last_message,
             (SELECT timestamp FROM whatsapp_messages WHERE conversation_id = wc.id ORDER BY id DESC LIMIT 1) as last_message_time
      FROM whatsapp_conversations wc
      JOIN whatsapp_contacts contact ON wc.contact_id = contact.id
      LEFT JOIN leads l ON contact.lead_id = l.id
      LEFT JOIN customers c ON contact.customer_id = c.id
      ORDER BY last_message_time DESC
    `);

    return res.json({ success: true, conversations });
  } catch (err) {
    next(err);
  }
}

async function getMessages(req, res, next) {
  try {
    const { conversationId } = req.params;
    const messages = await query('SELECT * FROM whatsapp_messages WHERE conversation_id = ? ORDER BY timestamp ASC', [conversationId]);
    return res.json({ success: true, messages });
  } catch (err) {
    next(err);
  }
}

async function sendMessage(req, res, next) {
  try {
    const { conversation_id, phone, content, template_id } = req.body;

    let convId = conversation_id;

    if (!convId && phone) {
      // Find or create contact
      let contact = await queryOne('SELECT id FROM whatsapp_contacts WHERE phone = ?', [phone]);
      if (!contact) {
        const resContact = await execute('INSERT INTO whatsapp_contacts (phone, name) VALUES (?, ?)', [phone, `Contact ${phone}`]);
        contact = { id: resContact.lastInsertRowid };
      }
      let conv = await queryOne('SELECT id FROM whatsapp_conversations WHERE contact_id = ?', [contact.id]);
      if (!conv) {
        const resConv = await execute('INSERT INTO whatsapp_conversations (contact_id, assigned_to) VALUES (?, ?)', [contact.id, req.user.id]);
        convId = resConv.lastInsertRowid;
      } else {
        convId = conv.id;
      }
    }

    if (!convId || !content) {
      return res.status(400).json({ success: false, message: 'conversation_id (or phone) and content are required' });
    }

    const result = await execute(`
      INSERT INTO whatsapp_messages (conversation_id, direction, message_type, content, template_id, status)
      VALUES (?, 'OUTBOUND', 'text', ?, ?, 'SENT')
    `, [convId, content, template_id || null]);

    await execute('UPDATE whatsapp_conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ?', [convId]);

    await logAudit({
      userId: req.user.id,
      action: 'WHATSAPP_MESSAGE',
      entity: 'whatsapp_messages',
      entityId: result.lastInsertRowid,
      newValue: { convId, content: content.substring(0, 50) },
      ipAddress: req.ip
    });

    return res.status(201).json({
      success: true,
      message: 'WhatsApp message sent successfully',
      messageId: result.lastInsertRowid
    });
  } catch (err) {
    next(err);
  }
}

async function getTemplates(req, res, next) {
  try {
    const templates = await query('SELECT * FROM whatsapp_templates ORDER BY template_name ASC');
    return res.json({ success: true, templates });
  } catch (err) {
    next(err);
  }
}

// Meta Webhook Verification for WhatsApp Cloud API
async function verifyWebhook(req, res) {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode && token) {
    if (mode === 'subscribe' && token === env.META_VERIFY_TOKEN) {
      console.log('WhatsApp Webhook Verified Successfully');
      return res.status(200).send(challenge);
    } else {
      return res.sendStatus(403);
    }
  }
  return res.sendStatus(400);
}

// Handle Incoming WhatsApp Webhook Events
async function handleWebhookEvent(req, res) {
  try {
    const body = req.body;
    if (body.object) {
      if (body.entry && body.entry[0].changes && body.entry[0].changes[0].value.messages) {
        const message = body.entry[0].changes[0].value.messages[0];
        const fromPhone = message.from;
        const text = message.text ? message.text.body : 'Media/Attachment';

        let contact = await queryOne('SELECT id FROM whatsapp_contacts WHERE phone = ?', [fromPhone]);
        if (!contact) {
          const resContact = await execute('INSERT INTO whatsapp_contacts (phone, name) VALUES (?, ?)', [fromPhone, `WhatsApp User ${fromPhone}`]);
          contact = { id: resContact.lastInsertRowid };
        }

        let conv = await queryOne('SELECT id FROM whatsapp_conversations WHERE contact_id = ?', [contact.id]);
        if (!conv) {
          const resConv = await execute('INSERT INTO whatsapp_conversations (contact_id) VALUES (?)', [contact.id]);
          conv = { id: resConv.lastInsertRowid };
        }

        await execute(`
          INSERT INTO whatsapp_messages (conversation_id, direction, message_type, content, status)
          VALUES (?, 'INBOUND', 'text', ?, 'DELIVERED')
        `, [conv.id, text]);
      }
      return res.status(200).send('EVENT_RECEIVED');
    }
    return res.sendStatus(404);
  } catch (err) {
    console.error('WhatsApp Webhook Error:', err);
    return res.sendStatus(500);
  }
}

module.exports = {
  getConversations,
  getMessages,
  sendMessage,
  getTemplates,
  verifyWebhook,
  handleWebhookEvent
};
