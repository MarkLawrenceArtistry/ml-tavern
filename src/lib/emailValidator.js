// ============================================================
// FILE: src/lib/emailValidator.js
// ============================================================

// Common disposable / temporary email domains
const DISPOSABLE_DOMAINS = [
  'guerrillamail.com', 'guerrillamailblock.com', 'grr.la', 'sharklasers.com',
  'guerrillamail.info', 'guerrillamail.net', 'guerrillamail.org',
  'mailinator.com', 'mailinator2.com', 'mailinator.org',
  'tempmail.com', 'temp-mail.org', 'tempmail.io',
  'throwaway.email', 'throwam.com', 'throwawaymail.com',
  'yopmail.com', 'yopmail.fr', 'yopmail.net', 'jetable.org', 'nofree.fr',
  '10minutemail.com', '10minutemail.net', '10minutemail.org',
  'tempail.com', 'tempail.fr',
  'dispostable.com', 'dispostable.net',
  'trashmail.com', 'trashmail.io', 'trash-mail.de',
  'maildrop.cc', 'maildrop.cf',
  'tmpmail.net', 'tmpmail.org', 'tmpmail.com',
  'fakemailgenerator.com', 'fakeemailgenerator.com',
  'burnermail.io', 'burnermail.com',
  'inboxkitten.com',
  'mailnesia.com', 'mailnesia.net',
  'mohmal.com', 'mohmal.org',
  'tempmailaddress.com',
  'mytemp.email', 'mytempmail.com',
  'tempmail.ninja', 'tempmail.ninja',
  'discard.email', 'discardmail.com',
  'emailondeck.com',
  'crazymailing.com',
  'tempmailo.com',
  'harakirimail.com',
  'jetable.org', 'jetable.fr', 'jetable.net',
  'mailforspam.com', 'mailforspam.net',
  'safetymail.info',
  'filzmail.com',
  'incognitomail.org',
  'instantemailaddress.com',
  'mailcatch.com',
  'mintemail.com', 'mintmail.com',
  'mt2015.com',
  'nada.email', 'nada.email',
  'neverbox.com',
  'nomail.xl.cx', 'nomail2.xl.cx',
  'nospam.ze.cx', 'nospam4.us',
  'throwawayemailaddress.com',
  'tmpbox.net',
  'mailscrap.com', 'mailscrap.net',
  'trashymail.com', 'trashymail.net',
  'wegwerfmail.de', 'wegwerfmail.net', 'wegwerfmail.org',
  'mailtemp.info', 'mailtemp.info',
  'zippymail.info', 'zippymail.info',
  'binkmail.com', 'bobmail.info', 'chammy.info', 'devnullmail.com',
  'dfgh.net', 'digitalsanctuary.com', 'e4ward.com', 'emailigo.de',
  'emailsensei.com', 'fammix.com', 'gishpuppy.com', 'guerrillamailblock.com',
  'hopemail.biz', 'klzlk.com', 'kostenlosemailadresse.de', 'kurzepost.de',
  'mailblocks.com', 'mailme.lv', 'mailexpire.com', 'mailfreeonline.com',
  'mailinater.com', 'mailmoat.com', 'mailshell.com', 'mailzilla.org',
  'messagebeamer.de', 'mytrashmail.com', 'nurfuerspam.de', 'objectmail.com',
  'proxymail.eu', 'rcpt.at', 'reallymymail.com', 'recode.me',
  'regbypass.com', 'rmqkr.net', 'royal.net', 'safersignup.de',
  'safetypost.de', 'saynotospams.com', 'scbox.one', 'schafmail.de',
  'selfdestructingmail.com', 'sendspamhere.com', 'sharklasers.com',
  'slothmail.net', 'smellfear.com', 'spamavert.com', 'spambox.us',
  'spamday.com', 'spamfree24.org', 'spamgoes.in', 'spamgourmet.com',
  'spamherelots.com', 'spamhole.com', 'spaminator.de', 'spamkill.info',
  'spaml.de', 'spammotel.com', 'spamspot.com', 'spamthis.co.uk',
  'spamthisplease.com', 'superrito.com', 'teewars.org', 'tempinbox.com',
  'tempmaildemo.com', 'tempmailer.com', 'tempmailalternative.com',
  'tempmails.com', 'trashmail.ws', 'uggsrock.com', 'webemail.me',
  'wh4f.org', 'whyspam.me', 'willselfdestruct.com', 'wuzup.net',
  'yeblight.com', 'yopmail.fr', 'yopmail.net', 'zipcad.com',
  'gottrashmail.com', 'ghosttexter.de',
];

const DISPOSABLE_SET = new Set(DISPOSABLE_DOMAINS);

export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { valid: false, reason: 'Email is required.' };
  }

  const trimmed = email.trim().toLowerCase();

  // Basic format check
  const emailRegex = /^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, reason: 'Please enter a valid email address.' };
  }

  // Extract domain
  const domain = trimmed.split('@')[1];
  if (!domain) {
    return { valid: false, reason: 'Invalid email format.' };
  }

  // Check for disposable email
  if (DISPOSABLE_SET.has(domain)) {
    return { valid: false, reason: 'Disposable/temporary emails are not allowed. Please use a permanent email address.' };
  }

  // Check for subdomains of disposable services
  const parts = domain.split('.');
  for (let i = 0; i < parts.length; i++) {
    const sub = parts.slice(i).join('.');
    if (DISPOSABLE_SET.has(sub)) {
      return { valid: false, reason: 'Disposable/temporary emails are not allowed. Please use a permanent email address.' };
    }
  }

  // Reject obviously fake patterns
  // Reject obviously fake patterns
  const fakePatterns = [
    /^test@test\.com$/i,
    /^a@a\.com$/i,
    /^.*@example\.(com|org|net)$/i,
    /^.*@test\.com$/i,
    /^.*@fake\.com$/i,
    /^.*@asdf\.com$/i,
    /^.*@qwer\.com$/i,
    /^.*@abc\.com$/i,
    /^.*@xxx\.com$/i,
    /^.*@zzz\.com$/i,
  ];

  for (const pattern of fakePatterns) {
    if (pattern.test(trimmed)) {
      return { valid: false, reason: 'This email appears to be fake. Please use a real email address.' };
    }
  }

  return { valid: true, reason: '' };
}