import React, { useState, useRef, useEffect } from 'react';
import './App.css';

function App() {
  const [userMessage, setUserMessage] = useState('');
  const [conversation, setConversation] = useState([]);
  const [error, setError] = useState(''); // Add this line to hold any error messages
  const endOfMessagesRef = useRef(null);

  const [uploadStatus, setUploadStatus] = useState('');
  // Add a new state for the selected file
  const [selectedFile, setSelectedFile] = useState(null);

  // New function to handle file selection
  const handleFileSelect = (event) => {
    setSelectedFile(event.target.files[0]);
  };

  // New function to handle file upload
  const handleUpload = async (event) => {
    event.preventDefault();
    setUploadStatus('Uploading...'); // Set uploading status
    if (!selectedFile) {
      setError('Please select a PDF file to upload.');
      return;
    }
    const formData = new FormData();
    formData.append('pdf', selectedFile);

    try {
      const response = await fetch('http://localhost:3000/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      alert(data.message); // or set a state variable to show the upload status
    } catch (error) {
      console.error('Error uploading file:', error);
      setError(`There was a problem uploading the file: ${error.message}`);
    }
    setUploadStatus('File uploaded successfully!');
  };

  const sendMessage = async () => {
    if (!userMessage.trim()) return;

    const newConversation = [...conversation, { text: userMessage, sender: 'user' }];
    setConversation(newConversation);

    try {
      const response = await fetch('http://localhost:3000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: userMessage })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setConversation([...newConversation, { text: data.reply, sender: 'bot' }]);
    } catch (error) {
      console.error('Fetch error:', error);
      setError(`There was a problem retrieving the AI's response: ${error.message}`);
    }

    setUserMessage('');
  };

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      sendMessage();
    }
  };

  return (
    <div className="AppContainer">
      {/* Upload status message */}
      {uploadStatus && <div className="upload-status">{uploadStatus}</div>}

      {/* Absolutely positioned file upload form */}
      <form onSubmit={handleUpload} className="upload-form">
        <input type="file" accept="application/pdf" onChange={handleFileSelect} />
        <button type="submit">Upload PDF</button>
      </form>

      {/* Rest of your app */}
      <div className="App">
        {/* Chat window */}
        <div className="chat-window">
        <div className="chat-header">
          <h2>AI Chatbot</h2>
        </div>
        <div className="chat-body">
          {conversation.map((msg, index) => (
            <div key={index} className={`chat-message ${msg.sender}`}>
              <div className="message">{msg.text}</div>
            </div>
          ))}
          <div ref={endOfMessagesRef} />
        </div>
        {error && <div className="error-message">{error}</div>} {/* Display error message here */}
        <div className="chat-footer">
          <input
            type="text"
            value={userMessage}
            onChange={(e) => setUserMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
          />
          <button onClick={sendMessage}>Send</button>
        </div>
      </div>
    </div>
    </div>
  );
}

export default App;