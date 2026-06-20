const form = document.getElementById("chatForm");
const input = document.getElementById("messageInput");
const messages = document.getElementById("messages");
const orb = document.getElementById("voiceOrb");

const chatHistory = [];

function addMessage(role, text) {
  const item = document.createElement("div");
  item.className = `message ${role === "user" ? "user" : "lia"}`;

  const name = document.createElement("span");
  name.textContent = role === "user" ? "هشام" : "ليا";

  const p = document.createElement("p");
  p.textContent = text;

  item.appendChild(name);
  item.appendChild(p);
  messages.appendChild(item);
  messages.scrollTop = messages.scrollHeight;

  chatHistory.push({ role: role === "user" ? "user" : "assistant", text });
}

async function sendToLia(message) {
  orb.classList.add("thinking");

  const waiting = document.createElement("div");
  waiting.className = "message lia";
  waiting.innerHTML = "<span>ليا</span><p>أفكر بهدوء...</p>";
  messages.appendChild(waiting);
  messages.scrollTop = messages.scrollHeight;

  try {
    const response = await fetch("/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        history: chatHistory
      })
    });

    const data = await response.json();
    waiting.remove();

    if (!response.ok) {
      addMessage("lia", "يا هشام، حصل خطأ في الاتصال. راجع إعدادات Gemini أو Railway.");
      console.error(data);
      return;
    }

    addMessage("lia", data.reply || "لم يصلني رد واضح الآن.");
  } catch (error) {
    waiting.remove();
    addMessage("lia", "يا هشام، لم أستطع الاتصال بالخادم الآن.");
    console.error(error);
  } finally {
    orb.classList.remove("thinking");
  }
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const message = input.value.trim();
  if (!message) return;

  addMessage("user", message);
  input.value = "";
  sendToLia(message);
});

document.querySelectorAll("[data-prompt]").forEach((button) => {
  button.addEventListener("click", () => {
    input.value = button.dataset.prompt;
    input.focus();
  });
});
