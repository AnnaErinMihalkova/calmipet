
import psycopg2
import os

DATABASE_URL = "postgresql://postgres.iqdqyeyfnpiyciuhgspn:praskovka_3225@aws-1-eu-central-1.pooler.supabase.com:6543/postgres"

def check_supabase_health():
    print(f"--- Supabase Health Check ---")
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        # 1. Check Connection
        print("[OK] Connection established.")

        # 2. Check Tables
        cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';")
        tables = [row[0] for row in cur.fetchall()]
        required_tables = ['users', 'readings', 'breathing_sessions', 'gamification']
        missing_tables = [t for t in required_tables if t not in tables]
        
        if not missing_tables:
            print(f"[OK] All required tables present: {required_tables}")
        else:
            print(f"[ERROR] Missing tables: {missing_tables}")

        # 3. Check Column structures for 'users'
        if 'users' in tables:
            cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'users' AND table_schema = 'public';")
            cols = {row[0]: row[1] for row in cur.fetchall()}
            required_cols = ['email', 'password', 'salt', 'username']
            missing_cols = [c for c in required_cols if c not in cols]
            if not missing_cols:
                print(f"[OK] 'users' table has all required columns.")
            else:
                print(f"[ERROR] 'users' table missing columns: {missing_cols}")
        
        # 4. Check Data Count
        for table in required_tables:
            if table in tables:
                cur.execute(f"SELECT COUNT(*) FROM {table};")
                count = cur.fetchone()[0]
                print(f"[INFO] Table '{table}' has {count} rows.")

        conn.close()
    except Exception as e:
        print(f"[CRITICAL] Connection failed: {e}")

if __name__ == "__main__":
    check_supabase_health()
