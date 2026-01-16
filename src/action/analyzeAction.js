"use server"

export async function analyzeAction(prevState, formData) {
  const imageDataUrl = String(formData.get("image") || "");
  const rid = String(formData.get("rid") || "");

  if (!imageDataUrl) {
    return {
      ok: false,
      html: "<p>Fotomu WOII 🫵</p>",
    };
  }

  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) {
    return {
      ok: false,
      html: "<p>API KEY nya Mana?? </p>",
    };
  }

  const model = "allenai/molmo-2-8b:free";
  const instruction = `
    Keluarkan HASIL dalam HTML valid (tanpa <style> eksternal). Topik: analisis wajah/pose (hiburan) 
    Nada tegas & ringkas. Jangan minta data lahir. Hindari hal sensitif & klaim medis/keuangan.
    Jika TIDAK ada WAJAH: balas persis:
    <p>Mana orangnya nih ! </p>

    Jika ADA manusia berupa wajah maupun pose, isi SEMUA bagian di bawah secara singkat :

    <section>
        <h2>🙂 Ekspresi Wajah</h2>
            <ul>
                <li>Emosi dominan (mis. senyum tipis/datar/pemarah)</li>
                <li>Arah pandang, gestur & tatapan mata (menghadap kamera/menoleh; bahu rileks/tegang tatapan tajam/hangat)</li>
                <li>Nuansa umum (energik/pemalas/pengangguran/santai)</li>
                <li>Karakter Wajah (Pemarah/Ramah/cemberut)</li>
                <li>Personality type(Leader, Architect, Logician dan lainnya) sertakan penjelasan singkat yang mudah dimengerti</li>
            </ul>
    </section>
    
    <section>
        <h2>🔮 Ramalan dari Wajah</h2>

        <article>
            <h3>💼 Pekerjaan/Karier</h3>
            <p><strong>Indikator:</strong> 1–2 poin dari ekspresi/pose.</p>
            <p><strong>Ramalan:</strong> 1–2 kalimat Kritik tentang arah/peluang kerja.</p>
        </article>
        
        <article>
            <h3>❤️ Jodoh/Cinta</h3>
            <p><strong>Indikator:</strong> 1 poin dari bahasa tubuh/kerapian.</p>
            <p><strong>Ramalan:</strong> 1–2 kalimat negatif (tidak selalu positif).</p>
        </article>

        <article>
            <h3>📈 Masa Depan (1–2 tahun)</h3>
            <p><strong>Indikator:</strong> 1 poin (keyakinan dari raut muka).</p>
            <p><strong>Ramalan:</strong> 1–2 kalimat target realistis.</p>
        </article>

        <article>
            <h3>🧠 Sikap & Kepribadian</h3>
            <p><strong>Ciri Tampak:</strong> 2–3 butir (mis. disiplin, pemalas, kurang percaya diri, Anti sosial).</p>
        </article>

        <article>
            <h3>🍀 Keberuntungan Minggu Ini</h3>
            <p>
                <strong>Angka:</strong> 1–99,
                <strong>Warna:</strong> 1 warna(berubah-ubah tidak selalu warna hijau),
                <strong>Skala:</strong> 0–10
            </p>
            <p><strong>Tips Singkat:</strong> 1 kalimat praktis yang cukup tajam untuk menjadi bahan introspeksi diri.</p>
        </article>
    </section>

    <section>
        <h2>✅ Saran Dalam Waktu Dekat</h2>
        <ol>
            <li></li>
            <li></li>
            <li></li>
        </ol>
    </section>`;

  const body = {
    model,
    messages: [
      {
        role: "system",
        content: "anda penganalisis foto dan profesi kamu adalah seorang PENGKRITIK TAJAM ,keluarkan HTML ringkas dan aman"
      },{
        role: "user",
        content: [
            { type:"text", text: instruction},
            {type: "image_url", image_url:{url: imageDataUrl} }
        ]
      }
    ],
    max_tokens: 900,
    temperature: 0.2
  };
  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "Referer": "http://localhost:3000",
        "X-Title" : "PERFACE"
    },
    body: JSON.stringify(body),
    cache: "no-store"
  })

  if(!res.ok) {
    const t = await res.text()
    console.error("ERROR: ", res.status, t)
    return {
      ok: false,
      html: "<p>AI nya ngambek </p>",
    };
  }

  const data = await res.json()
  const html = String(data?.choices?.[0]?.message?.content ?? "")
  return{ ok:true, html, rid}
}
