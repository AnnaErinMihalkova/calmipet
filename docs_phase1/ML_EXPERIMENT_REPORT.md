# ML Experiment Report

## 1. Hypothesis
We hypothesized that a Machine Learning model (Random Forest) could outperform the existing rule-based system for stress detection by identifying complex, non-linear patterns in heart rate (HR) and heart rate variability (HRV) data, particularly when incorporating historical baseline deviations.

**Core Question:** Can a trained classifier predict stress levels ('high', 'moderate', 'low', 'critical') more accurately than fixed threshold rules?

## 2. Dataset
The experiment utilized real user data collected from the application's bracelet simulator and manual stress logging.

- **Source:** `StressEvent` records (labels) linked to `Reading` data (features).
- **Total Data Points:** 387
- **Training Set:** 309 samples (80%)
- **Test Set:** 78 samples (20%)
- **Features Used:**
  1. `hr_bpm`: Current Heart Rate
  2. `hrv_rmssd`: Current Heart Rate Variability
  3. `hr_deviation`: Deviation from user's 7-day average HR
  4. `hrv_deviation`: Deviation from user's 7-day average HRV
- **Class Distribution:** The dataset primarily contained 'moderate' and 'high' stress labels during this capture period.

## 3. Baseline Model
The existing **Rule-Based System** uses fixed thresholds:
- **High Stress:** HR > 100 OR HRV < 20
- **Moderate Stress:** HR > 80 OR HRV < 40
- **Low Stress:** Otherwise

*Note: The baseline was evaluated on the same test set as the ML model for fair comparison.*

## 4. ML Model
We implemented a **Random Forest Classifier** using `scikit-learn`.

- **Algorithm:** Random Forest
- **Hyperparameters:**
  - `n_estimators`: 100
  - `max_depth`: 10
  - `class_weight`: 'balanced' (to handle potential class imbalance)
- **Training Strategy:** 5-fold cross-validation during development; final evaluation on held-out test set.

## 5. Results

The ML model demonstrated a significant improvement over the rule-based baseline.

| Metric | Rule-Based Baseline | ML Model (Random Forest) | Improvement |
|--------|---------------------|--------------------------|-------------|
| **Accuracy** | **87.18%** | **96.15%** | **+8.97%** |

### Detailed Performance (ML Model)
- **Precision:** ~96% (weighted avg)
- **Recall:** ~96% (weighted avg)
- **F1-Score:** ~96% (weighted avg)

### Feature Importance
The model relied heavily on HRV-related metrics, confirming that variability is a stronger predictor of stress than raw heart rate:
1. **HRV (RMSSD):** ~54.6% importance
2. **HRV Deviation:** ~39.0% importance
3. **HR Deviation:** ~4.6% importance
4. **HR (BPM):** ~1.8% importance

## 6. Lessons Learned
1. **HRV is King:** Heart Rate Variability (and its deviation from baseline) is overwhelmingly the most important predictor. Raw Heart Rate alone is less informative.
2. **Personalization Matters:** Including baseline deviations (`hr_deviation`, `hrv_deviation`) allowed the model to account for individual user norms, likely contributing to the accuracy boost.
3. **Data Diversity:** The current dataset was dominated by 'moderate' and 'high' stress events. Future data collection must prioritize 'low' and 'critical' states to ensure the model generalizes across the full spectrum.
4. **Rule-Based is Decent:** A baseline accuracy of 87% is surprisingly good, suggesting the heuristic rules are well-tuned, but ML still offers a ~9% edge that could be critical for reducing false positives/negatives.

## 7. Conclusion
**SUCCESS**

The experiment successfully validated the hypothesis. The ML model outperformed the rule-based baseline by approximately 9%, achieving an accuracy of 96.15% on the test set.

**Recommendation:**
Proceed with integrating the ML model into the production pipeline as a "Shadow Mode" first (logging predictions without showing them) to verify performance on live data, eventually replacing or augmenting the rule-based system.
