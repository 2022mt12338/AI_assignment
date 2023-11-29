// index.js
const express = require('express');
const axios = require('axios');
require('dotenv').config();
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const pdfParse = require('pdf-parse');
const ExcelJS = require('exceljs');
const upload = multer({ storage: multer.memoryStorage() });

const app = express();
app.use(cors());
app.use(express.json());

// Serve static files from the React app
app.use(express.static(path.join(__dirname, 'build')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});

// This will hold the conversation state
let conversationState = [];

app.post('/chat', async (req, res) => {
  try {
    const userMessage = req.body.message;
    console.log("User message:", userMessage);

    // If you're not maintaining a conversation, you can directly use userMessage as the prompt.
    // If you are maintaining a conversation, prepend the conversation history here as done previously.
    const prompt = userMessage;

    const response = await axios.post(
      'https://api.openai.com/v1/engines/text-davinci-003/completions',
      {
        prompt: prompt,
        temperature: 0.3, // This can be adjusted for more creative responses
        max_tokens: 150,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        // Removed stop sequences for a general prompt. Adjust if you're maintaining a conversation.
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log("OpenAI response:", response.data);

    if (response.data.choices[0].text.trim() === '') {
      // The model did not return a response, so you might want to send a default message
      res.json({ reply: "I'm not sure how to respond to that. Can you provide more detail or ask another question?" });
    } else {
      // Extract and send only the relevant part of the response
      const botResponse = response.data.choices[0].text.trim();
      // Update your conversation state here if you're maintaining one

      res.json({ reply: botResponse });
    }

  } catch (error) {
    console.error('Error:', error.response ? error.response.data : error.message);
    res.status(500).send('Error while getting a response from OpenAI.');
  }
});

// Endpoint to handle PDF upload and process it
app.post('/upload', upload.single('pdf'), async (req, res) => {
  try {
    if (!req.file) {
      throw new Error('No file uploaded.');
    }
    // Parse the PDF
    const pdfText = await pdfParse(req.file.buffer);
    // Generate embeddings (this is a placeholder, you'll need to implement this)
    const embeddings = await generateEmbeddings(pdfText.text);
    // Save embeddings to an Excel file (this is a placeholder, you'll need to implement this)
    await saveEmbeddingsToExcel(embeddings);
    res.status(200).json({ message: 'PDF processed and embeddings saved.' });
  } catch (error) {
    console.error('Error on PDF upload:', error.message);
    res.status(500).send('Error processing the PDF file.');
  }
});

// Function to generate embeddings (you'll need to use OpenAI's API)
async function generateEmbeddings(text) {
  const response = await axios.post(
    'https://api.openai.com/v1/embeddings',
    {
      model: "text-embedding-ada-002", // Use the appropriate embeddings model
      input: text,
    },
    {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      }
    }
  );
  // The actual embedding data will be in the response body, typically under `data.embeddings`
  const embeddings = response.data.data.embeddings; // This path may vary depending on the API's response structure
  return embeddings;
}

// Function to save embeddings to an Excel file
async function saveEmbeddingsToExcel(embeddings) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Embeddings');
  // Add your embeddings to the worksheet
  worksheet.addRow(embeddings);
  // Save workbook to a file (adjust the path as needed)
  await workbook.xlsx.writeFile('path/to/your/embeddings.xlsx');
}

// Clear the conversation state if you want to reset the chat
app.post('/reset', (req, res) => {
  conversationState = [];
  res.send('Conversation reset.');
});
