"""
Simple ML experiment: Stress Level Prediction Model

This module implements a basic machine learning model to predict stress levels
based on HR and HRV readings. This is an experimental feature to explore
whether ML can improve stress detection beyond rule-based methods.

Experiment Design:
- Use existing StressEvent data as labels
- Features: HR, HRV, and derived features (baseline deviations)
- Model: Random Forest Classifier (simple, interpretable)
- Evaluation: Cross-validation, confusion matrix
"""

import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from sklearn.preprocessing import LabelEncoder
from django.utils import timezone
from datetime import timedelta
from django.db.models import Avg
import logging
import json
import os

logger = logging.getLogger(__name__)


class StressPredictor:
    """
    Simple ML model for predicting stress levels from HR/HRV data.
    
    This is an experimental implementation - results may vary based on data quality.
    """
    
    def __init__(self):
        self.model = RandomForestClassifier(
            n_estimators=100,
            max_depth=10,
            random_state=42,
            class_weight='balanced'  # Handle imbalanced classes
        )
        self.label_encoder = LabelEncoder()
        self.is_trained = False
        self.feature_names = ['hr_bpm', 'hrv_rmssd', 'hr_deviation', 'hrv_deviation']
        
    def prepare_features(self, readings, user_baselines=None):
        """
        Prepare feature matrix from readings.
        
        Features:
        - hr_bpm: Heart rate
        - hrv_rmssd: Heart rate variability
        - hr_deviation: Deviation from user baseline HR
        - hrv_deviation: Deviation from user baseline HRV
        """
        features = []
        
        for reading in readings:
            feature_vector = []
            
            # Basic features
            feature_vector.append(reading.hr_bpm or 0)
            feature_vector.append(reading.hrv_rmssd or 0)
            
            # Deviation features (if baseline available)
            if user_baselines:
                hr_baseline = user_baselines.get('hr', 70)
                hrv_baseline = user_baselines.get('hrv', 50)
                
                hr_dev = (reading.hr_bpm or 0) - hr_baseline
                hrv_dev = (reading.hrv_rmssd or 0) - hrv_baseline
            else:
                hr_dev = 0
                hrv_dev = 0
            
            feature_vector.append(hr_dev)
            feature_vector.append(hrv_dev)
            
            features.append(feature_vector)
        
        return np.array(features)
    
    def get_user_baselines(self, user, reading_id=None):
        """Calculate user baseline HR and HRV from recent readings."""
        week_ago = timezone.now() - timedelta(days=7)
        baseline_query = Reading.objects.filter(
            user=user,
            ts__gte=week_ago
        )
        
        if reading_id:
            baseline_query = baseline_query.exclude(id=reading_id)
        
        baselines = baseline_query.aggregate(
            avg_hr=Avg('hr_bpm'),
            avg_hrv=Avg('hrv_rmssd')
        )
        
        return {
            'hr': baselines['avg_hr'] or 70,
            'hrv': baselines['avg_hrv'] or 50
        }
    
    def train(self, X, y):
        """
        Train the model on labeled data.
        
        Args:
            X: Feature matrix (n_samples, n_features)
            y: Labels (stress levels: 'low', 'moderate', 'high', 'critical')
        """
        if len(X) == 0:
            raise ValueError("Cannot train on empty dataset")
        
        # Encode labels
        y_encoded = self.label_encoder.fit_transform(y)
        
        # Train model
        self.model.fit(X, y_encoded)
        self.is_trained = True
        
        logger.info(f"Model trained on {len(X)} samples")
    
    def predict(self, X):
        """
        Predict stress levels for given features.
        
        Returns:
            List of predicted stress levels
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before prediction")
        
        predictions_encoded = self.model.predict(X)
        predictions = self.label_encoder.inverse_transform(predictions_encoded)
        
        return predictions.tolist()
    
    def predict_proba(self, X):
        """Get prediction probabilities."""
        if not self.is_trained:
            raise ValueError("Model must be trained before prediction")
        
        return self.model.predict_proba(X)
    
    def evaluate(self, X, y):
        """
        Evaluate model performance.
        
        Returns:
            Dictionary with metrics
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before evaluation")
        
        y_encoded = self.label_encoder.transform(y)
        predictions_encoded = self.model.predict(X)
        
        accuracy = accuracy_score(y_encoded, predictions_encoded)
        
        # Cross-validation score
        cv_scores = cross_val_score(self.model, X, y_encoded, cv=5)
        
        # Classification report
        report = classification_report(
            y_encoded, predictions_encoded,
            target_names=self.label_encoder.classes_,
            output_dict=True
        )
        
        # Confusion matrix
        cm = confusion_matrix(y_encoded, predictions_encoded)
        
        return {
            'accuracy': float(accuracy),
            'cv_mean': float(cv_scores.mean()),
            'cv_std': float(cv_scores.std()),
            'classification_report': report,
            'confusion_matrix': cm.tolist(),
            'class_labels': self.label_encoder.classes_.tolist()
        }


def run_experiment():
    """
    Run the ML experiment using existing data.
    
    This function:
    1. Loads readings with associated stress events
    2. Prepares features
    3. Trains model
    4. Evaluates performance
    5. Returns results
    """
    from api.models import Reading, StressEvent
    
    logger.info("Starting ML stress prediction experiment...")
    
    # Get readings that have associated stress events
    stress_events = StressEvent.objects.select_related('reading', 'user').filter(
        reading__isnull=False
    )
    
    if stress_events.count() < 10:
        logger.warning(
            f"Only {stress_events.count()} stress events with readings found. "
            "Need at least 10 for meaningful experiment. "
            "Consider using synthetic data or collecting more data."
        )
        return {
            'success': False,
            'error': 'Insufficient data',
            'data_points': stress_events.count(),
            'min_required': 10
        }
    
    # Prepare data
    readings = []
    labels = []
    users = []
    
    for event in stress_events:
        reading = event.reading
        if reading and reading.hr_bpm:  # Must have HR data
            readings.append(reading)
            labels.append(event.level)
            users.append(event.user)
    
    if len(readings) < 10:
        return {
            'success': False,
            'error': 'Insufficient valid readings',
            'data_points': len(readings),
            'min_required': 10
        }
    
    logger.info(f"Prepared {len(readings)} samples for training")
    
    # Prepare features
    predictor = StressPredictor()
    X = []
    y = []
    
    for i, reading in enumerate(readings):
        user = users[i]
        baseline = predictor.get_user_baselines(user, reading.id)
        features = predictor.prepare_features([reading], baseline)
        X.append(features[0])
        y.append(labels[i])
    
    X = np.array(X)
    y = np.array(y)
    
    # Split data
    if len(X) < 20:
        # Too small for train/test split, use all for training
        X_train, X_test = X, X
        y_train, y_test = y, y
    else:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y
        )
    
    # Train model
    try:
        predictor.train(X_train, y_train)
        
        # Evaluate
        train_metrics = predictor.evaluate(X_train, y_train)
        test_metrics = predictor.evaluate(X_test, y_test) if len(X_test) > 0 else None
        
        results = {
            'success': True,
            'data_points': len(readings),
            'train_samples': len(X_train),
            'test_samples': len(X_test),
            'train_metrics': train_metrics,
            'test_metrics': test_metrics,
            'feature_importance': dict(zip(
                predictor.feature_names,
                predictor.model.feature_importances_.tolist()
            )),
            'model_type': 'RandomForestClassifier',
            'parameters': {
                'n_estimators': 100,
                'max_depth': 10,
                'class_weight': 'balanced'
            }
        }
        
        logger.info(f"Experiment completed. Test accuracy: {test_metrics['accuracy'] if test_metrics else train_metrics['accuracy']:.2%}")
        
        return results
        
    except Exception as e:
        logger.error(f"Experiment failed: {str(e)}", exc_info=True)
        return {
            'success': False,
            'error': str(e),
            'data_points': len(readings)
        }


# Import here to avoid circular imports
from api.models import Reading

