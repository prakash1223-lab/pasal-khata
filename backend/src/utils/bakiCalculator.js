'use strict';

/**
 * Calculate baki (outstanding balance). Never negative.
 */
function calculateBaki(totalAmount, paidAmount) {
  const baki = parseFloat(totalAmount) - parseFloat(paidAmount);
  return Math.max(0, parseFloat(baki.toFixed(2)));
}

/**
 * Determine payment status from amounts
 */
function getPaymentStatus(totalAmount, paidAmount) {
  const total = parseFloat(totalAmount);
  const paid = parseFloat(paidAmount);
  if (paid >= total) return 'paid';
  if (paid <= 0) return 'unpaid';
  return 'partial';
}

/**
 * Update customer balance columns inside an existing DB transaction.
 * Must be called with a transaction client (BEGIN already called).
 *
 * @param {object} client - pg transaction client
 * @param {string} customerId
 * @param {number} saleTotal - amount added to total_purchased
 * @param {number} paidAmount - amount added to total_paid
 */
async function updateCustomerBalance(client, customerId, saleTotal, paidAmount) {
  const bakiDelta = calculateBaki(saleTotal, paidAmount);

  const result = await client.query(
    `UPDATE customers
       SET total_purchased = total_purchased + $1,
           total_paid      = total_paid + $2,
           baki            = GREATEST(0, baki + $3),
           updated_at      = NOW()
     WHERE id = $4
     RETURNING id, total_purchased, total_paid, baki`,
    [saleTotal, paidAmount, bakiDelta, customerId]
  );

  if (result.rowCount === 0) {
    throw new Error(`Customer ${customerId} not found when updating balance`);
  }

  return result.rows[0];
}

/**
 * Reduce customer baki after receiving a payment.
 * Baki never goes below 0.
 */
async function applyPaymentToCustomer(client, customerId, paymentAmount) {
  const result = await client.query(
    `UPDATE customers
       SET total_paid  = total_paid + $1,
           baki        = GREATEST(0, baki - $1),
           updated_at  = NOW()
     WHERE id = $2
     RETURNING id, total_purchased, total_paid, baki`,
    [paymentAmount, customerId]
  );

  if (result.rowCount === 0) {
    throw new Error(`Customer ${customerId} not found when applying payment`);
  }

  return result.rows[0];
}

module.exports = {
  calculateBaki,
  getPaymentStatus,
  updateCustomerBalance,
  applyPaymentToCustomer,
};
