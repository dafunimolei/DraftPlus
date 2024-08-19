import { App, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';
let index_processed: number = 0;
let index_all: number = 0;
let intput_question: string = "";
let output_answer: string = "";
let output_docu: string = "";
let chat_res: string = "";
let index_info: string = "";
let question: string="";
let document_info: string="";
let isshown: boolean = false;
let lastres: string = "";
let lastleft: number = 0;
let lastright: number = 0;
let max_chat_size: number = 200;
let index_array: Array<string> = [];
let chat_questions: Array<string> = [];
let chat_responses: Array<string> = [];
let left: number = 0;
let right: number = 0;
let current_state: number = 0;
let ask_times: number=0;
let query_type: number=0;
interface DraftPlusSettings {
	usertoken: string;
	serveraddress: string;
	username: string;
	password: string;
	topicid:string
}
const DEFAULT_SETTINGS: DraftPlusSettings = {
	usertoken: '',
	serveraddress: '',
	username: '',
	password: '',
	topicid: ''
};
export default class DraftPlusPlugin extends Plugin {
	settings: DraftPlusSettings;
	output_suggestions: HTMLTextAreaElement;
	async onload() {
		await this.loadSettings();
		this.addRibbonIcon('pencil', '文稿助手', async () => {
			if (isshown == false) {
				this.showCustomModalInOutline(); isshown = true;
			}
		});
		this.addSettingTab(new DraftPlusSettingTab(this.app, this));
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = '//styles.css'; 
		document.head.appendChild(link);
	};
	showCustomModalInOutline() {
		const modal = new DraftPlusModal(this.app, this.settings.usertoken, this.settings.serveraddress, this.settings.username, this.settings.password, this.settings.topicid);	
		modal.open();;
	}
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}
	async saveSettings() {
		await this.saveData(this.settings);
	}
}
class DraftPlusModal extends Modal {
	input_username: string = "";
	input_password: string = "";
	input_topicid: string = "";
	textarea: HTMLTextAreaElement;
	output_suggestions: HTMLTextAreaElement;
	output_ducument: HTMLTextAreaElement;
	chat_area: HTMLTextAreaElement;
	token: string = "";
	serveradd: string = "";
	requirement:HTMLTextAreaElement;
	revise: HTMLTextAreaElement;
	thisapp: App;
	socket: WebSocket;
	constructor(app: App,t:string,sa:string,u:string,p:string,to:string) {
		super(app);
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
			new Notice('输入为空！');
		}
		this.socket.onopen = () => {
			new Notice('WebSocket connection established');
			const data = JSON.stringify({
				input_string: this.textarea.value,
				input_token: this.token,
				input_username: this.input_username,
				input_password: this.input_password,
				ask_times: ask_times,
				query_type: query_type,
				topicid: this.input_topicid
			});
			lastres = this.output_suggestions.value;
			this.output_suggestions.value = "正在生成中，请勿输入或触碰按键...";
			this.socket.send(data);
		};
		this.socket.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				if (data && typeof data === 'object') {
					const content = data.content || '';
					if (data.error) {
						new Notice(data.error + " 请点击重新生成此目录 ")
					}
					if (this.output_suggestions.value === "正在生成中，请勿输入或触碰按键..." && content !== '') {
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
					new Notice('Received data is not a valid JSON object:', event.data);
				}
			} catch (error) {
				new Notice('Error parsing JSON data:', error);
			};

		};
		this.socket.onclose = (event) => {
			const tempStr = index_info.replace(/####/g, '__FOURHASH__').replace(/###/g, '__THREEHASH__');
			let parts = tempStr.split(/##(?!#)/);
			parts = parts.map(part => part.replace(/__FOURHASH__/g, '####').replace(/__THREEHASH__/g, '###'));
			index_array = parts;
			if (event.wasClean) {
				new Notice(`Connection closed cleanly, code=${event.code}, reason=${event.reason}`);
			} else {
				new Notice('Connection died');
			}
			new Notice(' 目录生成完毕 ')
		};
		this.socket.onerror = (error) => {
			new Notice('[WebSocket Error] ${error}');
		};
	}
	setupWebSocket2() {
		this.socket = new WebSocket("ws://" + this.serveradd + "/getDocument");
		if (index_processed == 0 && index_all == 0 ) {
			if (index_array.length == 0) {
				new Notice('空目录！');
				return;
			}
			left = 0;
			right = index_array[0].length;
		}
		this.socket.onopen = () => {
			new Notice('WebSocket connection established');
			const data = JSON.stringify({
				input_string: this.textarea.value,
				input_token: this.token,
				input_username: this.input_username,
				input_password: this.input_password,
				index: index_info,
				ask_times:ask_times,
				query_type: query_type,
				topicid: this.input_topicid,
				index_processed: index_processed,
				output_suggestions: output_answer,
				index_all: index_all
			});
			lastres = output_answer;
			lastleft = left;
			lastright = right;
			right += index_array[index_processed + 1].length + 2;
			if (index_processed == 0 && index_all==0)
				this.output_ducument.value = "正在生成中，请勿输入或触碰按键...";
			this.socket.send(data);
		};
			this.socket.onmessage = (event) => {
				try {
					const data = JSON.parse(event.data);
					if (data && typeof data === 'object') {
						const content = data.content || '';
						if (data.index_processed && data.index_all) { 
							index_processed = parseInt(data.index_processed, 10) ;
							index_all = parseInt(data.index_all, 10);
						if (index_processed >= index_all) {
							new Notice("全部文档生成完成");
						}
						}
						if (data.error) {
							new Notice(data.error+" 请点击重新生成此小结 ")
						}
						if (this.output_ducument.value === "正在生成中，请勿输入或触碰按键..." && content !== '') {
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
						new Notice('Received data is not a valid JSON object:', event.data);
					}
				} catch (error) {
					new Notice('Error parsing JSON data:', error);
				};
		};
		this.socket.onclose = (event) => {
			new Notice(' 已生成 ' + index_processed + ' 段,一共 ' + index_all + ' 段 ');
			if (event.wasClean) {
				new Notice(`Connection closed cleanly, code=${event.code}, reason=${event.reason}`);
			} else {
				new Notice('Connection died');
			}
		};
		this.socket.onerror = (error) => {
			new Notice('[WebSocket Error] ${error}');
		};
	}
	setupWebSocket3() {
		this.socket = new WebSocket("ws://" + this.serveradd + "/chat");
		if (chat_questions.length < max_chat_size) {
			chat_questions.push(this.textarea.value);
		}
		else {
			for (let i = 0; i < max_chat_size - 1; i++) {
				chat_questions[i] = chat_questions[i + 1];
			}
			chat_questions[max_chat_size - 1] = this.textarea.value;
		}
		this.socket.onopen = () => {
			new Notice('WebSocket connection established');
			this.chat_area.value = "";
			const data = JSON.stringify({
				input_string: this.textarea.value,
				input_token: this.token,
				output_answer: output_answer
			});
			this.socket.send(data);
		};
		this.socket.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				if (data && typeof data === 'object') {
					const content = data.content || '';
					if (data.error) {
						new Notice(data.error + " ChatGPT response error! ")
					}
					this.chat_area.value += content;
					chat_res = this.chat_area.value;
					this.chat_area.scrollTop = this.chat_area.scrollHeight;
				} else {
					new Notice('Received data is not a valid JSON object:', event.data);
				}
			} catch (error) {
				new Notice('Error parsing JSON data:', error);
			};
		};
		this.socket.onclose = (event) => {
			if (chat_responses.length < max_chat_size) {
				chat_responses.push(chat_res);
			}
			else {
				for (let i = 0; i < max_chat_size - 1; i++) {
					chat_responses[i] = chat_responses[i + 1];
				}
				chat_responses[max_chat_size - 1] = chat_res;
			}
			if (event.wasClean) {
				new Notice(`Connection closed cleanly, code=${event.code}, reason=${event.reason}`);
			} else {
				new Notice('Connection died');
			}
		};
		this.socket.onerror = (error) => {
			new Notice('[WebSocket Error] ${error}');
		};
	}
	async loadcontent_index() {
		const activeFile = this.app.workspace.getActiveFile();
		if (activeFile) {
			const filePath = activeFile.path;
			try {
				index_info = await this.app.vault.adapter.read(filePath);
			} catch (error) {
				new Notice('Failed to read file:', error);
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
				new Notice('Failed to read file:', error);
			}
		} else {
			this.output_suggestions.value = '';
			new Notice('No active file.');
		}
	}
	preventClose(evt: { stopPropagation: () => void; }) {
		evt.stopPropagation();
	}
	onOpen() {
		let { contentEl } = this;
		let overlay = document.createElement('div');
		overlay.appendChild(contentEl);
		document.body.appendChild(overlay);
		overlay.addEventListener('click', (event) => {
			if (event.target === overlay) { 
				event.stopPropagation();
			}
		});
		contentEl.createEl('h1', { text: '文稿助手', attr: { style: 'font-size: 16px;' } });
		contentEl.classList.add('ele');
		contentEl.style.top = localStorage.getItem('lastPositionTop') || '50%'; 
		contentEl.style.left = localStorage.getItem('lastPositionLeft') || '50%'; 
		const inputDiv = contentEl.createEl('div');
		inputDiv.classList.add('input-div');
		this.textarea = inputDiv.createEl('textarea');
		this.textarea.placeholder = '生成目录或文档的需求 或 与GPT聊天内容';
		this.textarea.classList.add('textarea');
		this.textarea.focus();
		this.textarea.value = intput_question;
		this.textarea.addEventListener('input', (event) => {
			const inputt = event.target as HTMLInputElement;
			this.textarea.value = inputt.value;
			intput_question = this.textarea.value;
		});
		const outputDiv = contentEl.createEl('div');
		outputDiv.classList.add('output-div');
		this.output_suggestions = outputDiv.createEl('textarea');
		this.output_suggestions.placeholder = 'output_suggestions are as follows:';
		this.output_suggestions.classList.add('output');
		this.output_suggestions.focus();
		this.output_ducument = outputDiv.createEl('textarea');
		this.output_ducument.placeholder = 'output_ducument are as follows:';
		this.output_ducument.focus();
		this.output_ducument.classList.add('output');
		this.output_ducument.addEventListener('input', (event) => {
			const inputt = event.target as HTMLInputElement;
			this.output_ducument.value = inputt.value;
			output_docu = this.output_ducument.value;
			const activeFile = this.app.workspace.getActiveFile();
			if (activeFile) {
				const fp = activeFile.path;
				this.thisapp.vault.adapter.write(fp, this.output_ducument.value);
			}
		});
		this.output_suggestions.addEventListener('input', (event) => {
			const inputt = event.target as HTMLInputElement;
			this.output_suggestions.value = inputt.value;
			if (current_state != 2) {
				index_info = this.output_suggestions.value;
			}
			output_answer = this.output_suggestions.value;
			const tempStr = index_info.replace(/####/g, '__FOURHASH__').replace(/###/g, '__THREEHASH__');
			let parts = tempStr.split(/##(?!#)/);
			parts = parts.map(part => part.replace(/__FOURHASH__/g, '####').replace(/__THREEHASH__/g, '###'));
			index_array = parts;
		});
		if (query_type == 1)
			this.output_suggestions.value = index_info;
		if (query_type == 2)
			this.output_suggestions.value = document_info;
		this.output_suggestions.value = output_answer;
		this.output_ducument.value = output_docu;
		const buttonDiv = contentEl.createEl('div');
		buttonDiv.classList.add('button-div');
		let indexButton = buttonDiv.createEl('button', { text: '生成目录' });
		indexButton.title = '生成新的完整目录';
		indexButton.classList.add('button-style');
		let documentButton = buttonDiv.createEl('button', { text: '生成段落' });
		documentButton.title = '逐段生成文档，以二级标题为单位';
		documentButton.classList.add('button-style');
		let resetButton = buttonDiv.createEl('button', { text: '清空段落' });
		resetButton.title = '清除已生成的文档段落内容，返回已保存的目录，接下来可以修改目录或重新生成文档';
		resetButton.classList.add('button-style');
		let rgButton = buttonDiv.createEl('button', { text: '重写本段' });
		rgButton.title = '重新生成本段内容，以二级标题为单位';
		rgButton.classList.add('button-style');
		let safButton = buttonDiv.createEl('button', { text: '保存文件' });
		safButton.title = '将本文件另存为tmp新文件';;
		safButton.classList.add('button-style');
		let chatButton = buttonDiv.createEl('button', { text: 'Chat聊天' });
		chatButton.title = '与ChatGPT机器人对话以获取更多信息';
		chatButton.classList.add('button-style');
		const chatDiv = contentEl.createEl('div');
		chatDiv.classList.add('chat-div');
		this.chat_area = chatDiv.createEl('textarea');
		this.chat_area.placeholder = 'ChatGPT机器人回答内容区域:';
		this.chat_area.readOnly = true;
		this.chat_area.classList.add('textarea');
		this.chat_area.focus();
		this.chat_area.value = chat_res;
		chatButton.addEventListener('click', () => {
			new Notice('与ChatGPT交流');
			this.setupWebSocket3();
		});
		safButton.addEventListener('click', () => {
			const currentTime = new Date();
			const years = currentTime.getFullYear();
			const months = currentTime.getMonth()+1;
			const days = currentTime.getDate();
			const hours = currentTime.getHours();
			const minutes = currentTime.getMinutes();
			const seconds = currentTime.getSeconds();
			const newFileName = "tmp_" + years + "_" + months + "_" + days + "_" + hours + "_" + minutes + "_" + seconds + ".md";
			this.loadcontent_output_suggestions();
			this.thisapp.vault.create(newFileName, output_answer);
		});
		rgButton.addEventListener('click', () => {
			new Notice('重新生成本段文档，生成文档期间请不要修改文件内容');
			query_type = 2;
			current_state = 2;
			if (question != this.textarea.value) {
				ask_times = 1;
			}
			else {
				ask_times++;
			}
			if (index_processed <= 0) {
				new Notice("未生成文档！无法重新生成");
				return;
			}
			index_processed--;
			if (index_processed >= index_all && index_all > 0) {
				index_all = 0;
				index_processed = 0;
				new Notice('根据目录重新生成文档', 15000);
				this.output_ducument.value = '';
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
		resetButton.addEventListener('click', () => {
			index_all = 0;
			index_processed = 0;
			this.output_ducument.value = '';
			this.output_suggestions.value = index_info;
			output_answer = index_info;
			const activeFile = this.app.workspace.getActiveFile();
			if (activeFile) {
				const fp = activeFile.path;
				this.thisapp.vault.adapter.write(fp, output_answer);
			}
		});
		indexButton.addEventListener('click', () => {
			query_type = 1;
			current_state = 1;
			index_all = 0;
			index_processed = 0;
			if (question != this.textarea.value) {
				ask_times = 1;
			}
			else {
				ask_times++;
			}
			this.loadcontent_index();
			this.setupWebSocket1();
			question = this.textarea.value;
			intput_question = this.textarea.value;
			const tempStr = index_info.replace(/####/g, '__FOURHASH__').replace(/###/g, '__THREEHASH__');
			let parts = tempStr.split(/##(?!#)/);
			parts = parts.map(part => part.replace(/__FOURHASH__/g, '####').replace(/__THREEHASH__/g, '###'));
			index_array = parts;
		});
		documentButton.addEventListener('click', () => {
			new Notice('已确认根据目录生成文档，生成文档期间请不要修改文件内容');
			query_type = 2;
			current_state = 2;
			if (question != this.textarea.value) {
				ask_times = 1;
			}
			else {
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
				new Notice('根据目录重新生成文档',15000);
				this.output_ducument.value = '';
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
		let offsetX: number;
		let offsetY: number;
		contentEl.addEventListener('mousedown', (e) => {
			if (e.target === contentEl) {
				isDragging = true;
				offsetX = e.clientX - contentEl.getBoundingClientRect().left;
				offsetY = e.clientY - contentEl.getBoundingClientRect().top;
				contentEl.style.cursor = 'move';
			}
		});
		document.addEventListener('mousemove', (e) => {
			if (isDragging) {
				contentEl.style.left = `${e.clientX - offsetX}px`;
				contentEl.style.top = `${e.clientY - offsetY}px`;
				contentEl.style.position = 'fixed';
			}
		});
		document.addEventListener('mouseup', () => {
			isDragging = false;
			contentEl.style.cursor = 'default';
		});
		const resizeHandle = document.createElement('div');
		resizeHandle.className = 'resize-handle';
		contentEl.appendChild(resizeHandle);
		let isResizing = false;
		resizeHandle.addEventListener('mousedown', (e) => {
			isResizing = true;
			e.stopPropagation();
		});
		document.addEventListener('mousemove', (e) => {
			if (isResizing) {
				const newWidth = e.clientX - contentEl.getBoundingClientRect().left;
				const newHeight = e.clientY - contentEl.getBoundingClientRect().top;
				contentEl.style.width = `${newWidth}px`;
				contentEl.style.height = `${newHeight}px`;
			}
		});
		document.addEventListener('mouseup', () => {
			isResizing = false;
		});
		const closeButton = document.createElement('button');
		closeButton.classList.add('modal-close-button');
		contentEl.appendChild(closeButton);
		closeButton.addEventListener('click', (e) => {
			isshown = false;
			e.stopPropagation(); 
			localStorage.setItem('lastPositionTop', contentEl.style.top);
			localStorage.setItem('lastPositionLeft', contentEl.style.left);
			contentEl.remove();
		});
	}
}
class DraftPlusSettingTab extends PluginSettingTab {
	plugin: DraftPlusPlugin;
	constructor(app: App, plugin: DraftPlusPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}
	display(): void {
		const {containerEl} = this;
		containerEl.empty();
		new Setting(containerEl)
			.setName('Server Address')
			.setDesc('服务器地址.')
			.addText(text => text
				.setPlaceholder('Enter server address')
				.setValue(this.plugin.settings.serveraddress)
				.onChange(async (value) => {		
					this.plugin.settings.serveraddress = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('GPT token')
			.setDesc('ChatGPT的token，同研发云token.')
			.addText(text => text
				.setPlaceholder('Enter GPT token')
				.setValue(this.plugin.settings.usertoken)
				.onChange(async (value) => {
					this.plugin.settings.usertoken = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Docchain username')
			.setDesc('Docchain的用户名.')
			.addText(text => text
				.setPlaceholder('Enter Docchain username')
				.setValue(this.plugin.settings.username)
				.onChange(async (value) => {
					this.plugin.settings.username = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Docchain password')
			.setDesc('Docchain的密码.')
			.addText(text => text
				.setPlaceholder('Enter Docchain password')
				.setValue(this.plugin.settings.password)
				.onChange(async (value) => {
					this.plugin.settings.password = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('Docchain topicid')
			.setDesc('Docchain对应主题的topicid.')
			.addText(text => text
				.setPlaceholder('Enter Docchain topicid')
				.setValue(this.plugin.settings.topicid)
				.onChange(async (value) => {
					this.plugin.settings.topicid = value;
					await this.plugin.saveSettings();
				}));
	}
}
