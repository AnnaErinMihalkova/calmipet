from django.db import models
from django.conf import settings

class Reading(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    ts = models.DateTimeField(auto_now_add=True)
    hr_bpm = models.PositiveSmallIntegerField()
    hrv_rmssd = models.FloatField(null=True, blank=True)

    def __str__(self):
        return f"{self.user} - {self.hr_bpm} bpm"
