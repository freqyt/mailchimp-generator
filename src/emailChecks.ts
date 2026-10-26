import type { EmailData } from './types';

export interface EmailIssue {
  level: 'error' | 'warning';
  message: string;
}

// Gmail clips emails over ~102KB and hides the rest behind "[Message clipped]"
const GMAIL_CLIP_BYTES = 102 * 1024;

const isPlaceholderUrl = (url: string) => !url.trim() || /^https?:\/\/?$/i.test(url.trim());

export function checkEmail(data: EmailData, html: string): EmailIssue[] {
  const issues: EmailIssue[] = [];
  const error = (message: string) => issues.push({ level: 'error', message });
  const warn = (message: string) => issues.push({ level: 'warning', message });

  const subject = (data.subjectLine || '').trim();
  if (!subject) error('Subject line is empty');
  else if (subject.length > 60) warn(`Subject line is ${subject.length} characters; most inboxes cut it off around 60`);
  if (!(data.preheader || '').trim()) warn('No preview text set; inboxes will show the first text in the email instead');
  if (!data.title.trim()) warn('Newsletter title is empty');
  if (data.products.length === 0) warn('No products added');

  const checkImage = (url: string, where: string) => {
    if (url.startsWith('data:')) error(`${where} image only exists in this browser (the upload failed), so it won't show in the email`);
    else if (url.startsWith('http://')) warn(`${where} image uses http://, which some inboxes block`);
  };
  if (data.headerImageUrl) checkImage(data.headerImageUrl, 'Header');

  data.products.forEach((p, i) => {
    const name = p.name.trim() ? `Product #${i + 1} ("${p.name.trim()}")` : `Product #${i + 1}`;
    if (!p.name.trim()) warn(`${name} has no name`);
    if (isPlaceholderUrl(p.link)) error(`${name} has no button link`);
    else if (!/^https?:\/\//i.test(p.link.trim())) error(`${name} link doesn't start with https://`);
    else if (p.link.trim().startsWith('http://')) warn(`${name} link uses http:// instead of https://`);
    if (p.useIcon === false) {
      if (!p.imageUrl) warn(`${name} is set to show an image but none is chosen`);
      else checkImage(p.imageUrl, name);
    }
  });

  (data.socialLinks || []).filter(s => s.enabled).forEach(s => {
    if (isPlaceholderUrl(s.url) || !/^https?:\/\//i.test(s.url.trim())) error(`Social link "${s.name}" has no valid URL`);
  });

  if (data.countdownEnabled) {
    const end = data.countdownEnd ? new Date(data.countdownEnd).getTime() : NaN;
    if (Number.isNaN(end)) error('Countdown timer is on but has no end time');
    else if (end <= Date.now()) error('Countdown timer end time has already passed');
  }

  const bytes = new Blob([html]).size;
  if (bytes > GMAIL_CLIP_BYTES) error(`Email is ${Math.round(bytes / 1024)}KB; Gmail clips anything over 102KB`);
  else if (bytes > GMAIL_CLIP_BYTES * 0.8) warn(`Email is ${Math.round(bytes / 1024)}KB, close to Gmail's 102KB clipping limit`);

  return issues;
}
