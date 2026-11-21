# BRIEF — Video Promosi StoryFrame AI (Vertikal 30 detik)

## Produk
Master Prompt StoryFrame AI — Bulk Studio Pro. Pembeli tempel master prompt ke Gemini Canvas, tool storyboard massal langsung jadi. Bukan video produk fisik — yang dijual prompt + bonus PDF panduan.

## Format
- Remotion, 1080x1920 (9:16 vertikal), 30fps, ~31 detik (durasi akhir dari beat narasi + jeda, dibulatkan ke frame).
- Render penuh via GitHub Actions (lokal hanya stills/tes pendek). Verifikasi: tsc + stills, spot-check frame final.

## Narasi (5 beat, suara iklan baru — BUKAN Narator Gaji)
Suara: "Suara Iklan StoryFrame", voice_fqwvlf575x73. File di `narasi/`, gaya: energik, persuasif, percaya diri.
- beat-1.wav (6,40 dtk): "Bikin storyboard 100 gambar dari satu naskah? Dulu seharian. Sekarang, hitungan menit."
- beat-2.wav (6,72 dtk): "StoryFrame AI, Bulk Studio Pro. Tempel master prompt ke Gemini, tool-nya langsung jadi."
- beat-3.wav (10,64 dtk): "Tempel naskah, pilih gaya, klik Generate Semua, ratusan gambar storyboard selesai sendiri. Karakter konsisten, ekspor ZIP dan storyboard.txt."
- beat-4.wav (5,40 dtk): "Buat YouTuber, kreator, dan editor, yang mau produksi video lebih cepat."
- beat-5.wav (1,48 dtk): "Cek link di bio."
- Total narasi 30,64 dtk + jeda antar-beat ~0,15 dtk.

## Visual (per beat)
- Gaya: dark slate/indigo seperti cover produk. Tipografi kinetik besar, elemen pop/fade di tempat. BUKAAN: bingkai diam + zoom pelan, JANGAN swipe ke samping. Kamera/zoom/pan interpolasi kontinu + easing, JANGAN pixel-stepped.
- Beat 1: teks besar "100 gambar dari 1 naskah?" lalu "Dulu seharian. Sekarang, hitungan menit."
- Beat 2: cover produk (`assets/cover.jpg`) + nama produk + "Tempel master prompt ke Gemini, tool-nya langsung jadi."
- Beat 3: screenshot tool asli (`assets/tool-screenshot.png`, 1920x1019) — Ken Burns zoom bertahap: grid scene selesai → tombol "Generate Semua" → tombol "Download ZIP". Teks: "Tempel naskah • Pilih gaya • Generate Semua" lalu "Karakter konsisten • Ekspor ZIP + storyboard.txt".
- Beat 4: teks "Buat YouTuber, kreator, dan editor — yang mau produksi video lebih cepat."
- Beat 5: CTA — nama produk + "Cek link di bio." (tahan 0,5 dtk di akhir).

## Aturan keras
- JANGAN SEBUT HARGA di mana pun: tanpa Rp30.000, tanpa Rp99.000, tanpa coret harga.
- BGM: `/home/hatch/workspace/video-kelas-menengah/bgm-kelas-menengah.wav` @0.15.
- Tanpa grafik data/chart. Teks hanya tipografi yang didesain, bukan teks melayang acak.

## Aset
- `assets/tool-screenshot.png` — screenshot tool asli (10 scene selesai).
- `assets/cover.jpg` — cover produk 1600x1600.
- `narasi/beat-*.wav` + `narasi/voice-iklan.json` (voice id di atas).

## Alur kerja
Agy Neon High menulis kode Remotion dari brief ini → Clover verifikasi (tsc + stills) → render GitHub Actions → verifikasi video final (decode penuh, spot frames) → serahkan ke Bos + simpan ke Drive (folder VIDEO bila Bos minta).
