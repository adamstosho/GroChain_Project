/**
 * Standard amortized loan calculations — mirrors backend/utils/loan-calculations.js
 * EMI = P × r × (1+r)^n / ((1+r)^n − 1)
 */

export function calculateMonthlyPayment(
  principal: number,
  annualRatePercent: number,
  termMonths: number
): number {
  if (!principal || !termMonths || principal <= 0 || termMonths <= 0) return 0

  const monthlyRate = annualRatePercent / 100 / 12
  if (monthlyRate === 0) return Math.round(principal / termMonths)

  const factor = Math.pow(1 + monthlyRate, termMonths)
  return Math.round((principal * monthlyRate * factor) / (factor - 1))
}

export function calculateTotalRepayment(
  principal: number,
  annualRatePercent: number,
  termMonths: number
): number {
  return calculateMonthlyPayment(principal, annualRatePercent, termMonths) * termMonths
}

export function calculateTotalInterest(
  principal: number,
  annualRatePercent: number,
  termMonths: number
): number {
  return calculateTotalRepayment(principal, annualRatePercent, termMonths) - principal
}

export function interestRateFromCreditScore(score: number): number | null {
  if (score >= 750) return 12
  if (score >= 650) return 14
  if (score >= 550) return 16
  if (score >= 500) return 18
  return null
}

export function assessDebtToIncome(
  monthlyPayment: number,
  existingMonthlyPayments: number,
  monthlyIncome: number
): 'excellent' | 'good' | 'fair' | 'poor' | 'unknown' {
  if (!monthlyIncome || monthlyIncome <= 0) return 'unknown'

  const ratio = (monthlyPayment + existingMonthlyPayments) / monthlyIncome
  if (ratio <= 0.3) return 'excellent'
  if (ratio <= 0.4) return 'good'
  if (ratio <= 0.5) return 'fair'
  return 'poor'
}

export function calculateEligibilityLimits(score: number) {
  const clamped = Math.max(300, Math.min(850, score))
  const normalized = (clamped - 300) / 550
  return {
    loans: score >= 500,
    maxLoanAmount: Math.round(normalized * 2_000_000),
    maxInsuranceCoverage: Math.round(normalized * 1_000_000),
  }
}

export interface RepaymentInstallment {
  installment: number
  dueDate: Date
  amount: number
  principal: number
  interest: number
  remainingBalance: number
}

export function generateRepaymentSchedule(
  principal: number,
  annualRatePercent: number,
  termMonths: number,
  startDate: Date = new Date()
): RepaymentInstallment[] {
  const monthlyRate = annualRatePercent / 100 / 12
  const monthlyPayment = calculateMonthlyPayment(principal, annualRatePercent, termMonths)
  const schedule: RepaymentInstallment[] = []
  let balance = principal

  for (let i = 0; i < termMonths; i++) {
    const interestPortion =
      monthlyRate === 0 ? 0 : Math.round(balance * monthlyRate * 100) / 100

    let principalPortion =
      monthlyRate === 0
        ? Math.round((principal / termMonths) * 100) / 100
        : Math.round((monthlyPayment - interestPortion) * 100) / 100

    if (i === termMonths - 1) {
      principalPortion = Math.round(balance * 100) / 100
    }

    const paymentAmount = Math.round((principalPortion + interestPortion) * 100) / 100
    balance = Math.max(0, Math.round((balance - principalPortion) * 100) / 100)

    const dueDate = new Date(startDate)
    dueDate.setMonth(dueDate.getMonth() + i + 1)

    schedule.push({
      installment: i + 1,
      dueDate,
      amount: paymentAmount,
      principal: principalPortion,
      interest: interestPortion,
      remainingBalance: balance,
    })
  }

  return schedule
}
