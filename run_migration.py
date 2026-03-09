"""Run migration SQL against Supabase PostgreSQL."""
import asyncio
import asyncpg

DB_URL = "postgresql://postgres.rhheiwfgbukrhbcdiqoc:GST_Easy_Password_2024!@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"

async def run():
    conn = await asyncpg.connect(DB_URL, ssl="require")
    print("Connected to Supabase!")
    
    with open("backend/migrations/004_complete_schema.sql", "r", encoding="utf-8") as f:
        sql = f.read()
    
    # Split into individual statements
    statements = []
    current = []
    for line in sql.split("\n"):
        stripped = line.strip()
        if stripped.startswith("--") or not stripped:
            continue
        current.append(line)
        if stripped.endswith(";"):
            stmt = "\n".join(current).strip()
            if stmt and stmt != ";":
                statements.append(stmt)
            current = []
    
    success = 0
    errors = 0
    for stmt in statements:
        try:
            await conn.execute(stmt)
            success += 1
            if "CREATE TABLE" in stmt.upper():
                table = stmt.split("EXISTS")[1].split("(")[0].strip() if "EXISTS" in stmt else "?"
                print(f"  [OK] Table: {table}")
            elif "CREATE POLICY" in stmt.upper():
                policy = stmt.split('"')[1] if '"' in stmt else "?"
                print(f"  [OK] Policy: {policy}")
            elif "INSERT" in stmt.upper():
                print(f"  [OK] Seed data inserted")
            elif "ALTER TABLE" in stmt.upper() and "ROW LEVEL" in stmt.upper():
                table = stmt.upper().split("TABLE")[1].split("ENABLE")[0].strip().lower()
                print(f"  [OK] RLS: {table}")
        except Exception as e:
            errors += 1
            err = str(e)
            if "already exists" in err:
                print(f"  [SKIP] Already exists")
            elif "auth.uid" in err:
                print(f"  [SKIP] RLS policy (need direct connection, not pooler)")
            else:
                short = err.split("\n")[0][:100]
                print(f"  [ERR] {short}")
    
    await conn.close()
    print(f"\nDone! {success} OK, {errors} skipped/errors")

asyncio.run(run())
