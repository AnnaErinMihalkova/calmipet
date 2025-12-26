# Generated manually

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('api', '0002_achievement_breathingsession_journalentry_streak_and_more'),
    ]

    operations = [
        migrations.RunSQL(
            sql="CREATE INDEX idx_api_reading_user_ts ON api_reading(user_id, ts);",
            reverse_sql="DROP INDEX IF EXISTS idx_api_reading_user_ts;",
        ),
    ]

