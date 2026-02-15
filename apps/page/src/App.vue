<script setup>
import { onMounted, reactive, ref } from "vue";

const fromDomain = ref("");
const sending = ref(false);
const output = ref("Ready to send.");

const form = reactive({
  name: "",
  fromLocal: "",
  to: "",
  subject: "",
  html: "",
});

async function sendMail() {
  sending.value = true;
  output.value = "Sending...";

  const payload = {
    name: form.name,
    fromLocal: form.fromLocal,
    to: form.to,
    subject: form.subject,
    html: form.html,
  };

  try {
    const res = await fetch("/api/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json().catch(() => ({}));
    output.value = JSON.stringify({ status: res.status, data }, null, 2);
  } catch (err) {
    output.value = JSON.stringify(
      {
        status: 0,
        error: err && err.message ? err.message : String(err),
      },
      null,
      2,
    );
  } finally {
    sending.value = false;
  }
}

async function loadFromDomain() {
  try {
    const res = await fetch("/api/from-domain");
    const data = await res.json().catch(() => ({}));
    if (res.ok && data && data.fromDomain) {
      fromDomain.value = String(data.fromDomain);
    }
  } catch (_) {}
}

onMounted(loadFromDomain);
</script>

<template>
  <main class="shell">
    <header class="hero">
      <h1>Mail Console</h1>
      <p>Worker API: <code>/api/send</code></p>
    </header>

    <section class="panel">
      <form class="form-grid" @submit.prevent="sendMail">
        <label class="row">
          <span class="label">Name</span>
          <input v-model.trim="form.name" required />
        </label>

        <label class="row">
          <span class="label">From</span>
          <div class="from-wrap">
            <input v-model.trim="form.fromLocal" required spellcheck="false" />
            <span v-if="fromDomain" class="suffix">@{{ fromDomain }}</span>
          </div>
        </label>

        <label class="row">
          <span class="label">To</span>
          <input v-model.trim="form.to" required type="email" />
        </label>

        <label class="row">
          <span class="label">Subject</span>
          <input v-model.trim="form.subject" required />
        </label>

        <label class="row">
          <span class="label">HTML</span>
          <textarea v-model="form.html" required />
        </label>

        <div class="actions">
          <button :disabled="sending" type="submit">
            {{ sending ? "Sending..." : "Send" }}
          </button>
          <span class="status">{{
            sending ? "Request in progress" : "Ready"
          }}</span>
        </div>
      </form>
    </section>

    <pre class="output">{{ output }}</pre>
  </main>
</template>
