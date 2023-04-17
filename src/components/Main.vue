
<script setup lang="ts">
// {
//   "id": "chatcmpl-123",
//   "object": "chat.completion",
//   "created": 1677652288,
//   "choices": [{
//     "index": 0,
//     "message": {
//       "role": "assistant",
//       "content": "\n\nHello there, how may I assist you today?",
//     },
//     "finish_reason": "stop"
//   }],
//   "usage": {
//     "prompt_tokens": 9,
//     "completion_tokens": 12,
//     "total_tokens": 21
//   }
// }
import { ref } from 'vue'
const { Configuration, OpenAIApi } = require("openai");

// defineProps<{ msg: string }>()
const apiKey = ref<string>('')
const showApiInput = ref<boolean>(false)
// add your script here
let cnLines = ref<string[]>([])
let enLines = ref<string[]>([])
const cnText = ref<HTMLTextAreaElement | null>(null)
const enText = ref<HTMLTextAreaElement | null>(null)
const mergeText = ref<HTMLTextAreaElement | null>(null)
const cnLineNumber = ref<HTMLPreElement | null>(null)
const enLineNumber = ref<HTMLPreElement | null>(null)

const rawTextParts = ref<string[]>([])
const translatedTextParts = ref<string[]>([])

const isTranslating = ref<boolean>(false)
const translatingPartIndex = ref<Number>(-1)
const prompt = "You are a professional web novel translator, translate my Chinese paragraphs into English in the form of a novel, DO NOT remove line breaks. While maintaining accuracy, pay attention to keeping the sentences fluent and literary, and ensure clear character references. Unless explicitly stated, assume all characters are female and use the pronouns She/Her, here is the text:"
const configuration = new Configuration({
  apiKey: apiKey.value,
});
const openai = new OpenAIApi(configuration);

async function translate() {
  if (rawTextParts.value.length === 0) {
    splitRawContent()
  }
  isTranslating.value = true
  for (let i = 0; i < rawTextParts.value.length; i++) {
    translatingPartIndex.value = i
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: prompt + rawTextParts.value[i] }],
    });
    let message = completion.data.choices[0].message.content
    translatedTextParts.value.push(message)
    if (enText?.value) {
      enText.value.value = enText.value.value + '\n' + message;
    }
  }
}

function displayCNLineNumbers() {
    const linesCount = cnLines.value.length;
    let numbersText = "";

    for (let i = 1; i <= linesCount; i++) {
        numbersText += i + (i === linesCount ? "" : "\n");
    }
    if (cnLineNumber.value) {
      cnLineNumber.value.innerText = numbersText;
    }
}
function displayENLineNumbers() {
    const linesCount = enLines.value.length;
    let numbersText = "";

    for (let i = 1; i <= linesCount; i++) {
        numbersText += i + (i === linesCount ? "" : "\n");
    }
    if (enLineNumber.value) {
      enLineNumber.value.innerText = numbersText;
    }
}
function onCNScroll() {
  if (cnLineNumber.value && cnText.value) {
    console.log("onScroll", cnText.value.scrollTop)
    cnLineNumber.value.scrollTop = cnText.value.scrollTop
  }
}
function onENScroll() {
  if (enLineNumber.value && enText.value) {
    console.log("onScroll", enText.value.scrollTop)
    enLineNumber.value.scrollTop = enText.value.scrollTop
  }
}

function onPasteCNContent(event: ClipboardEvent) {
  const pasteContent = event?.clipboardData?.getData("text/plain") ?? ""
  cnLines.value = pasteContent.split(/\r?\n/).map((line: string) => line.trim()).filter((line: string) => line !== '')
  // updateLineNumbers()
}

function onPasteENContent(event: ClipboardEvent) {
  const pasteContent = event?.clipboardData?.getData("text/plain") ?? ""
  enLines.value = pasteContent.split(/\r?\n/).map((line: string) => line.trim()).filter((line: string) => line !== '')
}

function clearAll() {
  if (cnText?.value) {
    cnText.value.value = '';
  }
  if (enText?.value) {
    enText.value.value = '';
  }
  if (mergeText?.value) {
    mergeText.value.value = '';
  }
  cnLines.value = []
  enLines.value = []
}
function loadText() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.txt';
  input.addEventListener('change', (event) => {
    const reader = new FileReader();
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];
    if (file) {
      reader.readAsText(file);
      reader.addEventListener('load', (event) => {
        const content = event.target?.result as string;
        cnLines.value = content?.split(/\r?\n/).map((line: string) => line.trim()).filter((line: string) => line.trim() !== '') ?? [];
        if (cnText?.value) {
          cnText.value.value = content ?? [];
        }
      });
    }

  });
  input.click();
}


function removeEmptyLines() {
  if (cnText?.value) {
    cnText.value.value = cnLines.value.join('\n');
  }
  if (enText?.value) {
    enText.value.value = enLines.value.join('\n');
  }
}

function addEmptyLines() {
  if (cnText?.value) {
    cnText.value.value = cnLines.value.join('\n\n');
  }
  if (enText?.value) {
    enText.value.value = enLines.value.join('\n\n');
  }
}

function splitRawContent() {
  let currentContent = '';
  for (let i = 0; i < cnLines.value.length; i++) {
    if (currentContent.length + cnLines.value[i].length <= 800) {
      currentContent += cnLines.value[i] + '\n';
    } else {
      rawTextParts.value.push(currentContent.trim());
      currentContent = cnLines.value[i] + '\n';
    }
  }
  if (currentContent.trim() !== '') {
    rawTextParts.value.push(currentContent.trim());
  }
}

function merge() {
  if (cnLines.value.length !== enLines.value.length) {
    alert(`行数不一致, cnlines = ${cnLines.value.length}, enlines = ${enLines.value.length}`)
  }
  let mergedContent = '';
  for (let i = 0; i < cnLines.value.length; i++) {
    mergedContent += cnLines.value[i] + '\n' + enLines.value[i] + '\n';
  }
  if (mergeText?.value) {
    mergeText.value.value = mergedContent.trim();
  }
}

function split() {
  if (mergeText?.value) {
    const mergedContent = mergeText.value.value.trim();
    const mergedLines = mergedContent.split(/\r?\n/).map(line => line.trim()).filter(line => line.trim() !== '');
    const cnLines = [];
    const enLines = [];
    for (let i = 0; i < mergedLines.length; i += 2) {
      cnLines.push(mergedLines[i]);
      enLines.push(mergedLines[i + 1]);
    }
    if (cnText?.value) {
      cnText.value.value = cnLines.join('\n\n');
    }
    if (enText?.value) {
      enText.value.value = enLines.join('\n\n');
    }
  }
}

function copyPart(part: string) {
  navigator.clipboard.writeText(part)
}

</script>

<template>
  <div class="container w-screen px-2 py-8">
    <h1 class="font-bold text-3xl mb-8 text-center">MTL Editor</h1>
    <div class="flex mb-2">
      <button class="btn btn-primary text-sm mr-2 bg-blue-500 py-1 px-1 rounded text-white" @click="loadText()">
        Import Raw TXT file
      </button>
      <button class="btn btn-primary text-sm mr-2 bg-blue-500 py-1 px-1 rounded text-white"
        @click="showApiInput = !showApiInput">
        {{ showApiInput ? "OK" : "Set GPT API KEY" }}
      </button>
      <input type="text" v-model="apiKey" v-show="showApiInput" class="border bg-gray-100">
      <p v-show="apiKey !== ''" class="text-left">Your key: {{ apiKey }}</p>
    </div>
    <div class="flex w-full mb-2" id="textarea-container">
      <div class="w-1/5"></div>
      <div class="w-2/5">
        <p class="text-left">Line Count:{{ cnLines.length }}</p>
      </div>
      <div class="w-2/5">
        <p class="text-left">Line Count:{{ enLines.length }}</p>
      </div>
    </div>
    <div class="flex w-full mb-2" id="textarea-container">
      <div class="w-1/5">
        <div class="flex flex-col content-center p-2">
          <button class="btn block btn-secondary text-sm mb-2 bg-gray-500 py-1 px-1 rounded text-white"
            @click="removeEmptyLines()">
            - Empty Lines
          </button>
          <button class="btn block btn-secondary text-sm mb-2 bg-gray-500 py-1 px-1 rounded text-white"
            @click="addEmptyLines()">
            + Empty Lines
          </button>
          <button class="btn block btn-secondary text-sm mb-2 bg-gray-500 py-1 px-1 rounded text-white"
            @click="splitRawContent()">
            Split Raw Content
          </button>
          <button class="btn btn-secondary text-sm mb-2 bg-green-500 py-2 px-4 rounded text-white" @click="translate()">
            Translate
          </button>
          <button class="btn btn-success text-sm mb-2 bg-blue-500 py-2 px-4 rounded text-white" @click="merge()">
            Merge Left and Right
          </button>
          <button class="btn btn-danger text-sm mb-2 bg-blue-500 py-2 px-4 rounded text-white" @click="split()">
            Split to Left and Right
          </button>
          <button class="btn btn-danger text-sm mb-2 bg-blue-500 py-2 px-4 rounded text-white" @click="clearAll()">
            Clear All
          </button>
        </div>
      </div>
      <div class="w-2/5 flex">
        <textarea ref="cnText" class="w-full bg-gray-200 border border-gray-400" rows="15" wrap="off"
          @paste="onPasteCNContent" @input="displayCNLineNumbers()" @scroll="onCNScroll()"></textarea>
        <pre ref="cnLineNumber" class="lines bg-gray-100"></pre>
      </div>
      <div class="w-2/5 flex">
        <pre ref="enLineNumber" class="lines bg-gray-100"></pre>
        <textarea ref="enText" class="w-full bg-gray-200 border border-gray-400" rows="15" wrap="off"
          @paste="onPasteENContent" @input="displayENLineNumbers()" @scroll="onENScroll()"></textarea>
      </div>
    </div>
    <p class="text-left text-base">Raw Content splited:</p>
    <div class="flex mb-2 mt-2">
      <template v-for="part in rawTextParts">
        <div @click="copyPart(part)">
          <p class="bg-blue-100 mr-1 text-left">{{ part.slice(0, 20) + '...' }}</p>
          <p class="bg-blue-100 mr-1 text-left">{{ '...' + part.slice(-20) }}</p>
        </div>
        <!-- <button @click="handleClick">{{ button }}</button> -->
      </template>
    </div>
    <p class="text-left text-base" v-show="isTranslating">Translating part {{ translatingPartIndex }}... Please wait...
    </p>
    <div class="flex mb-2 mt-2">
      <template v-for="part in translatedTextParts">
        <div @click="copyPart(part)">
          <p class="bg-blue-100 mr-1 text-left">{{ part.slice(0, 50) + '...' }}</p>
          <p class="bg-blue-100 mr-1 text-left">{{ '...' + part.slice(-50) }}</p>
        </div>
        <!-- <button @click="handleClick">{{ button }}</button> -->
      </template>
    </div>
    <textarea ref="mergeText" class="w-full bg-gray-200 border border-gray-400 mb-2" rows="15"></textarea>
    <!-- <h2 class="font-bold text-xl mb-8 mt-8 text-center">捐赠开发者</h2>
    <div class="flex px-20 mx-10">
      <img src="/static/img/img_donation_alipay.png" alt="" class="w-2/5">
      <img src="/static/img/img_donation_wechat.jpg" alt="" class="w-3/5">
    </div> -->
  </div></template>

<style scoped>
#textarea-container {
  max-height: 400px;
}
pre.lines {
  padding-top: 3px;
  overflow-y: scroll;
  user-select: none;
}
pre::-webkit-scrollbar {  
  width:0 !important;   /* remove scrollbar space */
  background: transparent;  /* optional: just make scrollbar invisible */
}


</style>
