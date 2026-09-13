<script>
    import { onMount } from "svelte";
    import { baseUrl } from "./config.js";
    import { fetchLetterboxdRSS, convertRSSToAppFormat } from "./lib/rssParser.js";

    let loading = false;
    let username = "";
    let message = "";
    let data = {};

    async function handleRssSubmit() {
        if (!username.trim()) {
            message = "Please enter a Letterboxd username";
            return;
        }

        loading = true;
        message = "";
        
        try {
            const rssData = await fetchLetterboxdRSS(username);
            const tmpdata = convertRSSToAppFormat(rssData, username);

            // Send to backend for stats calculation
            const resp = await fetch(baseUrl + "stats", {
                method: "POST",
                headers: { "Content-Type": "application/json;charset=UTF-8" },
                body: JSON.stringify(tmpdata),
            });

            if (!resp.ok) {
                throw new Error('Failed to calculate stats');
            }

            data = await resp.json();
            data["username"] = tmpdata.username;
            data["name"] = tmpdata.name;
            data["update"] = tmpdata.update;
            data["donator"] = false;

            localStorage.setItem(username.toLowerCase(), JSON.stringify(tmpdata));
            localStorage.setItem(username.toLowerCase() + "_stats", JSON.stringify(data));
            localStorage.setItem("latest", username.toLowerCase());
            
            window.location.search = "?username=" + username.toLowerCase();
        } catch (error) {
            console.error(error);
            message = `Error: ${error.message}. Make sure the username is correct and the profile is public.`;
        }
        
        loading = false;
    }

    onMount(async () => {
        const localStorageData = localStorage.getItem("latest");
        if (localStorageData !== null && localStorageData !== "undefined") {
            window.location.search =
                "?username=" + localStorageData.toLowerCase();
        }
    });
</script>

<main>
    {#if loading}
        <div class="loaderContainer2"><div class="loader2"></div></div>
    {/if}
    <div class="fileUploadContainer">
        <img class="logo" src="images/logo.webp" alt="statsboxd logo" />
        {#if message !== ""}
            <p class="errormsg message">{@html message}</p>
        {:else}
            <p>
                <strong>Get your stats without downloading!</strong>
                <br /><br />
            </p>
            <p>
                Enter your public Letterboxd username below and we'll fetch your recent activity via RSS feed.
                <br /><br />
            </p>
            <div class="rssInputForm">
                <input
                    type="text"
                    class="usernameInput"
                    placeholder="your_letterboxd_username"
                    bind:value={username}
                    on:keydown={(e) => e.key === 'Enter' && handleRssSubmit()}
                    disabled={loading}
                />
                <button
                    type="button"
                    class="btn rssSubmitBtn"
                    onclick={handleRssSubmit}
                    disabled={loading}
                >
                    {loading ? 'Loading...' : 'Load Stats via RSS'}
                </button>
            </div>
            <p style="color: #888; margin-top: 20px; font-size: 0.9em;">
                <strong>Note:</strong> RSS method works best for recent activity. For complete historical data, please use the ZIP export method.
            </p>
            <p>
                Prefer to upload a ZIP file?
                <a href="/?upload" class="clickable">Click here</a>
            </p>
        {/if}
    </div>
</main>

<style>
    main {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
    }

    .fileUploadContainer {
        text-align: center;
        max-width: 600px;
        padding: 40px 20px;
    }

    .logo {
        max-width: 200px;
        margin-bottom: 30px;
    }

    .rssInputForm {
        display: flex;
        flex-direction: column;
        gap: 15px;
        margin: 30px 0;
        background: rgba(0, 224, 84, 0.1);
        padding: 30px;
        border-radius: 8px;
        border: 2px solid #00e054;
    }

    .usernameInput {
        padding: 12px 16px;
        font-size: 16px;
        border: 1px solid #00e054;
        border-radius: 4px;
        background: #1a1a1a;
        color: #fff;
    }

    .usernameInput:focus {
        outline: none;
        border-color: #00e054;
        box-shadow: 0 0 10px rgba(0, 224, 84, 0.3);
    }

    .usernameInput:disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .rssSubmitBtn {
        padding: 12px 20px;
        font-size: 16px;
        font-weight: bold;
        background: #00e054;
        color: #000;
        border: none;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.3s ease;
    }

    .rssSubmitBtn:hover:not(:disabled) {
        background: #00cc47;
        transform: translateY(-2px);
    }

    .rssSubmitBtn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    p {
        color: #ccc;
        line-height: 1.6;
    }

    .errormsg {
        color: #ff6b6b;
        padding: 15px;
        background: rgba(255, 107, 107, 0.1);
        border-radius: 4px;
        margin: 20px 0;
    }

    .clickable {
        color: #00e054;
        text-decoration: none;
        cursor: pointer;
    }

    .clickable:hover {
        text-decoration: underline;
    }
</style>
