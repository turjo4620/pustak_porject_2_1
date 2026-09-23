const newsletterService = require('../services/newsletterService');

async function subscribe(req, res) {
  const email = typeof req.body.email === 'string' ? req.body.email.trim() : '';

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return res.status(400).json({ message: 'একটি বৈধ ইমেইল ঠিকানা দিন' });
  }

  try {
    await newsletterService.subscribeByEmail(email);
    return res.json({ success: true, message: 'নিউজলেটার সাবস্ক্রিপশন সক্রিয় হয়েছে' });
  } catch (error) {
    return res.status(error.status || 500).json({
      message: error.message || 'সাবস্ক্রাইব করা যায়নি',
    });
  }
}

module.exports = { subscribe };