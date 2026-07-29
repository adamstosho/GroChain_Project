# STATISTICAL ANALYSIS GUIDE
## GroChain — Ilorin Metropolis Evaluation

---

## 1. Sample size verification (already calculated)

| Parameter | Value |
|-----------|-------|
| Effect size (Cohen's d) | 0.40 |
| α | 0.05 |
| Power | 0.80 |
| Minimum per group | 99 |
| Design effect | 1.20 |
| Non-response inflation | 15% |
| **Target total** | **280** (180 farmers + 100 buyers) |

Re-calculate in G*Power 3.1 after pilot if standard deviation differs substantially.

---

## 2. Variable coding scheme

| Variable | Type | Values / Notes |
|----------|------|----------------|
| `participant_type` | Nominal | 1=farmer, 2=buyer |
| `lga` | Nominal | 1=East, 2=West, 3=South |
| `sex` | Binary | 0=male, 1=female |
| `education` | Ordinal | 0=none, 1=primary, 2=secondary, 3=tertiary |
| `income_tertile` | Ordinal | 1=low, 2=medium, 3=high (from B9) |
| `grochain_user` | Binary | 0=no, 1=yes (E2) |
| `grochain_intensity` | Continuous | 0–12 (computed) |
| `hfias_score` | Continuous | 0–27 |
| `hfias_cat` | Ordinal | 0=secure, 1=mild, 2=moderate, 3=severe |
| `mddw_score` | Continuous | 0–10 (women 15–49 only) |
| `mddw_achieved` | Binary | 0=<5 groups, 1=≥5 groups |
| `wash_index` | Continuous | 0–6 (F1–F4 scored) |

### GroChain intensity index computation (R/SPSS)

```r
# R syntax — GroChain use intensity index
compute_intensity <- function(harvests, listings, transactions, ussd, qr) {
  pts_h <- cut(harvests, breaks=c(-Inf,0,2,5,Inf), labels=0:3)
  pts_l <- cut(listings, breaks=c(-Inf,0,2,5,Inf), labels=0:3)
  pts_t <- cut(transactions, breaks=c(-Inf,0,2,5,Inf), labels=0:3)
  pts_uq <- (ussd==1) + (qr==1) + (ussd==1 & qr==1)  # cap at 3 manually
  as.numeric(pts_h) + as.numeric(pts_l) + as.numeric(pts_t) + pmin(pts_uq, 3)
}
```

### HFIAS category (FAO FANTA algorithm)

Use the official HFIAS Excel tool or `hfias` package in R:
https://www.fao.org/fileadmin/templates/ess/voh/FIES_Tools/HFIAS/HFIAS_Measurement_and_Scale.pdf

---

## 3. Descriptive analysis

```spss
* SPSS — Descriptives by GroChain user status.
SORT CASES BY grochain_user.
SPLIT FILE LAYERED BY grochain_user.
DESCRIPTIVES VARIABLES=hfias_score mddw_score age household_size
  /STATISTICS=MEAN STDDEV MIN MAX.
FREQUENCIES hfias_cat mddw_achieved sex education lga.
SPLIT FILE OFF.
```

Report:
- Mean (SD) for continuous variables
- n (%) for categorical variables
- 95% CI for MDD-W prevalence (Wilson method)

---

## 4. Bivariate tests

| Comparison | Test |
|------------|------|
| HFIAS score: users vs non-users | Independent t-test or Mann–Whitney U (check normality) |
| MDD-W achieved: users vs non-users | Chi-square or Fisher's exact |
| GroChain intensity × food groups | Chi-square per food group |
| HFIAS × LGA | Kruskal–Wallis |

Normality: Shapiro–Wilk on HFIAS scores; if p<0.05, use non-parametric tests.

---

## 5. Multivariable regression

### Model 1: HFIAS score (linear regression)

```r
model_hfias <- lm(hfias_score ~ grochain_intensity + sex + education +
                    income_tertile + household_size + wash_index +
                    factor(lga), data = df)

summary(model_hfias)
confint(model_hfias)
car::vif(model_hfias)  # All VIF < 5
```

**Interpretation:** β coefficient = change in HFIAS score per unit increase in GroChain intensity, holding covariates constant. **Negative β** supports hypothesis (lower insecurity with higher use).

### Model 2: MDD-W achieved (logistic regression)

```r
model_mddw <- glm(mddw_achieved ~ grochain_intensity + sex + education +
                    income_tertile + household_size + wash_index +
                    factor(lga), family=binomial, data=df_women)

exp(cbind(OR=coef(model_mddw), confint(model_mddw)))
```

**Interpretation:** OR > 1 for `grochain_intensity` indicates higher odds of achieving MDD-W.

### Model 3: Sensitivity — binary GroChain user

Repeat Models 1–2 using `grochain_user` (binary) instead of intensity index.

### Model 4: Stratification

Run Model 2 separately by LGA and sex; report if interaction term `grochain_intensity * sex` is significant.

---

## 6. Qualitative analysis (NVivo 14)

1. Import transcripts  
2. Code deductively: trust, finance, digital divide, nutrition pathways, policy  
3. Code inductively: emergent sub-themes  
4. Thematic map → Table 8  
5. Member checking with 3 KII participants  

---

## 7. Integration (joint display)

Cross-tabulate:
- High GroChain intensity + Low HFIAS = "Digital access success cases"
- Non-user + High HFIAS = "Excluded or unreached households"
- Qualitative quotes attached to each quadrant → Figure 5

---

## 8. Expected direction of findings (hypotheses — NOT fabricated results)

| Hypothesis | Expected direction | Test |
|------------|-------------------|------|
| H1 | GroChain users have lower HFIAS scores than non-users | t-test / regression β < 0 |
| H2 | GroChain users have higher MDD-W achievement | OR > 1 |
| H3 | USSD users include more women/older farmers | Chi-square |
| H4 | Higher shipment risk alerts correlate with higher HFIAS among farmers | Spearman ρ > 0 |

**These are a priori hypotheses only.** Report actual findings regardless of direction.

---

## 9. Reporting checklist before submission

- [ ] All ___ placeholders in manuscript replaced  
- [ ] CONSORT/STROBE flow figure complete  
- [ ] Regression assumptions verified (residual plots saved)  
- [ ] Multiple comparison adjustment considered for food group tests (Bonferroni)  
- [ ] Internal consistency of HFIAS reported (Cronbach's α)  
- [ ] Ethics approval number inserted  
- [ ] AI declaration completed  

---

## 10. Realistic timeline from raw data to submission-ready Results

| Day | Task |
|-----|------|
| 1–3 | Data entry and cleaning (check range values) |
| 4–5 | Compute HFIAS categories and MDD-W scores |
| 6–7 | Descriptive statistics → Table 2–5 |
| 8–10 | Regression models → Table 6 |
| 11–12 | Qualitative coding → Table 8 |
| 13–14 | Write Results narrative; create Figures 2–5 |
| 15 | Internal peer review by co-authors |
