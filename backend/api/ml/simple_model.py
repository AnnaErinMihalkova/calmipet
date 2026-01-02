"""
Simple ML Model: Decision Tree for Stress Prediction

This module implements a simple, interpretable decision tree model for stress prediction.
Designed to be readable, explainable, and easy to understand.

Key characteristics:
- Simple algorithm: Decision Tree (single tree, not ensemble)
- Minimal feature engineering: Uses raw features as-is
- No hyperparameter tuning: Uses sensible defaults
- Clear training/inference: Explicit steps with documentation
"""

from sklearn.tree import DecisionTreeClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import accuracy_score, classification_report, confusion_matrix
from sklearn.model_selection import train_test_split
import logging

logger = logging.getLogger(__name__)


class SimpleStressPredictor:
    """
    Simple Decision Tree model for stress level prediction.
    
    This is a minimal, interpretable implementation designed for clarity and
    explainability rather than maximum performance.
    
    Algorithm: Decision Tree Classifier
    - Single tree (not ensemble) for interpretability
    - Default parameters (no tuning)
    - Handles 4-class classification: low, moderate, high, critical
    """
    
    def __init__(self):
        """
        Initialize the simple predictor.
        
        Uses a Decision Tree with default parameters:
        - criterion='gini': Standard split quality measure
        - max_depth=None: No depth limit (can be overridden)
        - min_samples_split=2: Minimum samples to split a node
        - min_samples_leaf=1: Minimum samples in a leaf
        """
        self.model = DecisionTreeClassifier(
            criterion='gini',           # Split quality: gini impurity
            max_depth=None,             # No depth limit (grows fully)
            min_samples_split=2,       # Need at least 2 samples to split
            min_samples_leaf=1,        # Leaf can have 1 sample
            random_state=42             # For reproducibility
        )
        self.label_encoder = LabelEncoder()
        self.is_trained = False
        self.feature_names = ['hr_bpm', 'hrv_rmssd', 'hr_deviation', 'hrv_deviation']
        
    def train(self, X, y):
        """
        Train the decision tree model.
        
        Training Steps:
        1. Encode string labels to numbers (low/moderate/high/critical -> 0/1/2/3)
        2. Fit the decision tree on the feature matrix X and labels y
        3. The tree learns rules by recursively splitting on features
        
        How Decision Tree Works:
        - Starts with all data at root
        - Finds best feature and threshold to split data
        - Recursively splits until stopping criteria met
        - Each leaf node predicts a class
        
        Args:
            X: Feature matrix (n_samples, 4 features)
               Each row: [hr_bpm, hrv_rmssd, hr_deviation, hrv_deviation]
            y: Labels (n_samples,) - stress levels: 'low', 'moderate', 'high', 'critical'
        
        Returns:
            None (model is trained in-place)
        """
        if len(X) == 0:
            raise ValueError("Cannot train on empty dataset")
        
        if len(X) < 4:
            raise ValueError(f"Need at least 4 samples to train, got {len(X)}")
        
        # Step 1: Encode labels (strings -> numbers)
        # Example: ['low', 'moderate', 'high'] -> [0, 1, 2]
        y_encoded = self.label_encoder.fit_transform(y)
        
        # Step 2: Train the decision tree
        # The tree learns decision rules from the data
        self.model.fit(X, y_encoded)
        self.is_trained = True
        
        logger.info(f"Simple model trained on {len(X)} samples")
        logger.info(f"Tree depth: {self.model.tree_.max_depth}")
        logger.info(f"Number of leaves: {self.model.tree_.n_leaves}")
    
    def predict(self, X):
        """
        Predict stress levels for new data.
        
        Inference Steps:
        1. Tree traverses from root to leaf based on feature values
        2. Each split checks a feature against a threshold
        3. Leaf node contains the predicted class
        4. Decode numeric prediction back to string label
        
        Example Decision Path:
        - If hr_deviation > 20: go right (high stress likely)
        - Else if hrv_rmssd < 30: go right (high stress)
        - Else: go left (lower stress)
        - Continue until leaf node reached
        
        Args:
            X: Feature matrix (n_samples, 4) or single sample (4,)
        
        Returns:
            List of predicted stress levels: ['low', 'moderate', 'high', 'critical']
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before prediction")
        
        # Handle single sample
        import numpy as np
        X = np.array(X)
        if X.ndim == 1:
            X = X.reshape(1, -1)
        
        # Step 1: Tree makes predictions (returns encoded labels)
        predictions_encoded = self.model.predict(X)
        
        # Step 2: Decode back to string labels
        predictions = self.label_encoder.inverse_transform(predictions_encoded)
        
        return predictions.tolist()
    
    def predict_proba(self, X):
        """
        Get prediction probabilities.
        
        Returns probability distribution over classes for each sample.
        Useful for understanding model confidence.
        
        Args:
            X: Feature matrix (n_samples, 4)
        
        Returns:
            Array of probability distributions (n_samples, 4 classes)
            Each row sums to 1.0
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before prediction")
        
        import numpy as np
        X = np.array(X)
        if X.ndim == 1:
            X = X.reshape(1, -1)
        
        return self.model.predict_proba(X)
    
    def get_feature_importance(self):
        """
        Get feature importance scores.
        
        Decision trees provide feature importance based on how much each
        feature contributes to reducing impurity across all splits.
        
        Returns:
            Dictionary mapping feature names to importance scores (0-1)
            Higher score = more important for predictions
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before getting importance")
        
        importances = self.model.feature_importances_
        return dict(zip(self.feature_names, importances.tolist()))
    
    def evaluate(self, X, y):
        """
        Evaluate model performance on test data.
        
        Args:
            X: Test feature matrix
            y: True labels
        
        Returns:
            Dictionary with accuracy, classification report, confusion matrix
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before evaluation")
        
        predictions = self.predict(X)
        accuracy = accuracy_score(y, predictions)
        
        report = classification_report(
            y, predictions,
            output_dict=True
        )
        
        cm = confusion_matrix(y, predictions, labels=self.label_encoder.classes_)
        
        return {
            'accuracy': float(accuracy),
            'classification_report': report,
            'confusion_matrix': cm.tolist(),
            'class_labels': self.label_encoder.classes_.tolist(),
            'feature_importance': self.get_feature_importance()
        }
    
    def explain_prediction(self, features):
        """
        Explain a single prediction (for interpretability).
        
        Shows which features contributed to the prediction.
        This is a simplified explanation - full tree path would be more detailed.
        
        Args:
            features: Single feature vector [hr_bpm, hrv_rmssd, hr_deviation, hrv_deviation]
        
        Returns:
            Dictionary with prediction and explanation
        """
        if not self.is_trained:
            raise ValueError("Model must be trained before explanation")
        
        prediction = self.predict([features])[0]
        probabilities = self.predict_proba([features])[0]
        importance = self.get_feature_importance()
        
        # Find most important feature for this prediction
        feature_values = dict(zip(self.feature_names, features))
        
        explanation = {
            'prediction': prediction,
            'confidence': float(max(probabilities)),
            'probabilities': dict(zip(self.label_encoder.classes_, probabilities.tolist())),
            'feature_values': feature_values,
            'feature_importance': importance,
            'most_important_feature': max(importance.items(), key=lambda x: x[1])[0]
        }
        
        return explanation


def train_simple_model(X, y, test_size=0.2):
    """
    Convenience function to train and evaluate a simple model.
    
    This function demonstrates the complete workflow:
    1. Split data into train/test
    2. Train model
    3. Evaluate on test set
    4. Return results
    
    Args:
        X: Feature matrix (n_samples, 4)
        y: Labels (n_samples,)
        test_size: Fraction of data to use for testing (default: 0.2)
    
    Returns:
        Dictionary with model, training metrics, and test metrics
    """
    import numpy as np
    
    # Step 1: Split data
    if len(X) < 10:
        # Too small to split, use all for training
        X_train, X_test = X, X
        y_train, y_test = y, y
    else:
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=test_size, random_state=42, stratify=y
        )
    
    # Step 2: Train model
    model = SimpleStressPredictor()
    model.train(X_train, y_train)
    
    # Step 3: Evaluate
    train_metrics = model.evaluate(X_train, y_train)
    test_metrics = model.evaluate(X_test, y_test) if len(X_test) > 0 else None
    
    return {
        'model': model,
        'train_metrics': train_metrics,
        'test_metrics': test_metrics,
        'train_samples': len(X_train),
        'test_samples': len(X_test)
    }

