"""
Django management command to run the ML stress prediction experiment.

Usage:
    python manage.py run_ml_experiment
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
import json
import os
from api.ml.stress_predictor import run_experiment
from api.ml.rule_baseline import RuleBasedStressPredictor
from sklearn.metrics import accuracy_score, classification_report


class Command(BaseCommand):
    help = 'Run ML experiment for stress prediction'

    def add_arguments(self, parser):
        parser.add_argument(
            '--output',
            type=str,
            default='api/ml/experiment_results.json',
            help='Output file path for results (default: api/ml/experiment_results.json)'
        )

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('Starting ML stress prediction experiment...'))
        
        results = run_experiment()
        
        # Save results to file
        output_path = options['output']
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        with open(output_path, 'w') as f:
            json.dump(results, f, indent=2)
        
        # Evaluate baseline model for comparison
        baseline_results = None
        if results.get('success') and results.get('test_metrics'):
            try:
                from api.ml.stress_predictor import StressPredictor
                from api.models import Reading, StressEvent
                import numpy as np
                
                # Get test data
                stress_events = StressEvent.objects.select_related('reading', 'user').filter(
                    reading__isnull=False
                )
                
                X_test = []
                y_test = []
                ml_predictor = StressPredictor()
                baseline_predictor = RuleBasedStressPredictor()
                
                for event in stress_events[:results['test_samples']]:
                    reading = event.reading
                    if not reading or not reading.hr_bpm:
                        continue
                    
                    baseline = ml_predictor.get_user_baselines(event.user, reading.id)
                    hr_bpm = reading.hr_bpm or 0
                    hrv_rmssd = reading.hrv_rmssd or 0
                    hr_deviation = hr_bpm - baseline['hr']
                    hrv_deviation = hrv_rmssd - baseline['hrv']
                    
                    X_test.append([hr_bpm, hrv_rmssd, hr_deviation, hrv_deviation])
                    y_test.append(event.level)
                
                if len(X_test) > 0:
                    # Baseline predictions
                    y_baseline = baseline_predictor.predict(X_test)
                    baseline_accuracy = accuracy_score(y_test, y_baseline)
                    
                    baseline_results = {
                        'accuracy': float(baseline_accuracy),
                        'report': classification_report(y_test, y_baseline, output_dict=True)
                    }
                    
                    results['baseline_comparison'] = baseline_results
                    results['ml_vs_baseline'] = {
                        'ml_accuracy': results['test_metrics']['accuracy'],
                        'baseline_accuracy': baseline_accuracy,
                        'improvement': float(results['test_metrics']['accuracy'] - baseline_accuracy),
                        'improvement_pct': float((results['test_metrics']['accuracy'] - baseline_accuracy) / baseline_accuracy * 100) if baseline_accuracy > 0 else 0
                    }
            except Exception as e:
                self.stdout.write(self.style.WARNING(f"  Could not evaluate baseline: {str(e)}"))
        
        # Save updated results
        with open(output_path, 'w') as f:
            json.dump(results, f, indent=2)
        
        # Print summary
        if results.get('success'):
            self.stdout.write(self.style.SUCCESS('\n✓ Experiment completed successfully!'))
            self.stdout.write(f"  Data points: {results['data_points']}")
            self.stdout.write(f"  Train samples: {results['train_samples']}")
            self.stdout.write(f"  Test samples: {results['test_samples']}")
            
            if results.get('test_metrics'):
                accuracy = results['test_metrics']['accuracy']
                self.stdout.write(self.style.SUCCESS(f"  ML Test Accuracy: {accuracy:.2%}"))
                
                if baseline_results:
                    baseline_acc = baseline_results['accuracy']
                    self.stdout.write(self.style.SUCCESS(f"  Baseline Accuracy: {baseline_acc:.2%}"))
                    improvement = results.get('ml_vs_baseline', {}).get('improvement', 0)
                    if improvement > 0:
                        self.stdout.write(self.style.SUCCESS(f"  ML Improvement: +{improvement:.2%}"))
                    elif improvement < 0:
                        self.stdout.write(self.style.WARNING(f"  ML vs Baseline: {improvement:.2%} (baseline better)"))
            elif results.get('train_metrics'):
                accuracy = results['train_metrics']['accuracy']
                self.stdout.write(self.style.SUCCESS(f"  ML Train Accuracy: {accuracy:.2%}"))
            
            self.stdout.write(f"\n  Results saved to: {output_path}")
        else:
            self.stdout.write(self.style.WARNING('\n✗ Experiment failed or insufficient data'))
            self.stdout.write(f"  Error: {results.get('error', 'Unknown error')}")
            self.stdout.write(f"  Data points: {results.get('data_points', 0)}")
            self.stdout.write(f"\n  Partial results saved to: {output_path}")
        
        self.stdout.write('\n' + '='*60)
        self.stdout.write('Experiment results documented in:')
        self.stdout.write('  - api/ml/experiment_results.json (JSON)')
        self.stdout.write('  - docs_phase1/SPRINT4_ML_EXPERIMENT.md (Markdown)')

