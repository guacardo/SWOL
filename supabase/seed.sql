-- Global exercise catalog (owner_id NULL = shared/comparable across users).
-- Runs on `supabase db reset`. These are the canonical rows everyone normalizes
-- against; increments/ranges are sane defaults Will can tune in the CRUD panel.

insert into public.exercises
    (owner_id, name, modality, muscle_group, equipment, unit, increment, min_value, max_value)
values
    -- Chest
    (null, 'Barbell Bench Press',      'weighted', 'chest',     'barbell',   'lb', 5,    45, 405),
    (null, 'Incline Barbell Bench Press','weighted','chest',     'barbell',   'lb', 5,    45, 315),
    (null, 'Dumbbell Bench Press',     'weighted', 'chest',     'dumbbell',  'lb', 5,    10, 150),
    (null, 'Incline Dumbbell Press',   'weighted', 'chest',     'dumbbell',  'lb', 5,    10, 130),
    (null, 'Cable Fly',                'weighted', 'chest',     'cable',     'lb', 2.5,  5,  100),
    (null, 'Push-Up',                  'bodyweight','chest',    'bodyweight','lb', 0,    0,  0),
    -- Back
    (null, 'Deadlift',                 'weighted', 'back',      'barbell',   'lb', 5,    65, 600),
    (null, 'Barbell Row',              'weighted', 'back',      'barbell',   'lb', 5,    45, 315),
    (null, 'Pull-Up',                  'bodyweight','back',     'bodyweight','lb', 0,    0,  0),
    (null, 'Lat Pulldown',             'weighted', 'back',      'cable',     'lb', 5,    20, 250),
    (null, 'Seated Cable Row',         'weighted', 'back',      'cable',     'lb', 5,    20, 250),
    (null, 'Dumbbell Row',             'weighted', 'back',      'dumbbell',  'lb', 5,    10, 150),
    -- Shoulders
    (null, 'Overhead Press',           'weighted', 'shoulders', 'barbell',   'lb', 5,    45, 225),
    (null, 'Dumbbell Shoulder Press',  'weighted', 'shoulders', 'dumbbell',  'lb', 5,    10, 120),
    (null, 'Lateral Raise',            'weighted', 'shoulders', 'dumbbell',  'lb', 2.5,  5,  50),
    (null, 'Reverse Shoulder Fly',     'weighted', 'shoulders', 'dumbbell',  'lb', 2.5,  5,  40),
    (null, 'Face Pull',                'weighted', 'shoulders', 'cable',     'lb', 2.5,  10, 120),
    -- Arms
    (null, 'Barbell Curl',             'weighted', 'biceps',    'barbell',   'lb', 5,    20, 150),
    (null, 'Dumbbell Curl',            'weighted', 'biceps',    'dumbbell',  'lb', 2.5,  5,  80),
    (null, 'Hammer Curl',              'weighted', 'biceps',    'dumbbell',  'lb', 2.5,  5,  80),
    (null, 'Tricep Pushdown',          'weighted', 'triceps',   'cable',     'lb', 5,    10, 200),
    (null, 'Overhead Tricep Extension','weighted', 'triceps',   'dumbbell',  'lb', 2.5,  10, 100),
    (null, 'Dip',                      'bodyweight','triceps',  'bodyweight','lb', 0,    0,  0),
    -- Legs
    (null, 'Back Squat',               'weighted', 'legs',      'barbell',   'lb', 5,    45, 500),
    (null, 'Front Squat',              'weighted', 'legs',      'barbell',   'lb', 5,    45, 350),
    (null, 'Romanian Deadlift',        'weighted', 'legs',      'barbell',   'lb', 5,    65, 405),
    (null, 'Leg Press',                'weighted', 'legs',      'machine',   'lb', 10,   90, 1000),
    (null, 'Leg Extension',            'weighted', 'legs',      'machine',   'lb', 5,    20, 300),
    (null, 'Leg Curl',                 'weighted', 'legs',      'machine',   'lb', 5,    20, 250),
    (null, 'Walking Lunge',            'weighted', 'legs',      'dumbbell',  'lb', 5,    0,  150),
    (null, 'Calf Raise',               'weighted', 'legs',      'machine',   'lb', 5,    0,  400),
    -- Core
    (null, 'Plank',                    'duration', 'core',      'bodyweight','sec',5,    10, 600),
    (null, 'Hanging Leg Raise',        'bodyweight','core',     'bodyweight','lb', 0,    0,  0),
    (null, 'Cable Crunch',             'weighted', 'core',      'cable',     'lb', 5,    20, 200),
    -- Cardio
    (null, 'Treadmill Run',            'cardio',   'cardio',    'machine',   'm',  100,  0,  42000),
    (null, 'Rowing Machine',           'cardio',   'cardio',    'machine',   'm',  100,  0,  21000),
    (null, 'Stationary Bike',          'cardio',   'cardio',    'machine',   'm',  100,  0,  60000),
    (null, 'Jump Rope',                'duration', 'cardio',    'bodyweight','sec',10,   30, 3600);
