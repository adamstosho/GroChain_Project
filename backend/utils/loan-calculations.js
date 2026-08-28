/**
 * Standard amortized loan calculations for agricultural microfinance.
 * EMI formula: P × r × (1+r)^n / ((1+r)^n − 1)
 * where r = annual rate / 12, n = term in months.
 * Aligns with CBN microfinance and standard PMT() calculations.
 */

const { roundToDecimals } = require('./number-precision')

function calculateMonthlyPayment(principal, annualRatePercent, termMonths) {
  if (!principal || !termMonths || principal <= 0 || termMonths <= 0) return 0

  const monthlyRate = annualRatePercent / 100 / 12
  if (monthlyRate === 0) {
    return Math.round(principal / termMonths)
  }

  const factor = Math.pow(1 + monthlyRate, termMonths)
  const payment = (principal * monthlyRate * factor) / (factor - 1)
  return Math.round(payment)
}

function calculateTotalRepayment(principal, annualRatePercent, termMonths) {
  const monthly = calculateMonthlyPayment(principal, annualRatePercent, termMonths)
  return monthly * termMonths
}

function calculateTotalInterest(principal, annualRatePercent, termMonths) {
  return calculateTotalRepayment(principal, annualRatePercent, termMonths) - principal
}

/**
 * Interest rate tiers based on credit score (300–850 range).
 * Reflects typical Nigerian agri-microfinance spreads (12–18% APR).
 */
function interestRateFromCreditScore(score) {
  if (score >= 750) return 12
  if (score >= 650) return 14
  if (score >= 550) return 16
  if (score >= 500) return 18
  return null // not eligible
}

function assessRisk(creditScore) {
  if (creditScore >= 750) return 'low'
  if (creditScore >= 650) return 'medium'
  return 'high'
}

/**
 * Debt-to-income assessment (monthly obligations / monthly income).
 * Standard microfinance threshold: ≤30% excellent, ≤40% good, ≤50% fair.
 */
function assessDebtToIncome(monthlyPayment, existingMonthlyPayments, monthlyIncome) {
  if (!monthlyIncome || monthlyIncome <= 0) return 'unknown'

  const ratio = (monthlyPayment + (existingMonthlyPayments || 0)) / monthlyIncome
  if (ratio <= 0.3) return 'excellent'
  if (ratio <= 0.4) return 'good'
  if (ratio <= 0.5) return 'fair'
  return 'poor'
}

function calculateEligibilityLimits(score) {
  const clamped = Math.max(300, Math.min(850, score))
  const normalized = (clamped - 300) / 550
  return {
    loans: score >= 500,
    maxLoanAmount: Math.round(normalized * 2000000),
    maxInsuranceCoverage: Math.round(normalized * 1000000)
  }
}

/**
 * Generate full amortization schedule with principal/interest breakdown.
 */
function generateRepaymentSchedule(principal, annualRatePercent, termMonths, startDate = new Date()) {
  const monthlyRate = annualRatePercent / 100 / 12
  const monthlyPayment = calculateMonthlyPayment(principal, annualRatePercent, termMonths)
  const schedule = []
  let balance = principal

  for (let i = 0; i < termMonths; i++) {
    const interestPortion = monthlyRate === 0
      ? 0
      : roundToDecimals(balance * monthlyRate, 2)

    let principalPortion = monthlyRate === 0
      ? roundToDecimals(principal / termMonths, 2)
      : roundToDecimals(monthlyPayment - interestPortion, 2)

    // Adjust final payment to clear remaining balance
    if (i === termMonths - 1) {
      principalPortion = roundToDecimals(balance, 2)
    }

    const paymentAmount = roundToDecimals(principalPortion + interestPortion, 2)
    balance = roundToDecimals(Math.max(0, balance - principalPortion), 2)

    const dueDate = new Date(startDate)
    dueDate.setMonth(dueDate.getMonth() + i + 1)

    schedule.push({
      installment: i + 1,
      dueDate,
      amount: paymentAmount,
      principal: principalPortion,
      interest: interestPortion,
      remainingBalance: balance,
      status: 'pending'
    })
  }

  return schedule
}

function enrichLoanApplication(loan) {
  const doc = loan.toObject ? loan.toObject() : { ...loan }
  const amount = doc.approvedAmount || doc.amount
  const duration = doc.approvedDuration || doc.duration
  const rate = doc.approvedInterestRate || doc.interestRate

  const monthlyPayment = doc.repaymentSchedule?.length > 0
    ? doc.repaymentSchedule.find(p => p.status === 'pending')?.amount || doc.repaymentSchedule[0].amount
    : calculateMonthlyPayment(amount, rate, duration)

  const paidInstallments = (doc.repaymentSchedule || []).filter(p => p.status === 'paid').length
  const remainingBalance = (doc.repaymentSchedule || [])
    .filter(p => p.status === 'pending' || p.status === 'overdue')
    .reduce((sum, p) => sum + p.amount, 0)

  const nextPending = (doc.repaymentSchedule || [])
    .filter(p => p.status === 'pending' || p.status === 'overdue')
    .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))[0]

  // Once a real schedule exists, sum it directly rather than recomputing
  // from the flat formula — generateRepaymentSchedule rounds each
  // installment individually and balances the final installment to clear
  // the exact remaining balance, so the flat projection can drift a few
  // naira from what the schedule will actually collect.
  const hasSchedule = (doc.repaymentSchedule || []).length > 0
  const totalRepayment = hasSchedule
    ? doc.repaymentSchedule.reduce((sum, p) => sum + p.amount, 0)
    : calculateTotalRepayment(amount, rate, duration)
  const totalInterest = hasSchedule ? totalRepayment - amount : calculateTotalInterest(amount, rate, duration)

  return {
    ...doc,
    monthlyPayment,
    totalInterest,
    totalRepayment,
    remainingBalance: remainingBalance || (['approved', 'disbursed'].includes(doc.status) ? amount : 0),
    paidInstallments,
    remainingInstallments: duration - paidInstallments,
    nextPaymentDate: nextPending?.dueDate || null,
    nextPaymentAmount: nextPending?.amount || monthlyPayment
  }
}

module.exports = {
  calculateMonthlyPayment,
  calculateTotalRepayment,
  calculateTotalInterest,
  interestRateFromCreditScore,
  assessRisk,
  assessDebtToIncome,
  calculateEligibilityLimits,
  generateRepaymentSchedule,
  enrichLoanApplication
}
