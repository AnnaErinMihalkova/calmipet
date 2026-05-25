
import psycopg2
import os

DATABASE_URL = "postgresql://postgres.iqdqyeyfnpiyciuhgspn:praskovka_3225@aws-1-eu-central-1.pooler.supabase.com:6543/postgres"

def check_users_columns_detailed():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute("SELECT table_schema, column_name FROM information_schema.columns WHERE table_name = 'users';")
        rows = cur.fetchall()
        for schema, column in rows:
            print(f"Schema: {schema}, Column: {column}")
        conn.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_users_columns_detailed()
