async function testRss2Json() {
    const sr = 'forhire';
    const feedUrl = encodeURIComponent(`https://www.reddit.com/r/${sr}/new.rss`);
    const apiUrl = `https://api.rss2json.com/v1/api.json?rss_url=${feedUrl}`;

    try {
        const res = await fetch(apiUrl);
        console.log("Status:", res.status);
        if (res.ok) {
            const data = await res.json();
            console.log("Success! Items:", data?.items?.length);
            if (data?.items?.length > 0) {
                console.log("Sample:", data.items[0].title);
            }
        } else {
            console.log("Failed:", await res.text());
        }
    } catch (e) {
        console.log("Error:", e.message);
    }
}

testRss2Json();
