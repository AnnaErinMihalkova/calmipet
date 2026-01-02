# ML Experiment: Stress Prediction Model

## ML Hypothesis

### Problem Statement
The current system uses rule-based heuristics to detect stress levels from physiological readings (heart rate and heart rate variability). These rules rely on fixed thresholds and simple comparisons to user baselines. We hypothesize that a machine learning model can learn more nuanced patterns in the relationship between physiological signals and stress levels, potentially improving detection accuracy and reducing false positives/negatives.

### Hypothesis
**A Random Forest Classifier trained on historical physiological readings and their associated stress event labels can predict stress levels with equal or better accuracy than the current rule-based detection system.**

### Input Data
The model uses the following features derived from `Reading` records:
1. **hr_bpm** (Heart Rate): Raw heart rate in beats per minute (30-220 BPM range)
2. **hrv_rmssd** (Heart Rate Variability): RMSSD metric in milliseconds (typically 10-200 ms)
3. **hr_deviation**: Deviation from user's personal baseline HR (calculated from last 7 days of readings)
4. **hrv_deviation**: Deviation from user's personal baseline HRV (calculated from last 7 days of readings)

**Data Source**: Historical `Reading` records that have associated `StressEvent` records, where the stress event's `level` field serves as the ground truth label.

### Output Prediction
The model predicts one of four stress level classes:
- **'low'**: Normal stress levels
- **'moderate'**: Elevated but manageable stress
- **'high'**: Significant stress requiring attention
- **'critical'**: Severe stress requiring immediate intervention

This matches the classification used by the existing rule-based `detect_stress_level()` function.

### Success Metrics

**Primary Metric**: Classification Accuracy - The percentage of stress level predictions that match the ground truth labels from `StressEvent` records.

**Secondary Metrics**:
- Per-Class Performance: Precision, recall, and F1-score for each stress level class
- Cross-Validation Score: 5-fold cross-validation to assess model generalization
- Feature Importance: Understanding which features contribute most to predictions

**Success Criteria**:
- **Minimum Viable**: >60% accuracy (baseline: random guess would be 25% for 4 classes)
- **Target Performance**: >75% accuracy, indicating meaningful pattern learning
- **Comparison Baseline**: Compare against rule-based system accuracy on the same test set

**Acceptable Outcomes**:
- **Success**: Model performs equal to or better than rule-based system → Consider integration
- **Partial Success**: Model performs reasonably (>60% accuracy) but below rule-based → Document learnings
- **Failure**: Model performs poorly (<60% accuracy) or insufficient data → Document limitations

---

## Experiment Overview

**Objective**: Test the ML hypothesis by training and evaluating a stress prediction model.

**Date**: Sprint 4  
**Status**: Experimental (success or failure acceptable)

## Methodology

### Model Type
- **Algorithm**: Random Forest Classifier
- **Rationale**: Simple, interpretable, handles non-linear relationships
- **Parameters**:
  - `n_estimators`: 100
  - `max_depth`: 10
  - `class_weight`: 'balanced' (handle imbalanced classes)

### Features
1. **hr_bpm**: Heart rate in beats per minute
2. **hrv_rmssd**: Heart rate variability (RMSSD)
3. **hr_deviation**: Deviation from user's baseline HR (last 7 days)
4. **hrv_deviation**: Deviation from user's baseline HRV (last 7 days)

### Data Source
- Training data: Existing `StressEvent` records with associated `Reading` data
- Labels: Stress levels ('low', 'moderate', 'high', 'critical')
- Minimum required: 10 data points for basic experiment

### Evaluation Metrics
- Accuracy
- Cross-validation score (5-fold)
- Classification report (precision, recall, F1-score per class)
- Confusion matrix
- Feature importance

## Running the Experiment

```bash
cd backend
python manage.py run_ml_experiment
```

Results are saved to:
- `backend/api/ml/experiment_results.json` (JSON format)
- This document (Markdown summary)

## Expected Outcomes

### Success Criteria
- Model trains without errors
- Results documented (even if accuracy is low)
- Feature importance insights
- Comparison with rule-based method

### Acceptable Failures
- Insufficient data (need at least 10 labeled examples)
- Poor model performance (still valuable as learning exercise)
- Data quality issues

## Results

*Results will be populated after running the experiment*

### Summary
- **Status**: [Pending/Success/Failure]
- **Data Points**: [Number]
- **Test Accuracy**: [Percentage]
- **Key Insights**: [TBD]

### Detailed Metrics
See `backend/api/ml/experiment_results.json` for full metrics including:
- Classification report
- Confusion matrix
- Feature importance scores
- Cross-validation scores

## Limitations

1. **Data Dependency**: Requires existing stress events with readings
2. **Small Dataset**: May not have enough data for robust training
3. **Feature Engineering**: Simple features - could be enhanced
4. **Baseline Comparison**: Should compare with rule-based `detect_stress_level()`

## Future Improvements

1. **More Features**: Add time-of-day, day-of-week, recent trends
2. **Data Collection**: Collect more labeled examples
3. **Model Selection**: Try other algorithms (SVM, Neural Networks)
4. **Hyperparameter Tuning**: Optimize model parameters
5. **A/B Testing**: Compare ML vs rule-based in production

## Conclusion

*To be updated after experiment execution*

This experiment serves as a proof-of-concept for ML-based stress prediction.
Even if results are not production-ready, the exercise provides valuable
insights into:
- Data requirements for ML models
- Feature engineering challenges
- Model interpretability
- Integration with existing systems

