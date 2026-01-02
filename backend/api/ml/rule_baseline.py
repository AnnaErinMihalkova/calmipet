"""
Baseline Rule-Based Stress Prediction Model

This module implements a deterministic rule-based model for stress level prediction.
It serves as a baseline to compare against the ML model performance.

The model uses the same input features and output format as the ML model:
- Input: hr_bpm, hrv_rmssd, hr_deviation, hrv_deviation
- Output: stress level ('low', 'moderate', 'high', 'critical')

Rules are based on physiological research and clinical thresholds:
- HR elevation indicates stress activation
- HRV reduction indicates reduced parasympathetic activity (stress)
- Combined indicators provide more reliable assessment
"""


class RuleBasedStressPredictor:
    """
    Deterministic rule-based stress level predictor.
    
    Uses if/else logic based on physiological thresholds to classify stress levels.
    No ML libraries required - pure Python logic.
    """
    
    def __init__(self):
        """
        Initialize the rule-based predictor.
        
        Thresholds are based on:
        - HR elevation: >30 BPM = critical, >20 = high, >10 = moderate
        - HRV reduction: >20 ms drop = high stress, >10 ms = moderate
        - Absolute HR thresholds: >100 BPM = elevated, >120 BPM = high
        - Absolute HRV thresholds: <30 ms = high stress, <40 ms = moderate
        """
        # HR deviation thresholds (BPM above baseline)
        self.HR_CRITICAL_THRESHOLD = 30  # >30 BPM elevation = critical stress
        self.HR_HIGH_THRESHOLD = 20      # >20 BPM elevation = high stress
        self.HR_MODERATE_THRESHOLD = 10  # >10 BPM elevation = moderate stress
        
        # HRV deviation thresholds (ms below baseline)
        # Lower HRV = higher stress (parasympathetic withdrawal)
        self.HRV_HIGH_THRESHOLD = 20     # >20 ms drop = high stress
        self.HRV_MODERATE_THRESHOLD = 10 # >10 ms drop = moderate stress
        
        # Absolute HR thresholds (BPM)
        self.HR_ABSOLUTE_HIGH = 120      # >120 BPM = high stress (even without baseline)
        self.HR_ABSOLUTE_ELEVATED = 100  # >100 BPM = elevated (moderate stress)
        
        # Absolute HRV thresholds (ms)
        # Lower HRV indicates higher stress
        self.HRV_ABSOLUTE_LOW = 30       # <30 ms = high stress
        self.HRV_ABSOLUTE_MODERATE = 40  # <40 ms = moderate stress
        
        # Combined indicator weights
        # When both HR and HRV indicate stress, severity increases
        self.COMBINED_CRITICAL_HR = 25   # HR elevation threshold when HRV also indicates stress
        self.COMBINED_CRITICAL_HRV = 15  # HRV drop threshold when HR also indicates stress
    
    def predict(self, features):
        """
        Predict stress level from feature vector.
        
        Args:
            features: List or array of features [hr_bpm, hrv_rmssd, hr_deviation, hrv_deviation]
                     Can be single sample or batch of samples
        
        Returns:
            List of predicted stress levels: 'low', 'moderate', 'high', or 'critical'
        """
        # Handle single sample (convert to list of lists)
        if not isinstance(features[0], (list, tuple)) and len(features) == 4:
            features = [features]
        
        predictions = []
        for feature_vector in features:
            hr_bpm = feature_vector[0]
            hrv_rmssd = feature_vector[1] if len(feature_vector) > 1 else None
            hr_deviation = feature_vector[2] if len(feature_vector) > 2 else 0
            hrv_deviation = feature_vector[3] if len(feature_vector) > 3 else 0
            
            stress_level = self._predict_single(hr_bpm, hrv_rmssd, hr_deviation, hrv_deviation)
            predictions.append(stress_level)
        
        return predictions
    
    def _predict_single(self, hr_bpm, hrv_rmssd, hr_deviation, hrv_deviation):
        """
        Predict stress level for a single sample using deterministic rules.
        
        Rule Logic:
        1. Check for critical indicators (highest priority)
        2. Check for high stress indicators
        3. Check for moderate stress indicators
        4. Default to low stress if no indicators
        
        Priority order:
        - Critical: Extreme HR elevation (>30 BPM) OR combined severe indicators
        - High: Significant HR elevation (>20 BPM) OR significant HRV drop (>20 ms) OR absolute thresholds
        - Moderate: Moderate HR elevation (>10 BPM) OR moderate HRV drop (>10 ms)
        - Low: No significant deviations
        
        Args:
            hr_bpm: Heart rate in beats per minute
            hrv_rmssd: Heart rate variability in milliseconds (can be None)
            hr_deviation: Deviation from baseline HR (positive = elevated)
            hrv_deviation: Deviation from baseline HRV (negative = reduced, indicates stress)
        
        Returns:
            Stress level: 'low', 'moderate', 'high', or 'critical'
        """
        # Rule 1: CRITICAL STRESS
        # Extreme HR elevation indicates critical stress
        if hr_deviation > self.HR_CRITICAL_THRESHOLD:
            return 'critical'
        
        # Combined critical: both HR and HRV show severe stress
        if (hr_deviation > self.COMBINED_CRITICAL_HR and 
            hrv_deviation < -self.COMBINED_CRITICAL_HRV):
            return 'critical'
        
        # Absolute critical: very high HR regardless of baseline
        if hr_bpm > 130:  # Extreme tachycardia
            return 'critical'
        
        # Rule 2: HIGH STRESS
        # Significant HR elevation
        if hr_deviation > self.HR_HIGH_THRESHOLD:
            return 'high'
        
        # Significant HRV reduction (negative deviation = stress)
        if hrv_rmssd is not None and hrv_deviation < -self.HRV_HIGH_THRESHOLD:
            return 'high'
        
        # Absolute high thresholds
        if hr_bpm > self.HR_ABSOLUTE_HIGH:
            return 'high'
        
        if hrv_rmssd is not None and hrv_rmssd < self.HRV_ABSOLUTE_LOW:
            return 'high'
        
        # Combined high: moderate elevation in both indicators
        if (hr_deviation > self.HR_MODERATE_THRESHOLD and 
            hrv_rmssd is not None and hrv_deviation < -self.HRV_MODERATE_THRESHOLD):
            return 'high'
        
        # Rule 3: MODERATE STRESS
        # Moderate HR elevation
        if hr_deviation > self.HR_MODERATE_THRESHOLD:
            return 'moderate'
        
        # Moderate HRV reduction
        if hrv_rmssd is not None and hrv_deviation < -self.HRV_MODERATE_THRESHOLD:
            return 'moderate'
        
        # Absolute moderate thresholds
        if hr_bpm > self.HR_ABSOLUTE_ELEVATED:
            return 'moderate'
        
        if hrv_rmssd is not None and hrv_rmssd < self.HRV_ABSOLUTE_MODERATE:
            return 'moderate'
        
        # Rule 4: LOW STRESS (default)
        # No significant deviations detected
        return 'low'
    
    def predict_proba(self, features):
        """
        Get prediction probabilities (for compatibility with ML model interface).
        
        Since this is deterministic, probabilities are binary (1.0 for predicted class, 0.0 for others).
        
        Args:
            features: Feature vector(s) [hr_bpm, hrv_rmssd, hr_deviation, hrv_deviation]
        
        Returns:
            List of probability distributions (one-hot encoded)
        """
        predictions = self.predict(features)
        classes = ['low', 'moderate', 'high', 'critical']
        
        probabilities = []
        for pred in predictions:
            prob = [1.0 if pred == cls else 0.0 for cls in classes]
            probabilities.append(prob)
        
        return probabilities


def predict_stress_baseline(hr_bpm, hrv_rmssd=None, hr_deviation=0, hrv_deviation=0):
    """
    Convenience function for single prediction.
    
    Args:
        hr_bpm: Heart rate in beats per minute
        hrv_rmssd: Heart rate variability in milliseconds (optional)
        hr_deviation: Deviation from baseline HR
        hrv_deviation: Deviation from baseline HRV
    
    Returns:
        Predicted stress level: 'low', 'moderate', 'high', or 'critical'
    """
    predictor = RuleBasedStressPredictor()
    return predictor._predict_single(hr_bpm, hrv_rmssd, hr_deviation, hrv_deviation)

