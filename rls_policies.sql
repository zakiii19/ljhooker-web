-- =========================================================================
-- SQL SCRIPT FOR SUPABASE ROW LEVEL SECURITY (RLS) POLICIES
-- SYSTEM: LJ HOOKER SEMARANG KOTA
-- =========================================================================

-- Fix users schema constraint for Supabase Auth sync (password is managed by Supabase internally)
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- 1. Enable RLS on all tables
ALTER TABLE konfigurasi_sistem ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing ENABLE ROW LEVEL SECURITY;
ALTER TABLE properti ENABLE ROW LEVEL SECURITY;
ALTER TABLE properti_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE komisi_transaksi ENABLE ROW LEVEL SECURITY;
ALTER TABLE komisi_detail_penerima ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid duplicates/conflicts
DROP POLICY IF EXISTS "Allow authenticated read konfigurasi_sistem" ON konfigurasi_sistem;
DROP POLICY IF EXISTS "Allow admin/principal modify konfigurasi_sistem" ON konfigurasi_sistem;

DROP POLICY IF EXISTS "Allow authenticated read users" ON users;
DROP POLICY IF EXISTS "Allow authenticated insert own user" ON users;
DROP POLICY IF EXISTS "Allow users update own profile or admin/principal update all" ON users;
DROP POLICY IF EXISTS "Allow admin/principal delete users" ON users;

DROP POLICY IF EXISTS "Allow authenticated read user_permissions" ON user_permissions;
DROP POLICY IF EXISTS "Allow admin/principal modify user_permissions" ON user_permissions;

DROP POLICY IF EXISTS "Allow authenticated read marketing" ON marketing;
DROP POLICY IF EXISTS "Allow admin/principal modify marketing" ON marketing;

DROP POLICY IF EXISTS "Allow authenticated read properti" ON properti;
DROP POLICY IF EXISTS "Allow authenticated modify properti" ON properti;

DROP POLICY IF EXISTS "Allow authenticated read properti_media" ON properti_media;
DROP POLICY IF EXISTS "Allow authenticated modify properti_media" ON properti_media;

DROP POLICY IF EXISTS "Allow authenticated read transaksi" ON transaksi;
DROP POLICY IF EXISTS "Allow admin/principal modify transaksi" ON transaksi;

DROP POLICY IF EXISTS "Allow authenticated read komisi_transaksi" ON komisi_transaksi;
DROP POLICY IF EXISTS "Allow admin/principal modify komisi_transaksi" ON komisi_transaksi;

DROP POLICY IF EXISTS "Allow authenticated read komisi_detail_penerima" ON komisi_detail_penerima;
DROP POLICY IF EXISTS "Allow admin/principal modify komisi_detail_penerima" ON komisi_detail_penerima;

-- =========================================================================
-- TBL: konfigurasi_sistem
-- =========================================================================
CREATE POLICY "Allow authenticated read konfigurasi_sistem"
ON konfigurasi_sistem FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admin/principal modify konfigurasi_sistem"
ON konfigurasi_sistem FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'principal')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'principal')
  )
);

-- =========================================================================
-- TBL: users (Profile sync & metadata management)
-- =========================================================================
CREATE POLICY "Allow authenticated read users"
ON users FOR SELECT
TO authenticated
USING (true);

-- Allow users to insert their own profile during first-time sync
CREATE POLICY "Allow authenticated insert own user"
ON users FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Allow users to update their own profile, or admins/principals to update any profile
CREATE POLICY "Allow users update own profile or admin/principal update all"
ON users FOR UPDATE
TO authenticated
USING (
  auth.uid() = id 
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'principal')
  )
)
WITH CHECK (
  auth.uid() = id 
  OR EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'principal')
  )
);

CREATE POLICY "Allow admin/principal delete users"
ON users FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'principal')
  )
);

-- =========================================================================
-- TBL: user_permissions
-- =========================================================================
CREATE POLICY "Allow authenticated read user_permissions"
ON user_permissions FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admin/principal modify user_permissions"
ON user_permissions FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'principal')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'principal')
  )
);

-- =========================================================================
-- TBL: marketing
-- =========================================================================
CREATE POLICY "Allow authenticated read marketing"
ON marketing FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow admin/principal modify marketing"
ON marketing FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'principal')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'principal')
  )
);

-- =========================================================================
-- TBL: properti
-- =========================================================================
CREATE POLICY "Allow authenticated read properti"
ON properti FOR SELECT
TO authenticated
USING (true);

-- Admins, principals, and marketing agents can create/modify properties
CREATE POLICY "Allow authenticated modify properti"
ON properti FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'principal', 'marketing')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'principal', 'marketing')
  )
);

-- =========================================================================
-- TBL: properti_media
-- =========================================================================
CREATE POLICY "Allow authenticated read properti_media"
ON properti_media FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated modify properti_media"
ON properti_media FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'principal', 'marketing')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'principal', 'marketing')
  )
);

-- =========================================================================
-- TBL: transaksi
-- =========================================================================
CREATE POLICY "Allow authenticated read transaksi"
ON transaksi FOR SELECT
TO authenticated
USING (true);

-- Only admin and principal can record/modify transaction closing details
CREATE POLICY "Allow admin/principal modify transaksi"
ON transaksi FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'principal')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'principal')
  )
);

-- =========================================================================
-- TBL: komisi_transaksi
-- =========================================================================
CREATE POLICY "Allow authenticated read komisi_transaksi"
ON komisi_transaksi FOR SELECT
TO authenticated
USING (true);

-- Only admin and principal can modify commission details
CREATE POLICY "Allow admin/principal modify komisi_transaksi"
ON komisi_transaksi FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'principal')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'principal')
  )
);

-- =========================================================================
-- TBL: komisi_detail_penerima
-- =========================================================================
CREATE POLICY "Allow authenticated read komisi_detail_penerima"
ON komisi_detail_penerima FOR SELECT
TO authenticated
USING (true);

-- Only admin and principal can modify recipient share details
CREATE POLICY "Allow admin/principal modify komisi_detail_penerima"
ON komisi_detail_penerima FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'principal')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'principal')
  )
);

-- =========================================================================
-- SUPABASE STORAGE BUCKET: properti_media
-- =========================================================================

-- Ensure storage schema policies are cleared first
DROP POLICY IF EXISTS "Allow public read properti_media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert properti_media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update properti_media" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete properti_media" ON storage.objects;

-- Pre-populate properti_media bucket if not exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('properti_media', 'properti_media', true)
ON CONFLICT (id) DO NOTHING;

-- 1. Allow public read access to properti_media bucket (so anyone can view property photos)
CREATE POLICY "Allow public read properti_media"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'properti_media');

-- 2. Allow authenticated users (admin, principal, marketing) to upload new photos
CREATE POLICY "Allow authenticated insert properti_media"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'properti_media' 
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE public.users.id = auth.uid()
    AND public.users.role IN ('admin', 'principal', 'marketing')
  )
);

-- 3. Allow authenticated users to update their files
CREATE POLICY "Allow authenticated update properti_media"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'properti_media'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE public.users.id = auth.uid()
    AND public.users.role IN ('admin', 'principal', 'marketing')
  )
)
WITH CHECK (
  bucket_id = 'properti_media'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE public.users.id = auth.uid()
    AND public.users.role IN ('admin', 'principal', 'marketing')
  )
);

-- 4. Allow authenticated users to delete files
CREATE POLICY "Allow authenticated delete properti_media"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'properti_media'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE public.users.id = auth.uid()
    AND public.users.role IN ('admin', 'principal', 'marketing')
  )
);

