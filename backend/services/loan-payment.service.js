/**
 * Loan repayment completion — shared by Paystack webhook, verify endpoint, and admin override.
 */

const LoanApplication = require('../models/loan-application.model')
const Transaction = require('../models/transaction.model')
const { enrichLoanApplication } = require('../utils/loan-calculations')

async function getNextPendingInstallment(loanApplication) {
  return loanApplication.repaymentSchedule
    .filter(p => p.status === 'pending' || p.status === 'overdue')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0]
}

async function completeLoanRepayment(reference, session = null) {
  const tx = await Transaction.findOne({ reference }).session(session || null)
  if (!tx) {
    return { success: false, error: 'Transaction not found' }
  }

  if (tx.status === 'completed' && tx.metadata?.loanPaymentApplied) {
    const loan = await LoanApplication.findById(tx.metadata.loanApplicationId)
    return { success: true, alreadyProcessed: true, loan: loan ? enrichLoanApplication(loan) : null }
  }

  const loanApplicationId = tx.metadata?.loanApplicationId
  if (!loanApplicationId) {
    return { success: false, error: 'Not a loan repayment transaction' }
  }

  const loanApplication = await LoanApplication.findById(loanApplicationId).session(session || null)
  if (!loanApplication) {
    return { success: false, error: 'Loan application not found' }
  }

  if (!['approved', 'disbursed'].includes(loanApplication.status)) {
    return { success: false, error: 'Loan is not active' }
  }

  const installmentIndex = tx.metadata?.installmentIndex
  let installment

  if (installmentIndex !== undefined && installmentIndex !== null) {
    installment = loanApplication.repaymentSchedule[installmentIndex]
  } else {
    installment = await getNextPendingInstallment(loanApplication)
  }

  if (!installment) {
    return { success: false, error: 'No pending installment found' }
  }

  if (installment.status === 'paid') {
    // The specific installment this transaction targeted was already paid
    // by a different transaction (e.g. two near-simultaneous payment
    // attempts, or an admin's manual reconciliation landing first).
    // Redirect this payment to whatever installment is still actually
    // pending, so a real, captured payment never just gets reported as a
    // no-op and left to sit on a transaction stuck at its current status
    // with no trace of where the money went.
    const fallbackInstallment = await getNextPendingInstallment(loanApplication)
    if (!fallbackInstallment) {
      // Nothing left to apply this payment to — the loan is already fully
      // paid. Flag the transaction for admin reconciliation/refund instead
      // of silently leaving it unresolved.
      tx.metadata = { ...tx.metadata, loanPaymentApplied: false, needsReconciliation: true, reconciliationReason: 'Target installment already paid and loan has no remaining pending installments' }
      tx.markModified('metadata')
      if (tx.status !== 'completed') {
        tx.status = 'completed'
        tx.processedAt = new Date()
      }
      await tx.save({ session: session || undefined })
      return { success: false, error: 'This installment was already paid and the loan has no remaining balance. Flagged for admin reconciliation.', needsReconciliation: true }
    }
    installment = fallbackInstallment
  }

  if (Math.abs(installment.amount - tx.amount) > 1) {
    return {
      success: false,
      error: `Payment amount mismatch: expected ₦${installment.amount}, got ₦${tx.amount}`
    }
  }

  installment.status = 'paid'
  installment.paidAt = new Date()
  installment.paymentReference = reference

  const remainingPending = loanApplication.repaymentSchedule.filter(
    p => p.status === 'pending' || p.status === 'overdue'
  )
  if (remainingPending.length === 0) {
    loanApplication.status = 'completed'
  }

  await loanApplication.save({ session: session || undefined })

  tx.metadata = { ...tx.metadata, loanPaymentApplied: true, loanPaidAt: new Date() }
  tx.markModified('metadata')
  if (tx.status !== 'completed') {
    tx.status = 'completed'
    tx.processedAt = new Date()
  }
  await tx.save({ session: session || undefined })

  return {
    success: true,
    loan: enrichLoanApplication(loanApplication),
    paidAmount: installment.amount,
    message: `Payment of ₦${installment.amount.toLocaleString()} recorded successfully`
  }
}

function generateLoanPaymentReference(loanId) {
  return `GRO_LOAN_${loanId.toString().slice(-8)}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

module.exports = {
  completeLoanRepayment,
  getNextPendingInstallment,
  generateLoanPaymentReference
}
