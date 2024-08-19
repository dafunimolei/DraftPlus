/*
THIS IS A GENERATED/BUNDLED FILE BY ESBUILD
if you want to view the source, please visit the github repository of this plugin
*/

var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// main.ts
var main_exports = {};
__export(main_exports, {
  default: () => DraftPlusPlugin
});
module.exports = __toCommonJS(main_exports);
var import_obsidian = require("obsidian");
var index_processed = 0;
var index_all = 0;
var intput_question = "";
var output_answer = "";
var output_docu = "";
var chat_res = "";
var index_info = "";
var question = "";
var document_info = "";
var isshown = false;
var lastres = "";
var lastleft = 0;
var lastright = 0;
var max_chat_size = 200;
var index_array = [];
var chat_questions = [];
var chat_responses = [];
var left = 0;
var right = 0;
var current_state = 0;
var ask_times = 0;
var query_type = 0;
var DEFAULT_SETTINGS = {
  usertoken: "",
  serveraddress: "",
  username: "",
  password: "",
  topicid: ""
};
var DraftPlusPlugin = class extends import_obsidian.Plugin {
  async onload() {
    await this.loadSettings();
    this.addRibbonIcon("pencil", "\u6587\u7A3F\u52A9\u624B", async () => {
      if (isshown == false) {
        this.showCustomModalInOutline();
        isshown = true;
      }
    });
    this.addSettingTab(new DraftPlusSettingTab(this.app, this));
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = "//styles.css";
    document.head.appendChild(link);
  }
  showCustomModalInOutline() {
    const modal = new DraftPlusModal(this.app, this.settings.usertoken, this.settings.serveraddress, this.settings.username, this.settings.password, this.settings.topicid);
    modal.open();
    ;
  }
  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }
  async saveSettings() {
    await this.saveData(this.settings);
  }
};
var DraftPlusModal = class extends import_obsidian.Modal {
  constructor(app, t, sa, u, p, to) {
    super(app);
    this.input_username = "";
    this.input_password = "";
    this.input_topicid = "";
    this.token = "";
    this.serveradd = "";
    this.thisapp = app;
    this.token = t;
    this.serveradd = sa;
    this.input_username = u;
    this.input_password = p;
    this.input_topicid = to;
  }
  setupWebSocket1() {
    this.socket = new WebSocket("ws://" + this.serveradd + "/getIndex");
    if (this.textarea.value == "") {
      new import_obsidian.Notice("\u8F93\u5165\u4E3A\u7A7A\uFF01");
    }
    this.socket.onopen = () => {
      new import_obsidian.Notice("WebSocket connection established");
      const data = JSON.stringify({
        input_string: this.textarea.value,
        input_token: this.token,
        input_username: this.input_username,
        input_password: this.input_password,
        ask_times,
        query_type,
        topicid: this.input_topicid
      });
      lastres = this.output_suggestions.value;
      this.output_suggestions.value = "\u6B63\u5728\u751F\u6210\u4E2D\uFF0C\u8BF7\u52FF\u8F93\u5165\u6216\u89E6\u78B0\u6309\u952E...";
      this.socket.send(data);
    };
    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && typeof data === "object") {
          const content = data.content || "";
          if (data.error) {
            new import_obsidian.Notice(data.error + " \u8BF7\u70B9\u51FB\u91CD\u65B0\u751F\u6210\u6B64\u76EE\u5F55 ");
          }
          if (this.output_suggestions.value === "\u6B63\u5728\u751F\u6210\u4E2D\uFF0C\u8BF7\u52FF\u8F93\u5165\u6216\u89E6\u78B0\u6309\u952E..." && content !== "") {
            this.output_suggestions.value = "";
          }
          this.output_suggestions.value += content;
          index_info = this.output_suggestions.value;
          output_answer = this.output_suggestions.value;
          this.output_suggestions.scrollTop = this.output_suggestions.scrollHeight;
          const activeFile = this.app.workspace.getActiveFile();
          if (activeFile) {
            const fp = activeFile.path;
            this.thisapp.vault.adapter.write(fp, this.output_suggestions.value);
          }
        } else {
          new import_obsidian.Notice("Received data is not a valid JSON object:", event.data);
        }
      } catch (error) {
        new import_obsidian.Notice("Error parsing JSON data:", error);
      }
      ;
    };
    this.socket.onclose = (event) => {
      const tempStr = index_info.replace(/####/g, "__FOURHASH__").replace(/###/g, "__THREEHASH__");
      let parts = tempStr.split(/##(?!#)/);
      parts = parts.map((part) => part.replace(/__FOURHASH__/g, "####").replace(/__THREEHASH__/g, "###"));
      index_array = parts;
      if (event.wasClean) {
        new import_obsidian.Notice(`Connection closed cleanly, code=${event.code}, reason=${event.reason}`);
      } else {
        new import_obsidian.Notice("Connection died");
      }
      new import_obsidian.Notice(" \u76EE\u5F55\u751F\u6210\u5B8C\u6BD5 ");
    };
    this.socket.onerror = (error) => {
      new import_obsidian.Notice("[WebSocket Error] ${error}");
    };
  }
  setupWebSocket2() {
    this.socket = new WebSocket("ws://" + this.serveradd + "/getDocument");
    if (index_processed == 0 && index_all == 0) {
      if (index_array.length == 0) {
        new import_obsidian.Notice("\u7A7A\u76EE\u5F55\uFF01");
        return;
      }
      left = 0;
      right = index_array[0].length;
    }
    this.socket.onopen = () => {
      new import_obsidian.Notice("WebSocket connection established");
      const data = JSON.stringify({
        input_string: this.textarea.value,
        input_token: this.token,
        input_username: this.input_username,
        input_password: this.input_password,
        index: index_info,
        ask_times,
        query_type,
        topicid: this.input_topicid,
        index_processed,
        output_suggestions: output_answer,
        index_all
      });
      lastres = output_answer;
      lastleft = left;
      lastright = right;
      right += index_array[index_processed + 1].length + 2;
      if (index_processed == 0 && index_all == 0)
        this.output_ducument.value = "\u6B63\u5728\u751F\u6210\u4E2D\uFF0C\u8BF7\u52FF\u8F93\u5165\u6216\u89E6\u78B0\u6309\u952E...";
      this.socket.send(data);
    };
    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && typeof data === "object") {
          const content = data.content || "";
          if (data.index_processed && data.index_all) {
            index_processed = parseInt(data.index_processed, 10);
            index_all = parseInt(data.index_all, 10);
            if (index_processed >= index_all) {
              new import_obsidian.Notice("\u5168\u90E8\u6587\u6863\u751F\u6210\u5B8C\u6210");
            }
          }
          if (data.error) {
            new import_obsidian.Notice(data.error + " \u8BF7\u70B9\u51FB\u91CD\u65B0\u751F\u6210\u6B64\u5C0F\u7ED3 ");
          }
          if (this.output_ducument.value === "\u6B63\u5728\u751F\u6210\u4E2D\uFF0C\u8BF7\u52FF\u8F93\u5165\u6216\u89E6\u78B0\u6309\u952E..." && content !== "") {
            this.output_ducument.value = "";
          }
          this.output_ducument.value += content;
          this.output_suggestions.value = this.output_suggestions.value.slice(0, left) + content + index_info.slice(right, index_info.length);
          left += content.length;
          document_info = this.output_ducument.value;
          output_answer = this.output_suggestions.value;
          output_docu = this.output_ducument.value;
          this.output_ducument.scrollTop = this.output_ducument.scrollHeight;
          const activeFile = this.app.workspace.getActiveFile();
          if (activeFile) {
            const fp = activeFile.path;
            this.thisapp.vault.adapter.write(fp, output_answer);
          }
        } else {
          new import_obsidian.Notice("Received data is not a valid JSON object:", event.data);
        }
      } catch (error) {
        new import_obsidian.Notice("Error parsing JSON data:", error);
      }
      ;
    };
    this.socket.onclose = (event) => {
      new import_obsidian.Notice(" \u5DF2\u751F\u6210 " + index_processed + " \u6BB5,\u4E00\u5171 " + index_all + " \u6BB5 ");
      if (event.wasClean) {
        new import_obsidian.Notice(`Connection closed cleanly, code=${event.code}, reason=${event.reason}`);
      } else {
        new import_obsidian.Notice("Connection died");
      }
    };
    this.socket.onerror = (error) => {
      new import_obsidian.Notice("[WebSocket Error] ${error}");
    };
  }
  setupWebSocket3() {
    this.socket = new WebSocket("ws://" + this.serveradd + "/chat");
    if (chat_questions.length < max_chat_size) {
      chat_questions.push(this.textarea.value);
    } else {
      for (let i = 0; i < max_chat_size - 1; i++) {
        chat_questions[i] = chat_questions[i + 1];
      }
      chat_questions[max_chat_size - 1] = this.textarea.value;
    }
    this.socket.onopen = () => {
      new import_obsidian.Notice("WebSocket connection established");
      this.chat_area.value = "";
      const data = JSON.stringify({
        input_string: this.textarea.value,
        input_token: this.token,
        output_answer
      });
      this.socket.send(data);
    };
    this.socket.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data && typeof data === "object") {
          const content = data.content || "";
          if (data.error) {
            new import_obsidian.Notice(data.error + " ChatGPT response error! ");
          }
          this.chat_area.value += content;
          chat_res = this.chat_area.value;
          this.chat_area.scrollTop = this.chat_area.scrollHeight;
        } else {
          new import_obsidian.Notice("Received data is not a valid JSON object:", event.data);
        }
      } catch (error) {
        new import_obsidian.Notice("Error parsing JSON data:", error);
      }
      ;
    };
    this.socket.onclose = (event) => {
      if (chat_responses.length < max_chat_size) {
        chat_responses.push(chat_res);
      } else {
        for (let i = 0; i < max_chat_size - 1; i++) {
          chat_responses[i] = chat_responses[i + 1];
        }
        chat_responses[max_chat_size - 1] = chat_res;
      }
      if (event.wasClean) {
        new import_obsidian.Notice(`Connection closed cleanly, code=${event.code}, reason=${event.reason}`);
      } else {
        new import_obsidian.Notice("Connection died");
      }
    };
    this.socket.onerror = (error) => {
      new import_obsidian.Notice("[WebSocket Error] ${error}");
    };
  }
  async loadcontent_index() {
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile) {
      const filePath = activeFile.path;
      try {
        index_info = await this.app.vault.adapter.read(filePath);
      } catch (error) {
        new import_obsidian.Notice("Failed to read file:", error);
      }
    }
  }
  async loadcontent_output_suggestions() {
    const activeFile = this.app.workspace.getActiveFile();
    if (activeFile) {
      const filePath = activeFile.path;
      try {
        let tmp = this.output_suggestions.value.length;
        this.output_suggestions.value = await this.app.vault.adapter.read(filePath);
        output_answer = this.output_suggestions.value;
        left = left - tmp + output_answer.length;
      } catch (error) {
        new import_obsidian.Notice("Failed to read file:", error);
      }
    } else {
      this.output_suggestions.value = "";
      new import_obsidian.Notice("No active file.");
    }
  }
  preventClose(evt) {
    evt.stopPropagation();
  }
  onOpen() {
    let { contentEl } = this;
    let overlay = document.createElement("div");
    overlay.appendChild(contentEl);
    document.body.appendChild(overlay);
    overlay.addEventListener("click", (event) => {
      if (event.target === overlay) {
        event.stopPropagation();
      }
    });
    const heading = contentEl.createEl("h1", { text: "\u6587\u7A3F\u52A9\u624B", attr: { style: "font-size: 16px;" } });
    heading.style.marginLeft = "3%";
    contentEl.classList.add("ele");
    contentEl.style.top = localStorage.getItem("lastPositionTop") || "50%";
    contentEl.style.left = localStorage.getItem("lastPositionLeft") || "50%";
    const inputDiv = contentEl.createEl("div");
    inputDiv.classList.add("input-div");
    this.textarea = inputDiv.createEl("textarea");
    this.textarea.placeholder = "\u751F\u6210\u76EE\u5F55\u6216\u6587\u6863\u7684\u9700\u6C42 \u6216 \u4E0EGPT\u804A\u5929\u5185\u5BB9";
    this.textarea.classList.add("textarea");
    this.textarea.focus();
    this.textarea.value = intput_question;
    this.textarea.addEventListener("input", (event) => {
      const inputt = event.target;
      this.textarea.value = inputt.value;
      intput_question = this.textarea.value;
    });
    const outputDiv = contentEl.createEl("div");
    outputDiv.classList.add("output-div");
    this.output_suggestions = outputDiv.createEl("textarea");
    this.output_suggestions.placeholder = "output_suggestions are as follows:";
    this.output_suggestions.classList.add("output");
    this.output_suggestions.focus();
    this.output_ducument = outputDiv.createEl("textarea");
    this.output_ducument.placeholder = "output_ducument are as follows:";
    this.output_ducument.focus();
    this.output_ducument.classList.add("output");
    this.output_ducument.addEventListener("input", (event) => {
      const inputt = event.target;
      this.output_ducument.value = inputt.value;
      output_docu = this.output_ducument.value;
      const activeFile = this.app.workspace.getActiveFile();
      if (activeFile) {
        const fp = activeFile.path;
        this.thisapp.vault.adapter.write(fp, this.output_ducument.value);
      }
    });
    this.output_suggestions.addEventListener("input", (event) => {
      const inputt = event.target;
      this.output_suggestions.value = inputt.value;
      if (current_state != 2) {
        index_info = this.output_suggestions.value;
      }
      output_answer = this.output_suggestions.value;
      const tempStr = index_info.replace(/####/g, "__FOURHASH__").replace(/###/g, "__THREEHASH__");
      let parts = tempStr.split(/##(?!#)/);
      parts = parts.map((part) => part.replace(/__FOURHASH__/g, "####").replace(/__THREEHASH__/g, "###"));
      index_array = parts;
    });
    if (query_type == 1)
      this.output_suggestions.value = index_info;
    if (query_type == 2)
      this.output_suggestions.value = document_info;
    this.output_suggestions.value = output_answer;
    this.output_ducument.value = output_docu;
    const buttonDiv = contentEl.createEl("div");
    buttonDiv.classList.add("button-div");
    let indexButton = buttonDiv.createEl("button", { text: "\u751F\u6210\u76EE\u5F55" });
    indexButton.title = "\u751F\u6210\u65B0\u7684\u5B8C\u6574\u76EE\u5F55";
    indexButton.classList.add("button-style");
    let documentButton = buttonDiv.createEl("button", { text: "\u751F\u6210\u6BB5\u843D" });
    documentButton.title = "\u9010\u6BB5\u751F\u6210\u6587\u6863\uFF0C\u4EE5\u4E8C\u7EA7\u6807\u9898\u4E3A\u5355\u4F4D";
    documentButton.classList.add("button-style");
    let resetButton = buttonDiv.createEl("button", { text: "\u6E05\u7A7A\u6BB5\u843D" });
    resetButton.title = "\u6E05\u9664\u5DF2\u751F\u6210\u7684\u6587\u6863\u6BB5\u843D\u5185\u5BB9\uFF0C\u8FD4\u56DE\u5DF2\u4FDD\u5B58\u7684\u76EE\u5F55\uFF0C\u63A5\u4E0B\u6765\u53EF\u4EE5\u4FEE\u6539\u76EE\u5F55\u6216\u91CD\u65B0\u751F\u6210\u6587\u6863";
    resetButton.classList.add("button-style");
    let rgButton = buttonDiv.createEl("button", { text: "\u91CD\u5199\u672C\u6BB5" });
    rgButton.title = "\u91CD\u65B0\u751F\u6210\u672C\u6BB5\u5185\u5BB9\uFF0C\u4EE5\u4E8C\u7EA7\u6807\u9898\u4E3A\u5355\u4F4D";
    rgButton.classList.add("button-style");
    let safButton = buttonDiv.createEl("button", { text: "\u4FDD\u5B58\u6587\u4EF6" });
    safButton.title = "\u5C06\u672C\u6587\u4EF6\u53E6\u5B58\u4E3Atmp\u65B0\u6587\u4EF6";
    ;
    safButton.classList.add("button-style");
    let chatButton = buttonDiv.createEl("button", { text: "Chat\u804A\u5929" });
    chatButton.title = "\u4E0EChatGPT\u673A\u5668\u4EBA\u5BF9\u8BDD\u4EE5\u83B7\u53D6\u66F4\u591A\u4FE1\u606F";
    chatButton.classList.add("button-style");
    const chatDiv = contentEl.createEl("div");
    chatDiv.classList.add("chat-div");
    this.chat_area = chatDiv.createEl("textarea");
    this.chat_area.placeholder = "ChatGPT\u673A\u5668\u4EBA\u56DE\u7B54\u5185\u5BB9\u533A\u57DF:";
    this.chat_area.readOnly = true;
    this.chat_area.classList.add("textarea");
    this.chat_area.focus();
    this.chat_area.value = chat_res;
    chatButton.addEventListener("click", () => {
      new import_obsidian.Notice("\u4E0EChatGPT\u4EA4\u6D41");
      this.setupWebSocket3();
    });
    safButton.addEventListener("click", () => {
      const currentTime = new Date();
      const years = currentTime.getFullYear();
      const months = currentTime.getMonth() + 1;
      const days = currentTime.getDate();
      const hours = currentTime.getHours();
      const minutes = currentTime.getMinutes();
      const seconds = currentTime.getSeconds();
      const newFileName = "tmp_" + years + "_" + months + "_" + days + "_" + hours + "_" + minutes + "_" + seconds + ".md";
      this.loadcontent_output_suggestions();
      this.thisapp.vault.create(newFileName, output_answer);
    });
    rgButton.addEventListener("click", () => {
      new import_obsidian.Notice("\u91CD\u65B0\u751F\u6210\u672C\u6BB5\u6587\u6863\uFF0C\u751F\u6210\u6587\u6863\u671F\u95F4\u8BF7\u4E0D\u8981\u4FEE\u6539\u6587\u4EF6\u5185\u5BB9");
      query_type = 2;
      current_state = 2;
      if (question != this.textarea.value) {
        ask_times = 1;
      } else {
        ask_times++;
      }
      if (index_processed <= 0) {
        new import_obsidian.Notice("\u672A\u751F\u6210\u6587\u6863\uFF01\u65E0\u6CD5\u91CD\u65B0\u751F\u6210");
        return;
      }
      index_processed--;
      if (index_processed >= index_all && index_all > 0) {
        index_all = 0;
        index_processed = 0;
        new import_obsidian.Notice("\u6839\u636E\u76EE\u5F55\u91CD\u65B0\u751F\u6210\u6587\u6863", 15e3);
        this.output_ducument.value = "";
        this.output_suggestions.value = index_info;
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile) {
          const fp = activeFile.path;
          this.thisapp.vault.adapter.write(fp, index_info);
        }
      }
      output_answer = lastres;
      this.output_suggestions.value = output_answer;
      left = lastleft;
      right = lastright;
      this.setupWebSocket2();
      question = this.textarea.value;
      intput_question = this.textarea.value;
    });
    resetButton.addEventListener("click", () => {
      index_all = 0;
      index_processed = 0;
      this.output_ducument.value = "";
      this.output_suggestions.value = index_info;
      output_answer = index_info;
      const activeFile = this.app.workspace.getActiveFile();
      if (activeFile) {
        const fp = activeFile.path;
        this.thisapp.vault.adapter.write(fp, output_answer);
      }
    });
    indexButton.addEventListener("click", () => {
      query_type = 1;
      current_state = 1;
      index_all = 0;
      index_processed = 0;
      if (question != this.textarea.value) {
        ask_times = 1;
      } else {
        ask_times++;
      }
      this.loadcontent_index();
      this.setupWebSocket1();
      question = this.textarea.value;
      intput_question = this.textarea.value;
      const tempStr = index_info.replace(/####/g, "__FOURHASH__").replace(/###/g, "__THREEHASH__");
      let parts = tempStr.split(/##(?!#)/);
      parts = parts.map((part) => part.replace(/__FOURHASH__/g, "####").replace(/__THREEHASH__/g, "###"));
      index_array = parts;
    });
    documentButton.addEventListener("click", () => {
      new import_obsidian.Notice("\u5DF2\u786E\u8BA4\u6839\u636E\u76EE\u5F55\u751F\u6210\u6587\u6863\uFF0C\u751F\u6210\u6587\u6863\u671F\u95F4\u8BF7\u4E0D\u8981\u4FEE\u6539\u6587\u4EF6\u5185\u5BB9");
      query_type = 2;
      current_state = 2;
      if (question != this.textarea.value) {
        ask_times = 1;
      } else {
        ask_times++;
      }
      if (index_processed == 0 && index_all == 0) {
        this.loadcontent_index();
      } else {
        this.loadcontent_output_suggestions();
      }
      if (index_processed >= index_all && index_all > 0) {
        index_all = 0;
        index_processed = 0;
        new import_obsidian.Notice("\u6839\u636E\u76EE\u5F55\u91CD\u65B0\u751F\u6210\u6587\u6863", 15e3);
        this.output_ducument.value = "";
        this.output_suggestions.value = index_info;
        output_answer = index_info;
        const activeFile = this.app.workspace.getActiveFile();
        if (activeFile) {
          const fp = activeFile.path;
          this.thisapp.vault.adapter.write(fp, output_answer);
        }
      }
      this.setupWebSocket2();
      question = this.textarea.value;
      intput_question = this.textarea.value;
    });
    let isDragging = false;
    let offsetX;
    let offsetY;
    contentEl.addEventListener("mousedown", (e) => {
      if (e.target === contentEl) {
        isDragging = true;
        offsetX = e.clientX - contentEl.getBoundingClientRect().left;
        offsetY = e.clientY - contentEl.getBoundingClientRect().top;
        contentEl.style.cursor = "move";
      }
    });
    document.addEventListener("mousemove", (e) => {
      if (isDragging) {
        contentEl.style.left = `${e.clientX - offsetX}px`;
        contentEl.style.top = `${e.clientY - offsetY}px`;
        contentEl.style.position = "fixed";
      }
    });
    document.addEventListener("mouseup", () => {
      isDragging = false;
      contentEl.style.cursor = "default";
    });
    const resizeHandle = document.createElement("div");
    resizeHandle.className = "resize-handle";
    contentEl.appendChild(resizeHandle);
    let isResizing = false;
    resizeHandle.addEventListener("mousedown", (e) => {
      isResizing = true;
      e.stopPropagation();
    });
    document.addEventListener("mousemove", (e) => {
      if (isResizing) {
        const newWidth = e.clientX - contentEl.getBoundingClientRect().left;
        const newHeight = e.clientY - contentEl.getBoundingClientRect().top;
        contentEl.style.width = `${newWidth}px`;
        contentEl.style.height = `${newHeight}px`;
      }
    });
    document.addEventListener("mouseup", () => {
      isResizing = false;
    });
    const closeButton = document.createElement("button");
    closeButton.classList.add("modal-close-button");
    contentEl.appendChild(closeButton);
    closeButton.addEventListener("click", (e) => {
      isshown = false;
      e.stopPropagation();
      localStorage.setItem("lastPositionTop", contentEl.style.top);
      localStorage.setItem("lastPositionLeft", contentEl.style.left);
      contentEl.remove();
    });
  }
};
var DraftPlusSettingTab = class extends import_obsidian.PluginSettingTab {
  constructor(app, plugin) {
    super(app, plugin);
    this.plugin = plugin;
  }
  display() {
    const { containerEl } = this;
    containerEl.empty();
    new import_obsidian.Setting(containerEl).setName("Server Address").setDesc("\u670D\u52A1\u5668\u5730\u5740.").addText((text) => text.setPlaceholder("Enter server address").setValue(this.plugin.settings.serveraddress).onChange(async (value) => {
      this.plugin.settings.serveraddress = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("GPT token").setDesc("ChatGPT\u7684token\uFF0C\u540C\u7814\u53D1\u4E91token.").addText((text) => text.setPlaceholder("Enter GPT token").setValue(this.plugin.settings.usertoken).onChange(async (value) => {
      this.plugin.settings.usertoken = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Docchain username").setDesc("Docchain\u7684\u7528\u6237\u540D.").addText((text) => text.setPlaceholder("Enter Docchain username").setValue(this.plugin.settings.username).onChange(async (value) => {
      this.plugin.settings.username = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Docchain password").setDesc("Docchain\u7684\u5BC6\u7801.").addText((text) => text.setPlaceholder("Enter Docchain password").setValue(this.plugin.settings.password).onChange(async (value) => {
      this.plugin.settings.password = value;
      await this.plugin.saveSettings();
    }));
    new import_obsidian.Setting(containerEl).setName("Docchain topicid").setDesc("Docchain\u5BF9\u5E94\u4E3B\u9898\u7684topicid.").addText((text) => text.setPlaceholder("Enter Docchain topicid").setValue(this.plugin.settings.topicid).onChange(async (value) => {
      this.plugin.settings.topicid = value;
      await this.plugin.saveSettings();
    }));
  }
};
