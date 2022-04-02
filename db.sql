--
-- Struktur dari tabel `vaksin`
--

CREATE TABLE `vaksin` (
  `id` int(10) UNSIGNED NOT NULL,
  `id_penduduk` int(11) NOT NULL,
  `nik` decimal(16,0) NOT NULL,
  `vaccineId` varchar(32) CHARACTER SET ascii COLLATE ascii_bin DEFAULT NULL,
  `raw` text,
  `vaccineLast` tinyint(3) UNSIGNED DEFAULT '0',
  `vaccineLastType` varchar(32) DEFAULT NULL,
  `vaccineLastTypeName` varchar(64) DEFAULT NULL,
  `vaccineLastDate` date DEFAULT NULL,
  `vaccineLastLocation` varchar(64) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=ascii;

--
-- Indexes for dumped tables
--

--
-- Indeks untuk tabel `vaksin`
--
ALTER TABLE `vaksin`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `nik` (`nik`),
  ADD KEY `id_penduduk` (`id_penduduk`);

--
-- AUTO_INCREMENT untuk tabel yang dibuang
--

--
-- AUTO_INCREMENT untuk tabel `vaksin`
--
ALTER TABLE `vaksin`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT;
SELECT


-- vaksin_view
SELECT 
    p.nik, p.nama, p.tanggallahir,
    c.dusun, c.rt, c.rw,
    v.vaccineLast as vaksinKe,
    v.vaccineLastTypeName as jenisVaksin,
    v.vaccineLastDate as tglVaksin, k.no_kk
    FROM vaksin v 
    inner join tweb_penduduk p on p.id = v.id_penduduk
    left join tweb_keluarga k on k.id = p.id_kk
    left join tweb_wil_clusterdesa c on c.id = k.id_cluster
    order by p.id_kk, p.nik
