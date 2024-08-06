import { App, Editor, MarkdownView, Modal, Notice, Plugin, PluginSettingTab, Setting, TFile } from 'obsidian';
//我的
//bafeec42da6b4eaaab93b8950abc6eee44c3a30e
interface ResponseData {
	data: {
		Length: string;
	};
}
let rolling_dice: number = 0;
let index_processed: number = 0;
let index_all: number = 0;
let response_data: ResponseData | null = null;
let ifchange: boolean =false;
let intput_question: string = "";
let output_answer: string = "";
let output_docu: string = "";

//let serveraddress: string = "";
//let usertoken: string = "";


let index_info: string = "";
let question: string="";
let document_info: string="";



let password: string = "";
let username: string = "";
let topicid: string="";

let lastres: string = "";
let lastleft: number = 0;
let lastright: number = 0;


let index_array: Array<string> = [];
let this_index: Array<string> = [];
let left: number = 0;
let right: number = 0;
let current_state: number = 0;

let ask_times: number=0;
let query_type: number=0;

// Remember to rename these classes and interfaces!

interface MyPluginSettings {
	usertoken: string;
	serveraddress:string
}

const DEFAULT_SETTINGS: MyPluginSettings = {
	usertoken: 'bafeec42da6b4eaaab93b8950abc6eee44c3a30e',
	serveraddress: 'localhost:5000'
};

export default class HelloworldPlugin extends Plugin {
	settings: MyPluginSettings;
	output_suggestions: HTMLTextAreaElement;

	async onload() {
		await this.loadSettings();
		
		// This adds a status bar item to the bottom of the app. Does not work on mobile apps.
		const statusBarItemEl = this.addStatusBarItem();
		statusBarItemEl.setText('Status Bar Text');
		//const modal = new TextModal(this.app);
		//modal.open();
		this.addRibbonIcon('pencil', 'Auto Document Generator', async () => {
			this.showCustomModalInOutline();

			// Close the modal to remove it from the DOM tree but keep its content
			
		});
		
	
		// This adds a settings tab so the user can configure various aspects of the plugin
		this.addSettingTab(new SampleSettingTab(this.app, this));
		const link = document.createElement('link');
		link.rel = 'stylesheet';
		link.href = '//styles.css'; // 更新为你的CSS文件路径
		document.head.appendChild(link);
		// If the plugin hooks up any global DOM events (on parts of the app that doesn't belong to this plugin)
		// Using this function will automatically remove the event listener when this plugin is disabled.
		this.registerDomEvent(document, 'click', (evt: MouseEvent) => {
			console.log('click', evt);
		});

		// When registering intervals, this function will automatically clear the interval when the plugin is disabled.
		this.registerInterval(window.setInterval(() => console.log('setInterval'), 5 * 60 * 1000));
	};
	showCustomModalInOutline() {
		
		const modal = new TextModal(this.app, this.settings.usertoken, this.settings.serveraddress);
		modal.open();
		const modalContent = modal.contentEl;
		//outlinePane.appendChild(modalContent);
	}
	onunload() {

	}
	addTextEditor() {
		let input = document.createElement('input');
		input.type = 'text';
		input.placeholder = '请输入您的文本';
		input.addEventListener('input', () => {
			this.displayText(input.value);
		});

		document.body.appendChild(input);
	}
	displayText(text: string) {
		let displayDiv = document.createElement('div');
		displayDiv.textContent = text;

		let existingDisplay = document.getElementById('text-display');
		if (existingDisplay) {
			existingDisplay.remove();
		}

		displayDiv.id = 'text-display';
		document.body.appendChild(displayDiv);
	}
	
	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class TextModal extends Modal {
	
	
	input_username: HTMLInputElement;
	input_password: HTMLInputElement;
	input_topicid: HTMLInputElement;
	textarea: HTMLTextAreaElement;
	output_suggestions: HTMLTextAreaElement;
	output_ducument: HTMLTextAreaElement;
	
	token: string = "";
	serveradd: string = "";


	requirement:HTMLTextAreaElement;
	revise: HTMLTextAreaElement;
	
	thisapp: App;
	
	
	socket: WebSocket;
	constructor(app: App,t:string,sa:string) {
		
		super(app);
		this.thisapp = app;
		this.token = t;
		this.serveradd = sa;
	}
	
	setupWebSocket1() {
		this.socket = new WebSocket("ws://" + this.serveradd+"/getIndex");

		this.socket.onopen = () => {
			console.log("WebSocket connection established");
			new Notice('WebSocket connection established');
			const data = JSON.stringify({
				input_string: this.textarea.value,
				input_token: this.token,
				input_username: this.input_username.value,
				input_password: this.input_password.value,
				ask_times: ask_times,
				query_type: query_type,
				rolling_dice: rolling_dice,
				topicid: this.input_topicid.value
			});
			//new Notice('Preparing data');
			//new Notice(data);
			lastres = this.output_suggestions.value;
			this.output_suggestions.value = "正在生成中，请勿输入或触碰按键...";
			this.socket.send(data);

			//new Notice('Data sent');
		};
		
		this.socket.onmessage = (event) => {
			try {
				// 尝试解析接收到的消息为 JSON 对象
				const data = JSON.parse(event.data);

				// 检查并处理 JSON 数据
				if (data && typeof data === 'object') {
					// 假设 JSON 数据包含一个 `content` 字段
					const content = data.content || '';
					if (data.error) {
						new Notice(data.error + " 请点击重新生成此目录 ")
					}
					// 更新 output_ducument 的值
					if (this.output_suggestions.value === "正在生成中，请勿输入或触碰按键..." && content !== '') {
						this.output_suggestions.value = "";
					}
					this.output_suggestions.value += content;
					index_info = this.output_suggestions.value;
					output_answer = this.output_suggestions.value;
					this.output_suggestions.scrollTop = this.output_suggestions.scrollHeight;

					// 获取当前活动文件
					const activeFile = this.app.workspace.getActiveFile();
					if (activeFile) {
						const fp = activeFile.path;

						this.thisapp.vault.adapter.write(fp, this.output_suggestions.value);
					}
				} else {
					console.warn('Received data is not a valid JSON object:', event.data);
				}
			} catch (error) {
				console.error('Error parsing JSON data:', error, event.data);
			};

		};

		this.socket.onclose = (event) => {
			const tempStr = index_info.replace(/####/g, '__FOURHASH__').replace(/###/g, '__THREEHASH__');

			// 使用正则表达式按 `##` 进行拆分
			let parts = tempStr.split(/##(?!#)/);

			// 将占位符替换回 `###` 和 `####`
			parts = parts.map(part => part.replace(/__FOURHASH__/g, '####').replace(/__THREEHASH__/g, '###'));
			index_array = parts;//this.index_info.split(/##(?!#)/);

			if (event.wasClean) {
				console.log(`Connection closed cleanly, code=${event.code}, reason=${event.reason}`);
			} else {
				console.log('Connection died');
			}
			new Notice(' 目录生成完毕 ')
		};

		this.socket.onerror = (error) => {
			console.error(`[WebSocket Error] ${error}`);
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
			console.log("WebSocket connection established");
			new Notice('WebSocket connection established');
			
			const data = JSON.stringify({
				input_string: this.textarea.value,
				input_token: this.token,
				input_username: this.input_username.value,
				input_password: this.input_password.value,
				index: index_info,
				ask_times:ask_times,
				query_type: query_type,
				rolling_dice: rolling_dice,
				topicid: this.input_topicid.value,
				index_processed: index_processed,
				output_suggestions: output_answer,
				index_all: index_all
			});
			//new Notice('Preparing data');
			//new Notice(data);
			lastres = output_answer;
			lastleft = left;
			lastright = right;
			right += index_array[index_processed + 1].length + 2;
			if (index_processed == 0 && index_all==0)
				this.output_ducument.value = "正在生成中，请勿输入或触碰按键...";
			this.socket.send(data);
			//new Notice('Data sent');
		};
		
		
			//new Notice(event.data);
			this.socket.onmessage = (event) => {
				try {
					// 尝试解析接收到的消息为 JSON 对象
					const data = JSON.parse(event.data);

					// 检查并处理 JSON 数据
					if (data && typeof data === 'object') {
						// 假设 JSON 数据包含一个 `content` 字段
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
						// 更新 output_ducument 的值
						if (this.output_ducument.value === "正在生成中，请勿输入或触碰按键..." && content !== '') {
							this.output_ducument.value = "";
						}
						this.output_ducument.value += content;
						this.output_suggestions.value = this.output_suggestions.value.slice(0, left) + content + index_info.slice(right, index_info.length);
						//result += content;
						left += content.length;
						//right += content.length;
						document_info = this.output_ducument.value;
						output_answer = this.output_suggestions.value;
						output_docu = this.output_ducument.value;
						this.output_ducument.scrollTop = this.output_ducument.scrollHeight;

						// 获取当前活动文件
						const activeFile = this.app.workspace.getActiveFile();
						if (activeFile) {
							const fp = activeFile.path;
							// 将更新后的内容写入文件
							this.thisapp.vault.adapter.write(fp, output_answer);
						}
					} else {
						console.warn('Received data is not a valid JSON object:', event.data);
					}
				} catch (error) {
					console.error('Error parsing JSON data:', error, event.data);
				};
			
			
		};

		this.socket.onclose = (event) => {
			new Notice(' 已生成 ' + index_processed + ' 段,一共 ' + index_all + ' 段 ');
			if (event.wasClean) {
				console.log(`Connection closed cleanly, code=${event.code}, reason=${event.reason}`);
			} else {
				console.log('Connection died');
			}
		};

		this.socket.onerror = (error) => {
			console.error(`[WebSocket Error] ${error}`);
			new Notice('[WebSocket Error] ${error}');
		};
	}
	/*
	setupWebSocket3() {
		this.socket = new WebSocket("ws://" + this.serveradd + "/getRevise");

		this.socket.onopen = () => {
			console.log("WebSocket connection established");
			new Notice('WebSocket connection established');
			const data = JSON.stringify({
				input_string: this.textarea.value,
				input_token: this.token,
				input_username: this.input_username.value,
				input_password: this.input_password.value,
				index: index_info,
				ask_times: ask_times,
				query_type: query_type,
				rolling_dice: rolling_dice,
				topicid: this.input_topicid.value,
				index_processed: index_processed,
				output_suggestions: this.output_ducument.value,
				index_all: index_all,
				problem: this.requirement.value
			});
			//new Notice('Preparing data');
			//new Notice(data);
			lastres = this.requirement.value;
			this.socket.send(data);
			this.revise.value = "正在生成中，请勿输入或触碰按键...";
			
			//new Notice('Data sent');
		};
		let result = '';

		//new Notice(event.data);
		this.socket.onmessage = (event) => {
			try {
				// 尝试解析接收到的消息为 JSON 对象
				const data = JSON.parse(event.data);

				// 检查并处理 JSON 数据
				if (data && typeof data === 'object') {
					// 假设 JSON 数据包含一个 `content` 字段
					const content = data.content || '';
					
					// 更新 output_ducument 的值
					if (this.revise.value === "正在生成中，请勿输入或触碰按键..." && content !== '') {
						this.revise.value = "";
					}
					this.revise.value += content;
					
					this.revise.scrollTop = this.revise.scrollHeight;

					// 获取当前活动文件
					
				} else {
					console.warn('Received data is not a valid JSON object:', event.data);
				}
			} catch (error) {
				console.error('Error parsing JSON data:', error, event.data);
			};


		};

		this.socket.onclose = (event) => {
			if (event.wasClean) {
				console.log(`Connection closed cleanly, code=${event.code}, reason=${event.reason}`);
			} else {
				console.log('Connection died');
			}
		};

		this.socket.onerror = (error) => {
			console.error(`[WebSocket Error] ${error}`);
			new Notice('[WebSocket Error] ${error}');
		};
	}
	*/
	async loadcontent_index() {
		const activeFile = this.app.workspace.getActiveFile();
		if (activeFile) {
			const filePath = activeFile.path;
			try {
				// 读取文件内容并保存到 content 变量中
				index_info = await this.app.vault.adapter.read(filePath);
				console.log('Current file content:',index_info);
			} catch (error) {
				console.error('Failed to read file:', error);
			}
		}
	}
	async loadcontent_output_suggestions() {
		const activeFile = this.app.workspace.getActiveFile();
		if (activeFile) {
			const filePath = activeFile.path;
			try {
				// 读取文件内容并保存到 content 变量中
				let tmp = this.output_suggestions.value.length;
				this.output_suggestions.value = await this.app.vault.adapter.read(filePath);
				output_answer = this.output_suggestions.value;
				left = left - tmp + output_answer.length;
				console.log('Current file content:', this.output_suggestions.value);
			} catch (error) {
				console.error('Failed to read file:', error);
			}
		} else {
			this.output_suggestions.value = '';
			console.log('No active file.');
		}
	}
	onOpen() {
		let { contentEl } = this;

		contentEl.createEl('h1', { text: 'Input your requirements:' });
		contentEl.style.width = '300px'; // 设置宽度
		contentEl.style.height = '300px'; // 设置高度
		//contentEl.style.position = 'fixed';
		contentEl.style.zIndex = '9999'; // 确保模态框在最上层
		contentEl.style.position = 'fixed'; // 改为固定定位
		contentEl.style.top = localStorage.getItem('lastPositionTop') || '50%'; // 使用上一次关闭的位置或默认值
		contentEl.style.left = localStorage.getItem('lastPositionLeft') || '50%'; // 使用上一次关闭的位置或默认值
		contentEl.style.backgroundColor = 'white';
		contentEl.style.border = '1px solid #ccc';
		contentEl.style.borderRadius = '10px'; // 设置圆角边框

		const inputDiv = contentEl.createEl('div');
		inputDiv.style.marginBottom = '5px';
		inputDiv.style.display = 'flex';

		inputDiv.style.justifyContent = 'center';
		inputDiv.style.alignItems = 'center';

		this.textarea = inputDiv.createEl('textarea');
		this.textarea.placeholder = 'Enter your text here';
		this.textarea.style.height = '80px';
		this.textarea.style.width = '250px';
		this.textarea.focus();
		this.textarea.value = intput_question;
		this.textarea.addEventListener('input', (event) => {
			const inputt = event.target as HTMLInputElement;
			this.textarea.value = inputt.value;
			intput_question = this.textarea.value;
		});
		/*
		this.requirement = contentEl.createEl('textarea');
		this.requirement.placeholder = 'Enter your revise requirement here';
		this.requirement.style.height = '100px';
		this.requirement.style.width = '300px';
		this.requirement.focus();
		this.requirement.value = "";
		this.requirement.addEventListener('input', (event) => {
			const inputt = event.target as HTMLInputElement;
			this.requirement.value = inputt.value;
		});

		this.revise = contentEl.createEl('textarea');
		this.revise.placeholder = 'The revised content is here';
		this.revise.style.height = '100px';
		this.revise.style.width = '300px';
		this.revise.focus();
		this.revise.value = "";
		this.revise.addEventListener('input', (event) => {
			const inputt = event.target as HTMLInputElement;
			this.revise.value = inputt.value;
		});
		*/
		const outputDiv = contentEl.createEl('div');
		outputDiv.style.marginBottom = '5px';
		outputDiv.style.display = 'flex';
		outputDiv.style.flexDirection = 'column';
		outputDiv.style.justifyContent = 'center';
		outputDiv.style.alignItems = 'center';

		this.output_suggestions = outputDiv.createEl('textarea');
		this.output_suggestions.placeholder = 'output_suggestions are as follows:';
		this.output_suggestions.style.height = '0px';
		this.output_suggestions.style.width = '0px';
		this.output_suggestions.focus();
		this.output_suggestions.style.display = 'none';

		this.output_ducument = outputDiv.createEl('textarea');
		this.output_ducument.placeholder = 'output_ducument are as follows:';
		this.output_ducument.style.height = '0px';
		this.output_ducument.style.width = '0px';
		this.output_ducument.focus();
		this.output_ducument.style.display = 'none';
		this.output_ducument.addEventListener('input', (event) => {
			const inputt = event.target as HTMLInputElement;
			this.output_ducument.value = inputt.value;
			output_docu = this.output_ducument.value;
			const activeFile = this.app.workspace.getActiveFile();
			if (activeFile) {
				const fp = activeFile.path;
				// 将更新后的内容写入文件
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

			// 使用正则表达式按 `##` 进行拆分
			let parts = tempStr.split(/##(?!#)/);

			// 将占位符替换回 `###` 和 `####`
			parts = parts.map(part => part.replace(/__FOURHASH__/g, '####').replace(/__THREEHASH__/g, '###'));
			index_array = parts;//this.index_info.split(/##(?!#)/);
			
		});

		if (query_type == 1)
			this.output_suggestions.value = index_info;
		if (query_type == 2)
			this.output_suggestions.value = document_info;
		this.output_suggestions.value = output_answer;
		this.output_ducument.value = output_docu;
		
		const inputInfoDiv = contentEl.createEl('div');
		inputInfoDiv.style.marginBottom = '5px';
		inputInfoDiv.style.display = 'flex';
		inputInfoDiv.style.justifyContent = 'center';
		inputInfoDiv.style.alignItems = 'center';
		

		this.input_username = inputInfoDiv.createEl('input');
		this.input_username.type = 'text';
		this.input_username.style.width = '45%';
		this.input_username.placeholder = 'Docchain username';
		this.input_username.style.flexWrap = 'wrap'; // 允许按钮在小屏幕上换行
		this.input_username.focus();

		this.input_password = inputInfoDiv.createEl('input');
		this.input_password.type = 'text';
		this.input_password.style.width = '45%';
		this.input_password.placeholder = 'Docchain password';
		this.input_password.style.flexWrap = 'wrap'; // 允许按钮在小屏幕上换行
		this.input_password.focus();
		

		this.input_topicid = inputInfoDiv.createEl('input');
		this.input_topicid.type = 'text';
		this.input_topicid.style.width = '45%';
		this.input_topicid.placeholder = 'Docchain topicid';
		this.input_topicid.style.flexWrap = 'wrap'; // 允许按钮在小屏幕上换行
		this.input_topicid.focus();

		const buttonDiv = contentEl.createEl('div');
		buttonDiv.style.marginBottom = '5px';
		buttonDiv.style.display = 'flex';
		buttonDiv.style.flexWrap = 'wrap'; // 允许按钮在小屏幕上换行
		buttonDiv.style.alignItems = 'center';
		buttonDiv.style.width = '100%'; // 确保按钮区域宽度始终适应模态框宽度

		let resetButton = buttonDiv.createEl('button', { text: 'Reset to generate new document' });
		resetButton.style.fontSize = '12px'; // 设置字体大小
		resetButton.style.padding = '5px'; // 调整 padding 以适应新的字体大小
		resetButton.style.width = 'auto'; // 确保按钮宽度自适应内容
		resetButton.style.display = 'inline-block'; // 确保按钮宽度自适应内容

		let indexButton = buttonDiv.createEl('button', { text: 'Index' });
		indexButton.style.fontSize = '12px'; // 设置字体大小
		indexButton.style.padding = '5px'; // 调整 padding 以适应新的字体大小
		indexButton.style.width = 'auto'; // 确保按钮宽度自适应内容
		indexButton.style.display = 'inline-block'; // 确保按钮宽度自适应内容

		let documentButton = buttonDiv.createEl('button', { text: 'Document' });
		documentButton.style.fontSize = '12px'; // 设置字体大小
		documentButton.style.padding = '5px'; // 调整 padding 以适应新的字体大小
		documentButton.style.width = 'auto'; // 确保按钮宽度自适应内容
		documentButton.style.display = 'inline-block'; // 确保按钮宽度自适应内容

		let safButton = buttonDiv.createEl('button', { text: 'Save to another file' });
		safButton.style.fontSize = '12px'; // 设置字体大小
		safButton.style.padding = '5px'; // 调整 padding 以适应新的字体大小
		safButton.style.width = 'auto'; // 确保按钮宽度自适应内容
		safButton.style.display = 'inline-block'; // 确保按钮宽度自适应内容

		let rgButton = buttonDiv.createEl('button', { text: 'Regenerate this graph' });
		rgButton.style.fontSize = '12px'; // 设置字体大小
		rgButton.style.padding = '5px'; // 调整 padding 以适应新的字体大小
		rgButton.style.width = 'auto'; // 确保按钮宽度自适应内容
		rgButton.style.display = 'inline-block'; // 确保按钮宽度自适应内容

		safButton.addEventListener('click', () => {

			const currentTime = new Date();
			const years = currentTime.getFullYear();
			const months = currentTime.getMonth();
			const days = currentTime.getDay();
			// 获前时间的小时、分钟和秒
			const hours = currentTime.getHours();
			const minutes = currentTime.getMinutes();
			const seconds = currentTime.getSeconds();
			// 写入内容到新文件
			const newFileName = "tmp_" + years + "_" + months + "_" + days + "_" + hours + "_" + minutes + "_" + seconds + ".md";
			this.loadcontent_output_suggestions();
			this.thisapp.vault.create(newFileName, output_answer);

		});
		/*
		let rdButton = contentEl.createEl('button', { text: 'Change Search mode' });
		rdButton.addEventListener('click', () => {
			if (rolling_dice % 2 == 0) {
				new Notice("Change mode from document search to chat.");
			}
			else {
				new Notice("Change mode from chat to document search.");
			}
			rolling_dice++;

		});
		*/
		
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
					// 将更新后的内容写入文件
					this.thisapp.vault.adapter.write(fp, index_info);
				}
			}
			//new Notice(this.index_info, 5000);
			//new Notice(index_array[index_processed], 20000);
			//new Notice(this.index_info.slice(right, this.index_info.length), 20000);

			//new Notice('index_processed: ' + index_processed, 15000);
			//new Notice('index_all: ' + index_all, 15000);
			output_answer = lastres;
			this.output_suggestions.value = output_answer;
			left = lastleft;
			right = lastright;
			this.setupWebSocket2();
			question = this.textarea.value;
			intput_question = this.textarea.value;

		});



		this.input_topicid.addEventListener('input', (event) => {
			const inputt = event.target as HTMLInputElement;
			this.input_topicid.value = inputt.value;
			topicid = this.input_topicid.value;
		});
		this.input_password.addEventListener('input', (event) => {
			const inputt = event.target as HTMLInputElement;
			this.input_password.value = inputt.value;
			password = this.input_password.value;
		});
		this.input_username.addEventListener('input', (event) => {
			const inputt = event.target as HTMLInputElement;
			this.input_username.value = inputt.value;
			username = this.input_username.value;
		});
		
		this.input_username.value = username;
		this.input_password.value = password;
		this.input_topicid.value = topicid;
		resetButton.addEventListener('click', () => {
			index_all = 0;
			index_processed = 0;
			this.output_ducument.value = '';
			this.output_suggestions.value = index_info;
			output_answer = index_info;
			const activeFile = this.app.workspace.getActiveFile();
			if (activeFile) {
				const fp = activeFile.path;
				// 将更新后的内容写入文件
				this.thisapp.vault.adapter.write(fp, output_answer);
			}
		});
		/*
		let sfButton = buttonDiv.createEl('button', { text: 'Save Index to file' });
		let sdfButton = buttonDiv.createEl('button', { text: 'Save Document to file' });
		
		
		sfButton.addEventListener('click', () => {

			const currentTime = new Date();
			const years = currentTime.getFullYear();
			const months=currentTime.getMonth();
			const days = currentTime.getDay();
			// 获前时间的小时、分钟和秒
			const hours = currentTime.getHours();
			const minutes = currentTime.getMinutes();
			const seconds = currentTime.getSeconds();
			// 写入内容到新文件
			const newFileName = "tmp_index_"+years+"_"+months+"_"+days+"_" + hours + "_" + minutes + "_" + seconds + ".md";

			this.thisapp.vault.create(newFileName, this.output_suggestions.value);

		});
		sdfButton.addEventListener('click', () => {

			const currentTime = new Date();
			// 获前时间的小时、分钟和秒
			const hours = currentTime.getHours();
			const minutes = currentTime.getMinutes();
			const seconds = currentTime.getSeconds();
			// 写入内容到新文件
			const newFileName = "tmp_document_" + hours + "_" + minutes + "_" + seconds + ".md";

			this.thisapp.vault.create(newFileName, this.output_ducument.value);

		});
		*/
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

			// 使用正则表达式按 `##` 进行拆分
			let parts = tempStr.split(/##(?!#)/);

			// 将占位符替换回 `###` 和 `####`
			parts = parts.map(part => part.replace(/__FOURHASH__/g, '####').replace(/__THREEHASH__/g, '###'));
			index_array = parts;//this.index_info.split(/##(?!#)/);
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
					// 将更新后的内容写入文件
					this.thisapp.vault.adapter.write(fp, output_answer);
				}
			}
			//new Notice(this.index_info, 5000);
			//new Notice(index_array[index_processed], 20000);
			//new Notice(this.index_info.slice(right, this.index_info.length), 20000);

			//new Notice('index_processed: ' + index_processed, 15000);
			//new Notice('index_all: ' + index_all, 15000);
			
			this.setupWebSocket2();
			question = this.textarea.value;
			intput_question = this.textarea.value;
			
		});
		
		let isDragging = false;
		let offsetX: number;
		let offsetY: number;

		contentEl.addEventListener('mousedown', (e) => {
			// 仅在点击模态框的标题或特定区域时启用拖拽
			if (e.target === contentEl) {
				isDragging = true;
				offsetX = e.clientX - contentEl.getBoundingClientRect().left;
				offsetY = e.clientY - contentEl.getBoundingClientRect().top;
				contentEl.style.cursor = 'move'; // 更改光标样式
			}
		});

		// 只在拖拽时移动模态框
		document.addEventListener('mousemove', (e) => {
			if (isDragging) {
				contentEl.style.left = `${e.clientX - offsetX}px`;
				contentEl.style.top = `${e.clientY - offsetY}px`;
				contentEl.style.position = 'fixed'; // 使其固定定位
			}
		});

		// 释放鼠标时停止拖拽
		document.addEventListener('mouseup', () => {
			isDragging = false;
			contentEl.style.cursor = 'default'; // 恢复光标样式
		});

		// 缩放功能
		const resizeHandle = document.createElement('div');
		resizeHandle.className = 'resize-handle';
		resizeHandle.style.width = '10px';
		resizeHandle.style.height = '10px';
		resizeHandle.style.background = 'gray';
		resizeHandle.style.position = 'absolute';
		resizeHandle.style.right = '0';
		resizeHandle.style.bottom = '0';
		resizeHandle.style.cursor = 'nwse-resize'; // 缩放光标样式
		contentEl.appendChild(resizeHandle);

		let isResizing = false;

		resizeHandle.addEventListener('mousedown', (e) => {
			isResizing = true;
			e.stopPropagation(); // 防止触发拖拽事件
		});

		// 只在缩放时调整大小
		document.addEventListener('mousemove', (e) => {
			if (isResizing) {
				const newWidth = e.clientX - contentEl.getBoundingClientRect().left;
				const newHeight = e.clientY - contentEl.getBoundingClientRect().top;
				contentEl.style.width = `${newWidth}px`;
				contentEl.style.height = `${newHeight}px`;
			}
		});

		// 释放鼠标时停止缩放
		document.addEventListener('mouseup', () => {
			isResizing = false;
		});

		// 添加关闭按钮
		const closeButton = document.createElement('button');
		closeButton.textContent = '关闭';
		closeButton.style.position = 'absolute';
		closeButton.style.top = '10px';
		closeButton.style.right = '10px';
		contentEl.appendChild(closeButton);

		// 处理关闭按钮点击事件
		closeButton.addEventListener('click', (e) => {
			e.stopPropagation(); // 防止触发模态框外部点击事件
			// 记录当前模态框的位置
			localStorage.setItem('lastPositionTop', contentEl.style.top);
			localStorage.setItem('lastPositionLeft', contentEl.style.left);
			contentEl.remove(); // 关闭模态框
		});
	}
}
	


class SampleSettingTab extends PluginSettingTab {
	plugin: HelloworldPlugin;

	constructor(app: App, plugin: HelloworldPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const {containerEl} = this;

		containerEl.empty();

		new Setting(containerEl)
			.setName('Server Address')
			.setDesc('Input your server address.')
			.addText(text => text
				.setPlaceholder('Enter server address')
				.setValue(this.plugin.settings.serveraddress)
				.onChange(async (value) => {
					
					this.plugin.settings.serveraddress = value;
					//serveraddress = value;
					await this.plugin.saveSettings();
				}));
		new Setting(containerEl)
			.setName('GPT token')
			.setDesc('You can get your GPT token in the WhaleCloud website.')
			.addText(text => text
				.setPlaceholder('Enter GPT token')
				.setValue(this.plugin.settings.usertoken)
				.onChange(async (value) => {
					this.plugin.settings.usertoken = value;
					//usertoken = value;
					await this.plugin.saveSettings();
				}));
	}
}

