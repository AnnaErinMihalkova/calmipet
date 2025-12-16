# CalmiPet — Phase 1 Wireframes (Text)

## Login
- Main components: Logo, Email input, Password input (show/hide), Error banner, Submit button, Link to Sign Up
- Primary actions: Log in, Navigate to Sign Up
- Layout (ASCII)
```
-------------------+
|  CalmiPet Logo    |
|  Email: [       ] |
|  Password: [***] (Show) |
|  [ Log In ]       |
|  I need an account → Sign Up |
-------------------+
```

## Signup
- Main components: Logo, Username, Email, Password, Confirm Password (show/hide), Error banner, Submit button
- Primary actions: Create account, Navigate to Log In
```
-------------------+
|  CalmiPet Logo    |
|  Username: [     ]|
|  Email:    [     ]|
|  Password: [***] (Show) |
|  Confirm:  [***] (Show) |
|  [ Sign Up ]      |
|  I already have an account → Log In |
-------------------+
```

## Home (Virtual Pet + HR)
- Main components: Header (theme toggle, welcome, Add Test Reading), Pet Card (mood, streak), Trend Card (last 20 BPM), Coach Card (start breathing), Recent Readings List
- Primary actions: Start breathing, Add test reading, Toggle theme
```
=================== HOME ===================+
| Header: [🌗 Theme]  Welcome, Maya   [Add Test Reading] |
|-------------------------------------------|
| [ Pet 🐾 ] Mood: Worried | Streak: 3 days |
|-------------------------------------------|
| [ Trend ] |||||||||||||||||||||| (BPM bars) |
|-------------------------------------------|
| [ Coach ] Start Breathing →                |
|-------------------------------------------|
| [ Readings ] 12:01 78 bpm / HRV 42        |
|              11:55 92 bpm / HRV 28        |
===========================================+
```

## Readings List
- Main components: Table of readings (time, BPM, HRV), Add Test Reading button, Filters (optional), Empty state
- Primary actions: Add test reading, View detail
```
-------------------+
| Readings          |  [Add Test Reading]
| Time       BPM  HRV |
| 12:01      78   42  |
| 11:55      92   28  |
| ...               ...|
-------------------+
```

## Reading Detail
- Main components: Timestamp, BPM, HRV, Notes (optional), Back button
- Primary actions: Return to list
```
-------------------+
| Reading @ 12:01   |
| BPM: 78           |
| HRV: 42           |
| Notes: (—)        |
| ← Back            |
-------------------+
```

## Trends (Charts)
- Main components: Bar chart (BPM), Sparkline (HRV), Time window selector (Today / 24h), Legend
- Primary actions: Switch time window, Hover for values
```
-------------------+
| Trends            |
| [Today ▼]         |
| BPM: |||||||||||||||||||||||||||
| HRV: ~~~~~~~^^^^^~~~~~~         |
| Legend: BPM, HRV                |
-------------------+
```

## Breathing Exercise
- Main components: Overlay, Timer (60s), Inhale/Exhale guidance, Progress ring, Cancel
- Primary actions: Start, Complete, Cancel
```
-------------------+
| Breathing (Overlay)|
| 60s   Inhale…Exhale… |
| (○ progress ring)  |
| [ Cancel ]         |
-------------------+
```

## Settings / Export
- Main components: Theme toggle, Baseline HR, Daily stress rating, Export (CSV), Save
- Primary actions: Save settings, Export data
```
-------------------+
| Settings          |
| Theme: [Light/Dark] |
| Baseline HR: [70]   |
| Daily stress: [ 6 ] |
| [ Export CSV ]      |
| [ Save ]            |
-------------------+
```