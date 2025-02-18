const crypto = require('crypto');

function extractField(fieldName, wwwAuthenticate) {
  const match = new RegExp(`${fieldName}="([^"]+)"`).exec(wwwAuthenticate);
  if (!match) throw new Error(`Failed to extract ${fieldName} from www-authenticate header`);
  return match[1];
}

function generateDigestAuthHeader(method, uri, username, password, wwwAuthenticate) {
  const realm = extractField('realm', wwwAuthenticate);
  const nonce = extractField('nonce', wwwAuthenticate);
  const qop = extractField('qop', wwwAuthenticate) || null;

  const nc = '00000001';
  const cnonce = crypto.randomBytes(16).toString('hex');

  const ha1 = crypto.createHash('md5').update(`${username}:${realm}:${password}`).digest('hex');
  const ha2 = crypto.createHash('md5').update(`${method}:${uri}`).digest('hex');
  const response = crypto.createHash('md5').update(`${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`).digest('hex');

  let authHeader = `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${uri}", response="${response}", nc=${nc}, cnonce="${cnonce}"`;

  if (qop) {
    authHeader += `, qop=${qop}`;
  }

  return authHeader;
}

module.exports = generateDigestAuthHeader;
