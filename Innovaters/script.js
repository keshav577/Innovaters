'use strict';

const chatInput = document.querySelector('#chat_input');
const typingIndicator = document.querySelector('#typing');
const sendButton = document.querySelector('#send');
const chatMessages = document.querySelector('#chat_messages');
const chatBoxBody = document.querySelector('#chat_box_body');
const viewHistoryButton = document.querySelector('#view_history'); // Button to view chat history

const profile = {
  my: {
    name: 'You',
    pic: 'https://via.placeholder.com/30?text=U',
  },
  other: {
    name: 'AI Bot',
    pic: 'https://via.placeholder.com/30?text=B',
  },
};


let chatHistory = JSON.parse(localStorage.getItem('chatHistory')) || [];

let viewHistory = JSON.parse(localStorage.getItem('viewHistory')) || [];
localStorage.removeItem('chatHistory');

function saveChatHistory() {
  localStorage.setItem('chatHistory', JSON.stringify(chatHistory));
}


function saveToViewHistory() {
  const timestamp = new Date().toLocaleString(); 
  viewHistory.push({ timestamp, chatHistory });
  localStorage.setItem('viewHistory', JSON.stringify(viewHistory));
}


function clearChatHistory() {
  localStorage.removeItem('chatHistory');
  chatHistory = []; 
}


function renderChatHistory() {
  chatHistory.forEach(({ sender, message }) => {
    const profileType = sender === 'You' ? 'my' : 'other';
    appendMessage(profileType, message);
  });
}

function renderProfile(profileType) {
  return `
    <div class="profile ${profileType}-profile">
      <img src="${profile[profileType].pic}" alt="${profile[profileType].name}" width="30" height="30">
      <span>${profile[profileType].name}</span>
    </div>`;
}

function renderMessage(profileType, message) {
  return `<div class="message ${profileType}-message">${message}</div>`;
}


function appendMessage(profileType, message) {
  const profileHtml = renderProfile(profileType);
  const messageHtml = renderMessage(profileType, message);
  chatMessages.insertAdjacentHTML('beforeend', profileHtml + messageHtml);
  chatBoxBody.scrollTop = chatBoxBody.scrollHeight;
}

function saveMessage(profileType, message) {
  chatHistory.push({ sender: profileType === 'my' ? 'You' : 'AI Bot', message });
  saveChatHistory();
}


function sendMessage(profileType, text) {
  if (!text.trim()) return;
  appendMessage(profileType, text);
  saveMessage(profileType, text);
  chatInput.value = ''; 
}


async function fetchChatGPTResponse(userInput) {
  try {
    const requestBody = {
      contents: [
        {
          parts: [{ text: userInput }],
        },
      ],
    };
    const GEMINI_API_KEY = 'AIzaSyDn463tQhMveGgtqw82s5dUQoF6vuPeDG8'; // Replace with your actual API key
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      console.error(`HTTP error! Status: ${response.status}`);
      return 'Sorry, there was an error connecting to the server.';
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text.trim();
  } catch (error) {
    console.error(error);
    return 'Sorry, there was an error connecting to the server.';
  }
}


async function handleBotResponse(userInput) {
  typingIndicator.classList.add('active');
  const botResponse = await fetchChatGPTResponse(userInput);
  typingIndicator.classList.remove('active');
  appendMessage('other', botResponse);
  saveMessage('other', botResponse);
}

chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    const userInput = chatInput.value;
    sendMessage('my', userInput);
    handleBotResponse(userInput);
  }
});


sendButton.addEventListener('click', () => {
  const userInput = chatInput.value;
  sendMessage('my', userInput);
  handleBotResponse(userInput);
});


window.addEventListener('beforeunload', () => {
  saveChatHistory();
  saveToViewHistory(); 
  clearChatHistory();  
});


viewHistoryButton.addEventListener('click', () => {
  const history = viewHistory
    .map(({ timestamp, chatHistory }) => {
      const messages = chatHistory
        .map(({ sender, message }) => `${sender}: ${message}`)
        .join('\n');
      return `${timestamp}\n${messages}`;
    })
    .join('\n\n');
  
});

renderChatHistory();
