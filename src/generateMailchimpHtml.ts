import type { EmailData, Product } from './types';

// Gmail iOS dark mode fully inverts background colors (even on already-dark emails) but leaves
// background images alone, so pairing each color with a solid same-color gradient locks it in place.
const bg = (color: string) => `background-color: ${color}; background-image: linear-gradient(${color}, ${color});`;

// Gmail iOS dark mode also inverts text colors. This screen/difference blend pair (scoped to Gmail
// via `u + .body` in the <style> block) cancels the inversion; it's inert in every other client.
// Only wrap text, never images, or the images get inverted.
const keepColor = (html: string) => `<span class="gmail-screen"><span class="gmail-difference">${html}</span></span>`;

// Gmail iOS dark mode inverts colored text (even light blue turns orange), so footer links use a
// light grey that survives inversion; blue is reserved for gradient-locked backgrounds.
const linkText = '#bbbbbb';

export function generateMailchimpHtml(data: EmailData, isPreview = false): string {
  const generateProductRows = (products: Product[]) => {
    return products.map((product, index) => {
      const hasIcon = product.useIcon && product.iconName && product.iconName !== 'none';
      const hasImage = !product.useIcon && Boolean(product.imageUrl);
      const iconPosition = product.iconPosition || data.defaultIconPosition || 'inline';

      const iconImgUrl = hasIcon ? `https://api.iconify.design/fa6-solid/${product.iconName}.svg?color=${encodeURIComponent(product.iconColor || '#0078D4')}&width=128&height=128` : '';
      const cardBg = data.transparentCards ? '#0a0a0a' : '#1c1c1c';

      return `
      <tr>
        <td align="center" bgcolor="#050505" style="padding: ${index === 0 ? '0' : '20px'} 0 ${index === products.length - 1 ? (data.transparentCards ? '6px' : '12px') : '20px'} 0; ${bg('#050505')}">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="${cardBg}" style="${bg(cardBg)} border-radius: 8px;">
            ${hasImage ? `
            <!-- PRODUCT BANNER IMAGE -->
            <tr>
              <td align="center" bgcolor="${cardBg}" style="padding: 20px; ${bg(cardBg)}">
                <img src="${product.imageUrl}" alt="${product.name}" width="100%" style="max-width: 500px; border-radius: 6px; display: block;" />
              </td>
            </tr>
            ` : (hasIcon && iconPosition === 'top') ? `
            <!-- STANDALONE TOP FLOATING ICON -->
            <tr>
              <td align="center" bgcolor="${cardBg}" style="padding: 20px 20px 10px 20px; ${bg(cardBg)}">
                <table border="0" cellpadding="0" cellspacing="0" style="${data.hideIconCircle ? '' : `${bg('#2a2a2a')} border-radius: 50%; width: 64px; height: 64px; `}margin: 0 auto;">
                  <tr>
                    <td align="center" valign="middle" height="${data.hideIconCircle ? '38' : '64'}">
                      <img src="${iconImgUrl}" alt="Icon" width="${data.hideIconCircle ? '36' : '32'}" height="${data.hideIconCircle ? '36' : '32'}" style="display: block; width: ${data.hideIconCircle ? '36px' : '32px'}; height: ${data.hideIconCircle ? '36px' : '32px'}; margin: 0 auto;" />
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            ` : ''}

            <!-- PRODUCT TITLE & DETAILS -->
            <tr>
              <td align="center" bgcolor="${cardBg}" style="padding: ${hasImage || (hasIcon && iconPosition === 'top') ? '0 20px' : '15px 20px 0 20px'}; ${bg(cardBg)}">
                <h3 style="color: #ffffff; font-family: Helvetica, Arial, sans-serif; font-size: 22px; font-weight: bold; margin: 0 0 10px 0; line-height: 1.3;">
                  ${hasIcon && iconPosition === 'inline' ? `
                    <span style="display: inline-block; vertical-align: middle; margin-right: 8px; line-height: 1;">
                      <img src="${iconImgUrl}" alt="Icon" width="22" height="22" style="display: inline-block; vertical-align: -2px; width: 22px; height: 22px;" />
                    </span>
                  ` : ''}
                  <span style="vertical-align: middle;">${keepColor(product.name)}</span>
                </h3>
                <p style="color: #cccccc; font-family: Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.5; margin: 0 0 15px 0;">${keepColor(product.description)}</p>
                ${product.price ? `
                  <!-- PRICE BADGE: white text on a gradient-locked blue background, since Gmail iOS inverts blue text to orange -->
                  <table border="0" cellpadding="0" cellspacing="0" align="center" style="margin: 0 auto 20px auto;">
                    <tr>
                      ${product.originalPrice ? `
                      <td valign="middle" bgcolor="${cardBg}" style="padding-right: 10px; ${bg(cardBg)}">
                        <span style="font-family: Helvetica, Arial, sans-serif; font-size: 14px; color: #777777; text-decoration: line-through;">${keepColor(product.originalPrice)}</span>
                      </td>
                      ` : ''}
                      <td valign="middle" bgcolor="#0d2a4a" style="${bg('#0d2a4a')} border-radius: 999px; padding: 6px 16px;">
                        <span style="color: #ffffff; font-family: Helvetica, Arial, sans-serif; font-size: 16px; font-weight: bold; line-height: 1.3;">${keepColor(product.price)}</span>
                      </td>
                    </tr>
                  </table>
                ` : ''}
              </td>
            </tr>
            <tr>
              <td align="center" bgcolor="${cardBg}" style="padding: 0 20px ${data.transparentCards ? '8px' : '20px'} 20px; ${bg(cardBg)}">
                <table border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" bgcolor="#0078D4" style="${bg('#0078D4')} border-radius: 4px;">
                      <a href="${product.link}" target="_blank" style="font-family: Helvetica, Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 4px; padding: 12px 24px; border: 1px solid #0078D4; display: inline-block; font-weight: bold;">${keepColor(product.buttonText || 'Check It Out')}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    `;
    }).join('');
  };

  return `<!DOCTYPE html>
<html lang="en" style="background-color: #050505;">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <!-- Tells Apple Mail / Outlook this email is already dark so they don't adapt it. Gmail ignores this;
       it's handled by the bg() gradients and .gmail-screen/.gmail-difference blend hack below. -->
  <meta name="color-scheme" content="light dark">
  <meta name="supported-color-schemes" content="light dark">
  <title>${data.subjectLine || data.title}</title>
  <style type="text/css">
    :root { color-scheme: light dark; }
    body { margin: 0; padding: 0; background-color: #050505 !important; color-scheme: light dark; }
    /* Gmail inserts <u></u> before the body, so this only matches inside Gmail */
    u + .body .gmail-screen { background: #000000; mix-blend-mode: screen; }
    u + .body .gmail-difference { background: #000000; mix-blend-mode: difference; }
    table, td, tr { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
    .email-wrapper { background-color: #050505 !important; }
    .email-card { background-color: #0a0a0a !important; }
    .product-card { background-color: #1c1c1c !important; }
  </style>
</head>
<body class="body" bgcolor="#050505" style="${bg('#050505')} margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <!-- PREHEADER / PREVIEW TEXT -->
  ${data.preheader ? `
  <div style="display: none; font-size: 1px; color: #050505; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${data.preheader}
  </div>
  <div style="display: none; font-size: 1px; color: #050505; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    &#847; &zwnj; &nbsp; &#8199; &shy; &#847; &zwnj; &nbsp; &#8199; &shy; &#847; &zwnj; &nbsp; &#8199; &shy; &#847; &zwnj; &nbsp; &#8199; &shy;
  </div>
  ` : ''}

  <div class="email-wrapper" style="${bg('#050505')} width: 100%;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" bgcolor="#050505" style="${bg('#050505')}">
    <tr>
      <td align="center" bgcolor="#050505" style="padding: 30px 10px; ${bg('#050505')}">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" class="email-card" bgcolor="#0a0a0a" style="max-width: 600px; ${bg('#0a0a0a')} border-radius: 8px;">
          <!-- HEADER IMAGE -->
          ${data.headerImageUrl ? `
          <tr>
            <td align="center" bgcolor="#0a0a0a" style="padding: ${(data.headerImageSize && data.headerImageSize >= 400) ? '0' : '22px 20px 0 20px'}; ${bg('#0a0a0a')}">
              <img 
                src="${data.headerImageUrl}" 
                alt="Logo" 
                width="${data.headerImageSize || 64}" 
                style="width: ${data.headerImageSize || 64}px; max-width: 100%; height: auto; display: block; margin: 0 auto; ${(data.headerImageSize && data.headerImageSize >= 400) ? 'border-top-left-radius: 8px; border-top-right-radius: 8px;' : ''}" 
              />
            </td>
          </tr>
          ` : ''}

          <!-- TITLE & INTRO -->
          <tr>
            <td align="center" bgcolor="#0a0a0a" style="padding: ${data.headerImageUrl ? '15px' : '30px'} 30px ${data.intro ? '20px' : '0'} 30px; ${bg('#0a0a0a')}">
              <h1 style="color: #ffffff; font-family: Helvetica, Arial, sans-serif; font-size: 28px; font-weight: bold; margin: 0 ${data.intro ? '0 20px 0' : '0'};">${keepColor(data.title)}</h1>
              ${data.intro ? `<p style="color: #cccccc; font-family: Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.5; margin: 0;">${keepColor(data.intro)}</p>` : ''}
            </td>
          </tr>

          <!-- PRODUCTS -->
          <tr>
            <td align="center" bgcolor="#0a0a0a" style="padding: 0 30px; ${bg('#0a0a0a')}">
              <table border="0" cellpadding="0" cellspacing="0" width="100%">
                ${generateProductRows(data.products)}
              </table>
            </td>
          </tr>

          <!-- SOCIAL LINKS -->
          ${(() => {
            const activeSocials = (data.socialLinks || []).filter(s => s.enabled && s.url);
            if (activeSocials.length === 0) return '';
            return `
            <tr>
              <td align="center" bgcolor="#0a0a0a" style="padding: 6px 20px 25px 20px; ${bg('#0a0a0a')}">
                <table border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    ${activeSocials.map(s => {
                      const nameLower = s.name.toLowerCase();
                      const urlLower = s.url.toLowerCase();

                      let borderColor = '#252525';
                      let bgColor = '#141414';
                      let textColor = '#cccccc';
                      let fontWeight = '500';

                      if (nameLower.includes('instagram') || urlLower.includes('instagram') || nameLower === 'ig') {
                        borderColor = '#d62976';
                        bgColor = '#171115';
                        textColor = '#ffffff';
                        fontWeight = 'bold';
                      } else if (
                        nameLower.includes('booking') || 
                        urlLower.includes('booking') || 
                        nameLower.includes('sounds list') || 
                        nameLower.includes('sounds') || 
                        urlLower.includes('list.freq.yt') || 
                        nameLower.includes('list')
                      ) {
                        borderColor = '#0078D4';
                        bgColor = '#10141a';
                        textColor = '#ffffff';
                        fontWeight = 'bold';
                      } else if (nameLower.includes('youtube') || urlLower.includes('youtube') || urlLower.includes('youtu.be')) {
                        borderColor = '#FF0000';
                        bgColor = '#171010';
                        textColor = '#ffffff';
                        fontWeight = 'bold';
                      }

                      return `
                        <td align="center" bgcolor="#0a0a0a" style="padding: 4px 6px; ${bg('#0a0a0a')}">
                          <a href="${s.url}" target="_blank" style="${bg(bgColor)} border: 1px solid ${borderColor}; border-radius: 18px; color: ${textColor}; padding: 7px 15px; font-size: 12px; font-family: Helvetica, Arial, sans-serif; text-decoration: none; display: inline-block; font-weight: ${fontWeight}; letter-spacing: 0.2px;">
                            ${keepColor(s.name)}
                          </a>
                        </td>
                      `;
                    }).join('')}
                  </tr>
                </table>
              </td>
            </tr>
            `;
          })()}

          <!-- FOOTER DIVIDER (a 1px row instead of border-top, since Gmail iOS inverts border colors to white) -->
          <tr>
            <td height="1" bgcolor="#1c1c1c" style="height: 1px; font-size: 1px; line-height: 1px; ${bg('#1c1c1c')}">&nbsp;</td>
          </tr>

          <!-- FOOTER -->
          <tr>
            <td align="center" bgcolor="#0a0a0a" style="padding: 30px; color: #888888; font-family: Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.5; ${bg('#0a0a0a')}">
              <span style="color: #888888; font-family: Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.5;">${keepColor(`
                ${data.footerText ? `${data.footerText}<br><br>` : ''}
                ${isPreview ? `Freq.yt <a href="https://www.google.com/maps/search/Kronprinsensgade+6B%0D%0AK%C3%B8benhavn+K?entry=gmail&source=g" target="_blank" style="color: ${linkText}; text-decoration: underline;">Kronprinsensgade 6B København K</a> 1114 Denmark` : '*|LIST:ADDRESS|*'}<br><br>
                <!-- MAILCHIMP REQUIRED TAGS -->
                <a href="*|UNSUB|*" style="color: ${linkText}; text-decoration: underline;">Unsubscribe</a> |
                <a href="*|UPDATE_PROFILE|*" style="color: ${linkText}; text-decoration: underline;">Update Preferences</a>
              `)}</span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
  </div>
</body>
</html>`;
}
