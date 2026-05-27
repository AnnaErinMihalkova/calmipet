from __future__ import annotations

import math
from dataclasses import dataclass, field
from typing import Optional

# HR thresholds (% of Heart Rate Reserve)
HR_REST_LOW = 0.15
HR_REST_HIGH = 0.30
HR_STRESS_LO = 0.45
HR_STRESS_HI = 0.65

# SpO2 thresholds (%)
SPO2_NORMAL = 96.0
SPO2_CONCERN = 94.0
SPO2_LOW = 92.0
SPO2_CRITICAL = 90.0

# HRV (RMSSD proxy) thresholds — ms
HRV_HIGH = 50.0
HRV_MED = 30.0
HRV_LOW = 15.0

W_HR = 0.55
W_SPO2 = 0.20
W_HRV = 0.25


@dataclass
class StressResult:
    score: float
    level: str
    confidence: float
    factors: dict = field(default_factory=dict)
    alerts: list = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "score": round(self.score, 1),
            "level": self.level,
            "confidence": round(self.confidence, 2),
            "factors": {k: round(v, 2) for k, v in self.factors.items()},
            "alerts": self.alerts,
        }


def level_to_stress_label(level: str) -> str:
    """Map engine levels to legacy API labels used by the frontend."""
    if level in ("high", "critical"):
        return "stressed"
    if level == "moderate":
        return "medium"
    return "calm"


def _hr_stress_score(
    heart_rate: float,
    baseline_hr: float,
    age: int,
) -> tuple[float, list[str]]:
    alerts = []
    max_hr = 208 - 0.7 * age
    max_hr = max(max_hr, baseline_hr + 40)

    hrr_frac = (heart_rate - baseline_hr) / max(max_hr - baseline_hr, 1)
    hrr_frac = max(0.0, min(1.0, hrr_frac))

    if hrr_frac <= HR_REST_LOW:
        score = hrr_frac / HR_REST_LOW * 10
    elif hrr_frac <= HR_REST_HIGH:
        t = (hrr_frac - HR_REST_LOW) / (HR_REST_HIGH - HR_REST_LOW)
        score = 10 + t * 20
    elif hrr_frac <= HR_STRESS_LO:
        t = (hrr_frac - HR_REST_HIGH) / (HR_STRESS_LO - HR_REST_HIGH)
        score = 30 + t * 25
    elif hrr_frac <= HR_STRESS_HI:
        t = (hrr_frac - HR_STRESS_LO) / (HR_STRESS_HI - HR_STRESS_LO)
        score = 55 + t * 25
    else:
        t = min((hrr_frac - HR_STRESS_HI) / (1.0 - HR_STRESS_HI), 1.0)
        score = 80 + t * 20

    if heart_rate > 0.85 * max_hr:
        alerts.append(
            f"Heart rate is very high ({heart_rate:.0f} bpm, {hrr_frac * 100:.0f}% HRR)"
        )

    return score, alerts


def _spo2_stress_score(spo2: float) -> tuple[float, list[str]]:
    alerts = []

    if spo2 >= SPO2_NORMAL:
        score = 0.0
    elif spo2 >= SPO2_CONCERN:
        t = (SPO2_NORMAL - spo2) / (SPO2_NORMAL - SPO2_CONCERN)
        score = t * 30
        alerts.append(f"SpO2 slightly below normal ({spo2:.1f}%)")
    elif spo2 >= SPO2_LOW:
        t = (SPO2_CONCERN - spo2) / (SPO2_CONCERN - SPO2_LOW)
        score = 30 + t * 35
        alerts.append(f"SpO2 low ({spo2:.1f}%) – consider slow deep breathing")
    elif spo2 >= SPO2_CRITICAL:
        t = (SPO2_LOW - spo2) / (SPO2_LOW - SPO2_CRITICAL)
        score = 65 + t * 25
        alerts.append(
            f"SpO2 critically low ({spo2:.1f}%) – consult a healthcare provider"
        )
    else:
        score = 100.0
        alerts.append(f"SpO2 dangerously low ({spo2:.1f}%) – seek medical attention")

    return score, alerts


def _rmssd_stress_score(rmssd: float) -> float:
    if rmssd >= HRV_HIGH:
        return max(0.0, 20.0 - (rmssd - HRV_HIGH) * 0.4)
    if rmssd >= HRV_MED:
        t = (HRV_HIGH - rmssd) / (HRV_HIGH - HRV_MED)
        return 20 + t * 35
    if rmssd >= HRV_LOW:
        t = (HRV_MED - rmssd) / (HRV_MED - HRV_LOW)
        return 55 + t * 30
    t = min((HRV_LOW - rmssd) / HRV_LOW, 1.0)
    return 85 + t * 15


def _hrv_stress_score(hr_history: list[float]) -> tuple[float, float]:
    if len(hr_history) < 3:
        return 50.0, 0.0

    periods = [60_000.0 / max(h, 30) for h in hr_history]
    diffs = [periods[i + 1] - periods[i] for i in range(len(periods) - 1)]
    rmssd = math.sqrt(sum(d * d for d in diffs) / len(diffs))
    confidence = min(1.0, (len(hr_history) - 2) / 10.0)
    return _rmssd_stress_score(rmssd), confidence


def _interaction_boost(hr_score: float, spo2_score: float) -> float:
    if hr_score > 55 and spo2_score > 30:
        synergy = ((hr_score - 55) / 45) * ((spo2_score - 30) / 70)
        return 5.0 * synergy
    return 0.0


def calculate_stress(
    heart_rate: float,
    spo2: float = 98.0,
    hr_history: Optional[list] = None,
    baseline_hr: float = 65.0,
    age: int = 30,
    hrv_rmssd: Optional[float] = None,
) -> StressResult:
    hr_history = hr_history or []
    all_alerts: list[str] = []

    hr_score, hr_alerts = _hr_stress_score(heart_rate, baseline_hr, age)
    spo2_score, spo2_alerts = _spo2_stress_score(spo2)

    if hrv_rmssd is not None:
        hrv_score = _rmssd_stress_score(float(hrv_rmssd))
        hrv_conf = 1.0
    else:
        hrv_score, hrv_conf = _hrv_stress_score(hr_history + [heart_rate])

    all_alerts.extend(hr_alerts)
    all_alerts.extend(spo2_alerts)

    effective_w_hrv = W_HRV * hrv_conf
    effective_w_hr = W_HR + W_HRV * (1 - hrv_conf) * (W_HR / (W_HR + W_SPO2))
    effective_w_spo2 = W_SPO2 + W_HRV * (1 - hrv_conf) * (W_SPO2 / (W_HR + W_SPO2))

    raw_score = (
        effective_w_hr * hr_score
        + effective_w_spo2 * spo2_score
        + effective_w_hrv * hrv_score
    )
    raw_score += _interaction_boost(hr_score, spo2_score)
    score = max(0.0, min(100.0, raw_score))

    if score < 30:
        level = "low"
    elif score < 55:
        level = "moderate"
    elif score < 75:
        level = "high"
    else:
        level = "critical"

    agreement = 1.0 - abs(hr_score - spo2_score) / 100.0
    confidence = max(0.4, min(1.0, 0.5 + 0.3 * agreement + 0.2 * hrv_conf))

    if spo2 < SPO2_CRITICAL:
        level = "critical"
        confidence = 1.0

    return StressResult(
        score=score,
        level=level,
        confidence=confidence,
        factors={
            "hr_score": hr_score,
            "spo2_score": spo2_score,
            "hrv_score": hrv_score,
            "hrv_confidence": hrv_conf,
        },
        alerts=all_alerts,
    )


def stress_from_reading(reading: dict, user_profile: dict | None = None) -> dict:
    profile = user_profile or {}
    hrv_raw = reading.get("hrv")
    result = calculate_stress(
        heart_rate=float(reading.get("heart_rate", 75)),
        spo2=float(reading.get("spo2", 98)),
        hr_history=profile.get("hr_history", []),
        baseline_hr=float(profile.get("baseline_hr", 65)),
        age=int(profile.get("age", 30)),
        hrv_rmssd=float(hrv_raw) if hrv_raw is not None else None,
    )
    out = result.to_dict()
    out["stress_label"] = level_to_stress_label(result.level)
    return out
