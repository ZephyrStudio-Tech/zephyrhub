import os
from supabase import create_client

url = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
supabase = create_client(url, key)

# Get one row from triage_leads to see columns and maybe some data
res = supabase.table("triage_leads").select("*").limit(1).execute()
print(res.data)
