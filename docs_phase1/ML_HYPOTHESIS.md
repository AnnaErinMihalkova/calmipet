# ML Hypothesis

## Problem Statement

The current system uses rule-based heuristics to detect stress levels from physiological readings (heart rate and heart rate variability). These rules rely on fixed thresholds and simple comparisons to user baselines. We hypothesize that a machine learning model can learn more nuanced patterns in the relationship between physiological signals and stress levels, potentially improving detection accuracy and reducing false positives/negatives.

## Hypothesis

**A Random Forest Classifier trained on historical physiological readings and their associated stress event labels can predict stress levels with equal or better accuracy than the current rule-based detection system.**

## Input Data

The model uses the following features derived from `Reading` records:

1. **hr_bpm** (Heart Rate): Raw heart rate in beats per minute (30-220 BPM range)
2. **hrv_rmssd** (Heart Rate Variability): RMSSD metric in milliseconds (typically 10-200 ms)
3. **hr_deviation**: Deviation from user's personal baseline HR (calculated from last 7 days of readings)
4. **hrv_deviation**: Deviation from user's personal baseline HRV (calculated from last 7 days of readings)

**Data Source**: Historical `Reading` records that have associated `StressEvent` records, where the stress event's `level` field serves as the ground truth label.

## Output Prediction

The model predicts one of four stress level classes:
- **'low'**: Normal stress levels
- **'moderate'**: Elevated but manageable stress
- **'high'**: Significant stress requiring attention
- **'critical'**: Severe stress requiring immediate intervention

This matches the classification used by the existing rule-based `detect_stress_level()` function.

## Success Metrics

### Primary Metric
- **Classification Accuracy**: The percentage of stress level predictions that match the ground truth labels from `StressEvent` records.

### Secondary Metrics
- **Per-Class Performance**: Precision, recall, and F1-score for each stress level class (important due to potential class imbalance)
- **Cross-Validation Score**: 5-fold cross-validation to assess model generalization
- **Feature Importance**: Understanding which features (HR, HRV, deviations) contribute most to predictions

### Success Criteria
- **Minimum Viable**: Model achieves >60% accuracy (baseline: random guess would be 25% for 4 classes)
- **Target Performance**: Model achieves >75% accuracy, indicating it learns meaningful patterns
- **Comparison Baseline**: Compare against rule-based system accuracy on the same test set

### Acceptable Outcomes
- **Success**: Model performs equal to or better than rule-based system → Consider integration
- **Partial Success**: Model performs reasonably (>60% accuracy) but below rule-based → Document learnings for future improvement
- **Failure**: Model performs poorly (<60% accuracy) or insufficient data → Document limitations and data requirements

## Experimental Design

- **Model**: Random Forest Classifier (100 trees, max depth 10, balanced class weights)
- **Training Data**: Historical readings with associated stress events
- **Evaluation**: Train/test split (80/20) with 5-fold cross-validation
- **Baseline Comparison**: Evaluate rule-based system on same test set for direct comparison

## Expected Challenges

1. **Data Sparsity**: May have limited labeled examples (stress events with readings)
2. **Class Imbalance**: 'Low' stress events likely more common than 'critical'
3. **Individual Variation**: Stress patterns may vary significantly between users
4. **Temporal Patterns**: Current model doesn't capture time-of-day or sequential patterns

## Future Improvements (If Hypothesis Validated)

- Add temporal features (time of day, day of week)
- User-specific models or transfer learning
- Ensemble methods combining multiple algorithms
- Real-time prediction API endpoint

