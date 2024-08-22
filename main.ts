import { App, Modal, Notice, Plugin, PluginSettingTab, Setting } from 'obsidian';

//表示已经生成的段落数量和段落的总数量，两者皆为0代表是第一次按下document按键，
let index_processed: number = 0;
let index_all: number = 0;
//存储按照段落##分开的目录
let index_array: Array<string> = [];

//缓存用户输入需求
let intput_question: string = "";
//是当前文档内的内容，可以是目录，也可以是生成文档段落+剩余目录的形式
let output_answer: string = "";
//单单缓存生成的文档段落部分
let output_docu: string = "";
//缓存chat的回答，会和intput_question在点击chat按钮时一起缓存到记录chat_questions和chat_responses中
let chat_res: string = "";
//缓存当前的目录，点击段落生成后不可改变
let index_info: string = "";


//表示是否需要重新生成显示模态框，防止多次点击左侧按钮出现多个模态框
let isshown: boolean = false;
//用于重写段落时使用，用于保存上一次段落生成时已生成段落的内容，不包括后续目录
let lastres: string = "";

//（0，left）指向已生成段落的长度，（right，end）指向剩余的目录；last为上一次结果
let left: number = 0;
let right: number = 0;
let lastleft: number = 0;
let lastright: number = 0;
//缓存chat问答的问题和回答，最大次数表示能够存储的最大次数
let max_chat_size: number = 200;
let chat_questions: Array<string> = [];
let chat_responses: Array<string> = [];

//用户相同的需求输入一共重复问了多少次
let ask_times: number = 0;

//状态量，1表示在生成目录阶段，2表示在生成文档段落阶段
let query_type: number=0;
interface DraftPlusSettings {
	serveraddress: string;
	username: string;
	password: string;
	topicid:string
}
const DEFAULT_SETTINGS: DraftPlusSettings = {
	serveraddress: "wss://lab.iwhalecloud.com/writer",
	username: '',
	password: '',
	topicid: ''
};
// 插件主类
export default class DraftPlusPlugin extends Plugin {
	settings: DraftPlusSettings;
	async onload() {
		await this.loadSettings();
		
		this.addSettingTab(new DraftPlusSettingTab(this.app, this));
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = '//styles.css'; 
		document.head.appendChild(link);
		this.addRibbonIcon('pencil', '文稿助手', async () => {
			if (isshown == false) {
				this.showCustomModalInOutline(); isshown = true;
			}
		});
	};
	showCustomModalInOutline() {
		const modal = new DraftPlusModal(this.app, this.settings.serveraddress, this.settings.username, this.settings.password, this.settings.topicid);	
		modal.open();;
	}
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
		if (this.settings.serveraddress == "" || this.settings.serveraddress == null) {
			this.settings.serveraddress = 'wss://lab.iwhalecloud.com/writer';
		}
	}
	async saveSettings() {
		await this.saveData(this.settings);
	}
}
// 自定义模态框类
class DraftPlusModal extends Modal {
	serveradd: string = "";
	input_username: string = "";
	input_password: string = "";
	input_topicid: string = "";
	textarea: HTMLTextAreaElement;
	output_suggestions: HTMLTextAreaElement;
	output_ducument: HTMLTextAreaElement;
	chat_area: HTMLTextAreaElement;
	thisapp: App;
	socket: WebSocket;
	constructor(app: App,sa:string,u:string,p:string,to:string) {
		super(app);
		this.thisapp = app;
		//this.serveradd = sa;
		this.serveradd = sa.replace(/\s+/g, '');
		this.input_username = u;
		this.input_password = p;
		this.input_topicid = to;
	}
	safe(sa: string) {
		const removeSpaces = (str: string) => {
			return str.split(' ').join('');
		};
		let sad = removeSpaces(sa);
		return sad;
	}
	setupWebSocket_index() {
		this.socket = new WebSocket( this.serveradd + "/getIndex");
		if (this.textarea.value == "") {
			new Notice('输入为空！');
		}
		this.socket.onopen = () => {
			new Notice('WebSocket connection established');
			const data = JSON.stringify({
				input_string: this.textarea.value,
				input_username: this.input_username,
				input_password: this.input_password,
				ask_times: ask_times,
				query_type: query_type,
				topicid: this.input_topicid
			});
			lastres = output_answer;
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
			new Notice('[WebSocket Error] ' + error.target);
		};
	}
	setupWebSocket_document() {
		this.socket = new WebSocket( this.serveradd + "/getDocument");
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
			new Notice('[WebSocket Error]' + error);
		};
	}
	setupWebSocket_chat() {
		this.socket = new WebSocket(this.serveradd + "/chat");
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
				output_answer: output_answer,
				input_username: this.input_username,
				input_password: this.input_password
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
			new Notice('[WebSocket Error] ' + error);
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
		const heading = contentEl.createEl('h1', { text: '文稿助手', attr: { style: 'font-size: 16px;' } });
		heading.style.marginLeft = '3%';
		contentEl.classList.add('ele');
		contentEl.style.top = localStorage.getItem('lastPositionTop') || '50%'; 
		contentEl.style.left = localStorage.getItem('lastPositionLeft') || '50%'; 
		const inputDiv = contentEl.createEl('div');
		inputDiv.classList.add('input-div');
		this.textarea = inputDiv.createEl('textarea');
		this.textarea.placeholder = '请输入关于目录、段落的需求描述或问题';
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
			if (query_type != 2) {
				index_info = this.output_suggestions.value;
			}
			output_answer = this.output_suggestions.value;
			const tempStr = index_info.replace(/####/g, '__FOURHASH__').replace(/###/g, '__THREEHASH__');
			let parts = tempStr.split(/##(?!#)/);
			parts = parts.map(part => part.replace(/__FOURHASH__/g, '####').replace(/__THREEHASH__/g, '###'));
			index_array = parts;
		});
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
		this.chat_area.placeholder = '大模型输出内容';
		this.chat_area.readOnly = true;
		this.chat_area.classList.add('textarea');
		this.chat_area.focus();
		this.chat_area.value = chat_res;
		chatButton.addEventListener('click', () => {
			new Notice('与ChatGPT交流');
			this.setupWebSocket_chat();
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
			if (intput_question != this.textarea.value) {
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
			this.setupWebSocket_document();
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
			index_all = 0;
			index_processed = 0;
			if (intput_question != this.textarea.value) {
				ask_times = 1;
			}
			else {
				ask_times++;
			}
			this.loadcontent_index();
			this.setupWebSocket_index();
			intput_question = this.textarea.value;
			const tempStr = index_info.replace(/####/g, '__FOURHASH__').replace(/###/g, '__THREEHASH__');
			let parts = tempStr.split(/##(?!#)/);
			parts = parts.map(part => part.replace(/__FOURHASH__/g, '####').replace(/__THREEHASH__/g, '###'));
			index_array = parts;
		});
		documentButton.addEventListener('click', () => {
			new Notice('已确认根据目录生成文档，生成文档期间请不要修改文件内容');
			query_type = 2;
			if (intput_question != this.textarea.value) {
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
			this.setupWebSocket_document();
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
// 插件设置标签页类
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
				}))
			.addButton(button => {
				button.setButtonText('测试')
					.onClick(async () => {
						const serverAddress = this.plugin.settings.serveraddress;
						try {
							const socket = new WebSocket(serverAddress+'/test');
							socket.onopen = () => {
								new Notice("WebSocket 连接成功！");
							};
							socket.onerror = (error) => {
								new Notice("WebSocket 连接错误：" + error);
							};
						} catch (error) {
							new Notice("无效的服务器地址：" + error);
						}
					});
			});
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
			.addText(text => {
				text.inputEl.type = "password";
				text.setPlaceholder('Enter Docchain password')
					.setValue(this.plugin.settings.password)
					.onChange(async (value) => {
						this.plugin.settings.password = value;
						await this.plugin.saveSettings();
					});
				const toggleButton = document.createElement('button');
				toggleButton.textContent = '显示';
				toggleButton.type = 'button'; 
				toggleButton.addEventListener('click', () => {
					if (text.inputEl.type === "password") {
						text.inputEl.type = "text";
						toggleButton.textContent = '隐藏';
					} else {
						text.inputEl.type = "password";
						toggleButton.textContent = '显示';
					}
				});
				text.inputEl.parentElement?.appendChild(toggleButton);
			});
		new Setting(containerEl)
			.setName('Docchain topic-id')
			.setDesc('Docchain对应主题的topic-id.')
			.addText(text => text
				.setPlaceholder('Enter Docchain topic-id')
				.setValue(this.plugin.settings.topicid)
				.onChange(async (value) => {
					this.plugin.settings.topicid = value;
					await this.plugin.saveSettings();
				}));
	}
}
