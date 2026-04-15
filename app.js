// // Import required libraries
// import OpenAI from "openai";          // OpenAI-compatible client (used with Groq endpoint)
// import dotenv from "dotenv";          // Loads environment variables from .env file
// import Groq from "groq-sdk";          // Groq SDK for LLM calls
// import readline from "readline";      // For taking user input from terminal
// import { TavilyClient } from "tavily"; // For web search functionality

// // Load environment variables (API keys etc.)
// dotenv.config();

// // Initialize Tavily client for web search
// const tvly = new TavilyClient({
//   apiKey: process.env.TAVILY_API_KEY,
// });

// // Initialize Groq client
// const groq = new Groq({
//   apiKey: process.env.GROQ_API_KEY
// });


// // ---------------------- TOOL FUNCTION ----------------------
// // Function to perform web search using Tavily
// async function webSearch({ query }) {
//   const result = await tvly.search(query); // Call Tavily API
//   return result; // Return search results
// }


// // ---------------------- USER INPUT FUNCTION ----------------------
// // Function to get input from terminal (async)
// function getUserInput(prompt) {
//   const rl = readline.createInterface({
//     input: process.stdin,
//     output: process.stdout,
//   });

//   // Return a promise so we can use await
//   return new Promise((resolve) => {
//     rl.question(prompt, (answer) => {
//       rl.close(); // Close readline after input
//       resolve(answer); // Return user input
//     });
//   });
// }


// // ---------------------- MAIN FUNCTION ----------------------
// async function main(){

//   // Create OpenAI-compatible client pointing to Groq API
//   const client = new OpenAI({
//     apiKey: process.env.GROQ_API_KEY,
//     baseURL: "https://api.groq.com/openai/v1",
//   });

//   // Conversation history (important for context)
//   const messages = [
//     {
//       role: "system",
//       content: "You are Jarvis, a smart assistant. Your tone is humorous.",
//     },
//   ];

//   // Infinite loop to keep chat running
//   while (true) {

//     // Take user input
//     const userInput = await getUserInput("You: ");
    
//     // Exit condition
//     if (userInput.toLowerCase() === "bye") {
//       console.log("Jarvis: Goodbye! Have a great day!");
//       break;
//     }

//     // Add user message to chat history
//     messages.push({
//       role: "user",
//       content: userInput,
//     });

//     // ---------------------- FIRST LLM CALL ----------------------
//     // This call decides whether to answer directly OR call a tool
//     const response = await groq.chat.completions.create({
//       temperature: 0.7, // Controls randomness (higher = more creative)

//       model: "openai/gpt-oss-20b",

//       messages: messages,

//       // Define tools (functions the model can call)
//       tools: [
//         {
//           type: "function",
//           function: {
//             name: "webSearch",
//             description: "Search the web for information.",
//             parameters: {
//               type: "object",
//               properties: {
//                 query: {
//                   type: "string",
//                   description: "The search query."
//                 },
//               },
//               required: ["query"]
//             }
//           }
//         }
//       ],

//       tool_choice: "auto", // Let model decide whether to use tool
//     });

//     // Check if model wants to call a tool
//     const tool_call = response.choices[0].message.tool_calls;

//     // ---------------------- NO TOOL CASE ----------------------
//     if (!tool_call) {
//       // Model answered directly
//       console.log("Jarvis:", response.choices[0].message.content);

//       // Save assistant response to history
//       messages.push({
//         role: "assistant",
//         content: response.choices[0].message.content,
//       });

//     } else {

//       // ---------------------- TOOL CALL CASE ----------------------
//       console.log("Number of tool calls:", tool_call.length);

//       // Loop through all tool calls
//       for (const call of tool_call) {

//         console.log("Processing tool call:", call.function.name);

//         // If model called webSearch
//         if (call.function.name === "webSearch") {

//           // Parse arguments passed by model
//           const args = JSON.parse(call.function.arguments);

//           // Execute tool function
//           const result = await webSearch(args);    

//           // Add tool response to messages (VERY IMPORTANT)
//           messages.push({
//             tool_call_id: call.id, // Link tool response to tool call
//             role: "tool",
//             name: call.function.name,
//             content: JSON.stringify(result), // Send result as string
//           });
//         }
//       }

//       // ---------------------- SECOND LLM CALL ----------------------
//       // Now we send tool result back to model to generate final answer
//       const response2 = await groq.chat.completions.create({
//         temperature: 0.7,
//         model: "openai/gpt-oss-20b",
//         messages: messages, // includes tool output

//         tools: [
//           {
//             type: "function",
//             function: {
//               name: "webSearch",
//               description: "Search the web for information.",
//               parameters: {
//                 type: "object",
//                 properties: {
//                   query: {
//                     type: "string",
//                     description: "The search query."
//                   },
//                 },
//                 required: ["query"]
//               }
//             }
//           }
//         ],

//         tool_choice: "auto",
//       });

//       // Print final response
//       console.log("Jarvis:", response2.choices[0].message.content);

//       // Save final assistant response
//       messages.push({
//         role: "assistant",
//         content: response2.choices[0].message.content,
//       });
//     }
//   }
// }

// // Run the main function
// main();


// app.js
import Groq from 'groq-sdk';
import { TavilyClient } from 'tavily';
import dotenv from 'dotenv';

dotenv.config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const tavily = new TavilyClient({ apiKey: process.env.TAVILY_API_KEY });

async function webSearch({ query }) {
  const result = await tavily.search(query);
  return result;
}

export async function getJarvisReply(userMessage, history = []) {
  // Build messages array (system + history + new user message)
  const messages = [
    { role: 'system', content: 'You are Jarvis, a smart assistant. Your tone is humorous.' },
    ...history,
    { role: 'user', content: userMessage },
  ];

  // First LLM call – decide if tool needed
  const response = await groq.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    temperature: 0.7,
    messages,
    tools: [{
      type: 'function',
      function: {
        name: 'webSearch',
        description: 'Search the web for information.',
        parameters: {
          type: 'object',
          properties: { query: { type: 'string' } },
          required: ['query'],
        },
      },
    }],
    tool_choice: 'auto',
  });

  const toolCall = response.choices[0].message.tool_calls;

  // No tool → return direct answer
  if (!toolCall) {
    return response.choices[0].message.content;
  }

  // Tool call → execute search
  const updatedMessages = [...messages];
  for (const call of toolCall) {
    if (call.function.name === 'webSearch') {
      const args = JSON.parse(call.function.arguments);
      const searchResult = await webSearch(args);
      updatedMessages.push({
        tool_call_id: call.id,
        role: 'tool',
        name: call.function.name,
        content: JSON.stringify(searchResult),
      });
    }
  }

  // Second LLM call with search results
  const finalResponse = await groq.chat.completions.create({
    model: 'openai/gpt-oss-20b',
    temperature: 0.7,
    messages: updatedMessages,
    tools: [{
      type: 'function',
      function: {
        name: 'webSearch',
        description: 'Search the web for information.',
        parameters: {
          type: 'object',
          properties: { query: { type: 'string' } },
          required: ['query'],
        },
      },
    }],
    tool_choice: 'auto',
  });

  return finalResponse.choices[0].message.content;
}