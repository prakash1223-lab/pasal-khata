import { formatCurrency } from './currency';
import { formatNepaliDate } from './nepaliDate';

export function generateKhataMessage(customer, shopName = 'Ram Bhandar', lang = 'en') {
  if (!customer) return '';
  const today  = formatNepaliDate(new Date());
  const bought = parseFloat(customer.total_purchased ?? customer.totalBought ?? 0);
  const paid   = parseFloat(customer.total_paid      ?? customer.totalPaid    ?? 0);
  const baki   = parseFloat(customer.baki ?? 0);

  if (lang === 'np') {
    return `🏪 *${shopName}*
━━━━━━━━━━━━━━━
📋 *खाता विवरण*

👤 ग्राहक: *${customer.name ?? '—'}*
📱 फोन: ${customer.phone ?? ''}

💰 कुल खरिद: ${formatCurrency(bought)}
✅ कुल भुक्तान: ${formatCurrency(paid)}
🔴 *बाकी रहेको: ${formatCurrency(baki)}*

📅 मिति: ${today.bs} (${today.ad})
━━━━━━━━━━━━━━━
_पसल खाता - नेपालका लागि डिजिटल खाता_`.trim();
  }

  return `🏪 *${shopName}*
━━━━━━━━━━━━━━━
📋 *Khata Summary*

👤 Customer: *${customer.name ?? '—'}*
📱 Phone: ${customer.phone ?? ''}

💰 Total bought: ${formatCurrency(bought)}
✅ Total paid: ${formatCurrency(paid)}
🔴 *Baki remaining: ${formatCurrency(baki)}*

📅 Date: ${today.bs} (${today.ad})
━━━━━━━━━━━━━━━
_Pasal Khata - Digital Khata System for Nepal_`.trim();
}

export function generateUdharoMessage(supplier, shopName = 'My Shop', lang = 'en') {
  if (!supplier) return '';
  const bought = parseFloat(supplier.total_purchased ?? 0);
  const paid   = parseFloat(supplier.total_paid      ?? 0);
  const udharo = parseFloat(supplier.udharo ?? 0);
  const today  = formatNepaliDate(new Date());

  if (lang === 'np') {
    return `🏪 *${shopName}*
━━━━━━━━━━━━━━━
📋 *उधारो विवरण*

🏭 आपूर्तिकर्ता: *${supplier.name ?? '—'}*
🏢 कम्पनी: ${supplier.company_name ?? '—'}
📱 फोन: ${supplier.phone ?? '—'}

💰 कुल खरिद: ${formatCurrency(bought)}
✅ कुल भुक्तान: ${formatCurrency(paid)}
🟡 *उधारो बाँकी: ${formatCurrency(udharo)}*

📅 मिति: ${today.bs} (${today.ad})
━━━━━━━━━━━━━━━
_पसल खाता - नेपालका लागि डिजिटल खाता_`.trim();
  }

  return `🏪 *${shopName}*
━━━━━━━━━━━━━━━
📋 *Udharo Summary*

🏭 Supplier: *${supplier.name ?? '—'}*
🏢 Company: ${supplier.company_name ?? '—'}
📱 Phone: ${supplier.phone ?? '—'}

💰 Total purchased: ${formatCurrency(bought)}
✅ Total paid: ${formatCurrency(paid)}
🟡 *Udharo remaining: ${formatCurrency(udharo)}*

📅 Date: ${today.bs} (${today.ad})
━━━━━━━━━━━━━━━
_Pasal Khata - Digital Khata System for Nepal_`.trim();
}

export function shareOnWhatsApp(customer, shopName, lang = 'en') {
  if (!customer) return;
  const message = generateKhataMessage(customer, shopName, lang);
  const encoded = encodeURIComponent(message);
  const rawPhone = (customer.phone ?? '').replace(/\D/g, '');
  const url = rawPhone
    ? `https://wa.me/977${rawPhone}?text=${encoded}`
    : `https://wa.me/?text=${encoded}`;
  window.open(url, '_blank');
}
