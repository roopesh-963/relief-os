import xgboost as xgb
import pandas as pd
import numpy as np

# A simplified mock model wrapper.
# In a real-world scenario, this would load a pre-trained model like:
# self.model = xgb.XGBRegressor()
# self.model.load_model('disaster_severity_model.json')

class SeverityScorer:
    def __init__(self):
        # We will use a rule-based mock that mimics an XGBoost decision tree output 
        # for demonstration, as a trained model file doesn't exist yet.
        pass

    def predict_severity(self, disaster_data: dict) -> dict:
        """
        Takes disaster data (magnitude, population_density, vulnerability, type)
        and outputs a severity score (0-100) and zone classification.
        """
        magnitude = disaster_data.get("magnitude", 5.0)
        pop_density = disaster_data.get("population_density", 500)
        vulnerability = disaster_data.get("infrastructure_vulnerability", 0.5)
        
        # Simulated XGBoost feature importance weighting
        score = (magnitude * 8) + (pop_density / 100) + (vulnerability * 20)
        
        # Add some noise to simulate ML variation
        score += np.random.normal(0, 2)
        
        # Clamp between 0 and 100
        score = max(0, min(100, score))
        
        # Determine classification zone
        if score >= 80:
            classification = "Critical"
        elif score >= 60:
            classification = "High"
        elif score >= 40:
            classification = "Medium"
        else:
            classification = "Low"
            
        return {
            "severity_score": round(score, 2),
            "zone_class": classification
        }

    def process_batch(self, zones: list) -> list:
        """Process a batch of zones"""
        results = []
        for zone in zones:
            pred = self.predict_severity(zone)
            zone_result = {**zone, **pred}
            results.append(zone_result)
        return results

scorer = SeverityScorer()
