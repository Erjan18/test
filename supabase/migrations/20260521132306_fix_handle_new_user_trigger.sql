/*
  # Fix handle_new_user trigger

  The trigger was using raw_user_meta_data->>'role' which could cause constraint
  violations if an unexpected value was passed. New users always get role 'user'.
  Only the pre-seeded admin account keeps the 'admin' role.
*/

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO profiles (id, username, role)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'username'), ''), split_part(NEW.email, '@', 1)),
    'user'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
