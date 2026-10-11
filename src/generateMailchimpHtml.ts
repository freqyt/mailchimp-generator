import type { EmailData, Product } from './types';

export function generateMailchimpHtml(data: EmailData, isPreview = false): string {
  const generateProductRows = (products: Product[]) => {
    return products.map((product, index) => {
      const hasIcon = product.useIcon && product.iconName && product.iconName !== 'none';
      const hasImage = !product.useIcon && Boolean(product.imageUrl);
      const iconPosition = product.iconPosition || data.defaultIconPosition || 'inline';

      const iconImgUrl = hasIcon ? `https://api.iconify.design/fa6-solid/${product.iconName}.svg?color=${encodeURIComponent(product.iconColor || '#0078D4')}&width=128&height=128` : '';

      return `
      <tr>
        <td align="center" style="padding: ${index === 0 ? '0' : '20px'} 0 ${index === products.length - 1 ? (data.transparentCards ? '6px' : '12px') : '20px'} 0;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="${data.transparentCards ? '' : 'background-color: #1c1c1c; '}border-radius: 8px;">
            ${hasImage ? `
            <!-- PRODUCT BANNER IMAGE -->
            <tr>
              <td align="center" style="padding: 20px;">
                <img src="${product.imageUrl}" alt="${product.name}" width="100%" style="max-width: 500px; border-radius: 6px; display: block;" />
              </td>
            </tr>
            ` : (hasIcon && iconPosition === 'top') ? `
            <!-- STANDALONE TOP FLOATING ICON -->
            <tr>
              <td align="center" style="padding: 20px 20px 10px 20px;">
                <table border="0" cellpadding="0" cellspacing="0" style="${data.hideIconCircle ? '' : 'background-color: #2a2a2a; border-radius: 50%; width: 64px; height: 64px; '}margin: 0 auto;">
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
              <td align="center" style="padding: ${hasImage || (hasIcon && iconPosition === 'top') ? '0 20px' : '15px 20px 0 20px'};">
                <h3 style="color: #ffffff; font-family: Helvetica, Arial, sans-serif; font-size: 22px; font-weight: bold; margin: 0 0 10px 0; line-height: 1.3;">
                  ${hasIcon && iconPosition === 'inline' ? `
                    <span style="display: inline-block; vertical-align: middle; margin-right: 8px; line-height: 1;">
                      <img src="${iconImgUrl}" alt="Icon" width="22" height="22" style="display: inline-block; vertical-align: -2px; width: 22px; height: 22px;" />
                    </span>
                  ` : ''}
                  <span style="vertical-align: middle;">${product.name}</span>
                </h3>
                <p style="color: #cccccc; font-family: Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.5; margin: 0 0 15px 0;">${product.description}</p>
                ${product.price ? `
                  <p style="margin: 0 0 20px 0;">
                    ${product.originalPrice ? `<span style="font-family: Helvetica, Arial, sans-serif; font-size: 14px; color: #777777; text-decoration: line-through; margin-right: 8px;">${product.originalPrice}</span>` : ''}
                    <span style="color: #0078D4; font-family: Helvetica, Arial, sans-serif; font-size: 18px; font-weight: bold;">${product.price}</span>
                  </p>
                ` : ''}
              </td>
            </tr>
            <tr>
              <td align="center" style="padding: 0 20px ${data.transparentCards ? '8px' : '20px'} 20px;">
                <table border="0" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center" bgcolor="#0078D4" style="border-radius: 4px;">
                      <a href="${product.link}" target="_blank" style="font-family: Helvetica, Arial, sans-serif; font-size: 16px; color: #ffffff; text-decoration: none; border-radius: 4px; padding: 12px 24px; border: 1px solid #0078D4; display: inline-block; font-weight: bold;">${product.buttonText || 'Check It Out'}</a>
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
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${data.subjectLine || data.title}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #050505; }
    table, td, tr { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    a[x-apple-data-detectors] { color: inherit !important; text-decoration: none !important; font-size: inherit !important; font-family: inherit !important; font-weight: inherit !important; line-height: inherit !important; }
  </style>
</head>
<body style="background-color: #050505; margin: 0; padding: 0; -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%;">
  <!-- PREHEADER / PREVIEW TEXT -->
  ${data.preheader ? `
  <div style="display: none; font-size: 1px; color: #050505; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    ${data.preheader}
  </div>
  <div style="display: none; font-size: 1px; color: #050505; line-height: 1px; max-height: 0px; max-width: 0px; opacity: 0; overflow: hidden; mso-hide: all;">
    &#847; &zwnj; &nbsp; &#8199; &shy; &#847; &zwnj; &nbsp; &#8199; &shy; &#847; &zwnj; &nbsp; &#8199; &shy; &#847; &zwnj; &nbsp; &#8199; &shy;
  </div>
  ` : ''}

  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #050505;">
    <tr>
      <td align="center" style="padding: 30px 10px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #0a0a0a; border-radius: 8px;">
          <!-- HEADER IMAGE -->
          ${data.headerImageUrl ? `
          <tr>
            <td align="center" style="padding: ${(data.headerImageSize && data.headerImageSize >= 400) ? '0' : '22px 20px 0 20px'};">
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
            <td align="center" style="padding: ${data.headerImageUrl ? '15px' : '30px'} 30px ${data.intro ? '20px' : '0'} 30px;">
              <h1 style="color: #ffffff; font-family: Helvetica, Arial, sans-serif; font-size: 28px; font-weight: bold; margin: 0 ${data.intro ? '0 20px 0' : '0'};">${data.title}</h1>
              ${data.intro ? `<p style="color: #cccccc; font-family: Helvetica, Arial, sans-serif; font-size: 16px; line-height: 1.5; margin: 0;">${data.intro}</p>` : ''}
            </td>
          </tr>

          <!-- PRODUCTS -->
          <tr>
            <td align="center" style="padding: 0 30px;">
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
              <td align="center" style="padding: 6px 20px 25px 20px;">
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
                        <td align="center" style="padding: 4px 6px;">
                          <a href="${s.url}" target="_blank" style="background-color: ${bgColor}; border: 1px solid ${borderColor}; border-radius: 18px; color: ${textColor}; padding: 7px 15px; font-size: 12px; font-family: Helvetica, Arial, sans-serif; text-decoration: none; display: inline-block; font-weight: ${fontWeight}; letter-spacing: 0.2px;">
                            ${s.name}
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

          <!-- FOOTER -->
          <tr>
            <td align="center" style="padding: 30px; border-top: 1px solid #1c1c1c; color: #888888; font-family: Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.5;">
              <span style="color: #888888; font-family: Helvetica, Arial, sans-serif; font-size: 12px; line-height: 1.5;">
                ${data.footerText ? `${data.footerText}<br><br>` : ''}
                ${isPreview ? 'Freq.yt <a href="https://www.google.com/maps/search/Kronprinsensgade+6B%0D%0AK%C3%B8benhavn+K?entry=gmail&source=g" target="_blank" style="color: #0078D4; text-decoration: underline;">Kronprinsensgade 6B København K</a> 1114 Denmark' : '*|LIST:ADDRESS|*'}<br><br>
                <!-- MAILCHIMP REQUIRED TAGS -->
                <a href="*|UNSUB|*" style="color: #0078D4; text-decoration: underline;">Unsubscribe</a> | 
                <a href="*|UPDATE_PROFILE|*" style="color: #0078D4; text-decoration: underline;">Update Preferences</a>
              </span>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}
