
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
const notice = ref<string>('')
const showNotice = ref<boolean>(false)
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

async function translate() {
  if (apiKey.value === '') {
    showNotice.value = true
    notice.value = "Please privide API KEY"
    return
  }
  notice.value = ''
  const configuration = new Configuration({
    apiKey: apiKey.value,
  });
  const openai = new OpenAIApi(configuration);
  if (rawTextParts.value.length === 0) {
    splitRawContent()
  }
  isTranslating.value = true
  for (let i = 0; i < rawTextParts.value.length; i++) {
    translatingPartIndex.value = i
    const currentRawPart = rawTextParts.value[i]
    const completion = await openai.createChatCompletion({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt + currentRawPart }],
    });
    let message = completion.data.choices[0].message.content
    const msgLines = message.split(/\n\n/).filter((line: string) => line !== '')
    const currentRawPartLines = currentRawPart.split(/\n\n/)
    console.log(msgLines.length, currentRawPartLines.length)
    if (msgLines.length < currentRawPartLines.length) {
      for (let i = 0; i < (currentRawPartLines.length - msgLines.length); i++) {
        message += "\n[temp]"
        msgLines.push("[temp]")
      }
    }
    translatedTextParts.value.push(message)
    enLines.value = enLines.value.concat(msgLines)
    if (enText?.value) {
      enText.value.value = enText.value.value + '\n' + message;
    }
  }
  notice.value = 'Translated!'
  isTranslating.value = false
}

function displayCNLineNumbers() {
  if (cnText.value) {
    const linesCount = cnLines.value.length;
    console.log(linesCount)
    let numbersText = "";

    for (let i = 1; i < linesCount; i++) {
        numbersText += i + (i === linesCount ? "" : "\n");
    }
    if (cnLineNumber.value) {
      cnLineNumber.value.innerText = numbersText;
    }
  }
}

function displayENLineNumbers() {
  if (enText.value) {
    const linesCount = enLines.value.length;
    let numbersText = "";

    for (let i = 1; i < linesCount; i++) {
        numbersText += i + (i === linesCount ? "" : "\n");
    }
    if (enLineNumber.value) {
      enLineNumber.value.innerText = numbersText;
    }
  }
}
function onCNScroll() {
  if (cnLineNumber.value && cnText.value) {
    cnLineNumber.value.scrollTop = cnText.value.scrollTop
  }
}
function onENScroll() {
  if (enLineNumber.value && enText.value) {
    enLineNumber.value.scrollTop = enText.value.scrollTop
  }
}

function onPasteCNContent(event: ClipboardEvent) {
  const pasteContent = event?.clipboardData?.getData("text/plain") ?? ""
  cnLines.value = pasteContent.split(/\r?\n/).map((line: string) => line.trim()).filter((line: string) => line !== '')
  displayCNLineNumbers()
}

function onChangeCNContent() {
  if (cnText.value) {
    cnLines.value = cnText.value.value.split(/\r?\n/).map((line: string) => line.trim()).filter((line: string) => line !== '')
    displayCNLineNumbers()
  }
}

function onPasteENContent(event: ClipboardEvent) {
  const pasteContent = event?.clipboardData?.getData("text/plain") ?? ""
  enLines.value = pasteContent.split(/\r?\n/).map((line: string) => line.trim()).filter((line: string) => line !== '')
  displayENLineNumbers()
}
function onChangeENContent() {
  if (enText.value) {
    enLines.value = enText.value.value.split(/\r?\n/).map((line: string) => line.trim()).filter((line: string) => line !== '')
    displayENLineNumbers()
  }
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
  rawTextParts.value = []
  translatedTextParts.value = []
}
function loadText() {
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.txt';
  input.addEventListener('change', (event) => {
    const reader = new FileReader()
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      reader.readAsText(file)
      reader.addEventListener('load', (event) => {
        const content = event.target?.result as string
        cnLines.value = content?.split(/\n\n/).map((line: string) => line.trim()).filter((line: string) => line.trim() !== '') ?? []
        if (cnText?.value) {
          cnText.value.value = content ?? []
        }
      })
    }

  })
  input.click()
}


function removeEmptyLines() {
  if (cnText?.value) {
    cnText.value.value = cnLines.value.join('\n')
  }
  if (enText?.value) {
    enText.value.value = enLines.value.join('\n')
  }
  displayCNLineNumbers()
  displayENLineNumbers()
}

function addEmptyLines() {
  if (cnText?.value) {
    cnText.value.value = cnLines.value.join('\n\n')
  }
  if (enText?.value) {
    enText.value.value = enLines.value.join('\n\n')
  }
  displayCNLineNumbers()
  displayENLineNumbers()
}

function splitRawContent() {
  let currentContent = '';
  for (let i = 0; i < cnLines.value.length; i++) {
    if (currentContent.length + cnLines.value[i].length <= 800) {
      currentContent += cnLines.value[i] + '\n\n';
    } else {
      rawTextParts.value.push(currentContent.trim());
      currentContent = cnLines.value[i] + '\n\n';
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
    const mergedLines = mergedContent.split(/\n\n/).map(line => line.trim()).filter(line => line.trim() !== '');
    cnLines.value = []
    enLines.value = []
    for (let i = 0; i < mergedLines.length; i += 2) {
      cnLines.value.push(mergedLines[i]);
      enLines.value.push(mergedLines[i + 1]);
    }
    if (cnText?.value) {
      cnText.value.value = cnLines.value.join('\n');
    }
    if (enText?.value) {
      enText.value.value = enLines.value.join('\n');
    }
    displayCNLineNumbers()
    displayENLineNumbers()
  }
}

function copy(part: string) {
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
      <p v-show="!showApiInput && apiKey !== ''" class="text-left">Your key: {{ apiKey }}</p>
    </div>
    <div class="flex w-full mb-2" id="textarea-container">
      <div class="w-1/5"></div>
      <div class="w-2/5 flex justify-between">
        <p class="text-left mr-2">Line Count:{{ cnLines.length }}</p>
        <button class="btn btn-primary text-sm mr-2 bg-green-500 py-1 px-1 rounded text-white"
          @click="copy(cnText?.value??'')">Copy</button>
      </div>
      <div class="w-2/5 flex justify-between">
        <p class="text-left mr-2">Line Count:{{ enLines.length }}</p>
        <button class="btn btn-primary text-sm mr-2 bg-green-500 py-1 px-1 rounded text-white"
          @click="copy(enText?.value??'')">Copy</button>
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
        <textarea ref="cnText" class="w-full bg-gray-200 border border-gray-400 p-2" rows="15" wrap="off"
          @paste="onPasteCNContent" @input="onChangeCNContent" @scroll="onCNScroll()"></textarea>
        <pre ref="cnLineNumber" class="lines bg-gray-100"></pre>
      </div>
      <div class="w-2/5 flex">
        <pre ref="enLineNumber" class="lines bg-gray-100"></pre>
        <textarea ref="enText" class="w-full bg-gray-200 border border-gray-400 p-2" rows="15" wrap="off"
          @paste="onPasteENContent" @input="onChangeENContent" @scroll="onENScroll()"></textarea>
      </div>
    </div>
    <p class="text-left text-base">Raw Content splited:</p>
    <div class="flex mb-2 mt-2">
      <template v-for="part in rawTextParts">
        <div @click="copy(part)">
          <p class="bg-blue-100 mr-1 text-left">{{ part.slice(0, 20) + '...' }}</p>
          <p class="bg-blue-100 mr-1 text-left">{{ '...' + part.slice(-20) }}</p>
        </div>
        <!-- <button @click="handleClick">{{ button }}</button> -->
      </template>
    </div>
    <p class="text-left text-base" v-show="showNotice">{{ notice }}</p>
    <p class="text-left text-base" v-show="isTranslating">Translating part {{ translatingPartIndex }}... Please wait...
    </p>
    <div class="flex mb-2 mt-2">
      <template v-for="part in translatedTextParts">
        <div @click="copy(part)">
          <p class="bg-blue-100 mr-1 text-left">{{ part.slice(0, 50) + '...' }}</p>
          <p class="bg-blue-100 mr-1 text-left">{{ '...' + part.slice(-50) }}</p>
        </div>
        <!-- <button @click="handleClick">{{ button }}</button> -->
      </template>
    </div>
    <textarea ref="mergeText" class="w-full bg-gray-200 border border-gray-400 mb-2 p-2" rows="15"></textarea>
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
  padding-top: 0.6rem;
  overflow-y: scroll;
  user-select: none;
}
pre::-webkit-scrollbar {  
  width:0 !important;   /* remove scrollbar space */
  background: transparent;  /* optional: just make scrollbar invisible */
}


</style>
