"""
Baseline vs ML Model Comparison

This module provides utilities to compare the rule-based baseline model
against the ML model for evaluation purposes.
"""

from .rule_baseline import RuleBasedStressPredictor
from .stress_predictor import StressPredictor
from django.utils import timezone
from datetime import timedelta
from django.db.models import Avg
from api.models import Reading, StressEvent


def compare_models_on_dataset():
    """
    Compare rule-based baseline and ML model on the same dataset.
    
    Returns:
        Dictionary with comparison metrics
    """
    from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
    
    # Get labeled data
    stress_events = StressEvent.objects.select_related('reading', 'user').filter(
        reading__isnull=False
    )
    
    if stress_events.count() < 10:
        return {
            'error': 'Insufficient data for comparison',
            'data_points': stress_events.count()
        }
    
    # Prepare data
    baseline_predictor = RuleBasedStressPredictor()
    ml_predictor = StressPredictor()
    
    X = []
    y_true = []
    
    for event in stress_events:
        reading = event.reading
        if not reading or not reading.hr_bpm:
            continue
        
        # Get baselines
        baseline = ml_predictor.get_user_baselines(event.user, reading.id)
        
        # Prepare features
        hr_bpm = reading.hr_bpm or 0
        hrv_rmssd = reading.hrv_rmssd or 0
        hr_deviation = hr_bpm - baseline['hr']
        hrv_deviation = hrv_rmssd - baseline['hrv']
        
        X.append([hr_bpm, hrv_rmssd, hr_deviation, hrv_deviation])
        y_true.append(event.level)
    
    if len(X) < 10:
        return {
            'error': 'Insufficient valid data',
            'data_points': len(X)
        }
    
    # Baseline predictions
    y_baseline = baseline_predictor.predict(X)
    
    # ML predictions (if model is trained)
    y_ml = None
    ml_metrics = None
    if ml_predictor.is_trained:
        try:
            import numpy as np
            X_array = np.array(X)
            y_ml = ml_predictor.predict(X_array)
            
            ml_accuracy = accuracy_score(y_true, y_ml)
            ml_metrics = {
                'accuracy': float(ml_accuracy),
                'report': classification_report(y_true, y_ml, output_dict=True)
            }
        except Exception as e:
            ml_metrics = {'error': str(e)}
    
    # Baseline metrics
    baseline_accuracy = accuracy_score(y_true, y_baseline)
    baseline_metrics = {
        'accuracy': float(baseline_accuracy),
        'report': classification_report(y_true, y_baseline, output_dict=True)
    }
    
    return {
        'data_points': len(X),
        'baseline': baseline_metrics,
        'ml': ml_metrics,
        'improvement': {
            'absolute': float(baseline_accuracy - (ml_metrics['accuracy'] if ml_metrics and 'accuracy' in ml_metrics else 0)),
            'relative': float((baseline_accuracy - (ml_metrics['accuracy'] if ml_metrics and 'accuracy' in ml_metrics else 0)) / baseline_accuracy * 100) if baseline_accuracy > 0 else 0
        } if ml_metrics and 'accuracy' in ml_metrics else None
    }

