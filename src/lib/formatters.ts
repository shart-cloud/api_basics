import { Context } from 'hono';
import { escapeHtml, sanitizeForDisplay } from './sanitize';

export type ClientType = 'curl' | 'browser' | 'json';

export function detectClientType(c: Context): ClientType {
  const userAgent = c.req.header('user-agent') || '';
  const accept = c.req.header('accept') || '';

  // Prioritize explicit Accept header
  if (accept.includes('application/json')) {
    return 'json';
  }

  if (accept.includes('text/html')) {
    return 'browser';
  }

  // Fall back to User-Agent detection
  if (userAgent.toLowerCase().includes('curl')) {
    return 'curl';
  }

  if (userAgent.toLowerCase().includes('mozilla') ||
      userAgent.toLowerCase().includes('chrome') ||
      userAgent.toLowerCase().includes('safari')) {
    return 'browser';
  }

  return 'json';
}

export function formatResponse(c: Context, data: any, status: number = 200) {
  const clientType = detectClientType(c);

  if (clientType === 'curl') {
    return c.text(formatPlaintext(data), status);
  }

  if (clientType === 'browser') {
    return c.html(formatHtml(data), status);
  }

  return c.json(data, status);
}

function formatPlaintext(data: any): string {
  if (typeof data === 'string') {
    return data;
  }

  if (data.error) {
    return `ERROR: ${data.error}\n${data.message ? `\n${data.message}\n` : ''}`;
  }

  if (data.success) {
    let output = `SUCCESS: ${data.message || 'Operation completed'}\n`;

    // Add any additional data
    const keys = Object.keys(data).filter(k => k !== 'success' && k !== 'message');
    if (keys.length > 0) {
      output += '\n';
      keys.forEach(key => {
        const value = typeof data[key] === 'object' ? JSON.stringify(data[key], null, 2) : data[key];
        output += `${key}: ${value}\n`;
      });
    }

    return output;
  }

  // For arrays (like todos list)
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return 'No items found.\n';
    }

    let output = `Found ${data.length} item(s):\n\n`;
    data.forEach((item, index) => {
      output += `[${index + 1}] `;
      Object.entries(item).forEach(([key, value]) => {
        output += `${key}=${typeof value === 'object' ? JSON.stringify(value) : value} `;
      });
      output += '\n';
    });
    return output;
  }

  // For objects (like profile)
  if (typeof data === 'object') {
    let output = '';
    Object.entries(data).forEach(([key, value]) => {
      output += `${key}: ${typeof value === 'object' ? JSON.stringify(value, null, 2) : value}\n`;
    });
    return output;
  }

  return String(data) + '\n';
}

function formatHtml(data: any): string {
  const baseStyles = `
    <style>
      body { font-family: system-ui, -apple-system, sans-serif; max-width: 800px; margin: 40px auto; padding: 0 20px; line-height: 1.6; }
      .success { background: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 15px; border-radius: 4px; margin: 20px 0; }
      .error { background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; padding: 15px; border-radius: 4px; margin: 20px 0; }
      table { border-collapse: collapse; width: 100%; margin: 20px 0; }
      th, td { text-align: left; padding: 12px; border-bottom: 1px solid #ddd; }
      th { background-color: #f8f9fa; font-weight: 600; }
      .code { background: #f4f4f4; padding: 2px 6px; border-radius: 3px; font-family: monospace; }
      h1 { color: #333; }
      h2 { color: #666; margin-top: 30px; }
    </style>
  `;

  if (data.error) {
    return `
      <!DOCTYPE html>
      <html>
      <head><title>Error</title>${baseStyles}</head>
      <body>
        <h1>Error</h1>
        <div class="error">
          <strong>${escapeHtml(data.error)}</strong>
          ${data.message ? `<p>${escapeHtml(data.message)}</p>` : ''}
        </div>
      </body>
      </html>
    `;
  }

  if (data.success) {
    let additionalHtml = '';
    const keys = Object.keys(data).filter(k => k !== 'success' && k !== 'message');

    if (keys.length > 0) {
      additionalHtml = '<table>';
      keys.forEach(key => {
        const sanitizedKey = escapeHtml(key);
        const sanitizedValue = typeof data[key] === 'object'
          ? `<pre>${escapeHtml(JSON.stringify(data[key], null, 2))}</pre>`
          : escapeHtml(String(data[key]));
        additionalHtml += `<tr><th>${sanitizedKey}</th><td>${sanitizedValue}</td></tr>`;
      });
      additionalHtml += '</table>';
    }

    return `
      <!DOCTYPE html>
      <html>
      <head><title>Success</title>${baseStyles}</head>
      <body>
        <h1>Success</h1>
        <div class="success">
          <strong>${escapeHtml(data.message || 'Operation completed')}</strong>
        </div>
        ${additionalHtml}
      </body>
      </html>
    `;
  }

  // For arrays (like todos list)
  if (Array.isArray(data)) {
    if (data.length === 0) {
      return `
        <!DOCTYPE html>
        <html>
        <head><title>Items</title>${baseStyles}</head>
        <body>
          <h1>Items</h1>
          <p>No items found.</p>
        </body>
        </html>
      `;
    }

    const keys = Object.keys(data[0]);
    const tableHtml = `
      <table>
        <thead>
          <tr>${keys.map(k => `<th>${escapeHtml(k)}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${data.map(item =>
            `<tr>${keys.map(k => {
              const value = item[k];
              const sanitizedValue = typeof value === 'object'
                ? escapeHtml(JSON.stringify(value))
                : escapeHtml(String(value));
              return `<td>${sanitizedValue}</td>`;
            }).join('')}</tr>`
          ).join('')}
        </tbody>
      </table>
    `;

    return `
      <!DOCTYPE html>
      <html>
      <head><title>Items (${data.length})</title>${baseStyles}</head>
      <body>
        <h1>Found ${data.length} item(s)</h1>
        ${tableHtml}
      </body>
      </html>
    `;
  }

  // For objects (like profile)
  if (typeof data === 'object') {
    const tableHtml = `
      <table>
        ${Object.entries(data).map(([key, value]) => {
          const sanitizedKey = escapeHtml(key);
          const sanitizedValue = typeof value === 'object'
            ? `<pre>${escapeHtml(JSON.stringify(value, null, 2))}</pre>`
            : escapeHtml(String(value));
          return `<tr><th>${sanitizedKey}</th><td>${sanitizedValue}</td></tr>`;
        }).join('')}
      </table>
    `;

    return `
      <!DOCTYPE html>
      <html>
      <head><title>Details</title>${baseStyles}</head>
      <body>
        <h1>Details</h1>
        ${tableHtml}
      </body>
      </html>
    `;
  }

  return `
    <!DOCTYPE html>
    <html>
    <head><title>Response</title>${baseStyles}</head>
    <body>
      <h1>Response</h1>
      <pre>${escapeHtml(String(data))}</pre>
    </body>
    </html>
  `;
}
