# Obsidian 插件:中文名：文稿助手  
# 英文名：DraftPlus


该项目使用 TypeScript 提供类型检查和文档。该仓库依赖于最新的插件 API (obsidian.d.ts) 的 TypeScript 定义格式，其中包含描述其功能的 TSDoc 注释。
插件开发源语言为Javascript。

**注意：** Obsidian API 仍处于早期测试阶段，可能随时更改！

该插件专为 iWhaleCloud 用户设计，具有以下功能：

- 利用 Docchain 和 ChatGPT API 自动生成文本
- 根据您的要求自动生成目录
- 根据现有目录逐段自动生成文档，段落以 ## 标记
- 能够将文件保存到其他地址



## 设置：

您需要提供服务器地址、 ChatGPT 令牌、Docchain用户名、Docchain密码、Docchain对应的topidid。这五个参数需要在设置中进行配置。

## 使用方法：

点击左侧的“文稿助手”铅笔图标，右侧会弹出一个模态框。页面会变暗，您需要点击模态框以外的任意位置。然后，您可以在同一视图页面中查看您的 .md 文件并使用模态框。

### 模态框：

模态框是在您点击左侧页面的“文稿助手”时显示的文本区域。您可以点击右上角的“关闭”按钮退出。

模态框包含以下部分：

#### 通知：

左上角会显示一条通知，提示“文稿助手”。

#### 文本区域：

上方文本区域用于输入您的需求，推荐使用中文。

下方文本区域为ChatGPT机器人对话的回答部分。

#### 按钮：

模态框中共有六个按钮：

##### 1. 生成目录

根据您的需求生成一个完整的目录。

##### 2. 生成段落

逐段生成文档，每段以 `##` 标记。如果所有段落已经生成完毕，它将切换到目录并生成第一段。所有生成的文档不会被保存，因此点击此按钮时请小心。  
注意：一旦点击“文档”按钮，目录将被保存，您在对生成的文档进行修改时不应更改目录。任何试图更改目录的操作都将失败。

##### 3. 清空段落

如果您对整个生成的文档不满意或想更改目录，请点击此按钮。它将返回到已保存的目录，同时清空所有已经生成的段落内容。您可以更改目录或从头开始重新生成整个文档。

如果出现任何问题，例如“错误：获取 GPT 响应错误”，建议预先保存文件并点击此按钮重新生成。

##### 4. 重写本段

“文档”按钮用于生成下一个段落。如果您对生成的文本不满意，可以点击此按钮生成一个新的段落。现有的前面部分文档将被保存，但旧的、不满意的部分将不会被保存。

例如，您点击“文档”按钮生成了第三段。如果您对生成的内容不满意并点击此按钮，第一段和第二段的内容将被保存，并自动重新生成第三段。

##### 5. 保存文件

生成的目录和文档将显示在您当前打开/激活的文件中。您可以通过点击此按钮将该文件的内容保存到另一个文件中。强烈建议在对当前打开/激活的文件进行任何重大修改之前保存文件，例如生成文档的下一段。

保存的文件将按照以下格式命名：  
`tmp_年_月_日_时_分_秒.md`


#### 6. Chat聊天

该按钮通过您在文本输入的要求与ChatGPT机器人对话，回答将显示在下方的文本框中。

## 示例：

您可以输入自己的目录来生成文档。但请确保格式正确，如下所示：  
目录应包含一个以 `#` 标记的标题，所有子目录应以 `##` 标记，子标题以 `###` 标记。如果没有 `###` 也是可以的。  
下面是一个示例：

# ESG报告  
## 1. 产品与服务
1. SHS-5
2. SHS-6
3. 416-1
4. 416-2
5. 417-1

## 2. 供应链管理
1. SOC-2
2. SOC-3

## 3. 重人本的员工发展
1. 员工权益
2. SOC-6

## 4. 成长平台
1. SOC-4
2. SOC-7

## 5. 报告内容
1. IPIECA/API（2020）
2. GRI 2021

## 6. 心理健康与关爱员工
1. SHS-1
2. SHS-2
3. 403-3

## 7. 社会责任与社区关系
1. 本土化与多元化
2. SOC-4
3. SOC-5
4. SOC-15

## 8. 绿色环保
1. 绿色动力
2. 储量接替率

## 9. 技术创新
1. 中国石油年度十大科技进展
2. 研发经费投入

## 10. 企业数字化与智能化转型
1. 信息技术
2. 智慧能源与化工产业

## 11. 社区沟通与参与
1. 哈法亚公司
2. 印度尼西亚公司
3. 社区权益保障

## 12. ESG（环境、社会、治理）实践总结

## 13. 石油精神与企业文化
1. 感动石油人物
2. 石油精神与铁人精神



## 注意事项

- 一旦点击“生成文档”按钮，目录将保存在程序内部，您所有更改目录的努力都将失败，这意味着所有生成的文档都将基于您之前的目录。
- 如果您点击“返回”按钮，目录将会显示（但您可能需要在点击之前先保存文档，因为一旦点击，文档将会丢失）。
- 在生成过程未完成时，您不应点击“生成文档”按钮或“重新生成”按钮！

## API 文档

请参阅 [Obsidian API 文档](https://github.com/obsidianmd/obsidian-api)





