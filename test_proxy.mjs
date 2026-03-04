async function testProxy() {
    const sr = 'forhire';
    const targetUrl = `https://www.reddit.com/r/${sr}/new.json?limit=5`;
    const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(targetUrl)}`;

    try {
        const res = await fetch(proxyUrl, {
            headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' }
        });
        console.log("Status:", res.status);
        if (res.ok) {
            const data = await res.json();
            console.log("Success! Posts:", data?.data?.children?.length);
        } else {
            console.log("Failed:", await res.text());
        }
    } catch (e) {
        console.log("Error:", e.message);
    }
}

testProxy();
