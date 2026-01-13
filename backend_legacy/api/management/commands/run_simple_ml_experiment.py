"""
Django management command to run a simple ML experiment.

This demonstrates the simple decision tree model with clear training/inference steps.

Usage:
    python manage.py run_simple_ml_experiment
"""

from django.core.management.base import BaseCommand
import json
import os
import numpy as np
from api.ml.simple_model import SimpleStressPredictor, train_simple_model
from api.ml.stress_predictor import StressPredictor
from api.models import Reading, StressEvent
from django.utils import timezone
from datetime import timedelta
from django.db.models import Avg


class Command(BaseCommand):
    help = 'Run simple ML experiment (Decision Tree) for stress prediction'

    def add_arguments(self, parser):
        parser.add_argument(
            '--output',
            type=str,
            default='api/ml/simple_experiment_results.json',
            help='Output file path for results'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting Simple ML Experiment (Decision Tree)...'))
        self.stdout.write('='*60)
        
        # Step 1: Load data
        self.stdout.write('\n[Step 1] Loading labeled data...')
        stress_events = StressEvent.objects.select_related('reading', 'user').filter(
            reading__isnull=False
        )
        
        if stress_events.count() < 10:
            self.stdout.write(self.style.WARNING(
                f'Insufficient data: {stress_events.count()} samples (need at least 10)'
            ))
            return
        
        self.stdout.write(f'  Found {stress_events.count()} labeled samples')
        
        # Step 2: Prepare features
        self.stdout.write('\n[Step 2] Preparing features...')
        ml_predictor = StressPredictor()
        X = []
        y = []
        
        for event in stress_events:
            reading = event.reading
            if not reading or not reading.hr_bpm:
                continue
            
            # Get user baseline
            baseline = ml_predictor.get_user_baselines(event.user, reading.id)
            
            # Extract features (minimal engineering - just raw values and deviations)
            hr_bpm = reading.hr_bpm or 0
            hrv_rmssd = reading.hrv_rmssd or 0
            hr_deviation = hr_bpm - baseline['hr']
            hrv_deviation = hrv_rmssd - baseline['hrv']
            
            X.append([hr_bpm, hrv_rmssd, hr_deviation, hrv_deviation])
            y.append(event.level)
        
        X = np.array(X)
        y = np.array(y)
        
        self.stdout.write(f'  Prepared {len(X)} samples with 4 features each')
        self.stdout.write(f'  Features: hr_bpm, hrv_rmssd, hr_deviation, hrv_deviation')
        self.stdout.write(f'  Classes: {set(y)}')
        
        # Step 3: Train model
        self.stdout.write('\n[Step 3] Training Decision Tree model...')
        try:
            results = train_simple_model(X, y, test_size=0.2)
            model = results['model']
            
            self.stdout.write(self.style.SUCCESS('  ✓ Model trained successfully'))
            self.stdout.write(f'  Tree depth: {model.model.tree_.max_depth}')
            self.stdout.write(f'  Number of leaves: {model.model.tree_.n_leaves}')
            
            # Step 4: Show feature importance
            self.stdout.write('\n[Step 4] Feature Importance:')
            importance = model.get_feature_importance()
            for feature, score in sorted(importance.items(), key=lambda x: x[1], reverse=True):
                self.stdout.write(f'  {feature}: {score:.3f}')
            
            # Step 5: Evaluate
            self.stdout.write('\n[Step 5] Evaluation Results:')
            train_acc = results['train_metrics']['accuracy']
            test_acc = results['test_metrics']['accuracy'] if results['test_metrics'] else None
            
            self.stdout.write(f'  Train Accuracy: {train_acc:.2%}')
            if test_acc:
                self.stdout.write(self.style.SUCCESS(f'  Test Accuracy: {test_acc:.2%}'))
            
            # Step 6: Example prediction
            self.stdout.write('\n[Step 6] Example Prediction:')
            example_features = X[0]
            explanation = model.explain_prediction(example_features)
            self.stdout.write(f'  Features: {dict(zip(model.feature_names, example_features))}')
            self.stdout.write(f'  Prediction: {explanation["prediction"]}')
            self.stdout.write(f'  Confidence: {explanation["confidence"]:.2%}')
            self.stdout.write(f'  Most important feature: {explanation["most_important_feature"]}')
            
            # Save results
            output_path = options['output']
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            results_dict = {
                'model_type': 'DecisionTreeClassifier',
                'data_points': len(X),
                'train_samples': results['train_samples'],
                'test_samples': results['test_samples'],
                'train_metrics': results['train_metrics'],
                'test_metrics': results['test_metrics'],
                'tree_info': {
                    'max_depth': int(model.model.tree_.max_depth),
                    'n_leaves': int(model.model.tree_.n_leaves),
                    'n_nodes': int(model.model.tree_.node_count)
                }
            }
            
            with open(output_path, 'w') as f:
                json.dump(results_dict, f, indent=2)
            
            self.stdout.write(f'\n  Results saved to: {output_path}')
            self.stdout.write(self.style.SUCCESS('\n✓ Simple ML experiment completed!'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'\n✗ Experiment failed: {str(e)}'))
            import traceback
            self.stdout.write(traceback.format_exc())

