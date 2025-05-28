const GOOGLE_API_KEY = "AIzaSyDzZQuDnsIgqUDyYhJ77UV9XJ0G-0M2pp0";
const SEARCH_ENGINE_ID = "b456c73a132774aa1";

document.getElementById("generateBtn").addEventListener("click", async () => {
  const question = document.getElementById("questionInput").value.trim();
  const style = document.getElementById("styleSelect").value;
  const textAnswer = document.getElementById("textAnswer");
  const imageResults = document.getElementById("imageResults");

  textAnswer.innerHTML = "Generating answer...";
  imageResults.innerHTML = "";

  if (!question) {
    textAnswer.innerHTML = "Please enter a topic or question.";
    return;
  }

  try {
    // Call Flask backend to get Gemini text answer
    const response = await fetch("/api/generate-answer", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({question, style})
    });

    const data = await response.json();

    if (!response.ok) {
      textAnswer.innerHTML = `Error: ${data.error || "Unknown error"}`;
      return;
    }

    // Use the parser to convert markup to styled HTML
    textAnswer.innerHTML = parseSimpleMarkup(data.answer);

    // Search images using Google Custom Search API
    const imageQuery = encodeURIComponent(question + " diagram OR figure OR image");
    const imageResponse = await fetch(
      `https://www.googleapis.com/customsearch/v1?q=${imageQuery}&cx=${SEARCH_ENGINE_ID}&searchType=image&num=3&key=${GOOGLE_API_KEY}`
    );

    const imageData = await imageResponse.json();
    const items = imageData.items || [];

    items.forEach(item => {
      const img = document.createElement("img");
      img.src = item.link;
      img.alt = item.title || "Related image";
      img.style.maxWidth = "100%";
      img.style.margin = "5px 0";
      imageResults.appendChild(img);
    });
  } catch (error) {
    textAnswer.innerHTML = "An error occurred. Try again later.";
    console.error(error);
  }
});

function parseSimpleMarkup(text) {
  if (!text) return "";

  // Escape HTML to prevent injection
  text = text.replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;");

  // Replace **bold**
  text = text.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");

  // Replace *italic*
  text = text.replace(/\*(.+?)\*/g, "<em>$1</em>");

  // Replace ==highlight==
  text = text.replace(/==(.+?)==/g, "<mark>$1</mark>");

  // Replace ```code block```
  text = text.replace(/```([\s\S]+?)```/g, "<pre><code>$1</code></pre>");

  // Replace newlines with <br>
  text = text.replace(/\n/g, "<br>");

  return text;
}
